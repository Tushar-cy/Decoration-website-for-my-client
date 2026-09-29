const { test, describe } = require("node:test");
const assert = require("node:assert/strict");

const {
  validateAndSanitizeSubmission,
  stripHtml,
  isFieldVisible,
} = require("../services/formValidationService");
const { verifyTurnstile } = require("../services/turnstileService");
const FormSchema = require("../models/FormSchema");
const Submission = require("../models/Submission");

describe("Purpose Form System & Schema-Driven Submissions", () => {
  const sampleSchema = {
    key: "birthday",
    title: "Birthday Celebration",
    version: 1,
    fields: [
      {
        id: "name",
        type: "text",
        label: "Your Full Name",
        required: true,
        group: "Contact Details",
      },
      {
        id: "phone",
        type: "phone",
        label: "Phone Number",
        required: true,
        group: "Contact Details",
      },
      {
        id: "celebrant_name",
        type: "text",
        label: "Celebrant Name",
        required: true,
        group: "Celebrant",
      },
      {
        id: "theme",
        type: "select",
        label: "Theme",
        required: true,
        options: [
          { value: "barbie", label: "Barbie" },
          { value: "superhero", label: "Superhero" },
          { value: "custom", label: "Custom" },
        ],
        group: "Decor",
      },
      {
        id: "custom_desc",
        type: "text",
        label: "Custom Theme Description",
        required: true,
        showIf: { fieldId: "theme", equals: "custom" },
        group: "Decor",
      },
      {
        id: "guest_count",
        type: "number",
        label: "Estimated Guests",
        min: 5,
        max: 500,
        required: false,
        group: "Venue",
      },
      {
        id: "notes",
        type: "textarea",
        label: "Special Wishes",
        required: false,
        group: "Additional",
      },
    ],
  };

  // 1. Dynamic Schema Validation
  describe("Dynamic Schema Validation", () => {
    test("Valid submission sanitizes data, applies phone normalization, and builds answersSnapshot", () => {
      const answers = {
        name: "Priya Sharma",
        phone: "9876543210",
        celebrant_name: "Aarav",
        theme: "superhero",
        guest_count: 50,
        notes: "Please bring extra metallic balloons.",
      };

      const result = validateAndSanitizeSubmission(sampleSchema, answers);
      assert.equal(result.name, "Priya Sharma");
      assert.equal(result.phone, "+919876543210");
      assert.equal(result.sanitizedAnswers.celebrant_name, "Aarav");
      assert.equal(result.sanitizedAnswers.guest_count, 50);

      // Verify answersSnapshot contains immutable labels
      assert.ok(Array.isArray(result.answersSnapshot));
      const nameSnap = result.answersSnapshot.find((s) => s.fieldId === "name");
      assert.equal(nameSnap.label, "Your Full Name");
      assert.equal(nameSnap.value, "Priya Sharma");
      assert.equal(nameSnap.group, "Contact Details");
    });

    test("Rejects unknown fields not defined in the schema with useful message", () => {
      const answers = {
        name: "Priya Sharma",
        phone: "9876543210",
        celebrant_name: "Aarav",
        theme: "barbie",
        hacker_field: "malicious_payload",
      };

      assert.throws(
        () => validateAndSanitizeSubmission(sampleSchema, answers),
        (err) => {
          assert.equal(err.statusCode, 400);
          assert.match(err.message, /Unknown field 'hacker_field' is not permitted/);
          return true;
        }
      );
    });

    test("Rejects missing required field with useful validation message", () => {
      const answers = {
        name: "Priya Sharma",
        phone: "9876543210",
        // celebrant_name is required but omitted
        theme: "barbie",
      };

      assert.throws(
        () => validateAndSanitizeSubmission(sampleSchema, answers),
        (err) => {
          assert.equal(err.statusCode, 400);
          assert.match(err.message, /Celebrant Name is required/);
          return true;
        }
      );
    });

    test("Strips HTML tags to prevent XSS attacks", () => {
      const dirty = "<script>alert('xss')</script>Hello <b>World</b>!";
      const cleaned = stripHtml(dirty);
      assert.equal(cleaned, "Hello World!");
    });
  });

  // 2. Conditional showIf Evaluation
  describe("showIf Conditional Visibility", () => {
    test("When showIf condition is false, the conditionally required field is ignored", () => {
      const answers = {
        name: "Priya Sharma",
        phone: "9876543210",
        celebrant_name: "Aarav",
        theme: "superhero", // Not 'custom'
        // custom_desc is required ONLY if theme is 'custom'
      };

      const result = validateAndSanitizeSubmission(sampleSchema, answers);
      assert.equal(result.sanitizedAnswers.theme, "superhero");
      assert.equal(result.sanitizedAnswers.custom_desc, undefined);
    });

    test("When showIf condition is met, the conditionally required field is strictly enforced", () => {
      const answers = {
        name: "Priya Sharma",
        phone: "9876543210",
        celebrant_name: "Aarav",
        theme: "custom", // Meets condition!
        // custom_desc is missing
      };

      assert.throws(
        () => validateAndSanitizeSubmission(sampleSchema, answers),
        (err) => {
          assert.equal(err.statusCode, 400);
          assert.match(err.message, /Custom Theme Description is required/);
          return true;
        }
      );
    });
  });

  // 3. Anti-Spam & Turnstile Verification
  describe("Anti-Spam & Turnstile", () => {
    test("Rejects submission missing Turnstile token with 400", async () => {
      await assert.rejects(
        async () => {
          await verifyTurnstile({ token: "", honeypot: null });
        },
        (err) => {
          assert.equal(err.statusCode, 400);
          assert.match(err.message, /Turnstile token is required/);
          return true;
        }
      );
    });

    test("Rejects bot submission if honeypot field is filled", async () => {
      await assert.rejects(
        async () => {
          await verifyTurnstile({ token: "dummy_valid_token", honeypot: "bot_spammer_value" });
        },
        (err) => {
          assert.equal(err.statusCode, 400);
          assert.match(err.message, /Spam verification triggered/);
          return true;
        }
      );
    });

    test("Accepts clean submission with Turnstile token and empty honeypot", async () => {
      const result = await verifyTurnstile({ token: "dummy_valid_token", honeypot: "" });
      assert.equal(result, true);
    });
  });

  // 4. Schema Evolution & Immutable Label Snapshots
  describe("Immutable answersSnapshot during Schema Evolution", () => {
    test("Old submission retains its original field labels even after FormSchema is updated", () => {
      // 1. Initial submission created under Version 1 schema
      const originalAnswers = {
        name: "Rohan Varma",
        phone: "9876543210",
        celebrant_name: "Siya",
        theme: "barbie",
      };

      const { answersSnapshot } = validateAndSanitizeSubmission(sampleSchema, originalAnswers);

      const submission = new Submission({
        formKey: "birthday",
        formVersion: 1,
        answers: originalAnswers,
        answersSnapshot,
        name: "Rohan Varma",
        phone: "+919876543210",
      });

      // Original label in snapshot
      const originalFieldSnap = submission.answersSnapshot.find((s) => s.fieldId === "celebrant_name");
      assert.equal(originalFieldSnap.label, "Celebrant Name");

      // 2. Admin edits field label in FormSchema from "Celebrant Name" to "Honoree / Birthday Person Name"
      const evolvedSchema = {
        ...sampleSchema,
        version: 2,
        fields: sampleSchema.fields.map((f) =>
          f.id === "celebrant_name"
            ? { ...f, label: "Honoree / Birthday Person Name" }
            : f
        ),
      };

      // 3. Old submission's snapshot remains completely unchanged
      const oldSnapAfterSchemaEdit = submission.answersSnapshot.find((s) => s.fieldId === "celebrant_name");
      assert.equal(
        oldSnapAfterSchemaEdit.label,
        "Celebrant Name",
        "Old submission must preserve the original label as it was at the time of submission"
      );

      // 4. A new submission under evolved schema captures the new label
      const newSubResult = validateAndSanitizeSubmission(evolvedSchema, originalAnswers);
      const newFieldSnap = newSubResult.answersSnapshot.find((s) => s.fieldId === "celebrant_name");
      assert.equal(newFieldSnap.label, "Honoree / Birthday Person Name");
    });
  });
});

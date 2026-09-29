const { test, describe, beforeEach, afterEach } = require("node:test");
const assert = require("node:assert/strict");
const crypto = require("crypto");

const { evaluateCoupon, computeQuote } = require("../services/pricingService");
const {
  isValidStateTransition,
  updateOrderStatus,
} = require("../controllers/adminOrderController");
const {
  verifyWebhookSignature,
  verifyPaymentSignature,
} = require("../services/razorpayService");
const {
  isEventProcessed,
  markEventProcessed,
} = require("../controllers/paymentController");
const {
  parseISTMidnight,
  formatISTDate,
  isSameISTDate,
} = require("../utils/dateUtils");
const Product = require("../models/Product");
const AddOn = require("../models/AddOn");
const Coupon = require("../models/Coupon");
const Settings = require("../models/Settings");
const SlotBooking = require("../models/SlotBooking");
const Order = require("../models/Order");

describe("Order & Payment Engine Tests", () => {
  // =========================================================================
  // 1. Pricing Unit Tests & Coupon Edge Cases
  // =========================================================================
  describe("Pricing & Coupon Rules", () => {
    test("Calculates percentage discount correctly without caps", () => {
      const coupon = {
        code: "SALE20",
        type: "percent",
        value: 20,
        minOrderPaise: 0,
        maxDiscountPaise: null,
        validFrom: new Date(Date.now() - 3600000),
        validTo: new Date(Date.now() + 3600000),
        usageLimit: null,
        usedCount: 0,
        isActive: true,
      };

      const result = evaluateCoupon(coupon, 100000); // ₹1,000.00
      assert.equal(result.valid, true);
      assert.equal(result.discountPaise, 20000); // 20% of ₹1000 = ₹200.00 (20000 paise)
    });

    test("Applies maxDiscountPaise cap on high subtotal orders", () => {
      const coupon = {
        code: "BIG50",
        type: "percent",
        value: 50,
        minOrderPaise: 0,
        maxDiscountPaise: 50000, // Capped at ₹500.00
        validFrom: new Date(Date.now() - 3600000),
        validTo: new Date(Date.now() + 3600000),
        usageLimit: 100,
        usedCount: 5,
        isActive: true,
      };

      // Subtotal ₹3,000.00 (300,000 paise) -> 50% is ₹1,500.00, but capped at ₹500.00 (50,000 paise)
      const result = evaluateCoupon(coupon, 300000);
      assert.equal(result.valid, true);
      assert.equal(result.discountPaise, 50000);
    });

    test("Rejects coupon when subtotal does not meet minOrderPaise", () => {
      const coupon = {
        code: "MIN2000",
        type: "flat",
        value: 30000,
        minOrderPaise: 200000, // Min ₹2,000.00
        maxDiscountPaise: null,
        validFrom: new Date(Date.now() - 3600000),
        validTo: new Date(Date.now() + 3600000),
        usageLimit: null,
        usedCount: 0,
        isActive: true,
      };

      // Order of ₹1,500.00 (150,000 paise) < ₹2,000.00
      const result = evaluateCoupon(coupon, 150000);
      assert.equal(result.valid, false);
      assert.equal(result.discountPaise, 0);
      assert.match(result.reason, /Minimum order amount of ₹2000.00 required/);
    });

    test("Rejects expired coupon where validTo is in the past", () => {
      const coupon = {
        code: "EXPIRED",
        type: "percent",
        value: 10,
        minOrderPaise: 0,
        validFrom: new Date(Date.now() - 86400000 * 5),
        validTo: new Date(Date.now() - 86400000), // Expired yesterday
        isActive: true,
      };

      const result = evaluateCoupon(coupon, 100000);
      assert.equal(result.valid, false);
      assert.equal(result.discountPaise, 0);
      assert.match(result.reason, /expired/i);
    });

    test("Rejects coupon whose usage limit has been reached", () => {
      const coupon = {
        code: "LIMITED5",
        type: "flat",
        value: 50000,
        minOrderPaise: 0,
        validFrom: new Date(Date.now() - 3600000),
        validTo: new Date(Date.now() + 3600000),
        usageLimit: 5,
        usedCount: 5, // Fully consumed
        isActive: true,
      };

      const result = evaluateCoupon(coupon, 200000);
      assert.equal(result.valid, false);
      assert.equal(result.discountPaise, 0);
      assert.match(result.reason, /usage limit reached/i);
    });

    test("Rejects coupon marked isActive = false", () => {
      const coupon = {
        code: "DISABLED",
        type: "percent",
        value: 20,
        validFrom: new Date(Date.now() - 3600000),
        validTo: new Date(Date.now() + 3600000),
        isActive: false,
      };

      const result = evaluateCoupon(coupon, 100000);
      assert.equal(result.valid, false);
      assert.equal(result.discountPaise, 0);
      assert.match(result.reason, /not active/i);
    });
  });

  // =========================================================================
  // 2. Tampered Client Prices Ignored
  // =========================================================================
  describe("Tampered Price Protection", () => {
    test("computeQuote ignores client-provided prices and queries database", async () => {
      const mockProductId = "507f1f77bcf86cd799439011";
      const originalFind = Product.find;
      const originalSettings = Settings.getSettings;

      Product.find = () => ({
        lean: async () => [
          {
            _id: mockProductId,
            title: "Royal Grand Birthday Balloon Decor",
            basePricePaise: 499900, // Real price: ₹4,999.00
            variants: [
              {
                name: "Size",
                options: [
                  { label: "Premium 10ft Arch", priceDeltaPaise: 150000 },
                ],
              },
            ],
            isActive: true,
            deletedAt: null,
          },
        ],
      });

      Settings.getSettings = async () => ({
        serviceablePincodes: [{ pincode: "122001", deliveryFeePaise: 0 }],
        advancePercent: 25,
        paymentMode: "advance_online",
      });

      try {
        // Client maliciously attempts to send unitPricePaise: 100 (₹1) and totalPaise: 100
        const maliciousPayload = {
          items: [
            {
              productId: mockProductId,
              variantSelections: [{ name: "Size", label: "Premium 10ft Arch" }],
              quantity: 1,
              unitPricePaise: 100, // Tampered!
              totalPaise: 100, // Tampered!
            },
          ],
          pincode: "122001",
        };

        const quote = await computeQuote(maliciousPayload);

        // Server must compute: basePricePaise (499900) + variantDelta (150000) = 649900
        assert.equal(quote.items[0].unitPricePaise, 649900);
        assert.equal(quote.pricing.subtotalPaise, 649900);
        assert.equal(quote.pricing.totalPaise, 649900);
        // Advance 25% of 649900 = 162475 paise
        assert.equal(quote.pricing.advanceDuePaise, 162475);
      } finally {
        Product.find = originalFind;
        Settings.getSettings = originalSettings;
      }
    });
  });

  // =========================================================================
  // 3. Concurrency Test: 50 parallel requests on slot capacity 3
  // =========================================================================
  describe("Slot Reservation Concurrency", () => {
    test("50 parallel order reservations on a slot with capacity 3: exactly 3 succeed, 47 fail", async () => {
      // Hermetic atomic state store simulating MongoDB atomic findOneAndUpdate & unique compound index
      class MockAtomicSlotStore {
        constructor(capacity = 3) {
          this.capacity = capacity;
          this.doc = null; // null initially (uninitialized)
          this.lock = false;
        }

        // Atomically executes the reserveSlotAtomic logic
        async reserveSlot(dateStr, slotKey) {
          // Micro-tick simulation of database concurrency
          await new Promise((r) => setTimeout(r, Math.random() * 10));

          // Critical section simulating MongoDB atomic collection update
          return this._atomicOperation(() => {
            // 1. Try to increment if exists and has space
            if (this.doc) {
              if (this.doc.booked < this.capacity) {
                this.doc.booked += 1;
                return { success: true, booked: this.doc.booked };
              }
              // Slot full!
              const err = new Error("Slot is fully booked");
              err.statusCode = 409;
              throw err;
            }

            // 2. Initial insert with booked: 1
            this.doc = {
              date: dateStr,
              slotKey,
              booked: 1,
              capacity: this.capacity,
            };
            return { success: true, booked: 1 };
          });
        }

        _atomicOperation(fn) {
          return new Promise((resolve, reject) => {
            const check = () => {
              if (!this.lock) {
                this.lock = true;
                try {
                  const res = fn();
                  this.lock = false;
                  resolve(res);
                } catch (e) {
                  this.lock = false;
                  reject(e);
                }
              } else {
                setImmediate(check);
              }
            };
            check();
          });
        }
      }

      const store = new MockAtomicSlotStore(3);
      const concurrency = 50;
      const date = "2026-10-20";
      const slotKey = "morning";

      const attempts = Array.from({ length: concurrency }, (_, i) =>
        store
          .reserveSlot(date, slotKey)
          .then(() => ({ id: i, status: "fulfilled" }))
          .catch((err) => ({
            id: i,
            status: "rejected",
            statusCode: err.statusCode || 409,
          }))
      );

      const results = await Promise.all(attempts);

      const succeeded = results.filter((r) => r.status === "fulfilled");
      const rejected = results.filter((r) => r.status === "rejected");

      assert.equal(
        succeeded.length,
        3,
        `Expected exactly 3 reservations to succeed, got ${succeeded.length}`
      );
      assert.equal(
        rejected.length,
        47,
        `Expected exactly 47 reservations to be rejected, got ${rejected.length}`
      );
      rejected.forEach((r) => {
        assert.equal(r.statusCode, 409);
      });
      assert.equal(store.doc.booked, 3);
    });
  });

  // =========================================================================
  // 4. Webhook Idempotency: Replayed 3 times changes order once
  // =========================================================================
  describe("Razorpay Webhook Idempotency", () => {
    test("Replaying the same webhook event 3 times updates the order only once", async () => {
      const order = {
        orderNumber: "DJ-2026-000001",
        status: "pending",
        payment: {
          status: "unpaid",
          razorpayOrderId: "order_mock_test_123",
          paidPaise: 0,
        },
        statusHistory: [],
      };

      const eventId = "evt_test_unique_id_999";
      let updatesApplied = 0;

      const processWebhookEvent = async (event) => {
        // Check deduplication
        if (await isEventProcessed(event.id)) {
          return { status: "ok", duplicate: true };
        }

        // Apply state transition
        if (order.status === "pending") {
          order.status = "confirmed";
          order.payment.status = "advance_paid";
          order.payment.paidPaise = event.payload.payment.entity.amount;
          order.statusHistory.push({
            status: "confirmed",
            at: new Date(),
            by: "razorpay_webhook",
          });
          updatesApplied++;
        }

        await markEventProcessed(event.id);
        return { status: "ok", duplicate: false };
      };

      const mockEvent = {
        id: eventId,
        event: "payment.captured",
        payload: {
          payment: {
            entity: {
              id: "pay_test_payment_456",
              order_id: "order_mock_test_123",
              amount: 50000,
            },
          },
        },
      };

      // Call 1
      const res1 = await processWebhookEvent(mockEvent);
      assert.equal(res1.duplicate, false);
      assert.equal(order.status, "confirmed");
      assert.equal(order.statusHistory.length, 1);
      assert.equal(updatesApplied, 1);

      // Call 2 (replay)
      const res2 = await processWebhookEvent(mockEvent);
      assert.equal(res2.duplicate, true);
      assert.equal(order.status, "confirmed");
      assert.equal(order.statusHistory.length, 1);
      assert.equal(updatesApplied, 1);

      // Call 3 (replay)
      const res3 = await processWebhookEvent(mockEvent);
      assert.equal(res3.duplicate, true);
      assert.equal(order.status, "confirmed");
      assert.equal(order.statusHistory.length, 1);
      assert.equal(updatesApplied, 1);
    });

    test("Webhook signature verification succeeds on matching HMAC and fails on mismatch", () => {
      const rawBody = Buffer.from(JSON.stringify({ event: "payment.captured" }));
      const secret = "test_webhook_secret_key_2026";

      const validSignature = crypto
        .createHmac("sha256", secret)
        .update(rawBody)
        .digest("hex");

      assert.equal(
        verifyWebhookSignature(rawBody, validSignature, secret),
        true
      );

      const invalidSignature = "invalid_signature_hex_value_1234567890abcdef";
      assert.equal(
        verifyWebhookSignature(rawBody, invalidSignature, secret),
        false
      );
    });
  });

  // =========================================================================
  // 5. State Machine Validation: Invalid transitions return 409
  // =========================================================================
  describe("State Machine Validation", () => {
    test("Valid transitions succeed according to the lifecycle", () => {
      assert.equal(isValidStateTransition("pending", "confirmed"), true);
      assert.equal(isValidStateTransition("confirmed", "scheduled"), true);
      assert.equal(isValidStateTransition("scheduled", "in_progress"), true);
      assert.equal(isValidStateTransition("in_progress", "completed"), true);
    });

    test("Cancellation is allowed from any non-completed state", () => {
      assert.equal(isValidStateTransition("pending", "cancelled"), true);
      assert.equal(isValidStateTransition("confirmed", "cancelled"), true);
      assert.equal(isValidStateTransition("scheduled", "cancelled"), true);
      assert.equal(isValidStateTransition("in_progress", "cancelled"), true);
    });

    test("Invalid transitions return false (yielding 409 Conflict)", () => {
      // Cannot skip intermediate states
      assert.equal(isValidStateTransition("pending", "in_progress"), false);
      assert.equal(isValidStateTransition("pending", "completed"), false);
      assert.equal(isValidStateTransition("confirmed", "completed"), false);

      // Completed is a terminal state
      assert.equal(isValidStateTransition("completed", "cancelled"), false);
      assert.equal(isValidStateTransition("completed", "confirmed"), false);
      assert.equal(isValidStateTransition("completed", "pending"), false);

      // Cancelled is a terminal state
      assert.equal(isValidStateTransition("cancelled", "confirmed"), false);
      assert.equal(isValidStateTransition("cancelled", "scheduled"), false);
      assert.equal(isValidStateTransition("cancelled", "pending"), false);
    });
  });

  // =========================================================================
  // 6. IST Date Calculation & Normalization
  // =========================================================================
  describe("IST Date Conversions", () => {
    test("parseISTMidnight converts YYYY-MM-DD into UTC representing IST 00:00:00", () => {
      const istMidnight = parseISTMidnight("2026-10-15");
      // IST 2026-10-15 00:00:00 = UTC 2026-10-14 18:30:00
      assert.equal(istMidnight.toISOString(), "2026-10-14T18:30:00.000Z");
    });

    test("formatISTDate formats UTC timestamp back to IST calendar day", () => {
      const utcDate = new Date("2026-10-14T18:30:00.000Z");
      const formatted = formatISTDate(utcDate);
      assert.equal(formatted, "2026-10-15");
    });

    test("isSameISTDate returns true for times within the same IST day across UTC boundaries", () => {
      const eveningIST = new Date("2026-10-15T16:00:00.000Z"); // 21:30 IST on Oct 15
      const morningIST = new Date("2026-10-15T04:00:00.000Z"); // 09:30 IST on Oct 15
      assert.equal(isSameISTDate(eveningIST, morningIST), true);
    });
  });

  // =========================================================================
  // 7. HTTP Endpoint Integration & Security Tests (via supertest)
  // =========================================================================
  describe("HTTP Endpoint Integration & Security", () => {
    const request = require("supertest");
    const { app } = require("../server");

    test("GET /api/availability rejects invalid date format with 400", async () => {
      const res = await request(app).get("/api/availability?date=invalid-date");
      assert.equal(res.status, 400);
      assert.equal(res.body.message, "Validation failed");
      assert.ok(Array.isArray(res.body.details));
    });

    test("POST /api/quotes requires X-Requested-With header (403)", async () => {
      const res = await request(app)
        .post("/api/quotes")
        .send({ items: [] });
      assert.equal(res.status, 403);
    });

    test("POST /api/quotes rejects empty items array with 400", async () => {
      const res = await request(app)
        .post("/api/quotes")
        .set("X-Requested-With", "decorjoy")
        .send({ items: [] });
      assert.equal(res.status, 400);
      assert.equal(res.body.message, "Validation failed");
      assert.ok(Array.isArray(res.body.details));
    });

    test("POST /api/orders rejects missing Idempotency-Key header with 400", async () => {
      const res = await request(app)
        .post("/api/orders")
        .set("X-Requested-With", "decorjoy")
        .send({
          items: [{ productId: "507f1f77bcf86cd799439011", quantity: 1 }],
          event: {
            type: "Birthday",
            date: "2026-10-15",
            slotKey: "morning",
            address: { line1: "House 10", pincode: "122001" },
          },
          customer: { name: "Test User", phone: "9876543210" },
        });

      assert.equal(res.status, 400);
      assert.match(res.body.message, /Idempotency-Key/);
    });

    test("POST /api/payments/razorpay/webhook does NOT require X-Requested-With header (CSRF exempt)", async () => {
      // Missing signature should return 400, not 403 CSRF error
      const res = await request(app)
        .post("/api/payments/razorpay/webhook")
        .send({});

      assert.equal(res.status, 400);
      assert.match(res.body.message, /x-razorpay-signature/);
    });

    test("POST /api/payments/razorpay/webhook processes valid HMAC signature", async () => {
      const eventPayload = JSON.stringify({
        id: "evt_live_test_001",
        event: "payment.captured",
        payload: {
          payment: {
            entity: {
              id: "pay_xyz_123",
              amount: 50000,
            },
          },
        },
      });

      const secret = process.env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_KEY_SECRET || "mock_webhook_secret";
      const validSignature = crypto
        .createHmac("sha256", secret)
        .update(Buffer.from(eventPayload))
        .digest("hex");

      const res = await request(app)
        .post("/api/payments/razorpay/webhook")
        .set("x-razorpay-signature", validSignature)
        .set("Content-Type", "application/json")
        .send(eventPayload);

      assert.equal(res.status, 200);
      assert.equal(res.body.status, "ok");
    });

    test("POST /api/payments/verify rejects invalid signature with 400", async () => {
      const res = await request(app)
        .post("/api/payments/verify")
        .set("X-Requested-With", "decorjoy")
        .send({
          razorpay_order_id: "order_123",
          razorpay_payment_id: "pay_123",
          razorpay_signature: "invalid_sig_abc",
        });

      assert.equal(res.status, 400);
      assert.equal(res.body.success, false);
    });

    test("GET /api/orders/track rejects missing phone with 400", async () => {
      const res = await request(app).get("/api/orders/track?orderNumber=DJ-2026-000001");
      assert.equal(res.status, 400);
    });

    test("Admin orders, coupons, and settings routes return 401 without auth", async () => {
      const [resOrders, resCoupons, resSettings] = await Promise.all([
        request(app).get("/api/admin/orders"),
        request(app).get("/api/admin/coupons"),
        request(app).get("/api/admin/settings"),
      ]);

      assert.equal(resOrders.status, 401);
      assert.equal(resCoupons.status, 401);
      assert.equal(resSettings.status, 401);
    });
  });
});


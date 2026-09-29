const { z } = require("zod");

// Helper middleware to validate and whitelist body data
const validateBody = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    return next(result.error);
  }
  // Strip unvalidated fields and only assign sanitized/parsed data
  req.body = result.data;
  next();
};

// ================= AUTH SCHEMAS =================
const loginSchema = z.object({
  email: z
    .string({ required_error: "Email is required" })
    .email("Invalid email format")
    .toLowerCase()
    .trim(),
  password: z
    .string({ required_error: "Password is required" })
    .min(1, "Password cannot be empty"),
});

// ================= INQUIRY SCHEMAS =================
const createInquirySchema = z.object({
  name: z.string({ required_error: "Name is required" }).min(1, "Name cannot be empty").max(100).trim(),
  phone: z.string({ required_error: "Phone is required" }).min(7, "Invalid phone number").max(20).trim(),
  email: z.string().email("Invalid email format").optional().or(z.literal("")).default(""),
  eventType: z.string({ required_error: "Event type is required" }).min(1).max(100).trim(),
  eventDate: z.string({ required_error: "Event date is required" }).min(1).max(100).trim(),
  message: z.string().max(2000).optional().default(""),
});

const updateInquirySchema = z.object({
  status: z.enum(["new", "contacted", "completed"], {
    errorMap: () => ({ message: "Status must be 'new', 'contacted', or 'completed'" }),
  }),
});

// ================= SERVICE SCHEMAS =================
const createServiceSchema = z.object({
  title: z.string({ required_error: "Title is required" }).min(1).max(200).trim(),
  description: z.string({ required_error: "Description is required" }).min(1).trim(),
  category: z.enum(["Birthdays", "Anniversaries", "Baby Showers", "Proposals", "Special Celebrations"], {
    errorMap: () => ({ message: "Invalid service category" }),
  }),
  startingPrice: z.coerce.number({ required_error: "Starting price is required" }).min(0),
  image: z.string({ required_error: "Image URL is required" }).min(1).trim(),
});

const updateServiceSchema = z.object({
  title: z.string().min(1).max(200).trim().optional(),
  description: z.string().min(1).trim().optional(),
  category: z.enum(["Birthdays", "Anniversaries", "Baby Showers", "Proposals", "Special Celebrations"]).optional(),
  startingPrice: z.coerce.number().min(0).optional(),
  image: z.string().min(1).trim().optional(),
});

// ================= GALLERY SCHEMAS =================
const createGallerySchema = z.object({
  title: z.string({ required_error: "Title is required" }).min(1).max(200).trim(),
  category: z.enum(["Birthday", "Anniversary", "Baby Shower", "Proposal", "Other"], {
    errorMap: () => ({ message: "Invalid gallery category" }),
  }),
  description: z.string().max(2000).optional().default(""),
  image: z.string({ required_error: "Image URL is required" }).min(1).trim(),
});

const updateGallerySchema = z.object({
  title: z.string().min(1).max(200).trim().optional(),
  category: z.enum(["Birthday", "Anniversary", "Baby Shower", "Proposal", "Other"]).optional(),
  description: z.string().max(2000).optional(),
  image: z.string().min(1).trim().optional(),
});

// ================= TESTIMONIAL SCHEMAS =================
const createTestimonialSchema = z.object({
  name: z.string({ required_error: "Name is required" }).min(1).max(100).trim(),
  location: z.string().max(100).optional().default("Gurgaon"),
  eventType: z.string().max(100).optional().default("Celebration"),
  review: z.string({ required_error: "Review is required" }).min(1).max(2000).trim(),
  rating: z.coerce.number().min(1).max(5).default(5),
});

const updateTestimonialSchema = z.object({
  name: z.string().min(1).max(100).trim().optional(),
  location: z.string().max(100).optional(),
  eventType: z.string().max(100).optional(),
  review: z.string().min(1).max(2000).trim().optional(),
  rating: z.coerce.number().min(1).max(5).optional(),
});

module.exports = {
  validateBody,
  loginSchema,
  createInquirySchema,
  updateInquirySchema,
  createServiceSchema,
  updateServiceSchema,
  createGallerySchema,
  updateGallerySchema,
  createTestimonialSchema,
  updateTestimonialSchema,
};

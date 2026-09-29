const { z } = require("zod");

const indianPhoneRegex = /^(?:(?:\+?91[\s.-]?)?|0)?[6-9]\d{9}$/;
const pincodeRegex = /^122\d{3}$/; // Gurugram pincodes start with 122

const addressSchema = z.object({
  line1: z.string().min(1, "Address line 1 is required").max(300),
  line2: z.string().max(300).optional().default(""),
  locality: z.string().min(1, "Locality is required").max(100).default("Gurgaon"),
  city: z.string().default("Gurugram"),
  state: z.string().default("Haryana"),
  pincode: z.string().regex(pincodeRegex, "A valid 6-digit Gurugram pincode (122xxx) is required"),
});

const customerSchema = z.object({
  name: z.string().min(1, "Customer name is required").max(100),
  phone: z.string().regex(indianPhoneRegex, "Valid 10-digit Indian phone number is required"),
  email: z.string().email("Invalid email format").optional().or(z.literal("")),
});

const orderItemSchema = z.object({
  productId: z.string().min(1, "Product ID is required"),
  variantSelections: z.array(
    z.object({
      name: z.string().min(1),
      optionLabel: z.string().min(1),
    })
  ).optional().default([]),
  addOnIds: z.array(z.string()).optional().default([]),
  quantity: z.number().int().min(1, "Quantity must be at least 1").default(1),
});

const createOrderSchema = z.object({
  customer: customerSchema,
  event: z.object({
    type: z.string().min(1, "Event type is required").default("Birthday"),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Event date must be in YYYY-MM-DD format"),
    slotKey: z.string().min(1, "Time slot is required"),
    address: addressSchema,
    notes: z.string().max(1000).optional().default(""),
  }),
  items: z.array(orderItemSchema).min(1, "Order must contain at least one item"),
  couponCode: z.string().optional().nullable(),
  pincode: z.string().optional().nullable(),
  source: z.enum(["web", "admin", "whatsapp", "native_app"]).default("web"),
});

const trackOrderQuerySchema = z.object({
  orderNumber: z.string().min(1, "orderNumber is required"),
  phone: z.string().optional(),
});

module.exports = {
  indianPhoneRegex,
  pincodeRegex,
  addressSchema,
  customerSchema,
  orderItemSchema,
  createOrderSchema,
  trackOrderQuerySchema,
};

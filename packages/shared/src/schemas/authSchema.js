const { z } = require("zod");

const loginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const inviteStaffSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  email: z.string().email("Invalid email format"),
  role: z.enum(["owner", "staff"]).default("staff"),
  password: z.string().min(8, "Temporary password must be at least 8 characters").optional(),
});

const resetPasswordSchema = z.object({
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
});

module.exports = {
  loginSchema,
  inviteStaffSchema,
  resetPasswordSchema,
};

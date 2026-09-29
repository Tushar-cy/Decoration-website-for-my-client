const bcrypt = require("bcryptjs");
const { z } = require("zod");
const Admin = require("../models/Admin");
const { recordAudit } = require("../services/auditService");
const AppError = require("../utils/AppError");

/**
 * GET /api/admin/users
 * Owner only.
 */
async function getUsers(req, res, next) {
  try {
    const users = await Admin.find()
      .select("-password")
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      status: "success",
      data: { users },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/admin/users/invite
 * Owner only.
 */
async function inviteUser(req, res, next) {
  try {
    const schema = z.object({
      name: z.string().min(1),
      email: z.string().email(),
      password: z.string().min(8),
      role: z.enum(["owner", "staff"]).default("staff"),
    });

    const validated = schema.parse(req.body);
    const existing = await Admin.findOne({ email: validated.email.toLowerCase().trim() });
    if (existing) {
      throw new AppError("An account with this email already exists", 409);
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(validated.password, salt);

    const newUser = await Admin.create({
      name: validated.name.trim(),
      email: validated.email.toLowerCase().trim(),
      password: hashedPassword,
      role: validated.role,
      isActive: true,
    });

    await recordAudit({
      actorId: req.admin?.id,
      action: "USER_INVITED",
      entity: "Admin",
      entityId: newUser._id,
      before: null,
      after: { email: newUser.email, role: newUser.role },
      ip: req.ip,
    });

    return res.status(201).json({
      status: "success",
      data: {
        user: {
          _id: newUser._id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
          isActive: newUser.isActive,
        },
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /api/admin/users/:id/status
 * Owner only.
 */
async function toggleUserStatus(req, res, next) {
  try {
    const user = await Admin.findById(req.params.id);
    if (!user) {
      throw new AppError("User not found", 404);
    }

    // Prevent deactivating own account
    if (user._id.toString() === req.admin?.id) {
      throw new AppError("Cannot change status of your own account", 400);
    }

    user.isActive = req.body.isActive !== undefined ? req.body.isActive : !user.isActive;
    await user.save();

    await recordAudit({
      actorId: req.admin?.id,
      action: "USER_STATUS_UPDATED",
      entity: "Admin",
      entityId: user._id,
      before: { isActive: !user.isActive },
      after: { isActive: user.isActive },
      ip: req.ip,
    });

    return res.status(200).json({
      status: "success",
      data: {
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          isActive: user.isActive,
        },
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/admin/users/:id/reset-password
 * Owner only.
 */
async function resetUserPassword(req, res, next) {
  try {
    const { newPassword } = z
      .object({ newPassword: z.string().min(8) })
      .parse(req.body);

    const user = await Admin.findById(req.params.id);
    if (!user) {
      throw new AppError("User not found", 404);
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    user.failedLogins = 0;
    user.lockedUntil = null;
    await user.save();

    await recordAudit({
      actorId: req.admin?.id,
      action: "USER_PASSWORD_RESET",
      entity: "Admin",
      entityId: user._id,
      before: null,
      after: { email: user.email },
      ip: req.ip,
    });

    return res.status(200).json({
      status: "success",
      message: "Password reset successfully",
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getUsers,
  inviteUser,
  toggleUserStatus,
  resetUserPassword,
};

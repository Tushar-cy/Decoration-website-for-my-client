const jwt = require("jsonwebtoken");
const { env } = require("../config/env");
const Admin = require("../models/Admin");
const AppError = require("../utils/AppError");
const asyncHandler = require("../utils/asyncHandler");

const protect = asyncHandler(async (req, res, next) => {
  let token;

  // 1. Prioritize httpOnly cookie
  if (req.cookies && req.cookies.accessToken) {
    token = req.cookies.accessToken;
  }
  // 2. Fallback to Bearer token in Authorization header
  else if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer ")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return next(new AppError("Not authorized, no token provided", 401));
  }

  try {
    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET);

    const admin = await Admin.findById(decoded.id).select("-password");
    if (!admin) {
      return next(new AppError("Not authorized, admin account not found", 401));
    }

    if (!admin.isActive) {
      return next(new AppError("Account is inactive. Please contact system owner.", 401));
    }

    req.admin = admin;
    next();
  } catch (error) {
    return next(new AppError("Not authorized, invalid or expired token", 401));
  }
});

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.admin) {
      return next(new AppError("Authentication required", 401));
    }

    if (!roles.includes(req.admin.role)) {
      return next(
        new AppError(
          `Forbidden: Role '${req.admin.role}' is not authorized to access this resource`,
          403
        )
      );
    }

    next();
  };
};

module.exports = {
  protect,
  authorize,
};

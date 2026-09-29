const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { env } = require("../config/env");
const Admin = require("../models/Admin");
const RefreshToken = require("../models/RefreshToken");
const AppError = require("../utils/AppError");
const asyncHandler = require("../utils/asyncHandler");

// Pre-computed dummy bcrypt hash to ensure constant-time response for nonexistent users
const DUMMY_HASH = "$2a$10$wK1k6iB72bZfG1/2G283Aev/L4XjQ73kLhG6K6n2rNnF28t23x5dG";
const INVALID_CREDENTIALS_MSG = "Invalid email or password";

const getCookieOptions = () => {
  const isProduction = env.NODE_ENV === "production";
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/",
  };
};

const hashToken = (token) => {
  return crypto.createHash("sha256").update(token).digest("hex");
};

const setAuthCookies = (res, accessToken, refreshToken) => {
  const baseOptions = getCookieOptions();

  res.cookie("accessToken", accessToken, {
    ...baseOptions,
    maxAge: 15 * 60 * 1000, // 15 minutes
  });

  res.cookie("refreshToken", refreshToken, {
    ...baseOptions,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
};

const clearAuthCookies = (res) => {
  const baseOptions = getCookieOptions();
  res.clearCookie("accessToken", baseOptions);
  res.clearCookie("refreshToken", baseOptions);
};

// @desc    Admin Login
// @route   POST /api/auth/login
// @access  Public
const loginAdmin = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  const admin = await Admin.findOne({ email: email.toLowerCase().trim() });

  if (!admin) {
    // Perform dummy bcrypt compare for constant-time mitigation
    await bcrypt.compare(password, DUMMY_HASH);
    return next(new AppError(INVALID_CREDENTIALS_MSG, 401));
  }

  // Check if account is temporarily locked
  if (admin.isLocked()) {
    const minutesRemaining = Math.max(
      1,
      Math.ceil((admin.lockedUntil.getTime() - Date.now()) / (60 * 1000))
    );
    return next(
      new AppError(
        `Account temporarily locked due to multiple failed login attempts. Try again in ${minutesRemaining} minute(s).`,
        429
      )
    );
  }

  // Compare passwords
  const isMatch = await bcrypt.compare(password, admin.password);

  if (!isMatch) {
    admin.failedLogins = (admin.failedLogins || 0) + 1;
    if (admin.failedLogins >= 5) {
      admin.lockedUntil = new Date(Date.now() + 15 * 60 * 1000); // Lock for 15 minutes
    }
    await admin.save();
    return next(new AppError(INVALID_CREDENTIALS_MSG, 401));
  }

  if (!admin.isActive) {
    return next(new AppError(INVALID_CREDENTIALS_MSG, 401));
  }

  // Reset failed logins on successful authentication
  admin.failedLogins = 0;
  admin.lockedUntil = null;
  admin.lastLoginAt = new Date();
  await admin.save();

  // Generate tokens
  const accessToken = jwt.sign(
    { id: admin._id, role: admin.role },
    env.JWT_ACCESS_SECRET,
    { expiresIn: "15m" }
  );

  const rawRefreshToken = jwt.sign(
    { id: admin._id },
    env.JWT_REFRESH_SECRET,
    { expiresIn: "7d" }
  );

  // Store hashed refresh token in database
  await RefreshToken.create({
    userId: admin._id,
    hash: hashToken(rawRefreshToken),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    revokedAt: null,
    userAgent: req.headers["user-agent"] || "",
    ip: req.ip || req.socket.remoteAddress || "",
  });

  setAuthCookies(res, accessToken, rawRefreshToken);

  res.json({
    message: "Login successful",
    user: {
      _id: admin._id,
      name: admin.name,
      email: admin.email,
      role: admin.role,
    },
  });
});

// @desc    Refresh Access and Refresh Tokens with Rotation
// @route   POST /api/auth/refresh
// @access  Public (via Refresh Token Cookie)
const refreshAuthToken = asyncHandler(async (req, res, next) => {
  const rawRefreshToken = req.cookies?.refreshToken;

  if (!rawRefreshToken) {
    return next(new AppError("Refresh token not provided", 401));
  }

  let decoded;
  try {
    decoded = jwt.verify(rawRefreshToken, env.JWT_REFRESH_SECRET);
  } catch (err) {
    clearAuthCookies(res);
    return next(new AppError("Invalid or expired refresh token", 401));
  }

  const tokenHash = hashToken(rawRefreshToken);
  const tokenDoc = await RefreshToken.findOne({ hash: tokenHash });

  if (!tokenDoc) {
    clearAuthCookies(res);
    return next(new AppError("Refresh token not recognized", 401));
  }

  // Token Reuse Detection
  if (tokenDoc.revokedAt) {
    // If a revoked token is reused, revoke ALL active tokens for this user as a security measure
    await RefreshToken.updateMany(
      { userId: tokenDoc.userId, revokedAt: null },
      { revokedAt: new Date() }
    );
    clearAuthCookies(res);
    return next(
      new AppError("Compromised session detected. All sessions revoked. Please log in again.", 401)
    );
  }

  // Check Expiration
  if (tokenDoc.expiresAt < new Date()) {
    clearAuthCookies(res);
    return next(new AppError("Refresh token has expired", 401));
  }

  const admin = await Admin.findById(tokenDoc.userId);
  if (!admin || !admin.isActive) {
    clearAuthCookies(res);
    return next(new AppError("Admin account not found or inactive", 401));
  }

  // Revoke the used refresh token (Rotation)
  tokenDoc.revokedAt = new Date();
  await tokenDoc.save();

  // Issue new token pair
  const newAccessToken = jwt.sign(
    { id: admin._id, role: admin.role },
    env.JWT_ACCESS_SECRET,
    { expiresIn: "15m" }
  );

  const newRawRefreshToken = jwt.sign(
    { id: admin._id },
    env.JWT_REFRESH_SECRET,
    { expiresIn: "7d" }
  );

  await RefreshToken.create({
    userId: admin._id,
    hash: hashToken(newRawRefreshToken),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    revokedAt: null,
    userAgent: req.headers["user-agent"] || "",
    ip: req.ip || req.socket.remoteAddress || "",
  });

  setAuthCookies(res, newAccessToken, newRawRefreshToken);

  res.json({
    message: "Tokens refreshed successfully",
    user: {
      _id: admin._id,
      name: admin.name,
      email: admin.email,
      role: admin.role,
    },
  });
});

// @desc    Admin Logout (Revoke Refresh Token & Clear Cookies)
// @route   POST /api/auth/logout
// @access  Public
const logoutAdmin = asyncHandler(async (req, res, next) => {
  const rawRefreshToken = req.cookies?.refreshToken;

  if (rawRefreshToken) {
    const tokenHash = hashToken(rawRefreshToken);
    await RefreshToken.updateOne(
      { hash: tokenHash, revokedAt: null },
      { revokedAt: new Date() }
    );
  }

  clearAuthCookies(res);

  res.json({ message: "Logged out successfully" });
});

// @desc    Get Current Admin Profile
// @route   GET /api/auth/me
// @access  Private
const getAdminProfile = asyncHandler(async (req, res, next) => {
  const admin = await Admin.findById(req.admin._id).select("-password");
  if (!admin) {
    return next(new AppError("Admin not found", 404));
  }
  res.json({
    _id: admin._id,
    name: admin.name,
    email: admin.email,
    role: admin.role,
    isActive: admin.isActive,
    lastLoginAt: admin.lastLoginAt,
  });
});

module.exports = {
  loginAdmin,
  refreshAuthToken,
  logoutAdmin,
  getAdminProfile,
  hashToken,
};

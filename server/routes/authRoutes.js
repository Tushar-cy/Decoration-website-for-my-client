const express = require("express");
const router = express.Router();
const {
  loginAdmin,
  refreshAuthToken,
  logoutAdmin,
  getAdminProfile,
} = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");
const { loginLimiter } = require("../middleware/rateLimiter");
const { validateBody, loginSchema } = require("../validators/schemas");

// POST /api/auth/login - Rate limited to 10 per 15 min, validated body
router.post("/login", loginLimiter, validateBody(loginSchema), loginAdmin);

// POST /api/auth/refresh - Refresh access & refresh tokens
router.post("/refresh", refreshAuthToken);

// POST /api/auth/logout - Revokes token & clears cookies
router.post("/logout", logoutAdmin);

// GET /api/auth/me - Protected session check
router.get("/me", protect, getAdminProfile);

module.exports = router;

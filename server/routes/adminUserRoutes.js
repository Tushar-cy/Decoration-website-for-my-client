const express = require("express");
const { protect, authorize } = require("../middleware/authMiddleware");
const {
  getUsers,
  inviteUser,
  toggleUserStatus,
  resetUserPassword,
} = require("../controllers/adminUserController");

const router = express.Router();

// Strict Owner-only enforcement
router.use(protect);
router.use(authorize("owner"));

// GET /api/admin/users
router.get("/", getUsers);

// POST /api/admin/users/invite
router.post("/invite", inviteUser);

// PATCH /api/admin/users/:id/status
router.patch("/:id/status", toggleUserStatus);

// POST /api/admin/users/:id/reset-password
router.post("/:id/reset-password", resetUserPassword);

module.exports = router;

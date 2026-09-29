const AppError = require("../utils/AppError");

const requireCustomHeader = (req, res, next) => {
  const mutatingMethods = ["POST", "PUT", "PATCH", "DELETE"];

  // Webhook requests from payment providers authenticate via HMAC signatures, not browser custom headers
  if (req.originalUrl?.startsWith("/api/payments/razorpay/webhook")) {
    return next();
  }

  if (mutatingMethods.includes(req.method.toUpperCase())) {
    const customHeader = req.headers["x-requested-with"];
    if (!customHeader || customHeader !== "decorjoy") {
      return next(
        new AppError(
          "Access denied: Missing or invalid X-Requested-With header. Value must be 'decorjoy'.",
          403
        )
      );
    }
  }

  next();
};

module.exports = {
  requireCustomHeader,
};

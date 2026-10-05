const AppError = require("../utils/AppError");

const requireCustomHeader = (req, res, next) => {
  const mutatingMethods = ["POST", "PUT", "PATCH", "DELETE"];


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

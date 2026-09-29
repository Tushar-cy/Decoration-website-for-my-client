const { logger } = require("../utils/logger");

const errorHandler = (err, req, res, next) => {
  const isProduction = process.env.NODE_ENV === "production";
  const requestId = req.id || req.headers["x-request-id"] || "unknown";

  let statusCode = err.statusCode || (err.status && typeof err.status === "number" ? err.status : 500);
  let message = err.message || "Internal server error";
  let isOperational = !!err.isOperational;
  let details = err.details || null;

  // Handle Zod Validation Errors
  if (err.name === "ZodError") {
    statusCode = 400;
    message = "Validation failed";
    isOperational = true;
    details = err.errors || err.issues;
  }

  // Handle Mongoose CastError (e.g. invalid ObjectId)
  if (err.name === "CastError") {
    statusCode = 400;
    message = `Invalid value for ${err.path}`;
    isOperational = true;
  }

  // Handle Mongoose Duplicate Key Error
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue || {})[0] || "field";
    message = `Duplicate value for ${field}`;
    isOperational = true;
  }

  // Handle JSON parse errors from body-parser
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    statusCode = 400;
    message = "Malformed JSON body";
    isOperational = true;
  }

  // Log the error
  if (req.log) {
    req.log.error({ err, requestId }, message);
  } else {
    logger.error({ err, requestId }, message);
  }

  // Production response: Never leak internal error message or stack trace
  if (isProduction) {
    if (isOperational) {
      return res.status(statusCode).json({
        message,
        requestId,
        ...(details ? { details } : {}),
      });
    }
    return res.status(500).json({
      message: "Internal server error",
      requestId,
    });
  }

  // Development/Test response
  return res.status(statusCode).json({
    message,
    requestId,
    ...(details ? { details } : {}),
    stack: err.stack,
  });
};

module.exports = errorHandler;

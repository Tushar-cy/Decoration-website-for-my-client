const crypto = require("crypto");
const pino = require("pino");
const pinoHttp = require("pino-http");

const isProduction = process.env.NODE_ENV === "production";

const logger = pino({
  level: isProduction ? "info" : "debug",
  transport: !isProduction
    ? {
        target: "pino-pretty",
        options: {
          colorize: true,
          translateTime: "SYS:standard",
          ignore: "pid,hostname",
        },
      }
    : undefined,
});

const httpLogger = pinoHttp({
  logger,
  genReqId: (req) => {
    const existingId = req.headers["x-request-id"];
    if (existingId && typeof existingId === "string") {
      return existingId;
    }
    return crypto.randomUUID();
  },
  customLogLevel: (req, res, err) => {
    if (res.statusCode >= 500 || err) return "error";
    if (res.statusCode >= 400) return "warn";
    return "info";
  },
  customSuccessMessage: (req, res) => `${req.method} ${req.originalUrl || req.url} ${res.statusCode}`,
  customErrorMessage: (req, res, err) => `${req.method} ${req.originalUrl || req.url} ${res.statusCode} - ${err.message}`,
});

module.exports = {
  logger,
  httpLogger,
};

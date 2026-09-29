const { logger } = require("./logger");
const AppError = require("./AppError");

class CircuitBreaker {
  /**
   * @param {string} name - Service name (e.g. 'Razorpay', 'Cloudinary', 'Email')
   * @param {Object} options
   */
  constructor(name, options = {}) {
    this.name = name;
    this.failureThreshold = options.failureThreshold || 5;
    this.recoveryTimeout = options.recoveryTimeout || 30000; // 30 seconds before half-open probe
    this.state = "CLOSED"; // CLOSED | OPEN | HALF_OPEN
    this.failureCount = 0;
    this.lastFailureTime = null;
    this.successCount = 0;
  }

  isOpen() {
    if (this.state === "OPEN") {
      const now = Date.now();
      if (now - this.lastFailureTime >= this.recoveryTimeout) {
        logger.info({ service: this.name }, `Circuit breaker entering HALF_OPEN probe state`);
        this.state = "HALF_OPEN";
        return false;
      }
      return true;
    }
    return false;
  }

  recordSuccess() {
    this.failureCount = 0;
    if (this.state === "HALF_OPEN") {
      this.successCount++;
      if (this.successCount >= 2) {
        logger.info({ service: this.name }, `Circuit breaker healed; transitioning to CLOSED`);
        this.state = "CLOSED";
        this.successCount = 0;
      }
    }
  }

  recordFailure(err) {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    logger.warn(
      { service: this.name, failures: this.failureCount, err: err?.message },
      "Recorded service failure in circuit breaker"
    );

    if (this.state === "HALF_OPEN" || this.failureCount >= this.failureThreshold) {
      logger.error(
        { service: this.name, failures: this.failureCount },
        `Circuit breaker tripped to OPEN state. Tripping service calls for ${this.recoveryTimeout / 1000}s`
      );
      this.state = "OPEN";
      this.successCount = 0;
    }
  }

  /**
   * Executes an async operation protected by this circuit breaker, timeout, and jittered retries
   * 
   * @param {Function} fn - Async operation
   * @param {Object} execOptions - { maxRetries: 2, timeoutMs: 5000, baseDelayMs: 200 }
   */
  async execute(fn, execOptions = {}) {
    if (this.isOpen()) {
      throw new AppError(
        `Service '${this.name}' is temporarily unavailable (circuit breaker OPEN). Please retry shortly.`,
        503
      );
    }

    const maxRetries = execOptions.maxRetries ?? 2;
    const timeoutMs = execOptions.timeoutMs ?? 5000;
    const baseDelayMs = execOptions.baseDelayMs ?? 200;

    let lastError;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        // Execute with timeout promise race
        let timer;
        const timeoutPromise = new Promise((_, reject) => {
          timer = setTimeout(() => {
            reject(new AppError(`Request to ${this.name} timed out after ${timeoutMs}ms`, 504));
          }, timeoutMs);
        });

        const result = await Promise.race([fn(), timeoutPromise]);
        clearTimeout(timer);

        this.recordSuccess();
        return result;
      } catch (err) {
        lastError = err;

        // If circuit is already open or non-retryable error, bail
        if (err.statusCode && err.statusCode >= 400 && err.statusCode < 500) {
          // Client errors (4xx) do not trip the circuit breaker or retry
          throw err;
        }

        if (attempt < maxRetries) {
          // Full jitter backoff: random between 0 and min(maxDelay, baseDelay * 2^attempt)
          const maxDelay = Math.min(baseDelayMs * Math.pow(2, attempt), 3000);
          const jitteredDelay = Math.floor(Math.random() * maxDelay);
          logger.info(
            { service: this.name, attempt: attempt + 1, delay: jitteredDelay, err: err.message },
            "Retrying failed operation with jittered backoff"
          );
          await new Promise((resolve) => setTimeout(resolve, jitteredDelay));
        }
      }
    }

    this.recordFailure(lastError);
    throw lastError;
  }
}

// Pre-configured service breakers
const razorpayBreaker = new CircuitBreaker("Razorpay", { failureThreshold: 5, recoveryTimeout: 30000 });
const cloudinaryBreaker = new CircuitBreaker("Cloudinary", { failureThreshold: 5, recoveryTimeout: 30000 });
const emailBreaker = new CircuitBreaker("Email", { failureThreshold: 5, recoveryTimeout: 30000 });

module.exports = {
  CircuitBreaker,
  razorpayBreaker,
  cloudinaryBreaker,
  emailBreaker,
};

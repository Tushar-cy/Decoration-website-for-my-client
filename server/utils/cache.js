const crypto = require("crypto");
const { redisClient } = require("../config/redis");
const { logger } = require("./logger");

// In-process single-flight map to eliminate thundering herds on concurrent requests
const inFlightPromises = new Map();

/**
 * Creates a deterministic hash of an object or query parameters
 */
function hashQuery(query = {}) {
  if (!query || Object.keys(query).length === 0) {
    return "default";
  }
  // Sort keys deterministically
  const sortedKeys = Object.keys(query).sort();
  const sortedObj = {};
  for (const k of sortedKeys) {
    if (query[k] !== undefined && query[k] !== null && query[k] !== "") {
      sortedObj[k] = query[k];
    }
  }
  const str = JSON.stringify(sortedObj);
  return crypto.createHash("md5").update(str).digest("hex").slice(0, 16);
}

/**
 * Generates a standard cache key with query hash
 */
function buildCacheKey(prefix, query = {}) {
  const hash = hashQuery(query);
  return `cache:${prefix}:${hash}`;
}

/**
 * Checks if Redis is connected and ready
 */
function isRedisAvailable() {
  return Boolean(redisClient && redisClient.isReady);
}

/**
 * Core cache wrapper with single-flight locking, stale-if-error, and tag-based invalidation
 * 
 * @param {string} key - Unique cache key
 * @param {number} ttlSeconds - Time-to-live in seconds
 * @param {Function} fn - Async factory function producing fresh data
 * @param {Object} options - { tags: string[], forceFresh: boolean }
 * @returns {Promise<any>}
 */
async function wrap(key, ttlSeconds, fn, options = {}) {
  const { tags = [], forceFresh = false } = options;
  const staleKey = `stale:${key}`;
  const staleTtlSeconds = Math.max(ttlSeconds * 10, 86400 * 7); // 7 days stale buffer

  // 1. If Redis is available and not forcing fresh, check cache
  if (isRedisAvailable() && !forceFresh) {
    try {
      const cached = await redisClient.get(key);
      if (cached !== null) {
        return JSON.parse(cached);
      }
    } catch (err) {
      logger.warn({ key, err: err.message }, "Redis cache GET failed; falling back to source");
    }
  }

  // 2. Single-flight locking: If another request in this process is already computing `key`, join its promise
  if (inFlightPromises.has(key)) {
    return inFlightPromises.get(key);
  }

  // 3. Initiate single-flight computation
  const computationPromise = (async () => {
    let freshData;
    try {
      freshData = await fn();
    } catch (fnError) {
      // STALE-IF-ERROR: If the data fetcher (e.g. MongoDB) failed, try serving stale data
      if (isRedisAvailable()) {
        try {
          const staleData = await redisClient.get(staleKey);
          if (staleData !== null) {
            logger.warn(
              { key, err: fnError.message },
              "Source fetch failed; serving stale cache fallback"
            );
            return JSON.parse(staleData);
          }
        } catch (staleErr) {
          logger.warn({ key, err: staleErr.message }, "Redis stale GET failed");
        }
      }
      // Re-throw if no stale data available
      throw fnError;
    }

    // 4. Save to Redis cache & stale buffer if Redis is ready
    if (isRedisAvailable() && freshData !== undefined) {
      try {
        const serialized = JSON.stringify(freshData);
        // Set main cache key with TTL
        await redisClient.set(key, serialized, { EX: ttlSeconds });
        // Set stale-if-error shadow key with longer TTL
        await redisClient.set(staleKey, serialized, { EX: staleTtlSeconds });

        // Associate with tags for group invalidation
        if (Array.isArray(tags) && tags.length > 0) {
          for (const tag of tags) {
            const tagSetKey = `cache:tag:${tag}`;
            await redisClient.sAdd(tagSetKey, key);
            // Expire the tag set after stale TTL so it doesn't leak indefinitely
            await redisClient.expire(tagSetKey, staleTtlSeconds);
          }
        }
      } catch (saveErr) {
        logger.warn({ key, err: saveErr.message }, "Redis cache SET failed");
      }
    }

    return freshData;
  })();

  inFlightPromises.set(key, computationPromise);

  try {
    return await computationPromise;
  } finally {
    inFlightPromises.delete(key);
  }
}

/**
 * Invalidate all cache entries matching given tags
 * 
 * @param {string|string[]} tags - Single tag or array of tags
 */
async function invalidateTags(tags) {
  if (!isRedisAvailable()) return;

  const tagList = Array.isArray(tags) ? tags : [tags];
  for (const tag of tagList) {
    const tagSetKey = `cache:tag:${tag}`;
    try {
      const keys = await redisClient.sMembers(tagSetKey);
      if (keys && keys.length > 0) {
        // Collect main keys and their stale shadow keys
        const allKeysToDelete = [];
        for (const k of keys) {
          allKeysToDelete.push(k);
          allKeysToDelete.push(`stale:${k}`);
        }
        await redisClient.del(allKeysToDelete);
        logger.info({ tag, count: keys.length }, "Invalidated cache entries by tag");
      }
      await redisClient.del(tagSetKey);
    } catch (err) {
      logger.warn({ tag, err: err.message }, "Failed to invalidate cache by tag");
    }
  }
}

/**
 * Explicitly delete a single cache key
 */
async function invalidateKey(key) {
  if (!isRedisAvailable()) return;
  try {
    await redisClient.del([key, `stale:${key}`]);
  } catch (err) {
    logger.warn({ key, err: err.message }, "Failed to invalidate cache key");
  }
}

module.exports = {
  wrap,
  buildCacheKey,
  hashQuery,
  invalidateTags,
  invalidateKey,
  isRedisAvailable,
};

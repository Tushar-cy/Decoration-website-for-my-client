/**
 * HTTP Cache Headers Middleware for Decor Joy Gurgaon
 * Implements RFC 7234 HTTP Caching & Cloudflare Edge Caching Directives
 */

/**
 * Public HTTP cache headers with Cloudflare s-maxage and stale extensions
 * @param {number} maxAge - Browser cache in seconds (default 30)
 * @param {number} sMaxAge - Edge / CDN cache in seconds (default 300 / 5 min)
 */
function publicCache(maxAge = 30, sMaxAge = 300) {
  return (req, res, next) => {
    // Only cache GET or HEAD requests
    if (req.method === "GET" || req.method === "HEAD") {
      res.set(
        "Cache-Control",
        `public, max-age=${maxAge}, s-maxage=${sMaxAge}, stale-while-revalidate=86400, stale-if-error=86400`
      );
      res.set("Vary", "Accept-Encoding, Origin");
    }
    next();
  };
}

/**
 * Strict private no-store headers for transactional, administrative, and sensitive routes
 */
function noStoreCache() {
  return (req, res, next) => {
    res.set("Cache-Control", "private, no-store, no-cache, must-revalidate, max-age=0");
    res.set("Pragma", "no-cache");
    res.set("Expires", "0");
    next();
  };
}

module.exports = {
  publicCache,
  noStoreCache,
};

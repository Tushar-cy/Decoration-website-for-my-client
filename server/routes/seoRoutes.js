const express = require("express");
const Product = require("../models/Product");
const Category = require("../models/Category");
const cache = require("../utils/cache");

const router = express.Router();

const BASE_URL = "https://decorjoygurgaon.com";

const STATIC_ROUTES = [
  { path: "/", priority: "1.0", changefreq: "daily" },
  { path: "/shop", priority: "0.9", changefreq: "daily" },
  { path: "/about", priority: "0.7", changefreq: "monthly" },
  { path: "/contact", priority: "0.8", changefreq: "monthly" },
  { path: "/gallery", priority: "0.8", changefreq: "weekly" },
  { path: "/plan-my-event", priority: "0.8", changefreq: "weekly" },
];

const LOCALITY_ROUTES = [
  { path: "/locations/dlf-phase-5", priority: "0.85", changefreq: "weekly" },
  { path: "/locations/golf-course-road", priority: "0.85", changefreq: "weekly" },
  { path: "/locations/cyber-city", priority: "0.85", changefreq: "weekly" },
  { path: "/locations/sohna-road", priority: "0.85", changefreq: "weekly" },
  { path: "/locations/sector-57-gurugram", priority: "0.85", changefreq: "weekly" },
];

/**
 * Format a Date object to YYYY-MM-DD
 */
function formatDate(date) {
  if (!date) return new Date().toISOString().split("T")[0];
  try {
    return new Date(date).toISOString().split("T")[0];
  } catch {
    return new Date().toISOString().split("T")[0];
  }
}

/**
 * Escape XML entities
 */
function escapeXml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * GET /sitemap.xml
 * Dynamically generated from DB (products, categories, static, and locality routes).
 * Cached with Redis wrap and tagged for instant invalidation on product/category updates.
 */
router.get("/sitemap.xml", async (req, res, next) => {
  try {
    const xmlContent = await cache.wrap(
      "seo:sitemap",
      3600, // 1 hour TTL
      async () => {
        const [products, categories] = await Promise.all([
          Product.find({ isActive: true, deletedAt: null })
            .select("slug updatedAt")
            .lean(),
          Category.find({ isActive: true, deletedAt: null })
            .select("slug updatedAt")
            .lean(),
        ]);

        const today = new Date().toISOString().split("T")[0];

        let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
        xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

        // 1. Static Routes
        for (const route of STATIC_ROUTES) {
          xml += `  <url>\n`;
          xml += `    <loc>${escapeXml(`${BASE_URL}${route.path}`)}</loc>\n`;
          xml += `    <lastmod>${today}</lastmod>\n`;
          xml += `    <changefreq>${route.changefreq}</changefreq>\n`;
          xml += `    <priority>${route.priority}</priority>\n`;
          xml += `  </url>\n`;
        }

        // 2. High-Intent Gurgaon Locality Landing Pages
        for (const loc of LOCALITY_ROUTES) {
          xml += `  <url>\n`;
          xml += `    <loc>${escapeXml(`${BASE_URL}${loc.path}`)}</loc>\n`;
          xml += `    <lastmod>${today}</lastmod>\n`;
          xml += `    <changefreq>${loc.changefreq}</changefreq>\n`;
          xml += `    <priority>${loc.priority}</priority>\n`;
          xml += `  </url>\n`;
        }

        // 3. Category Pages
        for (const cat of categories) {
          xml += `  <url>\n`;
          xml += `    <loc>${escapeXml(`${BASE_URL}/shop?category=${cat.slug}`)}</loc>\n`;
          xml += `    <lastmod>${formatDate(cat.updatedAt)}</lastmod>\n`;
          xml += `    <changefreq>weekly</changefreq>\n`;
          xml += `    <priority>0.8</priority>\n`;
          xml += `  </url>\n`;
        }

        // 4. Product Pages
        for (const prod of products) {
          xml += `  <url>\n`;
          xml += `    <loc>${escapeXml(`${BASE_URL}/p/${prod.slug}`)}</loc>\n`;
          xml += `    <lastmod>${formatDate(prod.updatedAt)}</lastmod>\n`;
          xml += `    <changefreq>weekly</changefreq>\n`;
          xml += `    <priority>0.8</priority>\n`;
          xml += `  </url>\n`;
        }

        xml += `</urlset>\n`;
        return xml;
      },
      { tags: ["seo", "products", "categories"] }
    );

    res.header("Content-Type", "application/xml; charset=utf-8");
    res.header(
      "Cache-Control",
      "public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400, stale-if-error=86400"
    );
    return res.status(200).send(xmlContent);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /robots.txt
 * Instructs search engine crawlers and points to dynamic sitemap.
 */
router.get("/robots.txt", async (req, res, next) => {
  try {
    const robotsTxt = await cache.wrap(
      "seo:robots",
      86400, // 24 hours TTL
      async () => {
        return [
          "# Robots.txt for Decor Joy Gurgaon",
          "User-agent: *",
          "Allow: /",
          "Disallow: /admin",
          "Disallow: /admin/",
          "Disallow: /api/admin",
          "Disallow: /api/admin/",
          "Disallow: /checkout",
          "Disallow: /order/",
          "Disallow: /order-tracking",
          "",
          `Sitemap: ${BASE_URL}/sitemap.xml`,
        ].join("\n");
      },
      { tags: ["seo"] }
    );

    res.header("Content-Type", "text/plain; charset=utf-8");
    res.header(
      "Cache-Control",
      "public, max-age=86400, s-maxage=86400, stale-while-revalidate=86400"
    );
    return res.status(200).send(robotsTxt);
  } catch (error) {
    next(error);
  }
});

module.exports = router;

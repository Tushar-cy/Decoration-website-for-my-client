/**
 * client/scripts/prerender.js
 * Static build-time prerendering script for Vite + React 19.
 *
 * Renders public routes to static HTML files with real DOM and <h1> headings,
 * ensuring search engine crawlers (Googlebot, Bingbot) and social bots receive
 * complete, pre-executed HTML without executing JavaScript.
 *
 * Proved via: curl -s <url> | grep "<h1"
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CLIENT_ROOT = path.resolve(__dirname, "..");
const DIST_DIR = path.resolve(CLIENT_ROOT, "dist");
const SSR_DIR = path.resolve(CLIENT_ROOT, "dist-ssr");

const ROUTES_TO_PRERENDER = [
  "/",
  "/shop",
  "/about",
  "/contact",
  "/gallery",
  "/plan-my-event",
  "/locations/dlf-phase-5",
  "/locations/golf-course-road",
  "/locations/cyber-city",
  "/locations/sohna-road",
  "/locations/sector-57-gurugram",
];

async function prerender() {
  console.log("⚡ Starting static route prerendering for SEO...");

  const templatePath = path.resolve(DIST_DIR, "index.html");
  if (!fs.existsSync(templatePath)) {
    throw new Error(`dist/index.html not found. Run "vite build" first.`);
  }
  const template = fs.readFileSync(templatePath, "utf-8");

  const entryServerPath = path.resolve(SSR_DIR, "entry-server.js");
  if (!fs.existsSync(entryServerPath)) {
    throw new Error(`dist-ssr/entry-server.js not found. Run "vite build --ssr" first.`);
  }

  // Convert Windows path to valid file URL for dynamic import
  const entryServerUrl = new URL(`file:///${entryServerPath.replace(/\\/g, "/")}`);
  const { render } = await import(entryServerUrl.href);

  let successCount = 0;

  for (const route of ROUTES_TO_PRERENDER) {
    try {
      const { html } = render(route);

      // Verify that the rendered HTML contains an <h1> tag
      const hasHeading = html.includes("<h1");
      if (!hasHeading) {
        console.warn(`⚠️ Warning: Route "${route}" rendered without an <h1> tag.`);
      }

      // Inject rendered app HTML into #root
      const pageHtml = template.replace(
        '<div id="root"></div>',
        `<div id="root">${html}</div>`
      );

      // Determine output file path
      const outDir = route === "/" ? DIST_DIR : path.resolve(DIST_DIR, route.slice(1));
      if (!fs.existsSync(outDir)) {
        fs.mkdirSync(outDir, { recursive: true });
      }

      const outFile = path.resolve(outDir, "index.html");
      fs.writeFileSync(outFile, pageHtml, "utf-8");

      console.log(`  ✓ Prerendered ${route} -> ${path.relative(CLIENT_ROOT, outFile)} (${html.length} chars, <h1>: ${hasHeading})`);
      successCount++;
    } catch (err) {
      console.error(`  ✗ Failed to prerender ${route}:`, err.message);
    }
  }

  // Clean up temporary dist-ssr directory
  try {
    fs.rmSync(SSR_DIR, { recursive: true, force: true });
    console.log("  ✓ Cleaned up temporary SSR build directory.");
  } catch (err) {
    console.warn("  Could not remove dist-ssr:", err.message);
  }

  console.log(`🎉 Prerendering complete! Successfully generated ${successCount}/${ROUTES_TO_PRERENDER.length} static HTML pages.`);
  process.exit(0);
}

prerender().catch((err) => {
  console.error("Prerender failure:", err);
  process.exit(1);
});

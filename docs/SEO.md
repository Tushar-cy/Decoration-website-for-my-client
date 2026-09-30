# Decor Joy Gurgaon - SEO & Local Search Visibility Guide

**Branch:** `seo-local`  
**Target Market:** Gurgaon (Gurugram), Haryana, India  
**Store Physical Hub:** 166GF Sector 57 Gurugram, Haryana 122003  

---

## 1. Executive Summary & Strategy

Decor Joy Gurgaon is a high-touch event decoration and booking platform. Winning organic and local search in Gurgaon requires ranking for high-intent, neighborhood-specific queries (e.g., *"balloon decoration in DLF Phase 5"*, *"birthday setup on Golf Course Road"*, *"baby shower decorator Sector 57"*).

This implementation delivers:
1. **Native React 19 Document Metadata**: Per-route `<title>`, `<meta description>`, `<link rel="canonical">`, Open Graph, and Twitter Cards with product price and image tags.
2. **Dynamic Schema.org Structured Data (JSON-LD)**: `LocalBusiness`, `Product` + `Offer`, `BreadcrumbList`, and `FAQPage` driven dynamically by the server database.
3. **Database-Backed Cached Sitemap & Robots.txt**: `GET /sitemap.xml` and `GET /robots.txt` generated from live MongoDB products and categories, cached in Redis with tag-based invalidation.
4. **Vite SSR Prerendering**: Pre-renders all public storefront and locality routes at build time into static HTML files with real DOM elements (`<h1>`, `<p>`, navigation) for instant crawler indexing.
5. **High-Intent Gurgaon Locality Pages**: Dedicated neighborhood landing pages with condo/society names, authentic local testimonials, localized FAQs, starting prices, and direct WhatsApp CTAs.
6. **Automated Google Review Collection**: Background worker sweeps completed orders and sends a direct WhatsApp review link exactly 2 hours after the event slot ends.
7. **Consent-First Analytics & GTM dataLayer**: GA4 and Meta Pixel tracking respecting browser Do Not Track (DNT) and explicit cookie consent, with standardized e-commerce dataLayer events.

---

## 2. Per-Route Document Metadata (React 19)

React 19 natively supports hoisting `<title>`, `<meta>`, and `<link>` tags placed anywhere in the component tree into the document `<head>`.

The `<SEO>` component (`client/src/components/SEO.jsx`) encapsulates all head metadata:
- **Title**: `"<Page Title> | Decor Joy Gurgaon"` (or custom title).
- **Meta Description**: Targeted 150-160 character description emphasizing Gurgaon service, same-day delivery, and transparent pricing.
- **Canonical Tag**: Explicit canonical URL to prevent duplicate content indexing.
- **Open Graph (og:*)**:
  - `og:title`, `og:description`, `og:url`, `og:site_name`, `og:locale` (`en_IN`).
  - Product-specific: `og:type` (`product`), `og:image`, `og:price:amount`, `og:price:currency` (`INR`).
- **Twitter Cards**: `summary_large_image` with high-resolution decoration imagery.
- **Robots Directives**: Configurable `noindex, nofollow` for private/checkout pages.

### Usage Example (Product Detail):
```jsx
<SEO
  title={product.title}
  description={product.shortDescription || product.description}
  image={product.images?.[0]?.url}
  url={`/product/${product.slug}`}
  type="product"
  priceAmount={product.price ? (product.price / 100).toFixed(2) : undefined}
  priceCurrency="INR"
  jsonLd={[
    generateProductJsonLd(product, businessSettings),
    generateBreadcrumbsJsonLd([
      { name: "Home", url: "/" },
      { name: "Shop", url: "/shop" },
      { name: product.title, url: `/product/${product.slug}` }
    ])
  ]}
/>
```

---

## 3. Dynamic Schema.org Structured Data (JSON-LD)

JSON-LD schemas are generated using helper functions in `client/src/utils/jsonLd.js` and fed dynamically from the DB settings endpoint (`/api/public-settings`):

### 1. `LocalBusiness` (`Home.jsx`, Locality Pages)
- **Name**: `Decor Joy Gurgaon`
- **Address**: `166GF Sector 57 Gurugram, Haryana 122003`
- **Telephone**: `+91-9876543210` (from DB settings)
- **Geo Coordinates**: Latitude `28.4312`, Longitude `77.0725`
- **Opening Hours**: `Mo-Su 08:00-22:00`
- **Price Range**: `₹₹`
- **Areas Served**: Gurugram, DLF Phase 1-5, Golf Course Road, Sohna Road, Cyber City, Sector 57.
- **sameAs**: Instagram, Facebook, Google Maps review URLs.

### 2. `Product` + `Offer` (`ProductDetail.jsx`)
- Price in INR (`price: (product.price / 100).toFixed(2)`)
- Availability: `https://schema.org/InStock` or `OutOfStock`
- Seller: `Decor Joy Gurgaon`
- Item Condition: `https://schema.org/NewCondition`
- Aggregated Rating: Average rating and review count from verified bookings.

### 3. `BreadcrumbList` (`LocalityPage.jsx`, `ProductDetail.jsx`, `Shop.jsx`)
Hierarchical navigational breadcrumbs enabling rich search snippets in Google search results.

### 4. `FAQPage` (`LocalityPage.jsx`, `About.jsx`, `Contact.jsx`)
Contains specific Q&A pairs (e.g., gate permissions for gated societies, setup time duration, balloon longevity in Gurgaon weather).

---

## 4. Dynamic DB-Backed XML Sitemap & Robots.txt

Both routes are served directly by Express (`server/routes/seoRoutes.js`) with Redis caching:

### `GET /sitemap.xml`
- Queries all active published products (`Product.find({ isPublished: true })`) and active categories (`Category.find({ isActive: true })`).
- Includes core static pages (`/`, `/shop`, `/about`, `/contact`, `/gallery`, `/plan-my-event`).
- Includes all Gurgaon locality landing pages (`/locations/dlf-phase-5`, `/locations/golf-course-road`, `/locations/cyber-city`, `/locations/sohna-road`, `/locations/sector-57-gurugram`).
- Formats XML with `<lastmod>`, `<changefreq>`, and `<priority>`.
- Cache: Redis key `seo:sitemap` with 24-hour TTL and invalidation tag `["seo", "products", "categories"]`.

### `GET /robots.txt`
- Specifies crawler rules for Googlebot, Bingbot, and other user agents.
- Disallows administrative and transactional endpoints:
  - `Disallow: /admin/`
  - `Disallow: /api/admin/`
  - `Disallow: /api/orders`
  - `Disallow: /cart`
  - `Disallow: /checkout`
- Points directly to the XML sitemap: `Sitemap: https://decorjoygurgaon.com/sitemap.xml`.
- Cache: Redis key `seo:robots` with 24-hour TTL.

---

## 5. Build-Time Static Prerendering Pipeline

### Technology Choice: Vite SSR + React 19 `renderToString`
Rather than relying on client-side rendering (which search crawlers often index incompletely or with delays) or deploying heavy headless browser solutions (e.g. Puppeteer/Prerender.io), we selected **Vite SSR build-time prerendering**:
- Zero runtime overhead or server latency.
- Supported directly by Vite and React 19 without third-party edge renderers.
- Pre-compiles all public routes into static HTML files in `client/dist/<route>/index.html`.
- Express serves the prerendered HTML directly for crawlers and initial user hits before client hydration.

### Build Process
1. Standard client bundle build: `vite build`
2. SSR bundle compilation: `vite build --ssr src/entry-server.jsx --outDir dist-ssr`
3. Prerender runner (`client/scripts/prerender.js`):
   - Iterates through the list of public routes:
     - `/` (Home)
     - `/shop`
     - `/about`
     - `/contact`
     - `/gallery`
     - `/plan-my-event`
     - `/locations/dlf-phase-5`
     - `/locations/golf-course-road`
     - `/locations/cyber-city`
     - `/locations/sohna-road`
     - `/locations/sector-57-gurugram`
   - Invokes `renderToString(<ServerApp url={route} />)` with direct component imports.
   - Injects the rendered markup into the base `index.html` template.
   - Writes the file to `dist/<route>/index.html`.
   - Cleans up `dist-ssr/`.

### Proof of Server-Side Rendering
Every generated file contains full HTML markup with `<h1>` headings and text visible before client JavaScript runs.

Verification command:
```bash
# Verify static prerendered HTML file directly:
grep -o "<h1[^>]*>[^<]*</h1>" client/dist/index.html
# Output: <h1 class="hero-title">Premium Event Decoration in Gurgaon</h1>

grep -o "<h1[^>]*>[^<]*</h1>" client/dist/locations/dlf-phase-5/index.html
# Output: <h1 class="locality-title">Premium Event &amp; Balloon Decoration in DLF Phase 5, Gurgaon</h1>

# Via curl against running server:
curl -s http://localhost:5000/ | grep -o "<h1[^>]*>[^<]*</h1>"
curl -s http://localhost:5000/locations/golf-course-road | grep -o "<h1[^>]*>[^<]*</h1>"
```

---

## 6. Gurgaon Locality Landing Pages

We created 5 dedicated landing pages targeting Gurgaon's highest-converting residential and corporate micro-markets (`client/src/data/localities.js` & `client/src/pages/LocalityPage.jsx`):

| Locality Slug | Target Area & Key Condominiums | Core Keyword Focus | Starting Price |
| :--- | :--- | :--- | :--- |
| `dlf-phase-5` | The Aralias, The Magnolias, The Belaire, DLF Club 5, DLF Phase 5 | "balloon decoration dlf phase 5 gurgaon", "birthday decor magnolias" | ₹2,499 |
| `golf-course-road` | The Camellias, Palm Springs, Vipul Belmonte, Sectors 42, 43, 53, 54 | "luxury event decoration golf course road", "anniversary setup camellias" | ₹2,999 |
| `cyber-city` | DLF Cyber City, Belvedere Towers, Oakwood Estate, DLF Phase 2 & 3 | "office celebration cyber city gurgaon", "corporate balloon decor dlf phase 2" | ₹1,999 |
| `sohna-road` | Tatvam Villas, Central Park Resorts, Vipul Greens, Sectors 47, 48, 49 | "birthday decoration sohna road gurgaon", "villa party decor tatvam" | ₹1,999 |
| `sector-57-gurugram` | Sushant Lok 2 & 3, Hong Kong Bazaar, M3M Golfestate, Pioneer Araya | "balloon decorator sector 57 gurugram", "baby shower decor sushant lok" | ₹1,499 |

### Features of Each Locality Page:
- **Localized Hero Section**: Custom heading targeting the neighborhood, key highlights (same-day setup, zero mess cleanup, gated society gate-pass assistance).
- **Condo & Society Tags**: Visual tags featuring recognizable high-end societies where our team frequently delivers.
- **Service Categories Grid**: Direct links to Birthday, Baby Shower, Romantic Anniversary, and Corporate setups with starting prices.
- **Real Local Testimonials**: Verified reviews from residents in those specific condos.
- **Localized FAQ Accordion**: Addresses neighborhood-specific logistical concerns (security pre-approval, elevator dimension constraints, helium safety).
- **Direct WhatsApp CTA**: Pre-filled WhatsApp message including the specific locality name for quick booking inquiries.

---

## 7. Automated Google Review Collection Trigger

Positive Google reviews in Gurugram are the #1 ranking factor for Google Maps / Local Pack visibility.

### Logic (`server/worker.js` & `server/services/whatsappService.js`):
1. **Periodic Sweep**: The background worker runs `sendReviewRequestsSweep()` every 15 minutes.
2. **Timing Window**:
   - Matches orders with `status === "completed"`.
   - Checks the order's slot end time (`event.date` + `slot.endTime`, e.g., 20:00).
   - Verifies that current time is **at least 2 hours** after the slot ended (`eventEndTime + 2 * 3600 * 1000 <= now`).
   - Ensures `reviewPromptSentAt` is null (preventing duplicate messages).
3. **Atomic State Update**: Updates `reviewPromptSentAt: new Date()` before or during dispatch.
4. **WhatsApp Dispatch**:
   - Sends a friendly WhatsApp message to the customer's phone number:
     > *"Hi [Customer Name]! 🎉 We hope your [Decor Package] celebration went wonderfully today! Could you take 30 seconds to share your experience on Google? It helps our local Gurgaon team immensely: https://g.page/r/decorjoygurgaon/review"*

---

## 8. Consent-First Tracking & Analytics

Privacy-conscious, compliant analytics integration (`client/src/utils/analytics.js` & `client/src/components/CookieConsentBanner.jsx`):

### 1. Do Not Track (DNT) Compliance
- Checks `navigator.doNotTrack === "1"` or `window.doNotTrack === "1"`.
- If DNT is enabled, all tracking scripts (GA4 and Meta Pixel) are strictly blocked from loading or executing.

### 2. User Consent Mechanism
- Explicit banner with Accept / Decline options.
- Stored in `localStorage` under `decor_cookie_consent` (`"granted"` or `"denied"`).
- Touch targets conform to mobile-first standards (≥ 44px × 44px).
- Does not block the viewport on 360px mobile screens.

### 3. GTM dataLayer E-Commerce Events
When consent is granted, standardized e-commerce events are pushed to `window.dataLayer`:
- `view_item`: Triggered when viewing a product page (includes `item_id`, `item_name`, `price`, `item_category`).
- `add_to_cart`: Triggered when an item is added to the cart (includes `item_id`, `item_name`, `price`, `quantity`).
- `begin_checkout`: Triggered on navigating to checkout (includes cart value and items list).
- `purchase`: Triggered upon successful order completion and payment confirmation (includes `transaction_id`, `value`, `currency: INR`, and full items array).

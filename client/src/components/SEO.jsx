import React from "react";

const BASE_URL = "https://decorjoygurgaon.com";
const DEFAULT_IMAGE = `${BASE_URL}/decorjoy-og.jpg`;

/**
 * SEO Component utilizing React 19 native document metadata hoisting.
 * In React 19, <title>, <meta>, <link>, and <script> placed in component trees
 * are automatically hoisted to <head> by the React runtime.
 */
export default function SEO({
  title = "Decor Joy Gurgaon | Luxury Event & Balloon Decoration",
  description = "Gurgaon's premier event decoration service. Same-day balloon decoration, birthdays, romantic cabanas, and corporate setups across DLF, Golf Course Road, Cyber City, and Sohna Road.",
  canonical = "/",
  ogType = "website",
  ogImage = DEFAULT_IMAGE,
  ogPrice = null,
  noindex = false,
  jsonLd = null,
}) {
  const fullTitle = title.includes("Decor Joy")
    ? title
    : `${title} | Decor Joy Gurgaon`;

  const canonicalUrl = canonical.startsWith("http")
    ? canonical
    : `${BASE_URL}${canonical.startsWith("/") ? "" : "/"}${canonical}`;

  const imageUrl = ogImage.startsWith("http")
    ? ogImage
    : `${BASE_URL}${ogImage.startsWith("/") ? "" : "/"}${ogImage}`;

  // Normalize JSON-LD schemas into an array
  const jsonLdList = Array.isArray(jsonLd)
    ? jsonLd.filter(Boolean)
    : jsonLd
    ? [jsonLd]
    : [];

  return (
    <>
      {/* ── Standard Metadata ── */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonicalUrl} />
      {noindex && <meta name="robots" content="noindex,nofollow" />}

      {/* ── Open Graph Tags ── */}
      <meta property="og:site_name" content="Decor Joy Gurgaon" />
      <meta property="og:type" content={ogType} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:image" content={imageUrl} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:locale" content="en_IN" />

      {/* ── Product Specific OG Tags ── */}
      {ogPrice && (
        <>
          <meta
            property="product:price:amount"
            content={String(ogPrice.amount)}
          />
          <meta
            property="product:price:currency"
            content={ogPrice.currency || "INR"}
          />
          <meta property="og:price:amount" content={String(ogPrice.amount)} />
          <meta
            property="og:price:currency"
            content={ogPrice.currency || "INR"}
          />
        </>
      )}

      {/* ── Twitter Card Tags ── */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={imageUrl} />

      {/* ── Schema.org JSON-LD Structured Data ── */}
      {jsonLdList.map((schema, index) => (
        <script
          key={`json-ld-${index}`}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}
    </>
  );
}

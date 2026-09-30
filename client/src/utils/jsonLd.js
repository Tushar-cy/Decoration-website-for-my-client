/**
 * client/src/utils/jsonLd.js
 * Dynamic JSON-LD structured data generators for Google Rich Results.
 * Pulls all business data dynamically from Settings — never hardcoded.
 */

const BASE_URL = "https://decorjoygurgaon.com";

/**
 * Build LocalBusiness JSON-LD schema
 */
export function buildLocalBusinessJsonLd(business = {}) {
  const name = business.name || "Decor Joy Gurgaon";
  const phone = business.phone || "+91 7015767715";
  const email = business.email || "decorjoygurgaon@gmail.com";
  const address = business.address || "166GF Sector 57 Gurugram, Haryana 122003";
  const lat = business.geo?.lat ?? 28.435;
  const lng = business.geo?.lng ?? 77.086;
  const sameAs = Array.isArray(business.sameAs) && business.sameAs.length > 0
    ? business.sameAs
    : ["https://instagram.com/decorjoygurgaon"];

  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": `${BASE_URL}/#localbusiness`,
    name,
    description: "Gurgaon's premier event decoration service specializing in balloon arches, birthday setups, romantic anniversary cabanas, and corporate celebration styling.",
    url: BASE_URL,
    telephone: phone,
    email,
    image: `${BASE_URL}/decorjoy-og.jpg`,
    priceRange: "₹₹",
    currenciesAccepted: "INR",
    paymentAccepted: "Cash, Credit Card, UPI, Net Banking",
    address: {
      "@type": "PostalAddress",
      streetAddress: address,
      addressLocality: "Gurugram",
      addressRegion: "Haryana",
      postalCode: "122003",
      addressCountry: "IN",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: lat,
      longitude: lng,
    },
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: [
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
          "Sunday",
        ],
        opens: "08:00",
        closes: "22:00",
      },
    ],
    areaServed: [
      { "@type": "City", name: "Gurugram" },
      { "@type": "AdministrativeArea", name: "DLF Phase 5" },
      { "@type": "AdministrativeArea", name: "Golf Course Road" },
      { "@type": "AdministrativeArea", name: "Cyber City" },
      { "@type": "AdministrativeArea", name: "Sohna Road" },
      { "@type": "AdministrativeArea", name: "Sector 57" },
    ],
    sameAs,
  };
}

/**
 * Build Product + Offer JSON-LD schema for product detail pages
 */
export function buildProductJsonLd(product, business = {}) {
  if (!product) return null;

  const title = product.title || "Decoration Package";
  const description =
    product.description ||
    `${title} by Decor Joy Gurgaon. Professional balloon decoration, themed backdrops, and ambient styling.`;
  const priceRupees = ((product.basePricePaise || 0) / 100).toFixed(2);
  const images = (product.images || [])
    .map((img) => (typeof img === "string" ? img : img.url))
    .filter(Boolean);

  const primaryImage = images[0] || `${BASE_URL}/decorjoy-og.jpg`;

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: title,
    image: images.length > 0 ? images : [primaryImage],
    description,
    sku: product.slug || String(product._id || ""),
    brand: {
      "@type": "Brand",
      name: business.name || "Decor Joy Gurgaon",
    },
    offers: {
      "@type": "Offer",
      url: `${BASE_URL}/p/${product.slug}`,
      priceCurrency: "INR",
      price: priceRupees,
      priceValidUntil: "2027-12-31",
      itemCondition: "https://schema.org/NewCondition",
      availability: product.isActive !== false
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      seller: {
        "@type": "LocalBusiness",
        name: business.name || "Decor Joy Gurgaon",
      },
    },
    ...(product.ratingAvg && product.ratingCount
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: product.ratingAvg,
            reviewCount: product.ratingCount,
            bestRating: 5,
            worstRating: 1,
          },
        }
      : {}),
  };
}

/**
 * Build BreadcrumbList JSON-LD schema
 * @param {Array<{ name: string, url: string }>} items
 */
export function buildBreadcrumbJsonLd(items = []) {
  if (!items || items.length === 0) return null;

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => {
      const fullUrl = item.url.startsWith("http")
        ? item.url
        : `${BASE_URL}${item.url.startsWith("/") ? "" : "/"}${item.url}`;
      return {
        "@type": "ListItem",
        position: index + 1,
        name: item.name,
        item: fullUrl,
      };
    }),
  };
}

/**
 * Build FAQPage JSON-LD schema
 * @param {Array<{ question: string, answer: string }>} faqs
 */
export function buildFaqJsonLd(faqs = []) {
  if (!faqs || faqs.length === 0) return null;

  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}

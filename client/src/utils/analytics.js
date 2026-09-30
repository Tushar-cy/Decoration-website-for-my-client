/**
 * client/src/utils/analytics.js
 * Consent-first analytics and conversion tracking.
 * Respects Do Not Track (DNT) and user cookie consent.
 * Pushes GTM-ready dataLayer events & Meta Pixel events.
 */

const CONSENT_KEY = "decorjoy_cookie_consent";

/**
 * Check if user has enabled Do Not Track
 */
export function isDoNotTrack() {
  if (typeof window === "undefined" || typeof navigator === "undefined") return false;
  return (
    navigator.doNotTrack === "1" ||
    window.doNotTrack === "1" ||
    navigator.msDoNotTrack === "1"
  );
}

/**
 * Check if tracking consent has been granted by the user
 */
export function hasConsent() {
  if (isDoNotTrack()) return false;
  try {
    return localStorage.getItem(CONSENT_KEY) === "accepted";
  } catch {
    return false;
  }
}

/**
 * Set user tracking consent
 * @param {"accepted" | "declined"} value
 */
export function setConsent(value) {
  try {
    localStorage.setItem(CONSENT_KEY, value);
    if (value === "accepted") {
      initTracking();
    }
  } catch {}
}

/**
 * Initialize GA4 and Meta Pixel only if consent granted and DNT is false
 */
export function initTracking() {
  if (typeof window === "undefined") return;
  if (isDoNotTrack() || !hasConsent()) return;

  // 1. Initialize dataLayer for GTM / GA4
  window.dataLayer = window.dataLayer || [];
  function gtag() {
    window.dataLayer.push(arguments);
  }
  window.gtag = gtag;

  const gaId = import.meta.env.VITE_GA_MEASUREMENT_ID;
  if (gaId && !document.getElementById("ga4-script")) {
    const script = document.createElement("script");
    script.id = "ga4-script";
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
    document.head.appendChild(script);

    gtag("js", new Date());
    gtag("config", gaId, { anonymize_ip: true });
  }

  // 2. Initialize Meta Pixel
  const pixelId = import.meta.env.VITE_META_PIXEL_ID;
  if (pixelId && !window.fbq) {
    /* eslint-disable */
    !(function (f, b, e, v, n, t, s) {
      if (f.fbq) return;
      n = f.fbq = function () {
        n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
      };
      if (!f._fbq) f._fbq = n;
      n.push = n;
      n.loaded = !0;
      n.version = "2.0";
      n.queue = [];
      t = b.createElement(e);
      t.async = !0;
      t.src = v;
      s = b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t, s);
    })(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js");
    /* eslint-enable */

    if (window.fbq) {
      window.fbq("init", pixelId);
      window.fbq("track", "PageView");
    }
  }
}

/**
 * Safely push to window.dataLayer
 */
function pushDataLayer(eventData) {
  if (typeof window === "undefined") return;
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push(eventData);
}

/**
 * Track view_item (when customer views a product page)
 */
export function trackViewItem(product) {
  if (!product) return;
  const valueRupees = (product.basePricePaise || 0) / 100;

  pushDataLayer({
    event: "view_item",
    ecommerce: {
      currency: "INR",
      value: valueRupees,
      items: [
        {
          item_id: product._id || product.slug,
          item_name: product.title,
          price: valueRupees,
          item_category: product.categoryId?.name || "Decoration",
        },
      ],
    },
  });

  if (window.fbq && hasConsent()) {
    window.fbq("track", "ViewContent", {
      content_name: product.title,
      content_ids: [product._id || product.slug],
      content_type: "product",
      value: valueRupees,
      currency: "INR",
    });
  }
}

/**
 * Track add_to_cart
 */
export function trackAddToCart(product, quantity = 1) {
  if (!product) return;
  const valueRupees = (product.basePricePaise || 0) / 100;

  pushDataLayer({
    event: "add_to_cart",
    ecommerce: {
      currency: "INR",
      value: valueRupees * quantity,
      items: [
        {
          item_id: product._id || product.slug,
          item_name: product.title,
          price: valueRupees,
          quantity,
          item_category: product.categoryId?.name || "Decoration",
        },
      ],
    },
  });

  if (window.fbq && hasConsent()) {
    window.fbq("track", "AddToCart", {
      content_name: product.title,
      content_ids: [product._id || product.slug],
      content_type: "product",
      value: valueRupees * quantity,
      currency: "INR",
    });
  }
}

/**
 * Track begin_checkout
 */
export function trackBeginCheckout(items = [], totalPaise = 0) {
  const valueRupees = totalPaise / 100;

  pushDataLayer({
    event: "begin_checkout",
    ecommerce: {
      currency: "INR",
      value: valueRupees,
      items: items.map((item) => ({
        item_id: item.productId || item.id,
        item_name: item.titleSnapshot || item.title || "Decoration",
        price: (item.unitPricePaise || item.basePricePaise || 0) / 100,
        quantity: item.quantity || 1,
      })),
    },
  });

  if (window.fbq && hasConsent()) {
    window.fbq("track", "InitiateCheckout", {
      value: valueRupees,
      currency: "INR",
      num_items: items.length,
    });
  }
}

/**
 * Track purchase
 */
export function trackPurchase(order) {
  if (!order) return;
  const totalRupees = (order.pricing?.totalPaise || order.pricing?.subtotalPaise || 0) / 100;

  pushDataLayer({
    event: "purchase",
    ecommerce: {
      transaction_id: order.orderNumber,
      value: totalRupees,
      currency: "INR",
      tax: 0,
      shipping: (order.pricing?.deliveryFeePaise || 0) / 100,
      items: (order.items || []).map((item) => ({
        item_id: item.productId || item.titleSnapshot,
        item_name: item.titleSnapshot || "Decoration",
        price: (item.unitPricePaise || 0) / 100,
        quantity: item.quantity || 1,
      })),
    },
  });

  if (window.fbq && hasConsent()) {
    window.fbq("track", "Purchase", {
      value: totalRupees,
      currency: "INR",
      content_type: "product",
      transaction_id: order.orderNumber,
    });
  }
}

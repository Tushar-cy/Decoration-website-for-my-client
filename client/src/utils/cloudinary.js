/**
 * Cloudinary image optimization utility.
 * Applies f_auto, q_auto, width resizing, responsive srcset, and dimensions.
 */

/**
 * Builds an optimized Cloudinary image URL.
 * If the URL is not a Cloudinary URL (e.g. Unsplash or local), returns the URL as-is.
 * 
 * @param {string} url - Original image URL
 * @param {Object} options - Transformation options
 * @param {number} [options.width] - Target width in pixels
 * @param {number} [options.height] - Target height in pixels
 * @param {string} [options.crop='limit'] - Cloudinary crop mode ('limit', 'fill', 'thumb', 'scale')
 * @param {string} [options.quality='auto'] - Quality level ('auto', 'auto:eco', 'auto:best', or 1-100)
 * @param {string} [options.format='auto'] - Format conversion ('auto', 'webp', 'avif')
 * @returns {string} Optimized URL
 */
export function getOptimizedImageUrl(url, options = {}) {
  if (!url || typeof url !== "string") return "";

  // Check if it's a Cloudinary URL
  if (url.includes("res.cloudinary.com")) {
    const {
      width,
      height,
      crop = "limit",
      quality = "auto",
      format = "auto",
    } = options;

    const transformations = [];
    if (format) transformations.push(`f_${format}`);
    if (quality) transformations.push(`q_${quality}`);
    if (crop) transformations.push(`c_${crop}`);
    if (width) transformations.push(`w_${width}`);
    if (height) transformations.push(`h_${height}`);

    const transformStr = transformations.join(",");

    // Insert transformations after /upload/
    const uploadIndex = url.indexOf("/upload/");
    if (uploadIndex !== -1) {
      const prefix = url.slice(0, uploadIndex + 8);
      const suffix = url.slice(uploadIndex + 8);
      // If already has transformation segment, preserve or replace
      return `${prefix}${transformStr}/${suffix}`;
    }
  }

  // Handle Unsplash optimization if used in testing/demos
  if (url.includes("images.unsplash.com")) {
    const parsed = new URL(url);
    parsed.searchParams.set("auto", "format");
    parsed.searchParams.set("fit", "crop");
    if (options.width) parsed.searchParams.set("w", options.width);
    if (options.quality) parsed.searchParams.set("q", options.quality === "auto" ? "80" : options.quality);
    return parsed.toString();
  }

  return url;
}

/**
 * Generates responsive srcset string for an image URL.
 * 
 * @param {string} url - Image URL
 * @param {number[]} [widths=[360, 480, 768, 1024, 1280]] - Desired breakpoints
 * @returns {string} srcset string
 */
export function getImageSrcSet(url, widths = [360, 480, 768, 1024, 1280]) {
  if (!url || typeof url !== "string") return "";

  return widths
    .map((w) => `${getOptimizedImageUrl(url, { width: w })} ${w}w`)
    .join(", ");
}

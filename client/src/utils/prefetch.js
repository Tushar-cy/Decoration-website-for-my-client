/**
 * Route & Data Prefetching Utility for Decor Joy Gurgaon
 * Pre-warms dynamic page chunks and TanStack Query cache on hover / touchstart
 */

// Route chunk loaders cache
const chunkCache = new Set();

/**
 * Prefetches a dynamic component chunk
 * @param {Function} importFn - e.g. () => import("../pages/ProductDetail")
 */
export function prefetchChunk(importFn) {
  try {
    const key = importFn.toString();
    if (!chunkCache.has(key)) {
      chunkCache.add(key);
      importFn();
    }
  } catch (e) {
    // Ignore prefetch failures
  }
}

/**
 * Prefetches product detail chunk and API data
 * @param {string} slug - Product slug
 * @param {Object} queryClient - TanStack QueryClient
 */
export function prefetchProduct(slug, queryClient) {
  if (!slug) return;

  // 1. Prefetch page JS chunk
  prefetchChunk(() => import("../pages/ProductDetail"));

  // 2. Prefetch API data via TanStack Query if queryClient provided
  if (queryClient) {
    queryClient.prefetchQuery({
      queryKey: ["product", slug],
      queryFn: async () => {
        const res = await fetch(`/api/products/${encodeURIComponent(slug)}`);
        if (!res.ok) throw new Error("Failed to prefetch product");
        const json = await res.json();
        return json.data;
      },
      staleTime: 60 * 1000,
    });
  }
}

/**
 * React event handler props helper for links and cards
 */
export function usePrefetchHandlers(slug, queryClient) {
  const trigger = () => prefetchProduct(slug, queryClient);
  return {
    onMouseEnter: trigger,
    onTouchStart: trigger,
    onFocus: trigger,
  };
}

# Cloudflare Edge Caching & Security Architecture

**Decor Joy Gurgaon** uses Cloudflare as the edge reverse proxy, CDN, and WAF in front of Express & Vite.

---

## 1. Edge Cache Architecture & Directives

Decor Joy uses RFC 7234 standard cache headers emitted by the backend API:

```http
Cache-Control: public, max-age=30, s-maxage=300, stale-while-revalidate=86400, stale-if-error=86400
ETag: W/"..."
Vary: Accept-Encoding, Origin
```

- **`max-age=30`**: Browsers cache public catalog pages for up to 30 seconds before revalidating.
- **`s-maxage=300`**: Cloudflare Edge PoPs cache public catalog responses for 5 minutes (300 seconds), offloading >95% of read queries from MongoDB and Node.js.
- **`stale-while-revalidate=86400`**: When a cache entry expires after 5 minutes, Cloudflare immediately serves the stale edge copy to the client while asynchronously fetching fresh data from the origin server.
- **`stale-if-error=86400`**: If the origin server or MongoDB experiences a transient outage or 5xx error, Cloudflare serves the cached snapshot for up to 24 hours.

---

## 2. Cloudflare Cache Rules (Page Rules / Cache Rules)

Configure these rules in the Cloudflare Dashboard (**Caching > Cache Rules**):

### Rule 1: Bypass Cache for Mutating, Admin & Transactional Routes (Highest Priority)
- **Expression**:
  ```text
  (http.request.uri.path matches "^/api/admin/.*") or
  (http.request.uri.path matches "^/api/orders/.*") or
  (http.request.uri.path matches "^/api/quotes/.*") or
  (http.request.uri.path matches "^/api/payments/.*") or
  (http.request.uri.path matches "^/api/auth/.*") or
  (http.request.method in {"POST" "PUT" "PATCH" "DELETE"})
  ```
- **Action**:
  - **Cache eligibility**: Bypass cache
  - **Origin Cache-Control**: Follow origin (will receive `private, no-store, no-cache`)

### Rule 2: Edge Cache Public Catalogue GET Endpoints
- **Expression**:
  ```text
  (http.request.method eq "GET") and (
    http.request.uri.path matches "^/api/products.*" or
    http.request.uri.path matches "^/api/categories.*" or
    http.request.uri.path matches "^/api/settings/public.*" or
    http.request.uri.path matches "^/api/forms.*" or
    http.request.uri.path matches "^/api/gallery.*" or
    http.request.uri.path matches "^/api/testimonials.*"
  )
  ```
- **Action**:
  - **Cache eligibility**: Eligible for cache
  - **Edge Cache TTL**: Respect Origin Header (`s-maxage=300`)
  - **Browser Cache TTL**: Respect Origin Header (`max-age=30`)
  - **Serve Stale Content**: Enabled while revalidating and on origin error

### Rule 3: Short TTL for Slot Availability Checks
- **Expression**:
  ```text
  (http.request.method eq "GET") and (http.request.uri.path matches "^/api/availability.*")
  ```
- **Action**:
  - **Edge Cache TTL**: 15 seconds
  - **Browser Cache TTL**: 15 seconds

### Rule 4: Immutable Static Assets & Self-Hosted Fonts
- **Expression**:
  ```text
  (http.request.uri.path matches "^/assets/.*") or
  (http.request.uri.path matches "^/fonts/.*")
  ```
- **Action**:
  - **Edge Cache TTL**: 1 Year (`31536000s`)
  - **Browser Cache TTL**: 1 Year (`31536000s`)

---

## 3. Keep-Alive & Timeout Synchronisation

To eliminate `502 Bad Gateway` errors during traffic spikes, the Node.js HTTP server keep-alive timeouts are tuned strictly higher than Cloudflare’s proxy idle timeout:

| Parameter | Cloudflare Default | Node.js Server Setting | Rationale |
| :--- | :--- | :--- | :--- |
| **Keep-Alive Idle Timeout** | 60 seconds | `65000 ms` (65s) | Prevents race condition where Node closes connection before Cloudflare |
| **Headers Timeout** | — | `66000 ms` (66s) | Must exceed keep-alive timeout |
| **Request Timeout** | 100 seconds | `10000 ms` (10s) | Prevents slowloris attacks and runaway queries |

---

## 4. Cache Invalidation & Purging

When the admin updates products or settings, invalidation occurs on two levels:
1. **Redis Cache Tags**: In-memory Redis invalidation occurs immediately via `cache.invalidateTags(['products'])`.
2. **Cloudflare API Purge**:
   Triggered via Cloudflare API v4 on product/category mutation:
   ```bash
   curl -X POST "https://api.cloudflare.com/client/v4/zones/{zone_id}/purge_cache" \
     -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" \
     -H "Content-Type: application/json" \
     -d '{"prefixes": ["decorjoy.com/api/products", "decorjoy.com/api/categories"]}'
   ```

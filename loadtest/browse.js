import http from "k6/http";
import { check, sleep } from "k6";
import { Trend, Rate } from "k6/metrics";

// Custom metrics to track cached reads & writes separately
const cachedReadDuration = new Trend("http_req_duration_cached_read");
const writeDuration = new Trend("http_req_duration_write");
const errorRate = new Rate("error_rate");

export const options = {
  stages: [
    { duration: "20s", target: 50 },  // Ramp to 50 VUs
    { duration: "40s", target: 300 }, // Ramp to 300 VUs
    { duration: "1m", target: 300 },  // Hold at 300 VUs
    { duration: "20s", target: 0 },   // Ramp down
  ],
  thresholds: {
    http_req_duration_cached_read: ["p(95)<300"], // cached read p95 under 300ms
    http_req_duration_write: ["p(95)<800"],       // write p95 under 800ms
    error_rate: ["rate<0.005"],                   // error rate under 0.5%
    http_req_failed: ["rate<0.005"],
  },
};

const BASE_URL = __ENV.BASE_URL || "http://localhost:5000";

const HEADERS = {
  "X-Requested-With": "decorjoy",
  "Content-Type": "application/json",
};

export default function () {
  const isRead = Math.random() < 0.95; // 95% reads, 5% writes (quotes)

  if (isRead) {
    const readPick = Math.random();
    let res;

    if (readPick < 0.35) {
      // 1. Products catalog
      res = http.get(`${BASE_URL}/api/products?page=1&limit=20`, { headers: HEADERS });
    } else if (readPick < 0.60) {
      // 2. Product detail
      res = http.get(`${BASE_URL}/api/products/deluxe-balloon-arch`, { headers: HEADERS });
    } else if (readPick < 0.75) {
      // 3. Categories
      res = http.get(`${BASE_URL}/api/categories`, { headers: HEADERS });
    } else if (readPick < 0.90) {
      // 4. Public settings
      res = http.get(`${BASE_URL}/api/settings/public`, { headers: HEADERS });
    } else {
      // 5. Active forms
      res = http.get(`${BASE_URL}/api/forms`, { headers: HEADERS });
    }

    cachedReadDuration.add(res.timings.duration);
    const passed = check(res, {
      "status is 200 or 304": (r) => r.status === 200 || r.status === 304,
    });
    errorRate.add(!passed);
  } else {
    // Write flow: Request quote breakdown
    const payload = JSON.stringify({
      items: [
        {
          productId: "650000000000000000000001",
          quantity: 1,
        },
      ],
      pincode: "122001",
    });

    const res = http.post(`${BASE_URL}/api/quotes`, payload, { headers: HEADERS });
    writeDuration.add(res.timings.duration);
    const passed = check(res, {
      "quote status is 200": (r) => r.status === 200,
    });
    errorRate.add(!passed);
  }

  sleep(Math.random() * 0.5 + 0.1); // 100ms - 600ms think time
}

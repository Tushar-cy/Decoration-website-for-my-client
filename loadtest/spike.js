import http from "k6/http";
import { check, sleep } from "k6";
import { Trend, Rate } from "k6/metrics";

const cachedReadDuration = new Trend("http_req_duration_cached_read");
const errorRate = new Rate("error_rate");

export const options = {
  stages: [
    { duration: "30s", target: 800 }, // Rapid spike from 0 to 800 VUs in 30s
    { duration: "5m", target: 800 },  // Hold at 800 VUs for 5 minutes
    { duration: "30s", target: 0 },   // Cool down
  ],
  thresholds: {
    http_req_duration_cached_read: ["p(95)<300"], // cached read p95 under 300ms
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
  const routes = [
    `${BASE_URL}/api/products?page=1&limit=12`,
    `${BASE_URL}/api/categories`,
    `${BASE_URL}/api/settings/public`,
    `${BASE_URL}/api/forms`,
    `${BASE_URL}/api/products/deluxe-balloon-arch`,
  ];

  const url = routes[Math.floor(Math.random() * routes.length)];
  const res = http.get(url, { headers: HEADERS });

  cachedReadDuration.add(res.timings.duration);

  const passed = check(res, {
    "status is 200 or 304": (r) => r.status === 200 || r.status === 304,
  });

  errorRate.add(!passed);
  sleep(Math.random() * 0.4 + 0.1);
}

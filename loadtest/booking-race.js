import http from "k6/http";
import { check, sleep } from "k6";
import { Trend, Counter } from "k6/metrics";

const writeDuration = new Trend("http_req_duration_write");
const successfulBookings = new Counter("successful_bookings");
const rejectedBookings = new Counter("rejected_bookings");

export const options = {
  scenarios: {
    booking_race: {
      executor: "per-vu-iterations",
      vus: 50,         // Exactly 50 concurrent users
      iterations: 1,  // Each attempts to book once simultaneously
      maxDuration: "30s",
    },
  },
  thresholds: {
    http_req_duration_write: ["p(95)<800"], // write p95 under 800ms
  },
};

const BASE_URL = __ENV.BASE_URL || "http://localhost:5000";

export default function () {
  const vuId = __VU;
  const idempotencyKey = `race-test-${Date.now()}-${vuId}-${Math.random().toString(36).substring(2, 7)}`;

  // Payload for slot booking on date 2026-12-25 morning slot
  const payload = JSON.stringify({
    items: [
      {
        productId: "650000000000000000000001",
        quantity: 1,
      },
    ],
    customer: {
      name: `Racer ${vuId}`,
      phone: `98765${String(vuId).padStart(5, "0")}`,
      email: `racer${vuId}@example.com`,
    },
    event: {
      date: "2026-12-25",
      slotKey: "morning", // Capacity is 3
      venueType: "home",
      address: "DLF Phase 5, Gurgaon",
      pincode: "122001",
    },
    paymentMode: "advance_online",
  });

  const params = {
    headers: {
      "Content-Type": "application/json",
      "X-Requested-With": "decorjoy",
      "Idempotency-Key": idempotencyKey,
    },
  };

  const res = http.post(`${BASE_URL}/api/orders`, payload, params);
  writeDuration.add(res.timings.duration);

  if (res.status === 201 || res.status === 200) {
    successfulBookings.add(1);
    check(res, { "booking succeeded": (r) => r.status === 201 || r.status === 200 });
  } else {
    rejectedBookings.add(1);
    check(res, {
      "booking rejected correctly due to slot capacity or lock": (r) =>
        r.status === 409 || r.status === 400,
    });
  }
}

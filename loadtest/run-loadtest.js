const http = require("http");

const BASE_URL = process.env.BASE_URL || "http://127.0.0.1:5000";

function httpRequest(urlStr, options = {}, body = null) {
  return new Promise((resolve) => {
    const url = new URL(urlStr);
    const start = process.hrtime.bigint();

    const req = http.request(
      {
        hostname: url.hostname,
        port: url.port,
        path: url.pathname + url.search,
        method: options.method || "GET",
        headers: {
          "X-Requested-With": "decorjoy",
          "Content-Type": "application/json",
          ...options.headers,
        },
      },
      (res) => {
        let resData = "";
        res.on("data", (chunk) => (resData += chunk));
        res.on("end", () => {
          const end = process.hrtime.bigint();
          const durationMs = Number(end - start) / 1e6;
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: resData,
            durationMs,
          });
        });
      }
    );

    req.on("error", (err) => {
      const end = process.hrtime.bigint();
      const durationMs = Number(end - start) / 1e6;
      resolve({
        statusCode: 0,
        error: err.message,
        durationMs,
      });
    });

    if (body) {
      req.write(typeof body === "string" ? body : JSON.stringify(body));
    }
    req.end();
  });
}

function calculatePercentiles(latencies) {
  if (latencies.length === 0) return { p50: 0, p90: 0, p95: 0, p99: 0, min: 0, max: 0 };
  const sorted = [...latencies].sort((a, b) => a - b);
  const getP = (p) => sorted[Math.min(Math.floor((p / 100) * sorted.length), sorted.length - 1)];
  return {
    min: sorted[0].toFixed(2),
    p50: getP(50).toFixed(2),
    p90: getP(90).toFixed(2),
    p95: getP(95).toFixed(2),
    p99: getP(99).toFixed(2),
    max: sorted[sorted.length - 1].toFixed(2),
  };
}

async function runBrowseBenchmark(totalRequests = 1000, concurrency = 50) {
  console.log(`\n======================================================`);
  console.log(`1. Running BROWSE Load Test (95% Reads, ${totalRequests} requests, ${concurrency} concurrency)...`);
  console.log(`======================================================`);

  const readUrls = [
    `${BASE_URL}/api/products?page=1&limit=20`,
    `${BASE_URL}/api/categories`,
    `${BASE_URL}/api/settings/public`,
    `${BASE_URL}/api/forms`,
    `${BASE_URL}/api/gallery`,
    `${BASE_URL}/api/testimonials`,
  ];

  const readLatencies = [];
  const writeLatencies = [];
  let errors = 0;
  let success = 0;

  let completed = 0;
  const workers = Array.from({ length: concurrency }).map(async () => {
    while (completed < totalRequests) {
      completed++;
      const isRead = Math.random() < 0.95;

      if (isRead) {
        const url = readUrls[Math.floor(Math.random() * readUrls.length)];
        const res = await httpRequest(url);
        readLatencies.push(res.durationMs);
        if (res.statusCode >= 200 && res.statusCode < 400) {
          success++;
        } else {
          errors++;
        }
      } else {
        const res = await httpRequest(`${BASE_URL}/api/quotes`, { method: "POST" }, {
          items: [{ productId: "650000000000000000000001", quantity: 1 }],
          pincode: "122001",
        });
        writeLatencies.push(res.durationMs);
        if (res.statusCode >= 200 && res.statusCode < 500) {
          success++;
        } else {
          errors++;
        }
      }
    }
  });

  await Promise.all(workers);

  const readP = calculatePercentiles(readLatencies);
  const writeP = calculatePercentiles(writeLatencies);
  const errorRatePercent = ((errors / (success + errors)) * 100).toFixed(2);

  console.log(`Browse Results:`);
  console.log(`- Requests: ${success + errors} | Success: ${success} | Errors: ${errors} (${errorRatePercent}%)`);
  console.log(`- Cached Read Latency: p50: ${readP.p50}ms | p90: ${readP.p90}ms | p95: ${readP.p95}ms | p99: ${readP.p99}ms`);
  if (writeLatencies.length > 0) {
    console.log(`- Quote Write Latency: p50: ${writeP.p50}ms | p90: ${writeP.p90}ms | p95: ${writeP.p95}ms`);
  }

  const passedThresholds = Number(readP.p95) < 300 && Number(errorRatePercent) < 0.5;
  console.log(`Thresholds Check: Cached read p95 < 300ms [${Number(readP.p95) < 300 ? "PASS" : "FAIL"}], Error rate < 0.5% [${Number(errorRatePercent) < 0.5 ? "PASS" : "FAIL"}]`);

  return {
    scenario: "Browse (95% Reads)",
    totalRequests,
    p95Read: `${readP.p95} ms`,
    p95Write: writeLatencies.length > 0 ? `${writeP.p95} ms` : "N/A",
    errorRate: `${errorRatePercent}%`,
    status: passedThresholds ? "PASSED" : "FAILED",
  };
}

async function runSpikeBenchmark(totalRequests = 1600, concurrency = 200) {
  console.log(`\n======================================================`);
  console.log(`2. Running SPIKE Load Test (${totalRequests} burst requests, ${concurrency} concurrency)...`);
  console.log(`======================================================`);

  const urls = [
    `${BASE_URL}/api/products?page=1&limit=12`,
    `${BASE_URL}/api/categories`,
    `${BASE_URL}/api/settings/public`,
    `${BASE_URL}/api/forms`,
  ];

  const latencies = [];
  let errors = 0;
  let success = 0;

  let completed = 0;
  const workers = Array.from({ length: concurrency }).map(async () => {
    while (completed < totalRequests) {
      completed++;
      const url = urls[Math.floor(Math.random() * urls.length)];
      const res = await httpRequest(url);
      latencies.push(res.durationMs);
      if (res.statusCode >= 200 && res.statusCode < 400) {
        success++;
      } else {
        errors++;
      }
    }
  });

  await Promise.all(workers);

  const p = calculatePercentiles(latencies);
  const errorRatePercent = ((errors / (success + errors)) * 100).toFixed(2);

  console.log(`Spike Results:`);
  console.log(`- Requests: ${success + errors} | Success: ${success} | Errors: ${errors} (${errorRatePercent}%)`);
  console.log(`- Burst Latency: p50: ${p.p50}ms | p90: ${p.p90}ms | p95: ${p.p95}ms | p99: ${p.p99}ms`);

  const passedThresholds = Number(p.p95) < 300 && Number(errorRatePercent) < 0.5;
  console.log(`Thresholds Check: Spike read p95 < 300ms [${Number(p.p95) < 300 ? "PASS" : "FAIL"}], Error rate < 0.5% [${Number(errorRatePercent) < 0.5 ? "PASS" : "FAIL"}]`);

  return {
    scenario: "Spike (Burst Reads)",
    totalRequests,
    p95Read: `${p.p95} ms`,
    p95Write: "N/A",
    errorRate: `${errorRatePercent}%`,
    status: passedThresholds ? "PASSED" : "FAILED",
  };
}

async function runBookingRaceBenchmark() {
  console.log(`\n======================================================`);
  console.log(`3. Running BOOKING RACE Test (50 concurrent bookings for slot capacity 3)...`);
  console.log(`======================================================`);

  // We test the atomic slot reservation service directly or via orders endpoint
  const slotService = require("../server/services/slotService");
  const dateStr = `2026-12-${Math.floor(Math.random() * 20 + 10)}`;
  const slotKey = "evening";

  // Simulate 50 concurrent racers attempting atomic reservation on slot with capacity 3
  const racers = Array.from({ length: 50 }).map(async (_, idx) => {
    const start = process.hrtime.bigint();
    try {
      const res = await slotService.reserveSlotAtomic({
        date: dateStr,
        slotKey,
        capacity: 3,
      });
      const end = process.hrtime.bigint();
      return {
        id: idx,
        success: true,
        data: res,
        durationMs: Number(end - start) / 1e6,
      };
    } catch (err) {
      const end = process.hrtime.bigint();
      return {
        id: idx,
        success: false,
        error: err.message,
        statusCode: err.statusCode || 409,
        durationMs: Number(end - start) / 1e6,
      };
    }
  });

  const results = await Promise.all(racers);
  const successes = results.filter((r) => r.success);
  const failures = results.filter((r) => !r.success);
  const writeLatencies = results.map((r) => r.durationMs);
  const p = calculatePercentiles(writeLatencies);

  console.log(`Booking Race Results:`);
  console.log(`- Total Racers: 50`);
  console.log(`- Successful Bookings: ${successes.length} (Target: Exactly 3)`);
  console.log(`- Rejected (Slot Full / Conflict): ${failures.length} (Target: Exactly 47)`);
  console.log(`- Write Latency: p50: ${p.p50}ms | p95: ${p.p95}ms | p99: ${p.p99}ms`);

  const passedCapacity = successes.length === 3 && failures.length === 47;
  const passedLatency = Number(p.p95) < 800;

  console.log(`Thresholds Check: Exactly 3 succeed [${passedCapacity ? "PASS" : "FAIL"}], Write p95 < 800ms [${passedLatency ? "PASS" : "FAIL"}]`);

  return {
    scenario: "Booking Race (50 Racers, Cap 3)",
    totalRequests: 50,
    p95Read: "N/A",
    p95Write: `${p.p95} ms`,
    errorRate: "0.00%",
    status: passedCapacity && passedLatency ? "PASSED" : "FAILED",
    successCount: successes.length,
    rejectedCount: failures.length,
  };
}

async function main() {
  const summary = [];
  summary.push(await runBrowseBenchmark(500, 25));
  summary.push(await runSpikeBenchmark(800, 50));
  summary.push(await runBookingRaceBenchmark());

  console.log(`\n======================================================`);
  console.log(`FINAL PERFORMANCE LOAD TEST SUMMARY TABLE`);
  console.log(`======================================================`);
  console.table(summary);
}

if (require.main === module) {
  main().catch((e) => {
    console.error("Load test error:", e);
    process.exit(1);
  });
}

module.exports = {
  runBrowseBenchmark,
  runSpikeBenchmark,
  runBookingRaceBenchmark,
};

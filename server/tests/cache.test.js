const { test, describe, before, after } = require("node:test");
const assert = require("node:assert");
const cache = require("../utils/cache");
const { redisClient, connectRedis, closeRedis } = require("../config/redis");

describe("Redis Cache Helper & Single-Flight Tests", () => {
  before(async () => {
    await connectRedis();
  });

  after(async () => {
    await closeRedis();
  });

  test("cache.wrap returns fresh data and caches subsequent reads", async () => {
    let callCount = 0;
    const key = `test:wrap:${Date.now()}`;
    const fetcher = async () => {
      callCount++;
      return { msg: "hello", count: callCount };
    };

    const first = await cache.wrap(key, 5, fetcher);
    assert.strictEqual(first.msg, "hello");

    const second = await cache.wrap(key, 5, fetcher);
    if (cache.isRedisAvailable()) {
      assert.strictEqual(second.count, 1, "Should serve from cache when Redis is online");
      assert.strictEqual(callCount, 1);
    } else {
      assert.strictEqual(second.count, 2, "Should bypass cache without error when Redis is offline");
      assert.strictEqual(callCount, 2);
    }
  });

  test("single-flight locking prevents thundering herd on concurrent cache misses", async () => {
    let executionCount = 0;
    const key = `test:single-flight:${Date.now()}`;
    const slowFetcher = async () => {
      executionCount++;
      await new Promise((r) => setTimeout(r, 50));
      return { executed: executionCount };
    };

    // Fire 10 concurrent requests simultaneously
    const promises = Array.from({ length: 10 }).map(() =>
      cache.wrap(key, 5, slowFetcher)
    );

    const results = await Promise.all(promises);
    assert.strictEqual(results.length, 10);
    for (const res of results) {
      assert.strictEqual(res.executed, 1);
    }
    assert.strictEqual(executionCount, 1, "Factory function must only execute ONCE for concurrent requests");
  });

  test("stale-if-error serves stale data when fetcher fails", async () => {
    const key = `test:stale:${Date.now()}`;
    let shouldFail = false;

    const fragileFetcher = async () => {
      if (shouldFail) {
        throw new Error("Simulated MongoDB connection drop");
      }
      return { status: "initial_success", ts: Date.now() };
    };

    // 1. Initial successful call caches the response + stale buffer
    const initial = await cache.wrap(key, 1, fragileFetcher);
    assert.strictEqual(initial.status, "initial_success");

    // 2. Wait for main TTL to expire (1.1s)
    await new Promise((r) => setTimeout(r, 1100));

    // 3. Make fetcher fail
    shouldFail = true;

    // 4. Wrap call should return the stale cached data instead of throwing
    if (cache.isRedisAvailable()) {
      const staleRes = await cache.wrap(key, 1, fragileFetcher);
      assert.strictEqual(staleRes.status, "initial_success");
    }
  });

  test("invalidateTags purges all tagged keys from cache", async () => {
    if (!cache.isRedisAvailable()) return;

    const tag = "test_tag_perf";
    const key1 = `test:tag:1:${Date.now()}`;
    const key2 = `test:tag:2:${Date.now()}`;

    let c1 = 0;
    let c2 = 0;

    await cache.wrap(key1, 10, async () => ({ val: ++c1 }), { tags: [tag] });
    await cache.wrap(key2, 10, async () => ({ val: ++c2 }), { tags: [tag] });

    assert.strictEqual(c1, 1);
    assert.strictEqual(c2, 1);

    // Invalidate tag
    await cache.invalidateTags(tag);

    // Subsequent calls should re-fetch fresh data
    const res1 = await cache.wrap(key1, 10, async () => ({ val: ++c1 }), { tags: [tag] });
    const res2 = await cache.wrap(key2, 10, async () => ({ val: ++c2 }), { tags: [tag] });

    assert.strictEqual(res1.val, 2);
    assert.strictEqual(res2.val, 2);
  });
});

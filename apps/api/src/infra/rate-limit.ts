import { createHash } from "node:crypto";
import Redis from "ioredis";

export interface RateLimitStore { increment(key: string, windowSeconds: number): Promise<{ count: number; ttl: number }>; }
export class RedisRateLimitStore implements RateLimitStore {
  private readonly redis: Redis;
  constructor(url: string) { this.redis = new Redis(url, { lazyConnect: true, maxRetriesPerRequest: 1 }); }
  async increment(key: string, windowSeconds: number) { if (this.redis.status === "wait") await this.redis.connect(); const result = await this.redis.eval("local n=redis.call('INCR',KEYS[1]); if n==1 then redis.call('EXPIRE',KEYS[1],ARGV[1]); end; return {n,redis.call('TTL',KEYS[1])}", 1, key, windowSeconds) as [number, number]; return { count: Number(result[0]), ttl: Math.max(Number(result[1]), 1) }; }
}
export class FixedWindowRateLimiter {
  constructor(private readonly store: RateLimitStore) {}
  async consume(identity: string, bucket: string, limit: number, windowSeconds: number) { const digest = createHash("sha256").update(identity).digest("hex"); const result = await this.store.increment(`finance:rate:${bucket}:${digest}`, windowSeconds); return { allowed: result.count <= limit, remaining: Math.max(limit - result.count, 0), retryAfter: result.ttl }; }
}

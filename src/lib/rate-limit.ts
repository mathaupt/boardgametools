import { NextResponse } from "next/server";
import { env } from "@/lib/env";

// Max entries to prevent unbounded memory growth (e.g. during DDoS).
// When the limit is reached, expired entries are evicted first; if still
// full, the oldest entry is removed (LRU-style).
const MAX_MAP_SIZE = 10_000;

// ── Upstash Redis Rate Limiting (preferred for production) ──────
// Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN to enable.
// Falls back to in-memory Map if not configured.
const useUpstash = !!(env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN);

type UpstashLimiter = {
  limit: (identifier: string) => Promise<{ success: boolean; remaining: number; reset: number }>;
};

/** Cache of Ratelimit instances keyed by `${maxRequests}:${windowMs}`. */
const upstashRatelimitCache = new Map<string, UpstashLimiter>();

let sharedRedis: unknown = null;

async function getUpstashRatelimit(
  maxRequests: number,
  windowMs: number
): Promise<UpstashLimiter | null> {
  const cacheKey = `${maxRequests}:${windowMs}`;
  const cached = upstashRatelimitCache.get(cacheKey);
  if (cached) return cached;

  try {
    const { Ratelimit } = await import("@upstash/ratelimit");
    const { Redis } = await import("@upstash/redis");
    if (!sharedRedis) {
      sharedRedis = Redis.fromEnv();
    }
    const windowSec = Math.ceil(windowMs / 1000);
    const rl = new Ratelimit({
      redis: sharedRedis as InstanceType<typeof Redis>,
      limiter: Ratelimit.slidingWindow(maxRequests, `${windowSec} s`),
      analytics: true,
      prefix: `rl:${maxRequests}:${windowSec}`,
    });
    upstashRatelimitCache.set(cacheKey, rl);
    return rl;
  } catch {
    return null;
  }
}

// ── In-Memory Fallback ──────────────────────────────────────────
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

// Cleanup expired entries periodically (server-lifetime only — on
// serverless platforms each cold-start gets a fresh Map, so rate-limiting
// is best-effort per instance. For strict global limits use an external
// store like Redis / Vercel KV).
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of rateLimitMap) {
      if (now > entry.resetAt) rateLimitMap.delete(key);
    }
  }, 60_000);
}

/** Evict expired entries, then drop oldest if still over MAX_MAP_SIZE. */
function evictIfNeeded(): void {
  if (rateLimitMap.size < MAX_MAP_SIZE) return;

  const now = Date.now();
  for (const [key, entry] of rateLimitMap) {
    if (now > entry.resetAt) rateLimitMap.delete(key);
  }
  // Still over limit → drop oldest entries (Map iteration order = insertion order)
  if (rateLimitMap.size >= MAX_MAP_SIZE) {
    const excess = rateLimitMap.size - MAX_MAP_SIZE + 1;
    let removed = 0;
    for (const key of rateLimitMap.keys()) {
      if (removed >= excess) break;
      rateLimitMap.delete(key);
      removed++;
    }
  }
}

export async function checkRateLimitAsync(
  identifier: string,
  maxRequests: number = 10,
  windowMs: number = 60_000
): Promise<{ allowed: boolean; retryAfterMs: number }> {
  if (useUpstash) {
    const rl = await getUpstashRatelimit(maxRequests, windowMs);
    if (rl) {
      const result = await rl.limit(identifier);
      return {
        allowed: result.success,
        retryAfterMs: result.success ? 0 : Math.max(0, result.reset - Date.now()),
      };
    }
  }
  return checkRateLimit(identifier, maxRequests, windowMs);
}

export function checkRateLimit(
  identifier: string,
  maxRequests: number = 10,
  windowMs: number = 60_000
): { allowed: boolean; retryAfterMs: number } {
  const now = Date.now();
  const entry = rateLimitMap.get(identifier);

  if (!entry || now > entry.resetAt) {
    evictIfNeeded();
    // Re-insert so this key moves to the end (newest) in Map iteration order
    rateLimitMap.delete(identifier);
    rateLimitMap.set(identifier, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterMs: 0 };
  }

  if (entry.count >= maxRequests) {
    return { allowed: false, retryAfterMs: entry.resetAt - now };
  }

  entry.count++;
  return { allowed: true, retryAfterMs: 0 };
}

export function rateLimitResponse(retryAfterMs: number) {
  return NextResponse.json(
    { error: "Zu viele Anfragen. Bitte versuche es später erneut." },
    {
      status: 429,
      headers: { "Retry-After": String(Math.ceil(retryAfterMs / 1000)) },
    }
  );
}

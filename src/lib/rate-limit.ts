import {
  LOGIN_RATE_LIMIT_MAX,
  LOGIN_RATE_LIMIT_WINDOW_MS,
} from "./constants";

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() || "unknown";
  }
  return request.headers.get("x-real-ip") || "unknown";
}

export function checkLoginRateLimit(
  request: Request
): { ok: true } | { ok: false; retryAfterSeconds: number } {
  const now = Date.now();
  const ip = getClientIp(request);

  if (store.size > 1000) {
    for (const [key, entry] of store) {
      if (entry.resetAt <= now) store.delete(key);
    }
  }

  const entry = store.get(ip);
  if (!entry || entry.resetAt <= now) {
    store.set(ip, {
      count: 1,
      resetAt: now + LOGIN_RATE_LIMIT_WINDOW_MS,
    });
    return { ok: true };
  }

  entry.count += 1;
  if (entry.count > LOGIN_RATE_LIMIT_MAX) {
    return {
      ok: false,
      retryAfterSeconds: Math.ceil((entry.resetAt - now) / 1000),
    };
  }
  return { ok: true };
}

export function resetLoginRateLimit(request: Request): void {
  const ip = getClientIp(request);
  store.delete(ip);
}
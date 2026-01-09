/**
 * Simple in-memory rate limiter for Next.js API routes
 *
 * WARNING: This is a simple implementation for development/small deployments.
 * For production with multiple servers, use Redis-backed rate limiting.
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

class RateLimiter {
  private requests: Map<string, RateLimitEntry>;
  private windowMs: number;
  private maxRequests: number;

  constructor(windowMs: number = 15 * 60 * 1000, maxRequests: number = 5) {
    this.requests = new Map();
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;

    // Clean up old entries every minute
    setInterval(() => this.cleanup(), 60 * 1000);
  }

  check(identifier: string): { allowed: boolean; retryAfter?: number } {
    const now = Date.now();
    const entry = this.requests.get(identifier);

    if (!entry || now > entry.resetTime) {
      // First request or window expired
      this.requests.set(identifier, {
        count: 1,
        resetTime: now + this.windowMs
      });
      return { allowed: true };
    }

    if (entry.count >= this.maxRequests) {
      // Rate limit exceeded
      const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
      return { allowed: false, retryAfter };
    }

    // Increment count
    entry.count++;
    return { allowed: true };
  }

  cleanup() {
    const now = Date.now();
    for (const [key, entry] of this.requests.entries()) {
      if (now > entry.resetTime) {
        this.requests.delete(key);
      }
    }
  }

  reset(identifier: string) {
    this.requests.delete(identifier);
  }
}

// Login rate limiter: 5 attempts per 15 minutes
export const loginRateLimiter = new RateLimiter(15 * 60 * 1000, 5);

// General API rate limiter: 100 requests per minute
export const apiRateLimiter = new RateLimiter(60 * 1000, 100);

/**
 * Get client identifier from request (IP address)
 */
export function getClientIdentifier(request: Request): string {
  // Try to get real IP from various headers (Vercel, Cloudflare, etc.)
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }

  // Fallback (not ideal for production)
  return 'unknown';
}

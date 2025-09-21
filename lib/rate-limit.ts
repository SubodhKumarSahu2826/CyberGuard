// Rate limiting implementation using in-memory store
// In production, use Redis or similar distributed cache

interface RateLimitEntry {
  count: number
  resetTime: number
}

class RateLimiter {
  private store = new Map<string, RateLimitEntry>()
  private cleanupInterval: NodeJS.Timeout

  constructor() {
    // Clean up expired entries every minute
    this.cleanupInterval = setInterval(() => {
      const now = Date.now()
      for (const [key, entry] of this.store.entries()) {
        if (now > entry.resetTime) {
          this.store.delete(key)
        }
      }
    }, 60000)
  }

  async checkLimit(
    identifier: string,
    limit: number,
    windowMs: number,
  ): Promise<{
    success: boolean
    limit: number
    remaining: number
    reset: number
    retryAfter?: number
  }> {
    const now = Date.now()
    const resetTime = now + windowMs

    let entry = this.store.get(identifier)

    if (!entry || now > entry.resetTime) {
      // Create new entry or reset expired one
      entry = { count: 1, resetTime }
      this.store.set(identifier, entry)

      return {
        success: true,
        limit,
        remaining: limit - 1,
        reset: Math.ceil(resetTime / 1000),
      }
    }

    if (entry.count >= limit) {
      // Rate limit exceeded
      return {
        success: false,
        limit,
        remaining: 0,
        reset: Math.ceil(entry.resetTime / 1000),
        retryAfter: Math.ceil((entry.resetTime - now) / 1000),
      }
    }

    // Increment counter
    entry.count++
    this.store.set(identifier, entry)

    return {
      success: true,
      limit,
      remaining: limit - entry.count,
      reset: Math.ceil(entry.resetTime / 1000),
    }
  }

  cleanup() {
    clearInterval(this.cleanupInterval)
    this.store.clear()
  }
}

const rateLimiter = new RateLimiter()

export async function rateLimit(request: Request) {
  // Get client identifier (IP address or user ID)
  const forwarded = request.headers.get("x-forwarded-for")
  const ip = forwarded ? forwarded.split(",")[0] : "127.0.0.1"

  // Different limits for different endpoints
  const url = new URL(request.url)
  let limit = 100 // Default: 100 requests per hour
  let windowMs = 60 * 60 * 1000 // 1 hour

  if (url.pathname.startsWith("/api/analyze")) {
    limit = 50 // Analysis endpoints: 50 per hour
  } else if (url.pathname.startsWith("/api/upload")) {
    limit = 10 // Upload endpoints: 10 per hour
    windowMs = 60 * 60 * 1000
  } else if (url.pathname.startsWith("/api/ml")) {
    limit = 30 // ML endpoints: 30 per hour
  } else if (url.pathname.startsWith("/api/capture")) {
    limit = 200 // Capture endpoints: 200 per hour (higher for live capture)
  }

  const identifier = `${ip}:${url.pathname}`
  return rateLimiter.checkLimit(identifier, limit, windowMs)
}

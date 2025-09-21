// Caching utilities for performance optimization

interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
}

class MemoryCache {
  private cache = new Map<string, CacheEntry<any>>()
  private cleanupInterval: NodeJS.Timeout

  constructor() {
    // Clean up expired entries every 5 minutes
    this.cleanupInterval = setInterval(
      () => {
        this.cleanup()
      },
      5 * 60 * 1000,
    )
  }

  set<T>(key: string, data: T, ttlSeconds = 300): void {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttlSeconds * 1000,
    }
    this.cache.set(key, entry)
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key)
    if (!entry) return null

    const now = Date.now()
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key)
      return null
    }

    return entry.data as T
  }

  delete(key: string): boolean {
    return this.cache.delete(key)
  }

  clear(): void {
    this.cache.clear()
  }

  private cleanup(): void {
    const now = Date.now()
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key)
      }
    }
  }

  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    }
  }

  destroy(): void {
    clearInterval(this.cleanupInterval)
    this.clear()
  }
}

// Global cache instance
export const cache = new MemoryCache()

// Cache key generators
export const cacheKeys = {
  stats: (timeframe: string) => `stats:${timeframe}`,
  detections: (page: number, limit: number, filters: string) => `detections:${page}:${limit}:${filters}`,
  mlModel: (version: string) => `ml_model:${version}`,
  urlAnalysis: (url: string) => `url_analysis:${Buffer.from(url).toString("base64")}`,
  ipGeolocation: (ip: string) => `ip_geo:${ip}`,
} as const

// Cache with automatic JSON serialization
export class JsonCache {
  static set<T>(key: string, data: T, ttlSeconds = 300): void {
    cache.set(key, JSON.stringify(data), ttlSeconds)
  }

  static get<T>(key: string): T | null {
    const cached = cache.get<string>(key)
    if (!cached) return null

    try {
      return JSON.parse(cached) as T
    } catch {
      cache.delete(key)
      return null
    }
  }

  static delete(key: string): boolean {
    return cache.delete(key)
  }
}

// Cache decorator for functions
export function cached<T extends (...args: any[]) => Promise<any>>(
  ttlSeconds = 300,
  keyGenerator?: (...args: Parameters<T>) => string,
) {
  return (target: any, propertyName: string, descriptor: PropertyDescriptor) => {
    const method = descriptor.value

    descriptor.value = async function (...args: Parameters<T>) {
      const cacheKey = keyGenerator ? keyGenerator(...args) : `${propertyName}:${JSON.stringify(args)}`

      // Try to get from cache
      const cached = JsonCache.get(cacheKey)
      if (cached !== null) {
        return cached
      }

      // Execute original method
      const result = await method.apply(this, args)

      // Store in cache
      JsonCache.set(cacheKey, result, ttlSeconds)

      return result
    }
  }
}

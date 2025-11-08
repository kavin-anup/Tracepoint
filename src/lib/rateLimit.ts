/**
 * Client-Side Rate Limiting Utilities
 * Note: This is client-side only. For production, implement server-side rate limiting.
 */

interface RateLimitConfig {
  maxRequests: number
  windowMs: number
  key: string
}

class RateLimiter {
  private storage: Map<string, { count: number; resetTime: number }> = new Map()

  /**
   * Check if request is allowed
   * @param config Rate limit configuration
   * @returns true if allowed, false if rate limited
   */
  isAllowed(config: RateLimitConfig): boolean {
    const now = Date.now()
    const key = config.key
    const record = this.storage.get(key)

    // If no record or window expired, create new record
    if (!record || now > record.resetTime) {
      this.storage.set(key, {
        count: 1,
        resetTime: now + config.windowMs
      })
      return true
    }

    // Check if limit exceeded
    if (record.count >= config.maxRequests) {
      return false
    }

    // Increment count
    record.count++
    this.storage.set(key, record)
    return true
  }

  /**
   * Get remaining requests
   */
  getRemaining(config: RateLimitConfig): number {
    const record = this.storage.get(config.key)
    if (!record || Date.now() > record.resetTime) {
      return config.maxRequests
    }
    return Math.max(0, config.maxRequests - record.count)
  }

  /**
   * Reset rate limit for a key
   */
  reset(key: string): void {
    this.storage.delete(key)
  }
}

// Singleton instance
const rateLimiter = new RateLimiter()

/**
 * Rate limit for API calls
 */
export function rateLimitApiCall(key: string = 'api'): boolean {
  return rateLimiter.isAllowed({
    maxRequests: 100, // 100 requests
    windowMs: 60000, // per minute
    key: `api:${key}`
  })
}

/**
 * Rate limit for login attempts
 */
export function rateLimitLogin(email: string): boolean {
  return rateLimiter.isAllowed({
    maxRequests: 5, // 5 attempts
    windowMs: 900000, // per 15 minutes
    key: `login:${email.toLowerCase()}`
  })
}

/**
 * Rate limit for file uploads
 */
export function rateLimitFileUpload(): boolean {
  return rateLimiter.isAllowed({
    maxRequests: 10, // 10 uploads
    windowMs: 60000, // per minute
    key: 'file-upload'
  })
}

/**
 * Get remaining requests for a rate limit
 */
export function getRemainingRequests(config: RateLimitConfig): number {
  return rateLimiter.getRemaining(config)
}

/**
 * Reset rate limit
 */
export function resetRateLimit(key: string): void {
  rateLimiter.reset(key)
}


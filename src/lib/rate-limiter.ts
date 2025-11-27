// Simple in-memory rate limiter for Gemini API calls
// In production, use Redis for distributed rate limiting

interface RateLimitEntry {
    count: number
    resetTime: number
}

class RateLimiter {
    private limits: Map<string, RateLimitEntry> = new Map()
    private readonly maxRequests: number
    private readonly windowMs: number

    constructor(maxRequests: number = 15, windowMs: number = 60000) { // 15 requests per minute by default
        this.maxRequests = maxRequests
        this.windowMs = windowMs
    }

    async checkLimit(key: string): Promise<{ allowed: boolean; retryAfter?: number }> {
        const now = Date.now()
        const entry = this.limits.get(key)

        // Reset if window expired
        if (!entry || now > entry.resetTime) {
            this.limits.set(key, {
                count: 1,
                resetTime: now + this.windowMs
            })
            return { allowed: true }
        }

        // Check if under limit
        if (entry.count < this.maxRequests) {
            entry.count++
            return { allowed: true }
        }

        // Over limit
        const retryAfter = Math.ceil((entry.resetTime - now) / 1000)
        return { allowed: false, retryAfter }
    }

    reset(key: string) {
        this.limits.delete(key)
    }
}

// Global rate limiter instance
// Free tier limits: 15 RPM (requests per minute), 1500 RPD (requests per day)
export const geminiRateLimiter = new RateLimiter(15, 60000)

// Daily limit tracker
class DailyLimiter {
    private count: number = 0
    private resetTime: number = Date.now() + 24 * 60 * 60 * 1000
    private readonly maxDaily: number = 1500

    async checkLimit(): Promise<{ allowed: boolean; retryAfter?: number }> {
        const now = Date.now()

        // Reset if day expired
        if (now > this.resetTime) {
            this.count = 0
            this.resetTime = now + 24 * 60 * 60 * 1000
        }

        if (this.count < this.maxDaily) {
            this.count++
            return { allowed: true }
        }

        const retryAfter = Math.ceil((this.resetTime - now) / 1000)
        return { allowed: false, retryAfter }
    }

    getUsage() {
        return {
            used: this.count,
            limit: this.maxDaily,
            remaining: this.maxDaily - this.count,
            resetTime: new Date(this.resetTime).toISOString()
        }
    }
}

export const geminiDailyLimiter = new DailyLimiter()

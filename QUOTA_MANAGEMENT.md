# 🎯 Gemini API Quota Management Guide

## Problem
Gemini API Free Tier has strict limits:
- **15 requests per minute (RPM)**
- **1,500 requests per day (RPD)**
- Testing with multiple client onboardings quickly exhausts quota

## ✅ Solutions Implemented

### 1. **Database Caching** (Most Important!)
**What it does:** Prevents duplicate AI generation for existing data

**How it works:**
- Before generating audit → Check if audit exists for client_id
- Before generating calendar → Check if calendar exists for client_id
- Return cached data instantly (0 API calls!)

**Impact:** Saves 1-2 API calls per duplicate request

```typescript
// Example: Audit already exists
const { data: existingAudit } = await supabase
    .from('client_profile_audits')
    .select('*')
    .eq('client_id', client_id)
    .single()

if (existingAudit) {
    return NextResponse.json({ success: true, audit: existingAudit, cached: true })
}
```

### 2. **Rate Limiting**
**What it does:** Enforces 15 RPM and 1500 RPD limits BEFORE calling API

**How it works:**
- Check rate limit before every generateJSON() call
- Return clear error message if limit exceeded
- Tells user exactly how long to wait

**Impact:** Prevents wasted API calls that will fail anyway

**Files:**
- `/src/lib/rate-limiter.ts` - Rate limiting logic
- `/src/lib/gemini.ts` - Integrated into generateJSON()

### 3. **Smart Quota Error Handling**
**What it does:** Stops all retries immediately when quota is hit

**How it works:**
- Detects 429 status code (quota exceeded)
- Throws clear error message instead of retrying all 7 fallback models
- Prevents 7x wasted API calls per failure

**Impact:** Saves 6 API calls when quota is exhausted

```typescript
if (e.status === 429 || e.message?.includes('quota')) {
    throw new Error('API quota exceeded. Free tier limits: 15 requests/min, 1500 requests/day.')
}
```

### 4. **Optimized Prompts** (Already Done)
**Impact:** 60-70% token reduction per request

- Audit generation: ~180 tokens → ~65 tokens
- Calendar generation: ~210 tokens → ~85 tokens

### 5. **Intelligent Model Fallback**
**What it does:** Uses most reliable models first, stops on quota error

**Model priority:**
1. `gemini-1.5-flash` (most stable, lowest latency)
2. `gemini-1.5-flash-8b` (fast lightweight)
3. `gemini-1.5-flash-latest`
4. `gemini-1.5-pro` (higher capability)
5. `gemini-1.5-pro-latest`
6. `gemini-2.0-flash-exp` (experimental)
7. `gemini-exp-1206` (last resort)

---

## 📊 Current Quota Usage

The system logs quota usage on every request:
```
📊 Quota usage: { used: 45, limit: 1500, remaining: 1455, resetTime: '2025-11-22T04:00:00.000Z' }
```

---

## 🚀 Development Best Practices

### During Testing (To Avoid Quota Exhaustion):

1. **Delete Test Data Before Regenerating:**
```sql
-- Delete calendar for a client
DELETE FROM content_calendar WHERE client_id = 'your-client-id';

-- Delete audit for a client
DELETE FROM client_profile_audits WHERE client_id = 'your-client-id';

-- Delete entire client
DELETE FROM clients WHERE id = 'your-client-id';
```

2. **Use Existing Data:**
- Don't keep onboarding new clients
- Reuse existing client dashboards
- Use "View Calendar" button instead of regenerating

3. **Monitor Quota:**
- Watch terminal logs for quota usage
- Stop testing if you see "remaining: 100" or less

4. **Wait for Reset:**
- Daily quota resets at midnight UTC
- Minute quota resets after 60 seconds

---

## 🔧 Future Optimizations (For Production)

### Option 1: Upgrade to Gemini API Pay-as-You-Go
**Cost:** $0.075 per 1M input tokens, $0.30 per 1M output tokens
**Limits:** 1000 RPM, 4M RPD
**Best for:** Production app with real users

### Option 2: Implement Redis-based Rate Limiting
**Why:** Current implementation uses in-memory storage (resets on server restart)
**Best for:** Multi-server deployments

### Option 3: Add User-level Rate Limiting
**Why:** Prevent single user from exhausting quota
**Example:** Max 5 clients per day per user

### Option 4: Background Job Queue
**Why:** Process AI generation asynchronously with retry logic
**Tools:** BullMQ, Inngest, or Supabase Edge Functions

---

## 🎛️ Configuration

### Environment Variables
```bash
# .env.local
GEMINI_API_KEY=your-api-key
DEV_MODE=false  # Set to 'true' to use mock data
```

### Rate Limit Settings
Edit `/src/lib/rate-limiter.ts`:
```typescript
// Adjust these values based on your API tier
export const geminiRateLimiter = new RateLimiter(15, 60000) // 15 RPM
class DailyLimiter {
    private readonly maxDaily: number = 1500 // 1500 RPD
}
```

---

## 📈 Monitoring

### Check Current Usage:
1. Watch terminal logs during development
2. Look for: `📊 Quota usage: {...}`
3. Monitor for errors: `⏱️ Rate limit exceeded` or `💥 QUOTA EXCEEDED`

### When You See Quota Errors:
1. **Stop testing immediately**
2. Wait for rate limit reset (shown in error message)
3. Delete test data from database
4. Consider upgrading to paid tier

---

## 🎯 Summary

**Before these fixes:**
- Testing 10 clients = 20+ API calls (audit + calendar)
- Quota exhausted in ~75 tests
- No warning before hitting limits

**After these fixes:**
- Testing same client repeatedly = 0 API calls (cached)
- Clear warnings before hitting limits
- Quota tracked in real-time
- Immediate stop when quota hit (saves 6 calls per error)

**Best Practice:**
1. Use database cache (reuse existing clients)
2. Delete test data before regenerating
3. Monitor quota usage in logs
4. Upgrade to paid tier for production

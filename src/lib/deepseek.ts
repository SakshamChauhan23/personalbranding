import OpenAI from 'openai'
import { geminiRateLimiter, geminiDailyLimiter } from './rate-limiter'

// DeepSeek uses OpenAI-compatible API
let deepseek: OpenAI | null = null

const getDeepSeekClient = () => {
    if (!deepseek) {
        const apiKey = process.env.DEEPSEEK_API_KEY
        if (!apiKey) throw new Error("DEEPSEEK_API_KEY is not set")
        deepseek = new OpenAI({
            apiKey,
            baseURL: 'https://api.deepseek.com'
        })
    }
    return deepseek
}

export async function generateContent(prompt: string) {
    const client = getDeepSeekClient()
    const response = await client.chat.completions.create({
        model: 'deepseek-chat',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7
    })
    return response.choices[0].message.content || ''
}

export async function generateJSON(prompt: string, preferredModel?: string) {
    const apiKey = process.env.DEEPSEEK_API_KEY
    if (!apiKey) {
        throw new Error("DEEPSEEK_API_KEY is not set in environment variables")
    }

    // Check rate limits BEFORE making API call
    const minuteLimit = await geminiRateLimiter.checkLimit('deepseek-api')
    if (!minuteLimit.allowed) {
        console.error(`⏱️ Rate limit exceeded. Retry after ${minuteLimit.retryAfter}s`)
        throw new Error(`Rate limit exceeded. Please wait ${minuteLimit.retryAfter} seconds before trying again.`)
    }

    const dailyLimit = await geminiDailyLimiter.checkLimit()
    if (!dailyLimit.allowed) {
        const hours = Math.floor(dailyLimit.retryAfter! / 3600)
        console.error(`📊 Daily quota exhausted. Retry after ${hours}h`)
        throw new Error(`Daily API quota exhausted. Resets in ${hours} hours.`)
    }

    console.log('📊 Quota usage:', geminiDailyLimiter.getUsage())

    const modelName = preferredModel || 'deepseek-chat'

    try {
        console.log(`🤖 Attempting DeepSeek: ${modelName}`)

        const client = getDeepSeekClient()
        const response = await client.chat.completions.create({
            model: modelName,
            messages: [
                {
                    role: 'system',
                    content: 'You are a helpful assistant that returns valid JSON only. Never include explanations or markdown formatting. Always return pure JSON.'
                },
                {
                    role: 'user',
                    content: prompt + '\n\nReturn valid JSON only. No markdown, no explanations, just raw JSON.'
                }
            ],
            temperature: 0.7,
            response_format: { type: 'json_object' }
        })

        const text = response.choices[0].message.content || ''

        // Log the full response for debugging
        console.log("📄 DeepSeek Response length:", text.length)
        console.log("📄 DeepSeek Response preview:", text.substring(0, 300))

        if (!text || text.trim().length === 0) {
            console.error("❌ Empty response from DeepSeek")
            throw new Error("AI returned empty response")
        }

        // DeepSeek with json_object mode returns clean JSON
        const cleanedText = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim()

        // Try to extract JSON object or array
        const jsonObjectMatch = cleanedText.match(/\{[\s\S]*\}/)
        const jsonArrayMatch = cleanedText.match(/\[[\s\S]*\]/)

        const jsonString = jsonArrayMatch ? jsonArrayMatch[0] : (jsonObjectMatch ? jsonObjectMatch[0] : cleanedText)

        try {
            const parsed = JSON.parse(jsonString)
            console.log("✅ JSON parsed successfully")
            return parsed
        } catch {
            console.error("JSON parse failed. Raw response (first 800 chars):", text.substring(0, 800))
            throw new Error("Invalid JSON response from AI")
        }

    } catch (error: unknown) {
        console.error(`❌ DeepSeek failed:`, error)
        const errorMessage = error instanceof Error ? error.message : String(error)
        console.error('Full error:', errorMessage)

        // Check if it's a quota/balance error and include status in message
        const status = (error as { status?: number })?.status
        const code = (error as { code?: string })?.code

        if (status === 402 || code === '402' || errorMessage.includes('402')) {
            throw new Error(`402 Insufficient Balance: ${errorMessage || 'DeepSeek API quota exceeded'}`)
        }

        throw error
    }
}

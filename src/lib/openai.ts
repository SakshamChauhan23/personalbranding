import OpenAI from 'openai'
import { geminiRateLimiter, geminiDailyLimiter } from './rate-limiter'

let openai: OpenAI | null = null

const getOpenAIClient = () => {
    if (!openai) {
        const apiKey = process.env.OPENAI_API_KEY
        if (!apiKey) throw new Error("OPENAI_API_KEY is not set")
        openai = new OpenAI({ apiKey })
    }
    return openai
}

export async function generateContent(prompt: string) {
    const client = getOpenAIClient()
    const response = await client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7
    })
    return response.choices[0].message.content || ''
}

export async function generateJSON(prompt: string, preferredModel?: string) {
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
        throw new Error("OPENAI_API_KEY is not set in environment variables")
    }

    // Check rate limits BEFORE making API call (reusing same rate limiter)
    const minuteLimit = await geminiRateLimiter.checkLimit('openai-api')
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

    // Model selection with fallbacks
    const modelsToTry = [
        preferredModel || 'gpt-4o-mini', // Fast and cheap
        'gpt-4o', // More capable
        'gpt-4-turbo-preview' // Fallback
    ].filter(Boolean)

    let lastError: any

    // Try each model in sequence
    for (const modelName of modelsToTry) {
        try {
            console.log(`🤖 Attempting OpenAI: ${modelName}`)

            const client = getOpenAIClient()
            const response = await client.chat.completions.create({
                model: modelName,
                messages: [
                    {
                        role: 'system',
                        content: 'You are a helpful assistant that returns valid JSON only. Never include explanations or markdown formatting.'
                    },
                    {
                        role: 'user',
                        content: prompt + '\n\nReturn valid JSON only. No markdown, no explanations.'
                    }
                ],
                temperature: 0.7,
                response_format: { type: 'json_object' } // Force JSON response
            })

            const text = response.choices[0].message.content || ''

            // Log the full response for debugging
            console.log("📄 AI Response length:", text.length)
            console.log("📄 AI Response preview:", text.substring(0, 300))

            if (!text || text.trim().length === 0) {
                console.error("❌ Empty response from AI")
                throw new Error("AI returned empty response")
            }

            // OpenAI with json_object mode returns clean JSON, but let's be safe
            const cleanedText = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim()

            // Try to extract JSON object or array
            const jsonObjectMatch = cleanedText.match(/\{[\s\S]*\}/)
            const jsonArrayMatch = cleanedText.match(/\[[\s\S]*\]/)

            const jsonString = jsonArrayMatch ? jsonArrayMatch[0] : (jsonObjectMatch ? jsonObjectMatch[0] : cleanedText)

            try {
                const parsed = JSON.parse(jsonString)
                console.log("✅ JSON parsed successfully")
                return parsed
            } catch (e) {
                console.error("JSON parse failed. Raw response (first 800 chars):", text.substring(0, 800))
                throw new Error("Invalid JSON response from AI")
            }

        } catch (e: any) {
            // Log the full error for debugging
            console.error(`❌ ${modelName} failed:`, e)
            console.error('Full error:', JSON.stringify(e, null, 2))

            // Check if it's a quota error (429)
            if (e.status === 429 || e.message?.includes('quota') || e.message?.includes('429')) {
                console.error('💥 QUOTA EXCEEDED - stopping all retries')
                console.error('Error details:', e.message || e)
                throw new Error(`API quota exceeded: ${e.message || 'Please check your API key and billing'}`)
            }

            // Check if it's a rate limit error
            if (e.message?.includes('rate limit')) {
                console.error('💥 RATE LIMIT - stopping all retries')
                throw new Error('Rate limit exceeded. Please wait a moment and try again.')
            }

            lastError = e
            // Continue to next model
        }
    }

    console.error("All models exhausted")
    throw lastError || new Error("All AI models unavailable. Try again in a moment.")
}

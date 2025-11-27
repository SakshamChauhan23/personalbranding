import { GoogleGenerativeAI } from '@google/generative-ai'
import { geminiRateLimiter, geminiDailyLimiter } from './rate-limiter'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

export async function generateContent(prompt: string) {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
    const result = await model.generateContent(prompt)
    const response = await result.response
    return response.text()
}

export async function generateJSON(prompt: string, preferredModel?: string) {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
        throw new Error("GEMINI_API_KEY is not set in environment variables")
    }

    // Check rate limits BEFORE making API call
    const minuteLimit = await geminiRateLimiter.checkLimit('gemini-api')
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

    // Expanded fallback chain with more models for reliability
    // Using only confirmed available models from user's list
    const modelsToTry = [
        preferredModel || 'gemini-1.5-flash', // Most stable and reliable
        'gemini-1.5-flash-8b', // Fast lightweight version
        'gemini-1.5-flash-latest', // Latest stable flash
        'gemini-1.5-pro', // High capability
        'gemini-1.5-pro-latest', // Latest pro
        'gemini-2.0-flash-exp', // Experimental as last resort
        'gemini-exp-1206' // Final experimental fallback
    ].filter(Boolean); // Remove undefined if no preferred model

    let result;
    let lastError;

    // Try each model in sequence
    for (const modelName of modelsToTry) {
        try {
            console.log(`🤖 Attempting: ${modelName}`)
            const model = genAI.getGenerativeModel({
                model: modelName as string,
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 8192, // Increased for 12 post generation
                }
            })

            // Internal retry for the SAME model (in case of quick blip)
            for (let attempt = 0; attempt < 2; attempt++) {
                try {
                    result = await model.generateContent(prompt + "\n\nReturn valid JSON only.")
                    break; // Success! Break internal loop
                } catch (e: any) {
                    // Check if it's a quota error (429)
                    if (e.status === 429 || e.message?.includes('quota') || e.message?.includes('429')) {
                        console.error('💥 QUOTA EXCEEDED - stopping all retries')
                        throw new Error('API quota exceeded. Please wait before generating more content. Free tier limits: 15 requests/min, 1500 requests/day.')
                    }

                    const isRetryable = e.message?.includes('503') ||
                                       e.message?.includes('overloaded') ||
                                       e.message?.includes('500');

                    if (isRetryable && attempt < 1) {
                        console.log(`⚠️ ${modelName} busy. Retry ${attempt + 1}/2`)
                        await new Promise(resolve => setTimeout(resolve, 2000)); // Increased to 2s
                        continue;
                    }
                    throw e; // Throw to move to next model
                }
            }

            if (result) break; // Success! Break model loop

        } catch (e: any) {
            console.error(`❌ ${modelName} failed:`, e.message?.substring(0, 100))
            lastError = e;
            // Continue to next model
        }
    }

    if (!result) {
        console.error("All models exhausted")
        throw lastError || new Error("All AI models unavailable. Try again in a moment.");
    }

    const response = await result.response
    const text = response.text()

    // Log the full response for debugging
    console.log("📄 AI Response length:", text.length)
    console.log("📄 AI Response preview:", text.substring(0, 300))

    if (!text || text.trim().length === 0) {
        console.error("❌ Empty response from AI")
        throw new Error("AI returned empty response")
    }

    // Clean up markdown code blocks if present (```json ... ```)
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
}

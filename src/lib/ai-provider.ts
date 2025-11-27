import { generateJSON as generateWithDeepSeek } from './deepseek'
import { generateJSON as generateWithOpenAI } from './openai'
import { generateJSON as generateWithGemini } from './gemini'

/**
 * Smart AI provider with automatic fallback
 * Tries DeepSeek → OpenAI → Gemini in sequence
 */
export async function generateJSON(prompt: string, preferredModel?: string) {
    console.log('🤖 Starting AI generation with 3-tier fallback system...')

    const errors: string[] = []

    // Try DeepSeek first (cheapest)
    try {
        console.log('🔵 [1/3] Trying DeepSeek...')
        const result = await generateWithDeepSeek(prompt, preferredModel)
        console.log('✅ DeepSeek succeeded')
        return result
    } catch (deepseekError: any) {
        console.log('⚠️ DeepSeek failed:', deepseekError.message)
        errors.push(`DeepSeek: ${deepseekError.message}`)
    }

    // Try OpenAI second
    try {
        console.log('🟡 [2/3] Trying OpenAI...')
        const result = await generateWithOpenAI(prompt, preferredModel)
        console.log('✅ OpenAI succeeded')
        return result
    } catch (openaiError: any) {
        console.log('⚠️ OpenAI failed:', openaiError.message)
        errors.push(`OpenAI: ${openaiError.message}`)
    }

    // Try Gemini as final fallback
    try {
        console.log('🟢 [3/3] Trying Gemini (final fallback)...')
        const result = await generateWithGemini(prompt, preferredModel)
        console.log('✅ Gemini succeeded')
        return result
    } catch (geminiError: any) {
        console.log('❌ Gemini failed:', geminiError.message)
        errors.push(`Gemini: ${geminiError.message}`)
    }

    // All providers failed
    console.error('💥 ALL AI PROVIDERS EXHAUSTED')
    throw new Error(`All AI providers failed:\n${errors.join('\n')}`)
}

import { GoogleGenerativeAI } from '@google/generative-ai'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
    try {
        const { prompt, type, context } = await request.json()

        const apiKey = process.env.GEMINI_API_KEY
        if (!apiKey) {
            return NextResponse.json({ error: 'GEMINI_API_KEY is not set' }, { status: 500 })
        }

        const genAI = new GoogleGenerativeAI(apiKey)
        const model = genAI.getGenerativeModel({ model: 'gemini-pro' })

        let systemPrompt = ''
        if (type === 'brief') {
            systemPrompt = `You are an expert social media strategist. Generate a concise but engaging content brief for a LinkedIn post based on the following topic. 
            Include:
            1. A catchy title
            2. The core message (Brief)
            3. Best format (Text, Carousel, Story, etc.)
            4. Content Pillar (e.g. Leadership, Industry Trends, Company Culture)
            
            Topic: ${prompt}
            Context: ${JSON.stringify(context)}
            
            Return JSON format: { "title": "...", "brief": "...", "format": "...", "pillar": "..." }`
        } else if (type === 'caption') {
            systemPrompt = `Write a professional and engaging LinkedIn caption for this post brief. Use appropriate emojis and hashtags.
            Brief: ${prompt}
            Context: ${JSON.stringify(context)}`
        }

        const result = await model.generateContent(systemPrompt)
        const response = result.response
        const text = response.text()

        // Clean up JSON if needed
        if (type === 'brief') {
            try {
                const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim()
                const data = JSON.parse(jsonStr)
                return NextResponse.json({ success: true, data })
            } catch (e) {
                console.error('JSON Parse Error:', e)
                return NextResponse.json({ success: false, error: 'Failed to parse AI response' })
            }
        }

        return NextResponse.json({ success: true, data: { text } })

    } catch (error) {
        console.error('AI Assist Error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}

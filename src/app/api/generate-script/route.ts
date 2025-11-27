import { createClient } from '@/lib/supabase/server'
import { generateJSON } from '@/lib/ai-provider' // Smart AI provider with fallback
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
    try {
        const { calendar_id } = await request.json()
        const supabase = await createClient()

        // Fetch Calendar Item
        const { data: item, error: itemError } = await supabase
            .from('content_calendar')
            .select('*, clients(*)')
            .eq('id', calendar_id)
            .single()

        if (itemError || !item) {
            return NextResponse.json({ error: 'Calendar item not found' }, { status: 404 })
        }

        // Mock Data for Testing
        const scriptData = {
            formal_version: `[Formal Version]\n\nHere is a professional take on "${item.title}".\n\nWe are seeing a shift in ${item.pillar}. Leaders must adapt.\n\nKey takeaway: Innovation is key.\n\n#Leadership #Innovation`,
            conversational_version: `[Conversational Version]\n\nHey everyone! 👋\n\nLet's talk about "${item.title}".\n\nI've been thinking a lot about ${item.pillar} lately. It's crazy how fast things change!\n\nWhat do you think?\n\n#Thoughts #Growth`,
            hook_variations: [
                "You're doing it wrong.",
                "Here's the truth about " + item.pillar + ".",
                "Stop ignoring this trend."
            ],
            cta: "Share your thoughts in the comments below! 👇",
            hashtags: ["#Leadership", "#Growth", "#" + item.pillar.replace(/\s+/g, '')],
            carousel_slides: item.format === 'carousel' ? [
                { slide: 1, headline: "Slide 1 Headline", body: "Intro to the topic." },
                { slide: 2, headline: "Slide 2 Headline", body: "Key point number one." },
                { slide: 3, headline: "Slide 3 Headline", body: "Key point number two." },
                { slide: 4, headline: "Slide 4 Headline", body: "Key point number three." },
                { slide: 5, headline: "Slide 5 Headline", body: "Counter-intuitive insight." },
                { slide: 6, headline: "Slide 6 Headline", body: "Actionable advice." },
                { slide: 7, headline: "Slide 7 Headline", body: "Summary and CTA." }
            ] : []
        }
        // const scriptData = await generateJSON(prompt)

        // Determine default content text (prefer conversational, or formatted carousel)
        let defaultContent = scriptData.conversational_version || scriptData.formal_version;

        if (item.format === 'carousel' && scriptData.carousel_slides) {
            defaultContent = scriptData.carousel_slides.map((s: any) => `Slide ${s.slide}: ${s.headline}\n${s.body}`).join('\n\n');
        }

        // Save to Database
        const { data: script, error: saveError } = await supabase
            .from('content_scripts')
            .insert({
                calendar_id,
                content_text: defaultContent,
                hook_variations: scriptData.hook_variations,
                cta: scriptData.cta,
                hashtags: scriptData.hashtags,
                draft_data: scriptData, // Store full AI response for switching tones
                version: 1,
                status: 'draft'
            })
            .select()
            .single()

        if (saveError) throw saveError

        return NextResponse.json({ success: true, script })
    } catch (error) {
        console.error('Script generation error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}

import { createClient } from '@/lib/supabase/server'
import { generateJSON } from '@/lib/ai-provider'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
    try {
        const { script_id, feedback } = await request.json()
        const supabase = await createClient()

        // 1. Fetch Original Script & Calendar Info
        const { data: script, error: scriptError } = await supabase
            .from('content_scripts')
            .select('*, content_calendar(*, clients(*))')
            .eq('id', script_id)
            .single()

        if (scriptError || !script) {
            return NextResponse.json({ error: 'Script not found' }, { status: 404 })
        }

        // 2. Archive current version
        const { error: archiveError } = await supabase
            .from('content_script_versions')
            .insert({
                script_id: script.id,
                content_text: script.content_text,
                hook_variations: script.hook_variations,
                cta: script.cta,
                hashtags: script.hashtags,
                draft_data: script.draft_data,
                version: script.version,
                feedback_used: 'Previous Version'
            })

        if (archiveError) console.error("Failed to archive script version:", archiveError)

        // 3. Generate New Version
        const item = script.content_calendar
        // Mock Data for Testing
        const revisedData = {
            formal_version: `[Revised Formal]\n\n(Addressed feedback: ${feedback})\n\n${script.content_text}`,
            conversational_version: `[Revised Conversational]\n\n(Addressed feedback: ${feedback})\n\n${script.content_text}`,
            hook_variations: ["New Hook 1", "New Hook 2"],
            cta: "New CTA",
            hashtags: ["#New", "#Tags"],
            carousel_slides: item.format === 'carousel' ? [
                { slide: 1, headline: "Revised Slide 1", body: "Better content." },
                { slide: 2, headline: "Revised Slide 2", body: "More value." },
                { slide: 3, headline: "Revised Slide 3", body: "Deeper insight." },
                { slide: 4, headline: "Revised Slide 4", body: "Stronger point." },
                { slide: 5, headline: "Revised Slide 5", body: "Clearer example." },
                { slide: 6, headline: "Revised Slide 6", body: "Better flow." },
                { slide: 7, headline: "Revised Slide 7", body: "Stronger ending." }
            ] : []
        }
        // const revisedData = await generateJSON(prompt)

        // Determine default content
        let defaultContent = revisedData.conversational_version || revisedData.formal_version;
        if (item.format === 'carousel' && revisedData.carousel_slides) {
            defaultContent = revisedData.carousel_slides.map((s: any) => `Slide ${s.slide}: ${s.headline}\n${s.body}`).join('\n\n');
        }

        // 4. Update Main Script
        const { data: updatedScript, error: updateError } = await supabase
            .from('content_scripts')
            .update({
                content_text: defaultContent,
                hook_variations: revisedData.hook_variations,
                cta: revisedData.cta,
                hashtags: revisedData.hashtags,
                draft_data: revisedData,
                version: (script.version || 1) + 1,
                status: 'draft'
            })
            .eq('id', script_id)
            .select()
            .single()

        if (updateError) throw updateError

        return NextResponse.json({ success: true, script: updatedScript })

    } catch (error: any) {
        console.error('Script revision error:', error)
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
    }
}

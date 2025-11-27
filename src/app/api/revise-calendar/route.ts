import { createClient } from '@/lib/supabase/server'
import { generateJSON } from '@/lib/ai-provider'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
    try {
        const { calendar_id, feedback } = await request.json()
        const supabase = await createClient()

        // 1. Fetch Original Item
        const { data: item, error: itemError } = await supabase
            .from('content_calendar')
            .select('*, clients(*)')
            .eq('id', calendar_id)
            .single()

        if (itemError || !item) {
            return NextResponse.json({ error: 'Calendar item not found' }, { status: 404 })
        }

        // 2. Archive current version
        const { error: archiveError } = await supabase
            .from('content_calendar_versions')
            .insert({
                calendar_id: item.id,
                title: item.title,
                brief: item.brief,
                format: item.format,
                pillar: item.pillar,
                audience_target: item.audience_target,
                psychological_trigger: item.psychological_trigger,
                why_it_works: item.why_it_works,
                feedback_used: 'Original Version'
            })

        if (archiveError) {
            console.error("Failed to archive version:", archiveError)
            // Continue anyway? Ideally we should stop, but for MVP let's log and proceed or throw
            // throw archiveError
        }

        // 3. Generate New Version
        // 3. Generate New Version
        const prompt = `
        You are an expert social media strategist.
        
        Original Content Idea:
        Title: ${item.title}
        Brief: ${item.brief}
        Format: ${item.format}
        Pillar: ${item.pillar}
        Target Audience: ${item.audience_target}
        
        Client Feedback: "${feedback}"
        
        Task: Revise the content idea based on the client's feedback. Keep the same format and pillar unless explicitly asked to change.
        
        Return a JSON object with the following fields:
        - title: The revised catchy title
        - brief: The revised detailed content brief
        - format: The format (text, carousel, story, video)
        - pillar: The content pillar
        - audience_target: Who this is for
        - psychological_trigger: The hook/trigger used
        - why_it_works: Explanation of the changes
        `

        const revisedData = await generateJSON(prompt)

        // 4. Update Main Calendar Item
        const { data: updatedItem, error: updateError } = await supabase
            .from('content_calendar')
            .update({
                ...revisedData,
                status: 'pending' // Reset status to pending for approval
            })
            .eq('id', calendar_id)
            .select()
            .single()

        if (updateError) throw updateError

        return NextResponse.json({ success: true, item: updatedItem })

    } catch (error: any) {
        console.error('Revision error:', error)
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
    }
}

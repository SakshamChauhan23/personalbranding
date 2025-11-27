import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Initialize Supabase Admin Client inside handler to avoid build-time/load-time errors
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

export async function POST(request: Request) {
    try {
        const missingKeys = []
        if (!supabaseUrl) missingKeys.push('NEXT_PUBLIC_SUPABASE_URL')
        if (!supabaseServiceKey) missingKeys.push('SUPABASE_SERVICE_ROLE_KEY')

        if (missingKeys.length > 0) {
            console.error('Missing Supabase Environment Variables:', missingKeys)
            return NextResponse.json({ error: `Server Configuration Error: Missing keys: ${missingKeys.join(', ')}` }, { status: 500 })
        }

        const supabaseAdmin = createClient(supabaseUrl!, supabaseServiceKey!)

        const body = await request.json()
        const { postId, action, feedback } = body
        // clientId might be passed, but we should trust the post's client_id source of truth

        if (!postId || !action) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        // 1. Fetch the post to get the owner (admin) ID and client_id
        const { data: post, error: fetchError } = await supabaseAdmin
            .from('content_calendar')
            .select('*, clients(user_id, name)')
            .eq('id', postId)
            .single()

        if (fetchError || !post) {
            console.error('Error fetching post:', fetchError)
            return NextResponse.json({ error: 'Post not found' }, { status: 404 })
        }

        // @ts-ignore
        const adminId = post.clients?.user_id
        // @ts-ignore
        const clientName = post.clients?.name
        const clientId = post.client_id

        if (!adminId || !clientId) {
            console.error('Missing client or admin data for post:', postId)
            return NextResponse.json({ error: 'Invalid post data configuration' }, { status: 500 })
        }

        // 2. Perform the Action
        if (action === 'approve') {
            const currentStage = post.workflow_stage || 'brief'

            if (currentStage === 'brief') {
                // Brief approved -> Move to Content stage
                const { error: updateError } = await supabaseAdmin
                    .from('content_calendar')
                    .update({
                        feedback_status: 'draft', // Reset for content creation
                        workflow_stage: 'content',
                        feedback_notes: null // Clear previous notes
                    })
                    .eq('id', postId)

                if (updateError) throw updateError

                // Notification
                await supabaseAdmin.from('notifications').insert({
                    user_id: adminId,
                    client_id: clientId,
                    type: 'approval',
                    message: `${clientName} approved brief for "${post.title}". Ready for content.`,
                    is_read: false
                })

            } else {
                // Content approved -> Final approval
                const { error: updateError } = await supabaseAdmin
                    .from('content_calendar')
                    .update({
                        feedback_status: 'approved',
                        status: 'approved'
                    })
                    .eq('id', postId)

                if (updateError) throw updateError

                // Notification
                await supabaseAdmin.from('notifications').insert({
                    user_id: adminId,
                    client_id: clientId,
                    type: 'approval',
                    message: `${clientName} approved content for "${post.title}". Ready to publish.`,
                    is_read: false
                })
            }

        } else if (action === 'reject') {
            // Update Post Status
            const { error: updateError } = await supabaseAdmin
                .from('content_calendar')
                .update({
                    feedback_status: 'changes_requested',
                    feedback_notes: feedback
                })
                .eq('id', postId)

            if (updateError) throw updateError

            // Add Feedback Entry
            const { error: feedbackError } = await supabaseAdmin.from('feedback_entries').insert({
                calendar_id: postId,
                client_id: clientId,
                content: feedback || 'No feedback provided'
            })

            if (feedbackError) {
                console.error('Error inserting feedback entry:', feedbackError)
                // Don't fail the whole request if just the entry fails, but log it
            }

            // Create Notification for Admin
            await supabaseAdmin.from('notifications').insert({
                user_id: adminId,
                client_id: clientId,
                calendar_id: postId,
                type: 'feedback',
                message: `${clientName} requested changes on "${post.title}"`,
                is_read: false
            })
        }

        return NextResponse.json({ success: true })

    } catch (error: any) {
        console.error('Feedback API Error:', error)
        console.error('Error Stack:', error.stack)
        return NextResponse.json({ error: error.message || 'Internal Server Error', details: error }, { status: 500 })
    }
}

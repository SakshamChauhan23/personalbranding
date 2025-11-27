import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { sendEmail } from '@/lib/email'

export async function POST(request: Request) {
    try {
        const { postId, clientId } = await request.json()
        const supabase = await createClient()

        // 1. Fetch Post and Client Details
        const { data: post, error: postError } = await supabase
            .from('content_calendar')
            .select('*, clients(name, approval_email)')
            .eq('id', postId)
            .single()

        if (postError || !post) {
            return NextResponse.json({ error: 'Post not found' }, { status: 404 })
        }

        const clientEmail = post.clients.approval_email
        if (!clientEmail) {
            return NextResponse.json({ error: 'Client has no approval email' }, { status: 400 })
        }

        // 2. Prepare Email Content
        const approvalLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/feedback/${postId}`

        const htmlContent = `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                <h2>Content Approval Request</h2>
                <p>Hi ${post.clients.name},</p>
                <p>A new post is ready for your review.</p>
                
                <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h3 style="margin-top: 0;">${post.title}</h3>
                    <p style="color: #4b5563;">${post.brief}</p>
                </div>

                <a href="${approvalLink}" style="display: inline-block; background: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                    Review & Approve
                </a>

                <p style="margin-top: 20px; font-size: 12px; color: #6b7280;">
                    If the button doesn't work, copy this link: ${approvalLink}
                </p>
            </div>
        `

        // 3. Send Email
        const result = await sendEmail({
            to: clientEmail,
            subject: `Approval Required: ${post.title}`,
            html: htmlContent
        })

        // 4. Update Status
        const { error: updateError } = await supabase
            .from('content_calendar')
            .update({ feedback_status: 'sent' })
            .eq('id', postId)

        if (updateError) throw updateError

        return NextResponse.json({
            success: true,
            previewUrl: result.previewUrl // Will be present if using Ethereal
        })

    } catch (error: any) {
        console.error('Email Error:', error)
        return NextResponse.json({ error: error.message || 'Failed to send email' }, { status: 500 })
    }
}

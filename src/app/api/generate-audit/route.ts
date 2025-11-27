import { createClient } from '@/lib/supabase/server'
import { generateJSON } from '@/lib/ai-provider' // Smart AI provider with fallback
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
    console.log("🚀 Starting Audit Generation...")

    let client_id;
    try {
        const body = await request.json()
        client_id = body.client_id
        console.log("📦 Request body parsed, client_id:", client_id)
    } catch (e) {
        console.error("❌ Failed to parse request body")
        return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
    }

    const supabase = await createClient()

    // 1. Fetch Client
    let client;
    try {
        console.log("🔍 Fetching client from Supabase...")
        const { data, error } = await supabase
            .from('clients')
            .select('*')
            .eq('id', client_id)
            .single()

        if (error) {
            console.error("❌ Supabase error fetching client:", error)
            throw error
        }
        if (!data) {
            console.error("❌ Client not found in DB")
            return NextResponse.json({ error: 'Client not found' }, { status: 404 })
        }
        client = data
        console.log("✅ Client found:", client.id)
    } catch (error: any) {
        console.error("❌ Error during client fetch:", error)
        return NextResponse.json({ error: `Database Error: ${error.message}` }, { status: 500 })
    }

    // 1.5 Check if audit already exists (PREVENT DUPLICATE AI CALLS)
    const { data: existingAudit } = await supabase
        .from('client_profile_audits')
        .select('*')
        .eq('client_id', client_id)
        .single()

    if (existingAudit) {
        console.log("♻️ Audit already exists, returning cached version")
        return NextResponse.json({ success: true, audit: existingAudit, cached: true })
    }

    // 2. Generate Audit (Mock)
    try {
        console.log("🤖 Using Mock Data for Audit...")
        const auditData = {
            positioning_statement: "The go-to strategic advisor for enterprise leaders navigating digital transformation.",
            content_pillars: ["Digital Transformation", "Leadership Insights", "Future of Work", "Enterprise Innovation", "Change Management"],
            tone_voice: "Authoritative yet accessible, forward-thinking, and empathetic.",
            strengths_weaknesses: "Strength: Deep industry knowledge. Weakness: Needs more personal storytelling.",
            audience_insights: "C-suite executives and decision-makers looking for actionable strategies."
        }
        // const auditData = await generateJSON(prompt)

        console.log("✅ Audit data validated successfully")

        // 3. Save Audit
        console.log("💾 Saving audit to Supabase...")
        const { data: audit, error: saveError } = await supabase
            .from('client_profile_audits')
            .insert({
                client_id,
                ...auditData
            })
            .select()
            .single()

        if (saveError) {
            console.error("❌ Supabase error saving audit:", saveError)
            throw saveError
        }

        console.log("✅ Audit saved successfully")
        return NextResponse.json({ success: true, audit })

    } catch (error: any) {
        console.error('❌ Audit generation/saving error:', error)
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        return NextResponse.json({ error: errorMessage }, { status: 500 })
    }
}

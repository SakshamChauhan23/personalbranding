import { createClient } from '@/lib/supabase/server'
import { generateJSON } from '@/lib/ai-provider' // Smart AI provider with fallback
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
    try {
        const { client_id } = await request.json()
        const supabase = await createClient()

        // Fetch Client Audit
        console.log(`🔍 Fetching audit for client: ${client_id}`)
        const { data: audit, error: auditError } = await supabase
            .from('client_profile_audits')
            .select('*')
            .eq('client_id', client_id)
            .single()

        if (auditError || !audit) {
            console.error("❌ Audit not found:", auditError)
            return NextResponse.json({ error: 'Audit not found. Please complete onboarding first.' }, { status: 404 })
        }
        console.log("✅ Audit found")

        // Check if calendar already exists (PREVENT DUPLICATE AI CALLS)
        const { data: existingItems } = await supabase
            .from('content_calendar')
            .select('*')
            .eq('client_id', client_id)

        if (existingItems && existingItems.length > 0) {
            console.log("♻️ Calendar already exists, returning cached version")
            return NextResponse.json({ success: true, count: existingItems.length, items: existingItems, cached: true })
        }

        // Mock Data for Testing
        console.log("🤖 Using Mock Data for Calendar...")
        // Generate dates for the next 4 weeks (Mon, Wed, Fri)
        const today = new Date()
        const dates = []
        const currentDate = new Date(today)

        while (dates.length < 12) {
            currentDate.setDate(currentDate.getDate() + 1)
            const day = currentDate.getDay()
            if (day === 1 || day === 3 || day === 5) { // Mon, Wed, Fri
                dates.push(new Date(currentDate))
            }
        }

        const mockItems = [
            {
                title: "The Future of " + (audit?.industry || "Tech"),
                brief: "Discuss emerging trends in " + (audit?.industry || "the industry") + " and how they impact leadership decisions.",
                format: "text",
                pillar: "Thought Leadership",
                audience_target: "Industry Leaders",
                psychological_trigger: "Curiosity",
                why_it_works: "Positions you as a forward-thinking expert.",
                scheduled_date: dates[0].toISOString().split('T')[0]
            },
            {
                title: "My Biggest Mistake as a " + (audit?.role || "Leader"),
                brief: "Share a vulnerable story about a past failure and the key lesson learned.",
                format: "story",
                pillar: "Personal Journey",
                audience_target: "Aspiring Leaders",
                psychological_trigger: "Vulnerability",
                why_it_works: "Builds trust and relatability.",
                scheduled_date: dates[1].toISOString().split('T')[0]
            },
            {
                title: "3 Tools I Can't Live Without",
                brief: "A carousel showcasing your top productivity or industry-specific tools.",
                format: "carousel",
                pillar: "Tactical Advice",
                audience_target: "Practitioners",
                psychological_trigger: "Utility",
                why_it_works: "High save-ability and share-ability.",
                scheduled_date: dates[2].toISOString().split('T')[0]
            },
            {
                title: "Unpopular Opinion: " + (audit?.industry || "Industry") + " Edition",
                brief: "Challenge a common myth or status quo in your field.",
                format: "text",
                pillar: "Contrarian View",
                audience_target: "Peers",
                psychological_trigger: "Controversy",
                why_it_works: "Drives engagement and debate.",
                scheduled_date: dates[3].toISOString().split('T')[0]
            },
            {
                title: "How I Structure My Day",
                brief: "A behind-the-scenes look at your daily routine for maximum efficiency.",
                format: "story",
                pillar: "Personal Journey",
                audience_target: "Entrepreneurs",
                psychological_trigger: "Voyeurism",
                why_it_works: "People love seeing how successful people operate.",
                scheduled_date: dates[4].toISOString().split('T')[0]
            },
            {
                title: "The " + (audit?.industry || "Industry") + " Checklist",
                brief: "A step-by-step carousel guide to solving a specific problem.",
                format: "carousel",
                pillar: "Educational",
                audience_target: "Beginners",
                psychological_trigger: "Utility",
                why_it_works: "Actionable value is highly shareable.",
                scheduled_date: dates[5].toISOString().split('T')[0]
            },
            {
                title: "Client Success Story",
                brief: "Share a win from a recent project or client interaction.",
                format: "text",
                pillar: "Social Proof",
                audience_target: "Potential Clients",
                psychological_trigger: "Trust",
                why_it_works: "Demonstrates competence without bragging.",
                scheduled_date: dates[6].toISOString().split('T')[0]
            },
            {
                title: "What I'm Reading This Week",
                brief: "Review a book or article that influenced your thinking.",
                format: "text",
                pillar: "Curated Insights",
                audience_target: "Intellectuals",
                psychological_trigger: "Authority",
                why_it_works: "Shows you are a continuous learner.",
                scheduled_date: dates[7].toISOString().split('T')[0]
            },
            {
                title: "5 Lessons from 5 Years in " + (audit?.industry || "Business"),
                brief: "Carousel summarizing key career takeaways.",
                format: "carousel",
                pillar: "Thought Leadership",
                audience_target: "Career Switchers",
                psychological_trigger: "Wisdom",
                why_it_works: "Dense value in an easy-to-consume format.",
                scheduled_date: dates[8].toISOString().split('T')[0]
            },
            {
                title: "Stop Doing This One Thing",
                brief: "Advice on a common bad habit in your industry.",
                format: "text",
                pillar: "Tactical Advice",
                audience_target: "Practitioners",
                psychological_trigger: "Fear of Missing Out",
                why_it_works: "Negative framing grabs attention.",
                scheduled_date: dates[9].toISOString().split('T')[0]
            },
            {
                title: "My 'Why'",
                brief: "Reflect on what drives you to do what you do.",
                format: "story",
                pillar: "Personal Brand",
                audience_target: "Everyone",
                psychological_trigger: "Emotion",
                why_it_works: "Humanizes your professional brand.",
                scheduled_date: dates[10].toISOString().split('T')[0]
            },
            {
                title: "Weekend Reflection",
                brief: "A lighter, more personal post to end the week.",
                format: "text",
                pillar: "Personal",
                audience_target: "Followers",
                psychological_trigger: "Connection",
                why_it_works: "Builds community.",
                scheduled_date: dates[11].toISOString().split('T')[0]
            }
        ]
        console.log(`✅ Validated ${mockItems.length} calendar items`)

        // Save to Database
        console.log("💾 Saving calendar items to Supabase...")
        const { data: savedItems, error: saveError } = await supabase
            .from('content_calendar')
            .insert(mockItems.map(item => ({
                client_id,
                ...item,
                status: 'pending'
            })))
            .select()

        if (saveError) {
            console.error("❌ Supabase save error:", saveError)
            throw saveError
        }
        console.log(`✅ Saved ${savedItems.length} calendar items`)

        return NextResponse.json({ success: true, count: savedItems.length, items: savedItems })
    } catch (error: any) {
        console.error('Calendar generation error:', error)
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
    }
}

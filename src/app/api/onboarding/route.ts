import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { linkedin_url, bio, goals, tone_preferences, industry, role, target_audience } = body

        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Extract name from LinkedIn URL (e.g., "https://linkedin.com/in/saksham-chauhan" -> "Saksham Chauhan")
        let name = 'Unnamed Client'
        if (linkedin_url) {
            const urlParts = linkedin_url.split('/')
            const lastPart = urlParts[urlParts.length - 1] || urlParts[urlParts.length - 2]
            if (lastPart && lastPart !== 'in') {
                // Convert "saksham-chauhan" to "Saksham Chauhan"
                name = lastPart
                    .split('-')
                    .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(' ')
            }
        }

        const { data, error } = await supabase
            .from('clients')
            .insert({
                user_id: user.id,
                name,
                linkedin_url,
                bio,
                goals,
                tone_preferences,
                industry: industry || null,
                role: role || null,
                target_audience: target_audience || null
            })
            .select()
            .single()

        if (error) throw error

        return NextResponse.json({ success: true, client: data })
    } catch (error) {
        console.error('Onboarding error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}

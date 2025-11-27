import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
    try {
        const { script_id, scheduled_time, method } = await request.json()
        const supabase = await createClient()

        // 1. Check if script exists and is approved
        const { data: script, error: scriptError } = await supabase
            .from('content_scripts')
            .select('*')
            .eq('id', script_id)
            .single()

        if (scriptError || !script) {
            return NextResponse.json({ error: 'Script not found' }, { status: 404 })
        }

        if (script.status !== 'approved') {
            // Auto-approve if scheduling?
            // For now, let's require approval or auto-approve here
            await supabase.from('content_scripts').update({ status: 'approved' }).eq('id', script_id)
        }

        // 2. Create Schedule Entry
        const { data: schedule, error: scheduleError } = await supabase
            .from('schedules')
            .insert({
                script_id,
                scheduled_time,
                method: method || 'manual',
                is_posted: false
            })
            .select()
            .single()

        if (scheduleError) throw scheduleError

        return NextResponse.json({ success: true, schedule })

    } catch (error: any) {
        console.error('Scheduling error:', error)
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
    }
}

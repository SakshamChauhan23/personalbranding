import { createClient } from '@/lib/supabase/server'
import CalendarGrid from '@/components/CalendarGrid'

export default async function CalendarPage({ params }: { params: Promise<{ clientId: string }> }) {
    const supabase = await createClient()
    const { clientId } = await params

    // Fetch Calendar Items
    const { data: items } = await supabase
        .from('content_calendar')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false })

    return (
        <div className="max-w-7xl mx-auto">
            <CalendarGrid initialItems={items || []} clientId={clientId} />
        </div>
    )
}

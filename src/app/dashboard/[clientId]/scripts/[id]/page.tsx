import { createClient } from '@/lib/supabase/server'
import ScriptEditor from '@/components/ScriptEditor'
import Link from 'next/link'

export default async function ScriptPage({ params }: { params: { clientId: string, id: string } }) {
    const supabase = await createClient()
    const { clientId, id } = params

    // Fetch Calendar Item Details
    const { data: item } = await supabase
        .from('content_calendar')
        .select('*')
        .eq('id', id)
        .single()

    if (!item) return <div>Item not found</div>

    // Fetch Existing Script (if any)
    const { data: script } = await supabase
        .from('content_scripts')
        .select('*')
        .eq('calendar_id', id)
        .order('version', { ascending: false })
        .limit(1)
        .single()

    return (
        <div className="max-w-6xl mx-auto">
            <div className="mb-8">
                <Link href={`/dashboard/${clientId}/calendar`} className="text-sm text-gray-400 hover:text-white mb-4 inline-block">
                    ← Back to Calendar
                </Link>
                <h1 className="text-3xl font-bold mb-2">{item.title}</h1>
                <p className="text-gray-400">{item.brief}</p>
            </div>

            <ScriptEditor initialScript={script} calendarId={id} />
        </div>
    )
}

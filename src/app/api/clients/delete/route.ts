import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const client_id = searchParams.get('client_id')

        if (!client_id) {
            return NextResponse.json({ error: 'Client ID required' }, { status: 400 })
        }

        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Verify the client belongs to this user before deleting
        const { data: client } = await supabase
            .from('clients')
            .select('user_id')
            .eq('id', client_id)
            .single()

        if (!client || client.user_id !== user.id) {
            return NextResponse.json({ error: 'Client not found or unauthorized' }, { status: 404 })
        }

        // Delete the client (cascade will handle related records)
        const { error } = await supabase
            .from('clients')
            .delete()
            .eq('id', client_id)

        if (error) throw error

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Client deletion error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}

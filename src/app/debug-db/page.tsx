import { createClient } from '@/lib/supabase/server'

export default async function DebugDB() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return <div className="p-8">Not logged in</div>
    }

    // Check clients
    const { data: clients, error: clientError } = await supabase
        .from('clients')
        .select('*')
        .eq('user_id', user.id)

    // Check audits
    const { data: audits, error: auditError } = await supabase
        .from('client_profile_audits')
        .select('*')

    return (
        <div className="p-8 bg-slate-950 text-white min-h-screen">
            <h1 className="text-2xl font-bold mb-4">Database Debug</h1>

            <div className="mb-8">
                <h2 className="text-xl font-bold mb-2">Current User</h2>
                <pre className="bg-slate-900 p-4 rounded overflow-auto">
                    {JSON.stringify(user, null, 2)}
                </pre>
            </div>

            <div className="mb-8">
                <h2 className="text-xl font-bold mb-2">Clients Table</h2>
                {clientError && <p className="text-red-500">Error: {clientError.message}</p>}
                <pre className="bg-slate-900 p-4 rounded overflow-auto">
                    {JSON.stringify(clients, null, 2)}
                </pre>
            </div>

            <div className="mb-8">
                <h2 className="text-xl font-bold mb-2">Audits Table</h2>
                {auditError && <p className="text-red-500">Error: {auditError.message}</p>}
                <pre className="bg-slate-900 p-4 rounded overflow-auto">
                    {JSON.stringify(audits, null, 2)}
                </pre>
            </div>
        </div>
    )
}

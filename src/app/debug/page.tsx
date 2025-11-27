import { createClient } from '@/lib/supabase/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

export default async function DebugPage() {
    const results = {
        supabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        supabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        geminiKey: !!process.env.GEMINI_API_KEY,
        dbConnection: false,
        dbError: '',
        geminiConnection: false,
        geminiError: ''
    }

    // Check Supabase Connection
    try {
        const supabase = await createClient()
        const { error } = await supabase.from('clients').select('count').limit(1).single()
        if (error && error.code !== 'PGRST116') { // PGRST116 is "The result contains 0 rows" which is fine for connection check
            throw error
        }
        results.dbConnection = true
    } catch (e: any) {
        results.dbError = e.message
    }

    // Check Gemini Connection & List Models
    let availableModels: string[] = []
    try {
        if (process.env.GEMINI_API_KEY) {
            // 1. Test Generation
            const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
            const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })
            try {
                await model.generateContent('Hello')
                results.geminiConnection = true
            } catch (e) {
                console.error("Generation failed", e)
            }

            // 2. List Models directly via REST API
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`)
            const data = await response.json()
            if (data.models) {
                availableModels = data.models.map((m: any) => m.name.replace('models/', ''))
            }
        }
    } catch (e: any) {
        results.geminiError = e.message
    }

    return (
        <div className="min-h-screen bg-slate-950 text-white p-8 font-mono">
            <h1 className="text-2xl font-bold mb-8">System Diagnostics</h1>

            <div className="space-y-6 max-w-2xl">
                {/* Environment Variables */}
                <div className="p-6 bg-slate-900 rounded-lg border border-gray-800">
                    <h2 className="text-lg font-bold mb-4">1. Environment Variables</h2>
                    <div className="space-y-2">
                        <StatusRow label="NEXT_PUBLIC_SUPABASE_URL" status={results.supabaseUrl} />
                        <StatusRow label="NEXT_PUBLIC_SUPABASE_ANON_KEY" status={results.supabaseKey} />
                        <StatusRow label="GEMINI_API_KEY" status={results.geminiKey} />
                    </div>
                </div>

                {/* Database Connection */}
                <div className="p-6 bg-slate-900 rounded-lg border border-gray-800">
                    <h2 className="text-lg font-bold mb-4">2. Database Connection</h2>
                    <div className="space-y-2">
                        <StatusRow label="Connect to Supabase" status={results.dbConnection} error={results.dbError} />
                    </div>
                </div>

                {/* AI Connection */}
                <div className="p-6 bg-slate-900 rounded-lg border border-gray-800">
                    <h2 className="text-lg font-bold mb-4">3. AI Connection</h2>
                    <div className="space-y-2">
                        <StatusRow label="Connect to Gemini" status={results.geminiConnection} error={results.geminiError} />
                    </div>

                    <div className="mt-6 pt-6 border-t border-gray-800">
                        <h3 className="text-sm font-bold text-gray-400 uppercase mb-2">Available Models</h3>
                        {availableModels.length > 0 ? (
                            <ul className="grid grid-cols-2 gap-2">
                                {availableModels.map(model => (
                                    <li key={model} className="text-xs bg-slate-950 p-2 rounded text-indigo-300">
                                        {model}
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-sm text-gray-500">Could not fetch model list.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

function StatusRow({ label, status, error }: { label: string, status: boolean, error?: string }) {
    return (
        <div className="flex items-start justify-between">
            <span>{label}</span>
            <div className="text-right">
                <span className={`font-bold ${status ? 'text-green-400' : 'text-red-400'}`}>
                    {status ? 'OK' : 'FAILED'}
                </span>
                {error && <p className="text-xs text-red-400 mt-1 max-w-xs">{error}</p>}
            </div>
        </div>
    )
}

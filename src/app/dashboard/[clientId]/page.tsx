import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { MessageSquare, Target, Users, Volume2, TrendingUp, ArrowLeft, ArrowRight, PlusCircle, BarChart3, Send, FileText } from 'lucide-react'
import StrategyCreator from '@/components/StrategyCreator'

export default async function ClientStrategyDashboard({ params }: { params: Promise<{ clientId: string }> }) {
    const supabase = await createClient()
    const { clientId } = await params

    // Fetch Specific Client & Audit
    const { data: client, error: clientError } = await supabase
        .from('clients')
        .select('*, client_profile_audits(*)')
        .eq('id', clientId)
        .single()

    if (clientError || !client) {
        return <div>Client not found</div>
    }

    const audit = client.client_profile_audits?.[0]

    // Analytics Data Fetching
    // 1. Total Posts Created
    const { count: postsCreated } = await supabase
        .from('content_calendar')
        .select('*', { count: 'exact', head: true })
        .eq('client_id', clientId)

    // 2. Posts Sent for Feedback
    const { count: postsSent } = await supabase
        .from('content_calendar')
        .select('*', { count: 'exact', head: true })
        .eq('client_id', clientId)
        .in('feedback_status', ['sent', 'changes_requested', 'approved'])

    // 3. Recent Feedback (Last 3 items with feedback or status change)
    const { data: recentFeedback } = await supabase
        .from('content_calendar')
        .select('id, title, feedback_status, feedback_notes, updated_at')
        .eq('client_id', clientId)
        .neq('feedback_status', 'draft')
        .order('updated_at', { ascending: false })
        .limit(3)

    return (
        <div className="max-w-6xl mx-auto">
            {/* Header with Actions */}
            <header className="mb-8 flex justify-between items-start">
                <div className="flex items-center gap-4">
                    <Link
                        href="/dashboard"
                        className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-gray-400 hover:text-white"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <h1 className="text-3xl font-bold text-white">
                                {client.role} Strategy
                            </h1>
                            <span className="px-2 py-0.5 bg-slate-800 text-gray-400 text-xs rounded border border-gray-700">
                                {client.industry}
                            </span>
                        </div>
                        <p className="text-gray-400">AI-generated content strategy</p>
                    </div>
                </div>
                <div className="flex gap-3">
                    <Link
                        href={`/dashboard/${clientId}/calendar?create=true`}
                        className="bg-indigo-600 hover:bg-indigo-700 px-6 py-3 rounded-lg font-medium transition-colors shadow-lg hover:shadow-indigo-500/50 flex items-center gap-2"
                    >
                        <PlusCircle className="w-4 h-4" />
                        Create Post
                    </Link>
                </div>
            </header>

            {/* Analytics Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {/* Posts Created */}
                <div className="p-6 bg-slate-800 rounded-xl border border-slate-700">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-blue-500/10 rounded-lg">
                            <FileText className="w-5 h-5 text-blue-400" />
                        </div>
                        <h3 className="text-sm font-medium text-gray-400">Posts Created</h3>
                    </div>
                    <p className="text-3xl font-bold text-white">{postsCreated || 0}</p>
                </div>

                {/* Posts Sent */}
                <div className="p-6 bg-slate-800 rounded-xl border border-slate-700">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-purple-500/10 rounded-lg">
                            <Send className="w-5 h-5 text-purple-400" />
                        </div>
                        <h3 className="text-sm font-medium text-gray-400">Sent for Feedback</h3>
                    </div>
                    <p className="text-3xl font-bold text-white">{postsSent || 0}</p>
                </div>

                {/* Recent Feedback */}
                <div className="p-6 bg-slate-800 rounded-xl border border-slate-700">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-yellow-500/10 rounded-lg">
                            <MessageSquare className="w-5 h-5 text-yellow-400" />
                        </div>
                        <h3 className="text-sm font-medium text-gray-400">Recent Activity</h3>
                    </div>
                    <div className="space-y-3">
                        {recentFeedback && recentFeedback.length > 0 ? (
                            recentFeedback.map((item: any) => (
                                <div key={item.id} className="flex items-center justify-between text-sm">
                                    <span className="text-gray-300 truncate max-w-[120px]">{item.title}</span>
                                    <span className={`px-2 py-0.5 rounded text-xs ${item.feedback_status === 'approved' ? 'bg-green-500/20 text-green-300' :
                                            item.feedback_status === 'changes_requested' ? 'bg-red-500/20 text-red-300' :
                                                'bg-yellow-500/20 text-yellow-300'
                                        }`}>
                                        {item.feedback_status.replace('_', ' ')}
                                    </span>
                                </div>
                            ))
                        ) : (
                            <p className="text-sm text-gray-500">No recent feedback</p>
                        )}
                    </div>
                </div>
            </div>

            {!audit ? (
                <StrategyCreator
                    clientId={clientId}
                    clientRole={client.role || 'Client'}
                    clientIndustry={client.industry || 'Industry'}
                />
            ) : (
                <div className="space-y-6">
                    {/* Positioning Statement - Hero Card */}
                    <div className="relative overflow-hidden p-8 bg-gradient-to-br from-indigo-900/40 to-purple-900/40 rounded-xl border border-indigo-500/30 shadow-xl">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl"></div>
                        <div className="relative">
                            <div className="flex items-center gap-2 mb-4">
                                <Target className="w-5 h-5 text-indigo-400" />
                                <h3 className="text-sm font-bold text-indigo-300 uppercase tracking-wide">Positioning</h3>
                            </div>
                            <p className="text-2xl font-bold text-white leading-relaxed mb-6">
                                "{audit.positioning_statement}"
                            </p>
                            <Link
                                href={`/dashboard/feedback?type=positioning&id=${audit.id}`}
                                className="inline-flex items-center gap-2 text-sm text-indigo-300 hover:text-indigo-200 transition-colors"
                            >
                                <MessageSquare className="w-4 h-4" />
                                Give feedback
                            </Link>
                        </div>
                    </div>

                    <div className="grid gap-6 md:grid-cols-2">
                        {/* Content Pillars */}
                        <div className="p-6 bg-slate-900 rounded-xl border border-gray-800 hover:border-cyan-500/50 transition-colors">
                            <div className="flex items-center gap-2 mb-4">
                                <TrendingUp className="w-5 h-5 text-cyan-400" />
                                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wide">Content Pillars</h3>
                            </div>
                            <ul className="space-y-3">
                                {audit.content_pillars?.map((pillar: string, i: number) => (
                                    <li key={i} className="flex items-start gap-3 group">
                                        <span className="flex-shrink-0 w-6 h-6 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-full flex items-center justify-center text-xs font-bold text-white mt-0.5">
                                            {i + 1}
                                        </span>
                                        <span className="text-gray-200 group-hover:text-white transition-colors">{pillar}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Tone & Voice */}
                        <div className="p-6 bg-slate-900 rounded-xl border border-gray-800 hover:border-purple-500/50 transition-colors">
                            <div className="flex items-center gap-2 mb-4">
                                <Volume2 className="w-5 h-5 text-purple-400" />
                                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wide">Tone of Voice</h3>
                            </div>
                            <p className="text-gray-200 leading-relaxed">{audit.tone_voice}</p>
                        </div>

                        {/* Target Audience */}
                        <div className="p-6 bg-slate-900 rounded-xl border border-gray-800 hover:border-green-500/50 transition-colors md:col-span-2">
                            <div className="flex items-center gap-2 mb-4">
                                <Users className="w-5 h-5 text-green-400" />
                                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wide">Target Audience</h3>
                            </div>
                            <p className="text-gray-200 leading-relaxed">{audit.audience_insights}</p>
                        </div>

                        {/* Strengths & Weaknesses */}
                        <div className="p-6 bg-slate-900 rounded-xl border border-gray-800 hover:border-orange-500/50 transition-colors md:col-span-2">
                            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wide mb-4">Analysis</h3>
                            <p className="text-gray-200 leading-relaxed whitespace-pre-line">{audit.strengths_weaknesses}</p>
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="flex gap-4 pt-4">
                        <Link
                            href={`/dashboard/${clientId}/calendar`}
                            className="flex-1 p-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 rounded-lg text-center font-medium transition-all hover:scale-105"
                        >
                            View Content Calendar
                        </Link>
                        <Link
                            href={`/dashboard/feedback?type=strategy&id=${audit.id}`}
                            className="flex-1 p-4 bg-slate-800 hover:bg-slate-700 border border-gray-700 hover:border-gray-600 rounded-lg text-center font-medium transition-all"
                        >
                            Request Strategy Changes
                        </Link>
                    </div>
                </div>
            )}
        </div>
    )
}

'use client'

import { useState } from 'react'
import { ContentScript } from '@/types'
import { createClient } from '@/lib/supabase/client'
import { RefreshCw, Check, Copy, ExternalLink, MessageSquare, Zap, Layers, FileText, Calendar as CalendarIcon, Sparkles } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function ScriptEditor({
    initialScript,
    calendarId
}: {
    initialScript: ContentScript | null,
    calendarId: string
}) {
    const router = useRouter()
    const [script, setScript] = useState<ContentScript | null>(initialScript)
    const [loading, setLoading] = useState(false)
    const [isRevising, setIsRevising] = useState(false)
    const [revisionFeedback, setRevisionFeedback] = useState('')
    const [selectedTone, setSelectedTone] = useState<'conversational' | 'formal'>('conversational')

    // Scheduling State
    const [isScheduling, setIsScheduling] = useState(false)
    const [scheduledDate, setScheduledDate] = useState('')
    const [scheduledTime, setScheduledTime] = useState('')

    const supabase = createClient()

    const generateScript = async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/generate-script', {
                method: 'POST',
                body: JSON.stringify({ calendar_id: calendarId }),
                headers: { 'Content-Type': 'application/json' }
            })
            const data = await res.json()
            if (data.success) {
                setScript(data.script)
            }
        } catch (error) {
            console.error(error)
            alert('Failed to generate script')
        } finally {
            setLoading(false)
        }
    }

    const handleRevision = async () => {
        if (!script || !revisionFeedback.trim()) return

        setLoading(true)
        try {
            const res = await fetch('/api/revise-script', {
                method: 'POST',
                body: JSON.stringify({ script_id: script.id, feedback: revisionFeedback }),
                headers: { 'Content-Type': 'application/json' }
            })
            const data = await res.json()
            if (data.success) {
                setScript(data.script)
                setIsRevising(false)
                setRevisionFeedback('')
            } else {
                alert(data.error || 'Failed to revise script')
            }
        } catch (error) {
            console.error(error)
            alert('Failed to revise script')
        } finally {
            setLoading(false)
        }
    }

    const handleApprove = async () => {
        if (!script) return
        try {
            const { error } = await supabase
                .from('content_scripts')
                .update({ status: 'approved' })
                .eq('id', script.id)

            if (error) throw error

            setScript({ ...script, status: 'approved' })

            // Also create a schedule entry (default manual)
            // In a real app, we might redirect to a scheduling page
        } catch (error) {
            console.error(error)
            alert('Failed to approve script')
        }
    }

    const handleSchedule = async () => {
        if (!script || !scheduledDate || !scheduledTime) return

        setLoading(true)
        try {
            const dateTime = new Date(`${scheduledDate}T${scheduledTime}`).toISOString()

            const res = await fetch('/api/schedule-post', {
                method: 'POST',
                body: JSON.stringify({
                    script_id: script.id,
                    scheduled_time: dateTime,
                    method: 'manual'
                }),
                headers: { 'Content-Type': 'application/json' }
            })

            const data = await res.json()
            if (data.success) {
                setScript({ ...script, status: 'approved' })
                setIsScheduling(false)
                alert('Post scheduled successfully!')
                router.push('/dashboard/calendar')
            } else {
                alert(data.error || 'Failed to schedule post')
            }
        } catch (error) {
            console.error(error)
            alert('Failed to schedule post')
        } finally {
            setLoading(false)
        }
    }

    const copyToClipboard = () => {
        if (script?.content_text) {
            navigator.clipboard.writeText(script.content_text)
            alert('Copied to clipboard!')
        }
    }

    const openLinkedIn = () => {
        window.open('https://www.linkedin.com/feed/', '_blank')
    }

    const switchTone = (tone: 'conversational' | 'formal') => {
        if (!script?.draft_data) return

        const newText = tone === 'conversational'
            ? script.draft_data.conversational_version
            : script.draft_data.formal_version

        if (newText) {
            setSelectedTone(tone)
            setScript({ ...script, content_text: newText })
        }
    }

    // Manual Entry State
    const [useAI, setUseAI] = useState(false)
    const [manualContent, setManualContent] = useState('')

    const handleManualSave = async () => {
        if (!manualContent.trim()) return

        setLoading(true)
        try {
            const { data, error } = await supabase
                .from('content_scripts')
                .insert({
                    calendar_id: calendarId,
                    content_text: manualContent,
                    version: 1,
                    status: 'draft'
                })
                .select()
                .single()

            if (error) throw error

            setScript(data)
        } catch (error) {
            console.error(error)
            alert('Failed to save script')
        } finally {
            setLoading(false)
        }
    }

    if (!script && !loading) {
        return (
            <div className="max-w-3xl mx-auto py-12">
                <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold mb-4">Ready to write?</h2>
                    <div className="flex justify-center gap-4 mb-8">
                        <button
                            onClick={() => setUseAI(false)}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors border ${!useAI ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-gray-700 text-gray-400 hover:text-white'}`}
                        >
                            Write Manually
                        </button>
                        <button
                            onClick={() => setUseAI(true)}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors border ${useAI ? 'bg-purple-600 border-purple-600 text-white' : 'border-gray-700 text-gray-400 hover:text-white'}`}
                        >
                            Use AI Assistant
                        </button>
                    </div>
                </div>

                {useAI ? (
                    <div className="text-center py-12 bg-slate-900 rounded-xl border border-gray-800">
                        <div className="w-16 h-16 bg-purple-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Sparkles className="w-8 h-8 text-purple-400" />
                        </div>
                        <p className="text-gray-400 mb-8 max-w-md mx-auto">Generate a high-quality first draft based on your content brief and strategy.</p>
                        <button
                            onClick={generateScript}
                            className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 px-8 py-4 rounded-xl font-bold text-lg flex items-center gap-2 mx-auto transition-all hover:scale-105 shadow-lg"
                        >
                            <Zap className="w-5 h-5" />
                            Generate Script
                        </button>
                    </div>
                ) : (
                    <div className="bg-slate-900 rounded-xl border border-gray-800 p-6">
                        <textarea
                            value={manualContent}
                            onChange={(e) => setManualContent(e.target.value)}
                            className="w-full h-[400px] bg-slate-950 border border-gray-700 rounded-lg p-4 text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-mono text-sm leading-relaxed mb-4"
                            placeholder="Start writing your post here..."
                        />
                        <button
                            onClick={handleManualSave}
                            disabled={!manualContent.trim()}
                            className="w-full bg-indigo-600 hover:bg-indigo-700 px-6 py-3 rounded-lg font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            <Check className="w-5 h-5" />
                            Save Draft
                        </button>
                    </div>
                )}
            </div>
        )
    }

    if (loading) {
        return (
            <div className="text-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto mb-4"></div>
                <p className="text-gray-400">Processing...</p>
            </div>
        )
    }

    const isApproved = script?.status === 'approved'
    const isCarousel = script?.draft_data?.carousel_slides && script.draft_data.carousel_slides.length > 0

    return (
        <div className="grid gap-8 lg:grid-cols-3">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
                {/* Tone Selector */}
                {!isApproved && !isRevising && !isScheduling && script?.draft_data && (
                    <div className="flex gap-2 bg-slate-900 p-1 rounded-lg border border-gray-800 w-fit">
                        <button
                            onClick={() => switchTone('conversational')}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${selectedTone === 'conversational' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'}`}
                        >
                            Conversational
                        </button>
                        <button
                            onClick={() => switchTone('formal')}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${selectedTone === 'formal' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'}`}
                        >
                            Formal
                        </button>
                    </div>
                )}

                {/* Editor / Viewer */}
                <div className="bg-slate-900 rounded-lg border border-gray-800 p-6">
                    <h3 className="text-sm font-medium text-gray-400 uppercase mb-4 flex items-center gap-2">
                        {isCarousel ? <Layers className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                        {isCarousel ? 'Carousel Slides' : 'Post Content'}
                    </h3>

                    <textarea
                        className="w-full h-[500px] bg-slate-950 border border-gray-700 rounded-md p-4 text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-mono text-sm leading-relaxed"
                        value={script?.content_text || ''}
                        onChange={(e) => setScript(script ? { ...script, content_text: e.target.value } : null)}
                        readOnly={isApproved}
                    />
                </div>

                {/* Revision UI */}
                {isRevising && (
                    <div className="bg-slate-900 rounded-lg border border-indigo-500/30 p-6 space-y-4">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            <MessageSquare className="w-5 h-5 text-indigo-400" />
                            Request Changes
                        </h3>
                        <textarea
                            value={revisionFeedback}
                            onChange={(e) => setRevisionFeedback(e.target.value)}
                            className="w-full h-32 bg-slate-950 border border-gray-700 rounded-lg p-4 text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            placeholder="What should be improved? (e.g., 'Make the hook punchier', 'Shorten the body', 'Add more emojis')"
                        />
                        <div className="flex gap-3">
                            <button
                                onClick={() => setIsRevising(false)}
                                className="flex-1 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg font-medium transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleRevision}
                                disabled={!revisionFeedback.trim() || loading}
                                className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {loading ? <Zap className="w-4 h-4 animate-pulse" /> : <RefreshCw className="w-4 h-4" />}
                                Regenerate Script
                            </button>
                        </div>
                    </div>
                )}

                {/* Scheduling UI */}
                {isScheduling && (
                    <div className="bg-slate-900 rounded-lg border border-green-500/30 p-6 space-y-4">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            <CalendarIcon className="w-5 h-5 text-green-400" />
                            Schedule Post
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Date</label>
                                <input
                                    type="date"
                                    className="w-full bg-slate-950 border border-gray-700 rounded-lg p-3 text-white"
                                    value={scheduledDate}
                                    onChange={(e) => setScheduledDate(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Time</label>
                                <input
                                    type="time"
                                    className="w-full bg-slate-950 border border-gray-700 rounded-lg p-3 text-white"
                                    value={scheduledTime}
                                    onChange={(e) => setScheduledTime(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setIsScheduling(false)}
                                className="flex-1 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg font-medium transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSchedule}
                                disabled={!scheduledDate || !scheduledTime || loading}
                                className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                <Check className="w-4 h-4" />
                                Confirm Schedule
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Sidebar: Hooks & Metadata */}
            <div className="space-y-6">
                {isApproved ? (
                    <div className="bg-green-900/20 border border-green-900 rounded-lg p-6 space-y-4 sticky top-6">
                        <h3 className="text-green-400 font-bold text-lg flex items-center gap-2">
                            <Check className="w-5 h-5" />
                            Ready to Post!
                        </h3>
                        <button
                            onClick={copyToClipboard}
                            className="w-full bg-slate-800 hover:bg-slate-700 py-3 rounded-md font-medium transition-colors border border-gray-700 flex items-center justify-center gap-2"
                        >
                            <Copy className="w-4 h-4" />
                            Copy Text
                        </button>
                        <button
                            onClick={openLinkedIn}
                            className="w-full bg-[#0077b5] hover:bg-[#006396] py-3 rounded-md font-medium transition-colors flex items-center justify-center gap-2"
                        >
                            <ExternalLink className="w-4 h-4" />
                            Open LinkedIn
                        </button>
                    </div>
                ) : (
                    <div className="space-y-6 sticky top-6">
                        <div className="bg-slate-900 rounded-lg border border-gray-800 p-6">
                            <h3 className="text-sm font-medium text-gray-400 uppercase mb-4">Hook Variations</h3>
                            <div className="space-y-3">
                                {script?.hook_variations?.map((hook, i) => (
                                    <div
                                        key={i}
                                        className="p-3 bg-slate-950 rounded border border-gray-800 text-sm hover:border-indigo-500 cursor-pointer transition-colors"
                                        onClick={() => {
                                            navigator.clipboard.writeText(hook)
                                            alert('Hook copied!')
                                        }}
                                    >
                                        {hook}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="bg-slate-900 rounded-lg border border-gray-800 p-6">
                            <h3 className="text-sm font-medium text-gray-400 uppercase mb-4">Call to Action</h3>
                            <p className="text-indigo-300 font-medium">{script?.cta}</p>
                        </div>

                        <div className="bg-slate-900 rounded-lg border border-gray-800 p-6">
                            <h3 className="text-sm font-medium text-gray-400 uppercase mb-4">Hashtags</h3>
                            <div className="flex flex-wrap gap-2">
                                {script?.hashtags?.map((tag, i) => (
                                    <span key={i} className="text-xs bg-slate-800 px-2 py-1 rounded text-gray-300">
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {!isRevising && !isScheduling && (
                            <div className="flex flex-col gap-3">
                                <button
                                    onClick={() => setIsRevising(true)}
                                    className="w-full bg-slate-800 hover:bg-slate-700 py-3 rounded-md font-medium transition-colors border border-gray-700 flex items-center justify-center gap-2"
                                >
                                    <RefreshCw className="w-4 h-4" />
                                    Request Changes
                                </button>
                                <button
                                    onClick={() => setIsScheduling(true)}
                                    className="w-full bg-green-600 hover:bg-green-700 py-3 rounded-md font-medium transition-colors flex items-center justify-center gap-2"
                                >
                                    <Check className="w-4 h-4" />
                                    Approve & Schedule
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}

'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useParams } from 'next/navigation'
import { Check, MessageSquare, AlertCircle, Loader2, Image as ImageIcon, Video, FileText, Layout } from 'lucide-react'
import { ContentCalendarItem } from '@/types'

export default function FeedbackPage() {
    const params = useParams()
    const id = params.id as string
    const supabase = createClient()

    const [post, setPost] = useState<ContentCalendarItem | null>(null)
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [feedback, setFeedback] = useState('')
    const [showRejectInput, setShowRejectInput] = useState(false)
    const [completed, setCompleted] = useState(false)

    useEffect(() => {
        fetchPost()
    }, [id])

    const fetchPost = async () => {
        try {
            const { data, error } = await supabase
                .from('content_calendar')
                .select('*, clients(name, logo_url, brand_colors)')
                .eq('id', id)
                .single()

            if (error) throw error
            setPost(data)
        } catch (error) {
            console.error('Error fetching post:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleApprove = async () => {
        setSubmitting(true)
        try {
            const res = await fetch('/api/client-feedback', {
                method: 'POST',
                body: JSON.stringify({
                    postId: id,
                    action: 'approve',
                    clientId: post?.client_id
                }),
                headers: { 'Content-Type': 'application/json' }
            })

            if (!res.ok) throw new Error('Failed to approve')
            setCompleted(true)
        } catch (error) {
            console.error('Error approving post:', error)
            alert('Failed to approve post')
        } finally {
            setSubmitting(false)
        }
    }

    const handleRequestChanges = async () => {
        if (!feedback.trim()) return

        setSubmitting(true)
        try {
            const res = await fetch('/api/client-feedback', {
                method: 'POST',
                body: JSON.stringify({
                    postId: id,
                    action: 'reject',
                    feedback: feedback,
                    clientId: post?.client_id
                }),
                headers: { 'Content-Type': 'application/json' }
            })

            const data = await res.json()

            if (!res.ok) throw new Error(data.error || 'Failed to submit feedback')
            setCompleted(true)
        } catch (error: any) {
            console.error('Error requesting changes:', error)
            alert(`Failed to submit feedback: ${error.message}`)
        } finally {
            setSubmitting(false)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
            </div>
        )
    }

    if (!post) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                <div className="bg-white p-8 rounded-xl shadow-lg text-center max-w-md">
                    <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <h1 className="text-xl font-bold text-gray-900 mb-2">Post Not Found</h1>
                    <p className="text-gray-600">This link may be invalid or expired.</p>
                </div>
            </div>
        )
    }

    if (completed) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                <div className="bg-white p-8 rounded-xl shadow-lg text-center max-w-md animate-in zoom-in duration-300">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Check className="w-8 h-8 text-green-600" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Thank You!</h1>
                    <p className="text-gray-600">
                        Your feedback has been recorded. The team will be notified immediately.
                    </p>
                </div>
            </div>
        )
    }

    // @ts-expect-error - Supabase types are tricky with joins
    const clientBrand = post.clients?.brand_colors || { primary: '#4F46E5' }

    return (
        <div className="min-h-screen bg-slate-50 font-sans">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center sticky top-0 z-10">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">
                        SR
                    </div>
                    <span className="font-medium text-gray-600">Content Approval</span>
                </div>
                <div className="text-sm text-gray-500">
                    Reviewing 1 Post
                </div>
            </div>

            <div className="max-w-4xl mx-auto p-6 md:p-10">
                <div className="grid md:grid-cols-3 gap-8">
                    {/* Left: Preview */}
                    <div className="md:col-span-2 space-y-6">
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                            {/* Mock LinkedIn Post Header */}
                            <div className="p-4 border-b border-gray-100 flex gap-3">
                                <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                                <div>
                                    <div className="h-4 w-32 bg-gray-200 rounded mb-2"></div>
                                    <div className="h-3 w-20 bg-gray-100 rounded"></div>
                                </div>
                            </div>

                            {/* Post Content */}
                            <div className="p-6">
                                <p className="text-gray-800 whitespace-pre-wrap leading-relaxed mb-4">
                                    {post.brief}
                                </p>
                                {post.media_url && (
                                    <div className="mt-4 rounded-lg bg-gray-100 border border-gray-200 p-8 flex flex-col items-center justify-center text-gray-500 h-64">
                                        {post.media_type === 'image' && <ImageIcon className="w-12 h-12 mb-2" />}
                                        {post.media_type === 'video' && <Video className="w-12 h-12 mb-2" />}
                                        {post.media_type === 'carousel' && <Layout className="w-12 h-12 mb-2" />}
                                        {post.media_type === 'pdf' && <FileText className="w-12 h-12 mb-2" />}
                                        <span className="text-sm font-medium">Media Preview: {post.media_type}</span>
                                        <span className="text-xs mt-1 text-blue-600 underline truncate max-w-xs">{post.media_url}</span>
                                    </div>
                                )}
                            </div>

                            {/* Mock LinkedIn Actions */}
                            <div className="px-6 py-3 border-t border-gray-100 flex justify-between text-gray-400 text-sm font-medium">
                                <span>Like</span>
                                <span>Comment</span>
                                <span>Repost</span>
                                <span>Send</span>
                            </div>
                        </div>

                        {/* Strategy Context */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <h3 className="text-sm font-bold text-gray-400 uppercase mb-4">Strategy Context</h3>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <span className="text-gray-500 block mb-1">Format</span>
                                    <span className="font-medium text-gray-900 capitalize">{post.format}</span>
                                </div>
                                <div>
                                    <span className="text-gray-500 block mb-1">Pillar</span>
                                    <span className="font-medium text-gray-900">{post.pillar}</span>
                                </div>
                                <div className="col-span-2">
                                    <span className="text-gray-500 block mb-1">Why this works</span>
                                    <p className="text-gray-900">{post.why_it_works || "Designed to engage your target audience."}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="md:col-span-1">
                        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 sticky top-24">
                            <h2 className="text-lg font-bold text-gray-900 mb-6">Your Decision</h2>

                            {!showRejectInput ? (
                                <div className="space-y-3">
                                    <button
                                        onClick={handleApprove}
                                        disabled={submitting}
                                        className="w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold shadow-sm transition-all hover:scale-[1.02] flex items-center justify-center gap-2"
                                    >
                                        {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                                        Approve Post
                                    </button>
                                    <button
                                        onClick={() => setShowRejectInput(true)}
                                        disabled={submitting}
                                        className="w-full py-3 bg-white border-2 border-gray-200 hover:border-gray-300 text-gray-700 rounded-lg font-bold transition-colors flex items-center justify-center gap-2"
                                    >
                                        <MessageSquare className="w-5 h-5" />
                                        Request Changes
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-4 animate-in slide-in-from-bottom-2">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            What should be changed?
                                        </label>
                                        <textarea
                                            value={feedback}
                                            onChange={(e) => setFeedback(e.target.value)}
                                            className="w-full h-32 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900"
                                            placeholder="E.g. Make the tone more professional..."
                                            autoFocus
                                        />
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setShowRejectInput(false)}
                                            className="flex-1 py-2 text-gray-500 hover:text-gray-700 font-medium"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleRequestChanges}
                                            disabled={!feedback.trim() || submitting}
                                            className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold disabled:opacity-50"
                                        >
                                            {submitting ? 'Sending...' : 'Submit Feedback'}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

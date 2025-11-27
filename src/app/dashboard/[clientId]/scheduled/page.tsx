'use client'

import { useState, useEffect, use } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ContentCalendarItem } from '@/types'
import { Calendar, CheckSquare, Square, Clock, Check, ArrowRight, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function ScheduledPage({ params }: { params: Promise<{ clientId: string }> }) {
    const { clientId } = use(params)
    const router = useRouter()
    const supabase = createClient()
    const [posts, setPosts] = useState<ContentCalendarItem[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchPosts()
    }, [clientId])

    const fetchPosts = async () => {
        try {
            const { data, error } = await supabase
                .from('content_calendar')
                .select('*')
                .eq('client_id', clientId)
                .in('status', ['approved', 'scheduled'])
                .order('scheduled_date', { ascending: true })

            if (error) throw error
            setPosts(data || [])
        } catch (error) {
            console.error('Error fetching scheduled posts:', error)
        } finally {
            setLoading(false)
        }
    }

    const toggleScheduled = async (post: ContentCalendarItem) => {
        const newStatus = post.status === 'scheduled' ? 'approved' : 'scheduled'

        // Optimistic update
        setPosts(posts.map(p => p.id === post.id ? { ...p, status: newStatus } : p))

        try {
            const { error } = await supabase
                .from('content_calendar')
                .update({ status: newStatus })
                .eq('id', post.id)

            if (error) throw error
        } catch (error) {
            console.error('Error updating status:', error)
            // Revert on error
            setPosts(posts.map(p => p.id === post.id ? { ...p, status: post.status } : p))
            alert('Failed to update status')
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
            </div>
        )
    }

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                        <Clock className="w-8 h-8 text-green-400" />
                        Scheduled Posts
                    </h1>
                    <p className="text-gray-400 mt-1">Manage and track posts ready for publishing</p>
                </div>
            </div>

            <div className="bg-slate-900 border border-gray-800 rounded-xl overflow-hidden">
                <div className="grid grid-cols-[auto_1fr_auto_auto_auto] gap-4 p-4 bg-slate-950 border-b border-gray-800 text-sm font-medium text-gray-400 uppercase">
                    <div className="w-10 text-center">Status</div>
                    <div>Post Details</div>
                    <div>Format</div>
                    <div>Date & Time</div>
                    <div className="w-24 text-center">Action</div>
                </div>

                {posts.length === 0 ? (
                    <div className="p-12 text-center text-gray-500">
                        <Calendar className="w-12 h-12 mx-auto mb-4 opacity-20" />
                        <p>No approved posts found.</p>
                        <button
                            onClick={() => router.push(`/dashboard/${clientId}`)}
                            className="mt-4 text-indigo-400 hover:text-indigo-300"
                        >
                            Go to Calendar to create posts
                        </button>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-800">
                        {posts.map(post => (
                            <div key={post.id} className="grid grid-cols-[auto_1fr_auto_auto_auto] gap-4 p-4 items-center hover:bg-slate-800/50 transition-colors">
                                <div className="w-10 flex justify-center">
                                    <button
                                        onClick={() => toggleScheduled(post)}
                                        className={`transition-colors ${post.status === 'scheduled' ? 'text-green-500' : 'text-gray-600 hover:text-gray-400'}`}
                                    >
                                        {post.status === 'scheduled' ? (
                                            <CheckSquare className="w-6 h-6" />
                                        ) : (
                                            <Square className="w-6 h-6" />
                                        )}
                                    </button>
                                </div>
                                <div>
                                    <h3 className={`font-medium text-white ${post.status === 'scheduled' ? 'line-through text-gray-500' : ''}`}>
                                        {post.title}
                                    </h3>
                                    <p className="text-sm text-gray-400 line-clamp-1">{post.brief}</p>
                                </div>
                                <div>
                                    <span className="text-xs font-bold px-2 py-1 rounded-full border border-gray-700 bg-slate-800 text-gray-300 uppercase">
                                        {post.format}
                                    </span>
                                </div>
                                <div className="text-sm text-gray-300">
                                    <div className="flex items-center gap-2">
                                        <Calendar className="w-3 h-3 text-gray-500" />
                                        {post.scheduled_date}
                                    </div>
                                    {post.scheduled_time && (
                                        <div className="flex items-center gap-2 mt-1">
                                            <Clock className="w-3 h-3 text-gray-500" />
                                            {post.scheduled_time}
                                        </div>
                                    )}
                                </div>
                                <div className="w-24 flex justify-center">
                                    <button
                                        onClick={() => router.push(`/dashboard/${clientId}/scripts/${post.id}`)}
                                        className="p-2 hover:bg-slate-700 rounded-lg text-gray-400 hover:text-white transition-colors"
                                        title="View Script"
                                    >
                                        <ArrowRight className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

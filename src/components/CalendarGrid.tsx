'use client'

import { useState, useEffect } from 'react'
import { ContentCalendarItem } from '@/types'
import { Calendar, Sparkles, Eye, Zap, ChevronLeft, ChevronRight, ArrowLeft, Check, X, RefreshCw, MessageSquare, Loader2, Upload, Share2, CheckSquare, Square, Image as ImageIcon, Edit2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const LOADING_MESSAGES = [
    "🎨 Crafting your content masterpiece...",
    "🧠 AI is thinking deeply about your audience...",
    "✨ Sprinkling some viral magic...",
    "🚀 Launching content rockets...",
    "💡 Generating brilliant ideas...",
    "🎯 Targeting your perfect audience...",
    "📝 Writing engaging hooks...",
    "🔥 Creating scroll-stopping content...",
    "⚡ Powering up engagement engines...",
    "🎪 Making your content unmissable..."
]

// Helper to get posting dates (Mon, Wed, Fri) for the current month
function getPostingDates() {
    const today = new Date()
    const year = today.getFullYear()
    const month = today.getMonth()

    const dates = []
    const daysInMonth = new Date(year, month + 1, 0).getDate()

    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day)
        const dayOfWeek = date.getDay()
        // 1 = Monday, 3 = Wednesday, 5 = Friday
        if (dayOfWeek === 1 || dayOfWeek === 3 || dayOfWeek === 5) {
            dates.push(date)
        }
    }

    return dates.slice(0, 12) // Only take first 12 posting days
}

import EmailPreviewModal from './EmailPreviewModal'

export default function CalendarGrid({ initialItems, clientId }: { initialItems: ContentCalendarItem[], clientId: string }) {
    const router = useRouter()
    const [items, setItems] = useState<ContentCalendarItem[]>(initialItems || [])
    const [selectedItem, setSelectedItem] = useState<ContentCalendarItem | null>(null)
    const [loading, setLoading] = useState(false)
    const [loadingMessageIndex, setLoadingMessageIndex] = useState(0)
    const [currentMonth, setCurrentMonth] = useState(new Date())

    // Revision State
    const [isRevising, setIsRevising] = useState(false)
    const [revisionFeedback, setRevisionFeedback] = useState('')
    const [revisingId, setRevisingId] = useState<string | null>(null)

    // Manual Creation State
    const [isCreating, setIsCreating] = useState(false)
    const [selectedDate, setSelectedDate] = useState<Date | null>(null)
    const [useAI, setUseAI] = useState(false)
    const [newPost, setNewPost] = useState({
        title: '',
        brief: '',
        format: 'text',
        pillar: '',
        media_type: 'image' as 'image' | 'video' | 'carousel' | 'pdf',
        media_url: '',
        scheduled_time: '09:00'
    })

    // Selection Mode State
    const [isSelectionMode, setIsSelectionMode] = useState<boolean>(false)
    const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
    const [previewUrl, setPreviewUrl] = useState<string | null>(null)
    const [showEmailPreview, setShowEmailPreview] = useState(false)

    const supabase = createClient()

    // Helper to check if date is in the past (before today)
    const isPastDate = (date: Date) => {
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const checkDate = new Date(date)
        checkDate.setHours(0, 0, 0, 0)
        return checkDate < today
    }

    const isToday = (date: Date) => {
        const today = new Date()
        return date.getDate() === today.getDate() &&
            date.getMonth() === today.getMonth() &&
            date.getFullYear() === today.getFullYear()
    }

    // Rotate loading messages every 3 seconds
    useEffect(() => {
        if (!loading) return
        const interval = setInterval(() => {
            setLoadingMessageIndex(prev => (prev + 1) % LOADING_MESSAGES.length)
        }, 3000)
        return () => clearInterval(interval)
    }, [loading])

    // Realtime subscription for Calendar Items
    useEffect(() => {
        const channel = supabase
            .channel('calendar_updates')
            .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'content_calendar',
                filter: `client_id=eq.${clientId}`
            }, (payload) => {
                const updatedItem = payload.new as ContentCalendarItem
                setItems(prevItems => prevItems.map(item =>
                    item.id === updatedItem.id ? updatedItem : item
                ))
            })
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [clientId, supabase])

    const generateCalendar = async () => {
        setLoading(true)
        setLoadingMessageIndex(0)
        try {
            const res = await fetch('/api/generate-calendar', {
                method: 'POST',
                body: JSON.stringify({ client_id: clientId }),
                headers: { 'Content-Type': 'application/json' }
            })
            const data = await res.json()
            if (data.success) {
                setItems(data.items)
            } else {
                alert(data.error || 'Failed to generate calendar')
            }
        } catch (error) {
            console.error(error)
            alert('Failed to generate calendar')
        } finally {
            setLoading(false)
        }
    }

    const updateStatus = async (id: string, status: 'approved' | 'rejected' | 'pending') => {
        try {
            const updates: Partial<ContentCalendarItem> = { status }

            // If approving a brief, automatically move to content stage
            if (status === 'approved') {
                const currentItem = items.find(i => i.id === id)
                if (currentItem && currentItem.workflow_stage === 'brief') {
                    updates.workflow_stage = 'content'
                }
            }

            const { error } = await supabase
                .from('content_calendar')
                .update(updates)
                .eq('id', id)

            if (error) throw error

            setItems(items.map(item => item.id === id ? { ...item, ...updates } : item))

            if (selectedItem?.id === id) {
                // Update selected item in modal if open
                const updatedItem = items.find(i => i.id === id)
                if (updatedItem) updatedItem.status = status
            }
        } catch (error) {
            console.error('Error updating status:', error)
            alert('Failed to update status')
        }
    }

    const handleRevision = async () => {
        if (!revisingId || !revisionFeedback.trim()) return

        setLoading(true)
        try {
            const res = await fetch('/api/revise-calendar', {
                method: 'POST',
                body: JSON.stringify({ calendar_id: revisingId, feedback: revisionFeedback }),
                headers: { 'Content-Type': 'application/json' }
            })
            const data = await res.json()

            if (data.success) {
                setItems(items.map(item => item.id === revisingId ? data.item : item))
                setIsRevising(false)
                setRevisionFeedback('')
                setRevisingId(null)
                closeModal() // Close modal to refresh view
            } else {
                alert(data.error || 'Failed to revise item')
            }
        } catch (error) {
            console.error(error)
            alert('Failed to revise item')
        } finally {
            setLoading(false)
        }
    }

    const toggleSelection = (id: string) => {
        const newSelected = new Set(selectedItems)
        if (newSelected.has(id)) {
            newSelected.delete(id)
        } else {
            newSelected.add(id)
        }
        setSelectedItems(newSelected)
    }

    const handleShare = async () => {
        if (selectedItems.size === 0) return

        // Determine action based on stage of selected items (assuming all selected are same stage for MVP)
        // In reality we might need to handle mixed stages, but let's simplify.
        const firstItem = items.find(i => selectedItems.has(i.id))
        if (!firstItem) return

        const stage = firstItem.workflow_stage || 'brief'
        const actionLabel = stage === 'brief' ? 'Briefs' : 'Content'

        const confirm = window.confirm(`Are you sure you want to share ${selectedItems.size} ${actionLabel} with the client for approval?`)
        if (!confirm) return

        setLoading(true)
        try {
            const updates = Array.from(selectedItems).map(id =>
                supabase.from('content_calendar').update({
                    feedback_status: 'sent',
                    // If we are sending content, ensure stage is set to content
                    // If sending brief, it's already brief
                }).eq('id', id)
            )

            await Promise.all(updates)

            setItems(items.map(item =>
                selectedItems.has(item.id) ? { ...item, feedback_status: 'sent' } : item
            ))

            setIsSelectionMode(false)
            setSelectedItems(new Set())
            alert(`${actionLabel} shared successfully! Client has been notified.`)
        } catch (error) {
            console.error('Error sharing posts:', error)
            alert('Failed to share posts')
        } finally {
            setLoading(false)
        }
    }

    // Editing State
    const [isEditingPost, setIsEditingPost] = useState(false)
    const [editPostData, setEditPostData] = useState<ContentCalendarItem | null>(null)

    const handleUpdatePost = async () => {
        if (!editPostData) return

        setLoading(true)
        try {
            const { error } = await supabase
                .from('content_calendar')
                .update({
                    title: editPostData.title,
                    brief: editPostData.brief,
                    format: editPostData.format,
                    pillar: editPostData.pillar,
                    scheduled_date: editPostData.scheduled_date,
                    scheduled_time: editPostData.scheduled_time,
                    media_type: editPostData.media_type,
                    media_url: editPostData.media_url
                })
                .eq('id', editPostData.id)

            if (error) throw error

            setItems(items.map(item => item.id === editPostData.id ? { ...item, ...editPostData } : item))
            setIsEditingPost(false)
            setEditPostData(null)
            // Keep the modal open but exit edit mode
        } catch (error) {
            console.error('Update Post Error:', error)
            alert('Failed to update post: ' + ((error as Error).message || 'Unknown error'))
        } finally {
            setLoading(false)
        }
    }

    const handleCreatePost = async () => {
        if (!newPost.title && !useAI) {
            alert('Please fill in Title')
            return
        }
        if (!newPost.brief && useAI) {
            alert('Please enter a topic for the AI')
            return
        }

        setLoading(true)
        try {
            let postData = { ...newPost }

            if (useAI) {
                // Call AI API to generate brief
                const res = await fetch('/api/ai-assist', {
                    method: 'POST',
                    body: JSON.stringify({
                        prompt: newPost.brief, // User enters topic in brief field
                        type: 'brief',
                        context: { clientId }
                    }),
                    headers: { 'Content-Type': 'application/json' }
                })
                const data = await res.json()

                if (!data.success) throw new Error(data.error || 'AI generation failed')

                postData = {
                    ...postData,
                    title: data.data.title,
                    brief: data.data.brief,
                    format: data.data.format.toLowerCase(),
                    pillar: data.data.pillar
                }
            }

            const { data, error } = await supabase
                .from('content_calendar')
                .insert({
                    client_id: clientId,
                    title: postData.title,
                    brief: postData.brief,
                    format: postData.format,
                    pillar: postData.pillar || 'General',
                    status: 'pending',
                    scheduled_date: selectedDate ? selectedDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                    scheduled_time: postData.scheduled_time,
                    media_type: postData.media_type,
                    media_url: postData.media_url,
                    feedback_status: 'draft',
                    workflow_stage: 'brief' // Start as brief
                })
                .select()
                .single()

            if (error) throw error

            setItems([data, ...items])
            setIsCreating(false)
            setNewPost({
                title: '',
                brief: '',
                format: 'text',
                pillar: '',
                media_type: 'image',
                media_url: '',
                scheduled_time: '09:00'
            })
        } catch (error) {
            console.error('Create Post Error:', JSON.stringify(error, null, 2))
            alert('Failed to create post: ' + ((error as any).message || (error as any).error_description || 'Unknown error'))
        } finally {
            setLoading(false)
        }
    }

    const formatBadgeColor = (format: string) => {
        switch (format) {
            case 'carousel': return 'bg-purple-500/20 text-purple-300 border-purple-500/30'
            case 'story': return 'bg-pink-500/20 text-pink-300 border-pink-500/30'
            default: return 'bg-blue-500/20 text-blue-300 border-blue-500/30'
        }
    }

    const statusBadgeColor = (status: string) => {
        switch (status) {
            case 'approved': return 'bg-green-500/20 text-green-300 border-green-500/30'
            case 'rejected': return 'bg-red-500/20 text-red-300 border-red-500/30'
            default: return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
        }
    }

    const getStageBadge = (item: ContentCalendarItem) => {
        if (item.workflow_stage === 'content') {
            return <span className="text-[10px] bg-purple-500/20 text-purple-300 px-1 rounded border border-purple-500/30">Content</span>
        }
        return <span className="text-[10px] bg-blue-500/20 text-blue-300 px-1 rounded border border-blue-500/30">Brief</span>
    }

    const viewContentBrief = (item: ContentCalendarItem) => {
        setSelectedItem(item)
        setIsRevising(false)
        setRevisionFeedback('')
    }

    const closeModal = () => {
        setSelectedItem(null)
        setIsRevising(false)
        setRevisingId(null)
        setIsCreating(false)
    }

    // const selectedItem = items.find(item => item.id === selectedCard) // REMOVED

    const monthNames = ["January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"]

    // Get all days in month for grid
    const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate()
    const days = Array.from({ length: daysInMonth }, (_, i) => new Date(currentMonth.getFullYear(), currentMonth.getMonth(), i + 1))

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.push('/dashboard')}
                        className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-3xl font-bold flex items-center gap-3">
                            <Calendar className="w-8 h-8 text-indigo-400" />
                            Content Calendar
                        </h1>
                        <p className="text-gray-400 mt-1">Manage your posting schedule</p>
                    </div>
                </div>

                <div className="flex gap-3">
                    {isSelectionMode ? (
                        <>
                            <span className="flex items-center text-sm text-gray-400 mr-2">
                                {selectedItems.size} selected
                            </span>
                            <button
                                onClick={() => {
                                    setIsSelectionMode(false)
                                    setSelectedItems(new Set())
                                }}
                                className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleShare}
                                disabled={selectedItems.size === 0 || loading}
                                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
                            >
                                <Share2 className="w-4 h-4" />
                                Share with Client
                            </button>
                        </>
                    ) : (
                        <>
                            <button
                                onClick={() => setIsSelectionMode(true)}
                                className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-lg font-medium transition-colors border border-gray-700"
                            >
                                <CheckSquare className="w-4 h-4" />
                                Select
                            </button>
                            <button
                                onClick={() => {
                                    setIsCreating(true)
                                    setUseAI(false)
                                }}
                                className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-lg font-medium transition-colors border border-gray-700"
                            >
                                + Add Post
                            </button>
                            <button
                                onClick={generateCalendar}
                                disabled={loading}
                                className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 px-6 py-2 rounded-lg font-medium disabled:opacity-50 transition-all hover:scale-105 shadow-lg"
                            >
                                <Sparkles className="w-5 h-5" />
                                {loading ? 'Generating...' : 'Auto-Generate Month'}
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Loading State */}
            {loading && !isCreating && !isRevising && (
                <div className="p-16 bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl border border-indigo-500/30 text-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 animate-pulse"></div>
                    <div className="relative z-10">
                        <div className="relative mx-auto mb-8 w-24 h-24">
                            <div className="absolute inset-0 border-4 border-indigo-500/30 rounded-full"></div>
                            <div className="absolute inset-0 border-4 border-transparent border-t-indigo-500 rounded-full animate-spin"></div>
                            <Zap className="absolute inset-0 m-auto w-10 h-10 text-indigo-400 animate-pulse" />
                        </div>
                        <p className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400 mb-3 transition-all duration-500 animate-pulse">
                            {LOADING_MESSAGES[loadingMessageIndex]}
                        </p>
                    </div>
                </div>
            )}

            {/* Calendar Grid View */}
            {!loading && (
                <>
                    {/* Month Header */}
                    <div className="flex items-center justify-between p-4 glass rounded-xl">
                        <button className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-300 hover:text-white">
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <h2 className="text-xl font-bold text-white">{monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}</h2>
                        <button className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-300 hover:text-white">
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Full Month Grid */}
                    <div className="grid grid-cols-7 gap-4">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                            <div key={day} className="text-center text-sm font-bold text-gray-500 py-2 uppercase tracking-wider">{day}</div>
                        ))}

                        {/* Empty cells for start of month */}
                        {Array.from({ length: new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay() }).map((_, i) => (
                            <div key={`empty-${i}`} className="h-32 bg-white/5 rounded-lg border border-white/5"></div>
                        ))}

                        {days.map((date, index) => {
                            // Find item for this specific date
                            const dateString = date.toISOString().split('T')[0]
                            const item = items.find(i => i.scheduled_date === dateString)

                            return (
                                <div
                                    key={index}
                                    className={`relative h-48 glass rounded-xl transition-all duration-300 p-3 flex flex-col group/day ${isToday(date) ? 'border-primary ring-1 ring-primary shadow-lg shadow-primary/20' : 'hover:border-white/20'
                                        } ${isPastDate(date) ? 'opacity-40 grayscale' : ''}`}
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <span className={`text-sm font-bold ${isToday(date) ? 'text-secondary' : 'text-gray-400'}`}>
                                            {date.getDate()} {isToday(date) && '(Today)'}
                                        </span>
                                        {!isPastDate(date) && (
                                            <button
                                                onClick={() => {
                                                    setSelectedDate(date)
                                                    setIsCreating(true)
                                                    setUseAI(false)
                                                }}
                                                className="text-gray-500 hover:text-white opacity-0 group-hover/day:opacity-100 transition-opacity"
                                            >
                                                +
                                            </button>
                                        )}
                                    </div>

                                    {item ? (
                                        <div
                                            id={`card-${item.id}`}
                                            onClick={() => {
                                                if (isSelectionMode) {
                                                    toggleSelection(item.id)
                                                } else {
                                                    viewContentBrief(item)
                                                }
                                            }}
                                            className={`flex-1 bg-white/5 rounded-lg p-3 cursor-pointer hover:bg-white/10 transition-all border border-white/5 hover:border-white/10 overflow-hidden relative group ${isSelectionMode && selectedItems.has(item.id) ? 'ring-2 ring-primary bg-primary/10' : ''
                                                }`}
                                        >
                                            {isSelectionMode && (
                                                <div className="absolute top-2 right-2 z-10">
                                                    {selectedItems.has(item.id) ? (
                                                        <CheckSquare className="w-5 h-5 text-primary bg-black rounded" />
                                                    ) : (
                                                        <Square className="w-5 h-5 text-gray-500 bg-black rounded" />
                                                    )}
                                                </div>
                                            )}

                                            <div className="flex gap-1 mb-2">
                                                <span className={`w-2 h-2 rounded-full mt-1 ${item.feedback_status === 'approved' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' :
                                                    item.feedback_status === 'changes_requested' ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' :
                                                        item.feedback_status === 'sent' ? 'bg-yellow-500' : 'bg-gray-500'
                                                    }`}></span>
                                                {getStageBadge(item)}
                                                <span className="text-[10px] text-gray-400 uppercase tracking-wider border border-white/10 px-1.5 rounded">{item.format}</span>
                                            </div>
                                            <p className="text-xs font-medium text-gray-200 line-clamp-3 group-hover:text-white transition-colors">{item.title}</p>
                                            {item.media_url && (
                                                <div className="mt-2 flex items-center gap-1 text-[10px] text-gray-500">
                                                    <ImageIcon className="w-3 h-3" />
                                                    Media attached
                                                </div>
                                            )}

                                            {/* Feedback Display */}
                                            {item.feedback_status === 'changes_requested' && item.feedback_notes && (
                                                <div className="mt-2 p-2 bg-red-500/10 border border-red-500/20 rounded text-xs text-red-200 backdrop-blur-sm">
                                                    <div className="flex items-center gap-1 mb-1 font-bold text-red-400">
                                                        <MessageSquare className="w-3 h-3" />
                                                        Feedback
                                                    </div>
                                                    <p className="line-clamp-2">{item.feedback_notes}</p>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div
                                            onClick={() => {
                                                if (!isPastDate(date)) {
                                                    setSelectedDate(date)
                                                    setIsCreating(true)
                                                    setUseAI(false)
                                                }
                                            }}
                                            className={`flex-1 flex items-center justify-center text-gray-600 text-xs rounded-lg border border-dashed border-white/5 transition-all ${!isPastDate(date) ? 'hover:bg-white/5 hover:border-white/20 hover:text-gray-400 cursor-pointer' : 'cursor-not-allowed'
                                                }`}
                                        >
                                            {!isPastDate(date) ? '+ Add Post' : ''}
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                </>
            )}

            {/* Create Post Modal */}
            {isCreating && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={closeModal}>
                    <div className="bg-slate-900 rounded-2xl border border-indigo-500/30 max-w-lg w-full p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
                        <h3 className="text-xl font-bold text-white mb-4">Create New Post</h3>

                        <div className="flex justify-end mb-4">
                            <button
                                onClick={() => setUseAI(!useAI)}
                                className={`text-xs px-3 py-1 rounded-full border ${useAI ? 'bg-purple-500/20 border-purple-500 text-purple-300' : 'border-gray-700 text-gray-400'}`}
                            >
                                {useAI ? '✨ AI Enabled' : 'Manual Mode'}
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">Date</label>
                                    <input
                                        type="date"
                                        value={selectedDate ? selectedDate.toISOString().split('T')[0] : ''}
                                        onChange={(e) => {
                                            const newDate = new Date(e.target.value)
                                            // Maintain current time if needed, or just set date
                                            if (!isNaN(newDate.getTime())) {
                                                setSelectedDate(newDate)
                                            }
                                        }}
                                        min={new Date().toISOString().split('T')[0]}
                                        className="w-full bg-slate-950 border border-gray-800 rounded-lg p-3 text-white focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">Time</label>
                                    <input
                                        type="time"
                                        value={newPost.scheduled_time}
                                        onChange={(e) => setNewPost({ ...newPost, scheduled_time: e.target.value })}
                                        className="w-full bg-slate-950 border border-gray-800 rounded-lg p-3 text-white focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Title</label>
                                <input
                                    type="text"
                                    value={newPost.title}
                                    onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                                    className="w-full bg-slate-950 border border-gray-800 rounded-lg p-3 text-white focus:ring-2 focus:ring-indigo-500"
                                    placeholder="Post Title"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Format</label>
                                <select
                                    value={newPost.format}
                                    onChange={(e) => setNewPost({ ...newPost, format: e.target.value })}
                                    className="w-full bg-slate-950 border border-gray-800 rounded-lg p-3 text-white focus:ring-2 focus:ring-indigo-500"
                                >
                                    <option value="text">Text Only</option>
                                    <option value="carousel">Carousel</option>
                                    <option value="story">Story</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Media Upload (Optional)</label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={newPost.media_url}
                                        onChange={(e) => setNewPost({ ...newPost, media_url: e.target.value })}
                                        className="flex-1 bg-slate-950 border border-gray-800 rounded-lg p-3 text-white focus:ring-2 focus:ring-indigo-500"
                                        placeholder="https://..."
                                    />
                                    <button className="px-4 py-2 bg-slate-800 border border-gray-800 rounded-lg hover:bg-slate-700 transition-colors">
                                        <Upload className="w-5 h-5 text-gray-400" />
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Brief / Content</label>
                                <textarea
                                    value={newPost.brief}
                                    onChange={(e) => setNewPost({ ...newPost, brief: e.target.value })}
                                    className="w-full h-32 bg-slate-950 border border-gray-800 rounded-lg p-3 text-white focus:ring-2 focus:ring-indigo-500"
                                    placeholder={useAI ? "Describe what you want the post to be about..." : "Write your post brief here..."}
                                />
                            </div>

                            <button
                                onClick={handleCreatePost}
                                disabled={loading}
                                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (useAI ? <Sparkles className="w-5 h-5" /> : <Check className="w-5 h-5" />)}
                                {useAI ? 'Generate & Save' : 'Create Post'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Content Brief Modal (Existing) */}
            {selectedItem && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={closeModal}>
                    <div className="bg-slate-900 rounded-2xl border border-indigo-500/30 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
                        <div className="sticky top-0 bg-gradient-to-r from-indigo-900/90 to-purple-900/90 backdrop-blur-sm p-6 border-b border-indigo-500/30 z-10">
                            <div className="flex justify-between items-start">
                                <div>
                                    <div className="flex gap-2 mb-3">
                                        <span className={`text-xs font-bold px-3 py-1 rounded-full border ${formatBadgeColor(selectedItem.format)}`}>
                                            {selectedItem.format}
                                        </span>
                                        <span className={`text-xs font-bold px-3 py-1 rounded-full border ${statusBadgeColor(selectedItem.status)}`}>
                                            {selectedItem.status}
                                        </span>
                                    </div>
                                    <h2 className="text-2xl font-bold text-white">{selectedItem.title}</h2>
                                </div>
                                <button
                                    onClick={closeModal}
                                    className="text-gray-400 hover:text-white transition-colors text-2xl"
                                >
                                    ×
                                </button>
                            </div>
                        </div>

                        <div className="p-6 space-y-6">
                            {isRevising ? (
                                <div className="space-y-4 bg-slate-950 p-6 rounded-xl border border-indigo-500/30">
                                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                        <MessageSquare className="w-5 h-5 text-indigo-400" />
                                        Request Changes
                                    </h3>
                                    <p className="text-sm text-gray-400">Tell the AI what to improve (e.g., &quot;Make it more professional&quot;, &quot;Focus on leadership&quot;, &quot;Change format to story&quot;)</p>
                                    <textarea
                                        value={revisionFeedback}
                                        onChange={(e) => setRevisionFeedback(e.target.value)}
                                        className="w-full h-32 bg-slate-900 border border-gray-700 rounded-lg p-4 text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                        placeholder="Enter your feedback here..."
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
                                            Regenerate Idea
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    {/* Edit Mode */}
                                    {isEditingPost && editPostData ? (
                                        <div className="space-y-4">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-400 mb-1">Date</label>
                                                    <input
                                                        type="date"
                                                        value={editPostData.scheduled_date}
                                                        onChange={(e) => setEditPostData(prev => prev ? { ...prev, scheduled_date: e.target.value } : null)}
                                                        className="w-full bg-slate-950 border border-gray-800 rounded-lg p-3 text-white"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-400 mb-1">Time</label>
                                                    <input
                                                        type="time"
                                                        value={editPostData.scheduled_time || '09:00'}
                                                        onChange={(e) => setEditPostData(prev => prev ? { ...prev, scheduled_time: e.target.value } : null)}
                                                        className="w-full bg-slate-950 border border-gray-800 rounded-lg p-3 text-white"
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-400 mb-1">Title</label>
                                                <input
                                                    type="text"
                                                    value={editPostData.title}
                                                    onChange={(e) => setEditPostData(prev => prev ? { ...prev, title: e.target.value } : null)}
                                                    className="w-full bg-slate-950 border border-gray-800 rounded-lg p-3 text-white"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-400 mb-1">Brief</label>
                                                <textarea
                                                    value={editPostData.brief}
                                                    onChange={(e) => setEditPostData(prev => prev ? { ...prev, brief: e.target.value } : null)}
                                                    className="w-full h-32 bg-slate-950 border border-gray-800 rounded-lg p-3 text-white"
                                                />
                                            </div>
                                            <div className="flex gap-3">
                                                <button
                                                    onClick={() => setIsEditingPost(false)}
                                                    className="flex-1 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg font-medium transition-colors"
                                                >
                                                    Cancel
                                                </button>
                                                <button
                                                    onClick={handleUpdatePost}
                                                    className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg font-medium transition-colors"
                                                >
                                                    Save Changes
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="flex justify-end mb-4">
                                                <button
                                                    onClick={() => {
                                                        setEditPostData(selectedItem)
                                                        setIsEditingPost(true)
                                                    }}
                                                    className="text-sm text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                    Edit Post
                                                </button>
                                            </div>
                                            <div>
                                                <h3 className="text-sm font-bold text-indigo-400 uppercase mb-2">Content Brief</h3>
                                                <p className="text-gray-300 leading-relaxed">{selectedItem.brief}</p>
                                            </div>

                                            <div className="grid md:grid-cols-2 gap-4">
                                                <div>
                                                    <h3 className="text-sm font-bold text-cyan-400 uppercase mb-2">Content Pillar</h3>
                                                    <p className="text-gray-300">{selectedItem.pillar}</p>
                                                </div>
                                                <div>
                                                    <h3 className="text-sm font-bold text-purple-400 uppercase mb-2">Target Audience</h3>
                                                    <p className="text-gray-300">{selectedItem.audience_target}</p>
                                                </div>
                                            </div>

                                            {/* Feedback History */}
                                            {selectedItem.feedback_entries && selectedItem.feedback_entries.length > 0 && (
                                                <div className="mt-6 pt-6 border-t border-gray-800">
                                                    <h3 className="text-sm font-bold text-yellow-400 uppercase mb-4 flex items-center gap-2">
                                                        <MessageSquare className="w-4 h-4" />
                                                        Client Feedback History
                                                    </h3>
                                                    <div className="space-y-4">
                                                        {selectedItem.feedback_entries.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).map((entry) => (
                                                            <div key={entry.id} className="bg-slate-950/50 p-4 rounded-lg border border-yellow-500/20">
                                                                <p className="text-gray-300 text-sm mb-2">&quot;{entry.content}&quot;</p>
                                                                <p className="text-xs text-gray-500">
                                                                    {new Date(entry.created_at).toLocaleString()}
                                                                </p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            <div>
                                                <h3 className="text-sm font-bold text-pink-400 uppercase mb-2">Psychological Trigger</h3>
                                                <p className="text-gray-300">{selectedItem.psychological_trigger}</p>
                                            </div>

                                            <div>
                                                <h3 className="text-sm font-bold text-green-400 uppercase mb-2">Why This Will Work</h3>
                                                <p className="text-gray-300 leading-relaxed">{selectedItem.why_it_works}</p>
                                            </div>

                                            {/* Approval Actions */}
                                            <div className="flex gap-3 pt-4 border-t border-gray-800">
                                                {selectedItem.status === 'pending' && (
                                                    <>
                                                        <button
                                                            onClick={() => {
                                                                setIsRevising(true)
                                                                setRevisingId(selectedItem.id)
                                                            }}
                                                            className="flex-1 px-4 py-3 bg-slate-800 hover:bg-slate-700 border border-gray-700 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                                                        >
                                                            <RefreshCw className="w-4 h-4" />
                                                            Request Changes
                                                        </button>
                                                        <button
                                                            onClick={async () => {
                                                                setLoading(true)
                                                                setPreviewUrl(null)
                                                                try {
                                                                    const res = await fetch('/api/send-approval-email', {
                                                                        method: 'POST',
                                                                        body: JSON.stringify({
                                                                            postId: selectedItem.id,
                                                                            clientId
                                                                        }),
                                                                        headers: { 'Content-Type': 'application/json' }
                                                                    })
                                                                    const data = await res.json()

                                                                    if (!data.success) throw new Error(data.error || 'Failed to send email')

                                                                    setItems(items.map(item => item.id === selectedItem.id ? { ...item, feedback_status: 'sent' } : item))

                                                                    if (data.previewUrl) {
                                                                        setPreviewUrl(data.previewUrl)
                                                                        setShowEmailPreview(true)
                                                                    } else {
                                                                        alert('Email sent successfully!')
                                                                    }
                                                                } catch (error) {
                                                                    console.error('Error sending for approval:', error)
                                                                    alert('Failed to send for approval: ' + (error as Error).message)
                                                                } finally {
                                                                    setLoading(false)
                                                                }
                                                            }}
                                                            className="flex-1 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                                                        >
                                                            <Share2 className="w-4 h-4" />
                                                            Send for Approval
                                                        </button>
                                                    </>
                                                )}

                                                {/* Preview Link Fallback (Optional, but modal is better) */}
                                                {previewUrl && !showEmailPreview && (
                                                    <div className="w-full mt-3 p-3 bg-indigo-500/10 border border-indigo-500/30 rounded-lg flex justify-between items-center">
                                                        <span className="text-sm text-indigo-300">Email sent!</span>
                                                        <button
                                                            onClick={() => setShowEmailPreview(true)}
                                                            className="text-sm font-bold text-indigo-400 hover:text-indigo-300 underline"
                                                        >
                                                            Open Preview
                                                        </button>
                                                    </div>
                                                )}
                                                {selectedItem.status === 'approved' && (
                                                    <div className="w-full grid grid-cols-2 gap-3">
                                                        <button
                                                            onClick={() => {
                                                                setEditPostData(selectedItem)
                                                                setIsEditingPost(true)
                                                            }}
                                                            className="px-4 py-3 bg-slate-800 hover:bg-slate-700 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                                                        >
                                                            <Edit2 className="w-4 h-4" />
                                                            Write Manually
                                                        </button>
                                                        <button
                                                            onClick={() => router.push(`/dashboard/${clientId}/scripts/${selectedItem.id}`)}
                                                            className="px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 rounded-lg font-medium transition-all hover:scale-105 flex items-center justify-center gap-2"
                                                        >
                                                            <Sparkles className="w-4 h-4" />
                                                            Generate with AI
                                                        </button>
                                                    </div>
                                                )}
                                                {selectedItem.status === 'rejected' && (
                                                    <button
                                                        onClick={() => updateStatus(selectedItem.id, 'pending')}
                                                        className="w-full px-4 py-3 bg-slate-800 hover:bg-slate-700 rounded-lg font-medium transition-colors"
                                                    >
                                                        Restore to Pending
                                                    </button>
                                                )}
                                            </div>
                                        </>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
            {/* Email Preview Modal */}
            <EmailPreviewModal
                isOpen={showEmailPreview}
                onClose={() => setShowEmailPreview(false)}
                previewUrl={previewUrl}
            />
        </div>
    )
}

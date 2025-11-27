'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Bell, CheckCircle, MessageSquare, Info } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Notification {
    id: string
    type: 'feedback' | 'approval' | 'deadline' | 'system'
    message: string
    is_read: boolean
    created_at: string
    client_id?: string
    calendar_id?: string
}

export default function Notifications() {
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [unreadCount, setUnreadCount] = useState(0)
    const [isOpen, setIsOpen] = useState(false)
    const supabase = createClient()
    const router = useRouter()

    useEffect(() => {
        fetchNotifications()

        // Subscribe to new notifications
        const channel = supabase
            .channel('notifications')
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'notifications'
            }, (payload) => {
                const newNotif = payload.new as Notification
                setNotifications(prev => [newNotif, ...prev])
                setUnreadCount(prev => prev + 1)
            })
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [])

    const fetchNotifications = async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(10)

        if (data) {
            setNotifications(data)
            setUnreadCount(data.filter(n => !n.is_read).length)
        }
    }

    const markAsRead = async () => {
        if (unreadCount === 0) return

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('user_id', user.id)
            .eq('is_read', false)

        setNotifications(notifications.map(n => ({ ...n, is_read: true })))
        setUnreadCount(0)
    }

    const toggleOpen = () => {
        if (!isOpen) {
            markAsRead()
        }
        setIsOpen(!isOpen)
    }

    const handleNotificationClick = async (notif: Notification) => {
        setIsOpen(false)

        // Mark as read immediately
        if (!notif.is_read) {
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                await supabase
                    .from('notifications')
                    .update({ is_read: true })
                    .eq('id', notif.id)

                setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, is_read: true } : n))
                setUnreadCount(prev => Math.max(0, prev - 1))
            }
        }

        // Navigate if linked to calendar
        if (notif.calendar_id && notif.client_id) {
            router.push(`/dashboard/${notif.client_id}/calendar?highlight=${notif.calendar_id}`)
        }
    }

    const getIcon = (type: string) => {
        switch (type) {
            case 'approval': return <CheckCircle className="w-4 h-4 text-green-400" />
            case 'feedback': return <MessageSquare className="w-4 h-4 text-yellow-400" />
            default: return <Info className="w-4 h-4 text-blue-400" />
        }
    }

    return (
        <div className="relative">
            <button
                onClick={toggleOpen}
                className="p-2 rounded-full glass hover:bg-white/10 transition-colors relative"
            >
                <Bell className="w-5 h-5 text-gray-300" />
                {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.5)]"></span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 glass rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 border border-white/10">
                    <div className="p-3 border-b border-white/10 bg-white/5">
                        <h3 className="text-sm font-bold text-white">Notifications</h3>
                    </div>
                    <div className="max-h-96 overflow-y-auto custom-scrollbar">
                        {notifications.length === 0 ? (
                            <div className="p-8 text-center text-gray-500 text-sm">
                                No notifications yet
                            </div>
                        ) : (
                            <div className="divide-y divide-white/5">
                                {notifications.map((notif) => (
                                    <div
                                        key={notif.id}
                                        onClick={() => handleNotificationClick(notif)}
                                        className={`p-4 hover:bg-white/5 transition-colors cursor-pointer ${!notif.is_read ? 'bg-primary/10' : ''}`}
                                    >
                                        <div className="flex gap-3">
                                            <div className="mt-1">
                                                {getIcon(notif.type)}
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-200 leading-snug">{notif.message}</p>
                                                <p className="text-xs text-gray-500 mt-1">
                                                    {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Backdrop to close */}
            {isOpen && (
                <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}></div>
            )}
        </div>
    )
}

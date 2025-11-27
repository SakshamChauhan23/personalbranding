'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Client } from '@/types'
import Link from 'next/link'
import Notifications from '@/components/Notifications'
import { Plus, Search, Bell, CheckCircle, Clock, AlertCircle, ChevronRight, Users, BarChart3, TrendingUp, Calendar } from 'lucide-react'

export default function Dashboard() {
    const [clients, setClients] = useState<Client[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const supabase = createClient()

    useEffect(() => {
        fetchClients()
    }, [])

    const fetchClients = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const { data, error } = await supabase
                .from('clients')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })

            if (error) throw error
            setClients(data || [])
        } catch (error) {
            console.error('Error fetching clients:', error)
        } finally {
            setLoading(false)
        }
    }

    // Filter clients based on search
    const filteredClients = clients.filter(client =>
        client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (client.company_name && client.company_name.toLowerCase().includes(searchQuery.toLowerCase()))
    )

    return (
        <div className="min-h-screen bg-slate-950 text-white p-8">
            <div className="space-y-8">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400 mb-2">
                            Clients Workspace
                        </h1>
                        <p className="text-gray-400">
                            Manage all your clients in one place
                        </p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                            <input
                                type="text"
                                placeholder="Search clients..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="bg-slate-900 border border-gray-800 rounded-lg pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent w-64"
                            />
                        </div>
                        <Notifications />
                        <Link
                            href="/dashboard/new-client"
                            className="bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors"
                        >
                            <Plus className="w-5 h-5" />
                            Add Client
                        </Link>
                    </div>
                </div>

                {/* Client Grid */}
                {loading ? (
                    <div className="text-center py-12 text-gray-400">Loading clients...</div>
                ) : filteredClients.length === 0 ? (
                    <div className="text-center py-12 text-gray-400">No clients found. Add a client to get started.</div>
                ) : (
                    <div className="grid md:grid-cols-3 gap-6">
                        {filteredClients.map((client) => (
                            <Link
                                key={client.id}
                                href={`/dashboard/${client.id}`}
                                className="bg-slate-900 border border-gray-800 rounded-xl p-6 hover:border-indigo-500/50 transition-all group relative overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <ChevronRight className="w-5 h-5 text-indigo-400" />
                                </div>

                                <div className="flex items-start justify-between mb-6">
                                    <div className="flex items-center gap-4">
                                        {client.logo_url ? (
                                            <img src={client.logo_url} alt={client.name} className="w-16 h-16 rounded-xl object-cover border border-gray-700" />
                                        ) : (
                                            <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center text-white font-bold text-2xl shadow-lg">
                                                {client.name.charAt(0)}
                                            </div>
                                        )}
                                        <div>
                                            <h3 className="font-bold text-xl text-white group-hover:text-indigo-400 transition-colors">{client.name}</h3>
                                            <p className="text-sm text-gray-400">{client.role || 'Leader'}</p>
                                            {client.company_name && (
                                                <p className="text-xs text-indigo-400 mt-1 font-medium">{client.company_name}</p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 py-4 border-t border-gray-800/50 border-b mb-4">
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase font-bold mb-1">Industry</p>
                                        <p className="text-sm text-gray-300 truncate">{client.industry || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase font-bold mb-1">Status</p>
                                        <div className="flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                                            <span className="text-sm text-green-400">Active</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between text-xs text-gray-500">
                                    <span>Joined {new Date(client.created_at).toLocaleDateString()}</span>
                                    <span className="group-hover:translate-x-1 transition-transform text-indigo-400 font-medium">View Dashboard →</span>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

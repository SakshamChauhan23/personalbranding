'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Users, Plus, Calendar, LogOut, Search, Trash2, Edit, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Client {
    id: string
    name: string | null
    linkedin_url: string | null
    industry: string | null
    role: string | null
    target_audience: string | null
    created_at: string
    client_profile_audits: any[]
}

export default function AdminPage() {
    const router = useRouter()
    const [user, setUser] = useState<any>(null)
    const [clients, setClients] = useState<Client[]>([])
    const [filteredClients, setFilteredClients] = useState<Client[]>([])
    const [searchQuery, setSearchQuery] = useState('')
    const [loading, setLoading] = useState(true)
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

    useEffect(() => {
        checkUser()
        fetchClients()
    }, [])

    useEffect(() => {
        // Filter clients based on search query
        if (searchQuery.trim() === '') {
            setFilteredClients(clients)
        } else {
            const query = searchQuery.toLowerCase()
            const filtered = clients.filter(client =>
                (client.name?.toLowerCase().includes(query)) ||
                (client.industry?.toLowerCase().includes(query)) ||
                (client.role?.toLowerCase().includes(query))
            )
            setFilteredClients(filtered)
        }
    }, [searchQuery, clients])

    const checkUser = async () => {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            router.push('/login')
        } else {
            setUser(user)
        }
    }

    const fetchClients = async () => {
        const supabase = createClient()
        const { data, error } = await supabase
            .from('clients')
            .select('*, client_profile_audits(*)')
            .order('created_at', { ascending: false })

        if (!error && data) {
            setClients(data)
            setFilteredClients(data)
        }
        setLoading(false)
    }

    const handleLogout = async () => {
        const supabase = createClient()
        await supabase.auth.signOut()
        router.push('/login')
    }

    const handleDelete = async (clientId: string) => {
        try {
            const response = await fetch(`/api/clients/delete?client_id=${clientId}`, {
                method: 'DELETE'
            })

            if (!response.ok) {
                throw new Error('Failed to delete client')
            }

            // Refresh the clients list
            setClients(clients.filter(c => c.id !== clientId))
            setDeleteConfirm(null)
        } catch (error) {
            console.error('Delete error:', error)
            alert('Failed to delete client')
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white flex items-center justify-center">
                <div className="text-xl">Loading...</div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header with Logout */}
                <header className="mb-8 flex justify-between items-center">
                    <div>
                        <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
                            Admin Dashboard
                        </h1>
                        <p className="text-gray-400 mt-2">Manage your clients and their content strategies</p>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg font-medium transition-colors"
                    >
                        <LogOut className="w-4 h-4" />
                        Logout
                    </button>
                </header>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="p-6 bg-slate-900 rounded-xl border border-gray-800">
                        <div className="flex items-center gap-3 mb-2">
                            <Users className="w-5 h-5 text-indigo-400" />
                            <h3 className="text-sm font-medium text-gray-400">Total Clients</h3>
                        </div>
                        <p className="text-3xl font-bold text-white">{clients.length}</p>
                    </div>
                    <div className="p-6 bg-slate-900 rounded-xl border border-gray-800">
                        <div className="flex items-center gap-3 mb-2">
                            <Calendar className="w-5 h-5 text-green-400" />
                            <h3 className="text-sm font-medium text-gray-400">Active Strategies</h3>
                        </div>
                        <p className="text-3xl font-bold text-white">
                            {clients.filter(c => c.client_profile_audits && c.client_profile_audits.length > 0).length}
                        </p>
                    </div>
                    <div className="p-6 bg-slate-900 rounded-xl border border-gray-800">
                        <div className="flex items-center gap-3 mb-2">
                            <Plus className="w-5 h-5 text-cyan-400" />
                            <h3 className="text-sm font-medium text-gray-400">Pending Onboarding</h3>
                        </div>
                        <p className="text-3xl font-bold text-white">
                            {clients.filter(c => !c.client_profile_audits || c.client_profile_audits.length === 0).length}
                        </p>
                    </div>
                </div>

                {/* Search Bar and Add Button */}
                <div className="mb-6 flex flex-col sm:flex-row gap-4 items-center">
                    <div className="relative flex-1 w-full">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by name, industry, or role..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-gray-800 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        />
                    </div>
                    <Link
                        href="/onboarding"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 rounded-lg font-medium transition-all hover:scale-105 shadow-lg whitespace-nowrap"
                    >
                        <Plus className="w-5 h-5" />
                        Onboard New Client
                    </Link>
                </div>

                {/* Clients Grid */}
                <div className="space-y-4">
                    <h2 className="text-2xl font-bold mb-4">
                        Your Clients {searchQuery && `(${filteredClients.length} results)`}
                    </h2>

                    {filteredClients.length === 0 ? (
                        <div className="p-12 bg-slate-900 rounded-xl border border-gray-800 text-center">
                            <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                            <h3 className="text-xl font-medium text-gray-300 mb-2">
                                {searchQuery ? 'No clients found' : 'No clients yet'}
                            </h3>
                            <p className="text-gray-400 mb-6">
                                {searchQuery ? 'Try a different search term' : 'Get started by onboarding your first client'}
                            </p>
                            {!searchQuery && (
                                <Link
                                    href="/onboarding"
                                    className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 rounded-lg font-medium transition-colors"
                                >
                                    <Plus className="w-5 h-5" />
                                    Onboard First Client
                                </Link>
                            )}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredClients.map((client) => {
                                const hasAudit = client.client_profile_audits && client.client_profile_audits.length > 0
                                const audit = hasAudit ? client.client_profile_audits[0] : null

                                return (
                                    <div
                                        key={client.id}
                                        className="relative group p-6 bg-slate-900 hover:bg-slate-800 rounded-xl border border-gray-800 hover:border-indigo-500/50 transition-all"
                                    >
                                        {/* Delete Confirmation Modal */}
                                        {deleteConfirm === client.id && (
                                            <div className="absolute inset-0 bg-slate-950/95 rounded-xl z-10 flex flex-col items-center justify-center p-6">
                                                <X
                                                    className="absolute top-4 right-4 w-6 h-6 text-gray-400 hover:text-white cursor-pointer"
                                                    onClick={() => setDeleteConfirm(null)}
                                                />
                                                <h3 className="text-xl font-bold mb-3 text-center">Delete Client?</h3>
                                                <p className="text-gray-400 mb-6 text-center text-sm">
                                                    This will permanently delete all data for {client.name || 'this client'}
                                                </p>
                                                <div className="flex gap-3">
                                                    <button
                                                        onClick={() => setDeleteConfirm(null)}
                                                        className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg font-medium transition-colors"
                                                    >
                                                        Cancel
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(client.id)}
                                                        className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg font-medium transition-colors"
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </div>
                                        )}

                                        {/* Action Buttons */}
                                        <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Link
                                                href={`/onboarding?client_id=${client.id}`}
                                                onClick={(e) => e.stopPropagation()}
                                                className="p-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
                                                title="Edit client"
                                            >
                                                <Edit className="w-4 h-4" />
                                            </Link>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    setDeleteConfirm(client.id)
                                                }}
                                                className="p-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                                                title="Delete client"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>

                                        <Link
                                            href={hasAudit ? `/dashboard?client_id=${client.id}` : `/onboarding?client_id=${client.id}`}
                                            className="block"
                                        >
                                            <div className="flex items-start gap-3 mb-3">
                                                <h3 className="text-xl font-bold group-hover:text-indigo-400 transition-colors flex-1">
                                                    {client.name || 'Unnamed Client'}
                                                </h3>
                                                {hasAudit ? (
                                                    <span className="px-3 py-1 bg-green-500/20 text-green-300 text-xs font-bold rounded-full border border-green-500/30">
                                                        Active
                                                    </span>
                                                ) : (
                                                    <span className="px-3 py-1 bg-yellow-500/20 text-yellow-300 text-xs font-bold rounded-full border border-yellow-500/30">
                                                        Pending
                                                    </span>
                                                )}
                                            </div>

                                            {client.industry && client.role && (
                                                <p className="text-sm text-gray-400 mb-3">
                                                    {client.role} • {client.industry}
                                                </p>
                                            )}

                                            {audit && (
                                                <p className="text-gray-300 line-clamp-2 mb-3 text-sm">
                                                    {audit.positioning_statement}
                                                </p>
                                            )}

                                            <p className="text-xs text-gray-500 mb-4">
                                                Created: {new Date(client.created_at).toLocaleDateString()}
                                            </p>

                                            <div className="pt-3 border-t border-gray-800">
                                                {hasAudit ? (
                                                    <span className="text-indigo-400 text-sm font-medium group-hover:text-indigo-300 transition-colors">
                                                        View Dashboard →
                                                    </span>
                                                ) : (
                                                    <span className="text-yellow-400 text-sm font-medium group-hover:text-yellow-300 transition-colors">
                                                        Complete Setup →
                                                    </span>
                                                )}
                                            </div>
                                        </Link>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

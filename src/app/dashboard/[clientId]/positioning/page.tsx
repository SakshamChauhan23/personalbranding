'use client'

import { useState, useEffect, use } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Target, MessageSquare, Users, Shield, Edit2 } from 'lucide-react'

export default function PositioningPage({ params }: { params: Promise<{ clientId: string }> }) {
    const { clientId } = use(params)
    const [client, setClient] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const supabase = createClient()

    const [isEditing, setIsEditing] = useState(false)
    const [editForm, setEditForm] = useState<any>({})

    useEffect(() => {
        fetchClient()
    }, [])

    const fetchClient = async () => {
        const { data } = await supabase
            .from('clients')
            .select('*')
            .eq('id', clientId)
            .single()

        setClient(data)
        setEditForm(data)
        setLoading(false)
    }

    const handleSave = async () => {
        try {
            const { error } = await supabase
                .from('clients')
                .update({
                    role: editForm.role,
                    industry: editForm.industry,
                    goals: editForm.goals,
                    target_audience: editForm.target_audience,
                    tone_preferences: editForm.tone_preferences
                })
                .eq('id', clientId)

            if (error) throw error

            setClient(editForm)
            setIsEditing(false)
        } catch (error) {
            console.error('Error updating client:', error)
            alert('Failed to update strategy')
        }
    }

    if (loading) return <div className="p-8 text-gray-400">Loading positioning data...</div>

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Brand Positioning</h1>
                    <p className="text-gray-400">Strategic foundation for {client?.name}</p>
                </div>
                {isEditing ? (
                    <div className="flex gap-2">
                        <button
                            onClick={() => setIsEditing(false)}
                            className="px-4 py-2 rounded-lg text-gray-400 hover:text-white transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            className="bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-lg font-medium transition-colors text-white"
                        >
                            Save Changes
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={() => setIsEditing(true)}
                        className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-lg font-medium transition-colors border border-gray-700"
                    >
                        <Edit2 className="w-4 h-4" />
                        Edit Strategy
                    </button>
                )}
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                {/* Core Identity */}
                <div className="bg-slate-900 border border-gray-800 rounded-xl p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-indigo-500/20 rounded-lg text-indigo-400">
                            <Shield className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl font-bold text-white">Core Identity</h2>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase">Role / Title</label>
                            {isEditing ? (
                                <select
                                    value={editForm.role || ''}
                                    onChange={e => setEditForm({ ...editForm, role: e.target.value })}
                                    className="w-full bg-slate-950 border border-gray-700 rounded p-2 text-white mt-1"
                                >
                                    <option value="">Select Role</option>
                                    <option value="CEO">CEO</option>
                                    <option value="Founder">Founder</option>
                                    <option value="CTO">CTO</option>
                                    <option value="CMO">CMO</option>
                                    <option value="VP of Sales">VP of Sales</option>
                                    <option value="Product Manager">Product Manager</option>
                                    <option value="Consultant">Consultant</option>
                                    <option value="Investor">Investor</option>
                                    <option value="Other">Other</option>
                                </select>
                            ) : (
                                <p className="text-white text-lg">{client?.role || 'Not specified'}</p>
                            )}
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase">Industry</label>
                            {isEditing ? (
                                <select
                                    value={editForm.industry || ''}
                                    onChange={e => setEditForm({ ...editForm, industry: e.target.value })}
                                    className="w-full bg-slate-950 border border-gray-700 rounded p-2 text-white mt-1"
                                >
                                    <option value="">Select Industry</option>
                                    <option value="Technology">Technology</option>
                                    <option value="SaaS">SaaS</option>
                                    <option value="Finance">Finance</option>
                                    <option value="Healthcare">Healthcare</option>
                                    <option value="E-commerce">E-commerce</option>
                                    <option value="Marketing">Marketing</option>
                                    <option value="Real Estate">Real Estate</option>
                                    <option value="Education">Education</option>
                                    <option value="Other">Other</option>
                                </select>
                            ) : (
                                <p className="text-white">{client?.industry || 'Not specified'}</p>
                            )}
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase">Key Goal</label>
                            {isEditing ? (
                                <textarea
                                    value={editForm.goals || ''}
                                    onChange={e => setEditForm({ ...editForm, goals: e.target.value })}
                                    className="w-full bg-slate-950 border border-gray-700 rounded p-2 text-white mt-1 h-20"
                                />
                            ) : (
                                <p className="text-white">{client?.goals || 'Build thought leadership'}</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Target Audience */}
                <div className="bg-slate-900 border border-gray-800 rounded-xl p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-purple-500/20 rounded-lg text-purple-400">
                            <Users className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl font-bold text-white">Target Audience</h2>
                    </div>
                    {isEditing ? (
                        <textarea
                            value={editForm.target_audience || ''}
                            onChange={e => setEditForm({ ...editForm, target_audience: e.target.value })}
                            className="w-full bg-slate-950 border border-gray-700 rounded p-2 text-white h-32"
                        />
                    ) : (
                        <p className="text-gray-300 leading-relaxed">
                            {client?.target_audience || 'Professionals, Decision Makers, and Industry Peers.'}
                        </p>
                    )}
                </div>

                {/* Tone & Voice */}
                <div className="bg-slate-900 border border-gray-800 rounded-xl p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-pink-500/20 rounded-lg text-pink-400">
                            <MessageSquare className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl font-bold text-white">Tone & Voice</h2>
                    </div>
                    {isEditing ? (
                        <textarea
                            value={editForm.tone_preferences || ''}
                            onChange={e => setEditForm({ ...editForm, tone_preferences: e.target.value })}
                            className="w-full bg-slate-950 border border-gray-700 rounded p-2 text-white h-32"
                        />
                    ) : (
                        <p className="text-gray-300 leading-relaxed">
                            {client?.tone_preferences || 'Professional, Insightful, and Authentic.'}
                        </p>
                    )}
                </div>

                {/* Content Pillars (Mocked for now as it's in a separate table/json) */}
                <div className="bg-slate-900 border border-gray-800 rounded-xl p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-green-500/20 rounded-lg text-green-400">
                            <Target className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl font-bold text-white">Content Pillars</h2>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {['Leadership', 'Innovation', 'Company Culture', 'Industry Trends'].map(pillar => (
                            <span key={pillar} className="px-3 py-1 bg-slate-800 rounded-full text-sm text-gray-300 border border-gray-700">
                                {pillar}
                            </span>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}

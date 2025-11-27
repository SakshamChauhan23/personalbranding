'use client'

import { useState, useEffect, use } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Palette, Mail, Link as LinkIcon, Edit2 } from 'lucide-react'

export default function OnboardingPage({ params }: { params: Promise<{ clientId: string }> }) {
    const { clientId } = use(params)
    const [client, setClient] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [isEditing, setIsEditing] = useState(false)
    const [editForm, setEditForm] = useState<any>({})
    const supabase = createClient()

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
                    approval_email: editForm.approval_email,
                    linkedin_url: editForm.linkedin_url,
                    brand_colors: editForm.brand_colors,
                    logo_url: editForm.logo_url
                })
                .eq('id', clientId)

            if (error) throw error

            setClient(editForm)
            setIsEditing(false)
        } catch (error) {
            console.error('Error updating onboarding:', error)
            alert('Failed to update onboarding info')
        }
    }

    if (loading) return <div className="p-8 text-gray-400">Loading onboarding data...</div>

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Client Onboarding</h1>
                    <p className="text-gray-400">Manage branding and workflow settings</p>
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
                        Edit Settings
                    </button>
                )}
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                {/* Branding */}
                <div className="bg-slate-900 border border-gray-800 rounded-xl p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-pink-500/20 rounded-lg text-pink-400">
                            <Palette className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl font-bold text-white">Branding Assets</h2>
                    </div>

                    <div className="space-y-6">
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Logo URL</label>
                            {isEditing ? (
                                <input
                                    type="text"
                                    value={editForm.logo_url || ''}
                                    onChange={e => setEditForm({ ...editForm, logo_url: e.target.value })}
                                    className="w-full bg-slate-950 border border-gray-700 rounded p-2 text-white"
                                />
                            ) : (
                                <div className="flex items-center gap-4">
                                    {client?.logo_url ? (
                                        <img src={client.logo_url} alt="Logo" className="w-16 h-16 rounded-lg object-cover bg-white" />
                                    ) : (
                                        <div className="w-16 h-16 bg-slate-800 rounded-lg flex items-center justify-center text-gray-500 text-xs">No Logo</div>
                                    )}
                                    <span className="text-sm text-gray-400 truncate">{client?.logo_url || 'No URL provided'}</span>
                                </div>
                            )}
                        </div>

                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Brand Colors</label>
                            {isEditing ? (
                                <div className="grid grid-cols-2 gap-4">
                                    <input
                                        type="text"
                                        placeholder="Primary Hex"
                                        value={editForm.brand_colors?.primary || ''}
                                        onChange={e => setEditForm({ ...editForm, brand_colors: { ...editForm.brand_colors, primary: e.target.value } })}
                                        className="bg-slate-950 border border-gray-700 rounded p-2 text-white"
                                    />
                                    <input
                                        type="text"
                                        placeholder="Secondary Hex"
                                        value={editForm.brand_colors?.secondary || ''}
                                        onChange={e => setEditForm({ ...editForm, brand_colors: { ...editForm.brand_colors, secondary: e.target.value } })}
                                        className="bg-slate-950 border border-gray-700 rounded p-2 text-white"
                                    />
                                </div>
                            ) : (
                                <div className="flex gap-4">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-full border border-gray-700" style={{ backgroundColor: client?.brand_colors?.primary || '#000000' }}></div>
                                        <span className="text-sm text-gray-300">Primary</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-full border border-gray-700" style={{ backgroundColor: client?.brand_colors?.secondary || '#ffffff' }}></div>
                                        <span className="text-sm text-gray-300">Secondary</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Workflow & Links */}
                <div className="bg-slate-900 border border-gray-800 rounded-xl p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400">
                            <LinkIcon className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl font-bold text-white">Workflow & Links</h2>
                    </div>

                    <div className="space-y-6">
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">LinkedIn Profile</label>
                            {isEditing ? (
                                <input
                                    type="text"
                                    value={editForm.linkedin_url || ''}
                                    onChange={e => setEditForm({ ...editForm, linkedin_url: e.target.value })}
                                    className="w-full bg-slate-950 border border-gray-700 rounded p-2 text-white"
                                />
                            ) : (
                                <a
                                    href={client?.linkedin_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-indigo-400 hover:text-indigo-300 flex items-center gap-2"
                                >
                                    {client?.linkedin_url || 'Not connected'}
                                    <LinkIcon className="w-3 h-3" />
                                </a>
                            )}
                        </div>

                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Approval Email</label>
                            {isEditing ? (
                                <input
                                    type="email"
                                    value={editForm.approval_email || ''}
                                    onChange={e => setEditForm({ ...editForm, approval_email: e.target.value })}
                                    className="w-full bg-slate-950 border border-gray-700 rounded p-2 text-white"
                                />
                            ) : (
                                <div className="flex items-center gap-2 text-gray-300">
                                    <Mail className="w-4 h-4 text-gray-500" />
                                    {client?.approval_email || 'Not set'}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

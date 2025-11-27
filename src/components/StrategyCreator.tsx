'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Sparkles, Save, Loader2, Bot, PenTool, Target, AlertCircle, Check, ChevronDown } from 'lucide-react'

const GOAL_OPTIONS = [
    'Brand Awareness',
    'Thought Leadership',
    'Lead Generation',
    'Talent Acquisition (Hiring)',
    'Community Building',
    'Product/Service Promotion',
    'Investor Relations',
    'Educational/Industry Insights'
]

export default function StrategyCreator({ clientId, clientRole, clientIndustry }: { clientId: string, clientRole: string, clientIndustry: string }) {
    const router = useRouter()
    const supabase = createClient()

    const [useAI, setUseAI] = useState(false)
    const [loading, setLoading] = useState(true)
    const [existingId, setExistingId] = useState<string | null>(null)
    const [error, setError] = useState<any>(null)
    const [goalsDropdownOpen, setGoalsDropdownOpen] = useState(false)

    // Manual Form State
    const [formData, setFormData] = useState({
        positioning_statement: '',
        content_pillars: ['', '', '', '', '', ''], // 6 fixed pillars
        tone_voice: '',
        audience_insights: '',
        strengths_weaknesses: '',
        primary_goals: [] as string[],
        relevant_content: ''
    })

    useEffect(() => {
        fetchStrategy()
    }, [clientId])

    const fetchStrategy = async () => {
        try {
            const { data, error } = await supabase
                .from('client_profile_audits')
                .select('*')
                .eq('client_id', clientId)
                .order('created_at', { ascending: false })
                .limit(1)
                .single()

            if (data) {
                // Ensure 6 pillars
                let pillars = data.content_pillars || []
                while (pillars.length < 6) pillars.push('')
                if (pillars.length > 6) pillars = pillars.slice(0, 6)

                setFormData({
                    positioning_statement: data.positioning_statement || '',
                    content_pillars: pillars,
                    tone_voice: data.tone_voice || '',
                    audience_insights: data.audience_insights || '',
                    strengths_weaknesses: data.strengths_weaknesses || '',
                    primary_goals: data.primary_goals || [],
                    relevant_content: data.relevant_content || ''
                })
                setExistingId(data.id)
                setUseAI(false)
            }
        } catch (error) {
            console.log('No existing strategy found')
        } finally {
            setLoading(false)
        }
    }

    const handleGenerate = async () => {
        setLoading(true)
        setError(null)
        try {
            const res = await fetch('/api/generate-audit', {
                method: 'POST',
                body: JSON.stringify({ client_id: clientId }),
                headers: { 'Content-Type': 'application/json' }
            })
            const data = await res.json()
            if (data.success) {
                router.refresh()
                fetchStrategy() // Reload data
            } else {
                setError({ message: data.error || 'Failed to generate strategy' })
            }
        } catch (error) {
            console.error(error)
            setError(error)
        } finally {
            setLoading(false)
        }
    }

    const handleManualSave = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)

        if (!formData.positioning_statement || !formData.tone_voice) {
            alert('Please fill in at least Positioning and Tone.')
            return
        }

        setLoading(true)
        try {
            const payload = {
                client_id: clientId,
                positioning_statement: formData.positioning_statement,
                content_pillars: formData.content_pillars.filter(p => p.trim() !== ''),
                tone_voice: formData.tone_voice,
                audience_insights: formData.audience_insights,
                strengths_weaknesses: formData.strengths_weaknesses,
                primary_goals: formData.primary_goals,
                relevant_content: formData.relevant_content,
                updated_at: new Date().toISOString()
            }

            let dbError;

            if (existingId) {
                const { error: updateError } = await supabase
                    .from('client_profile_audits')
                    .update(payload)
                    .eq('id', existingId)
                dbError = updateError
            } else {
                const { error: insertError } = await supabase
                    .from('client_profile_audits')
                    .insert(payload)
                dbError = insertError
            }

            if (dbError) throw dbError

            router.refresh()
            alert('Strategy saved successfully!')
        } catch (error: any) {
            console.error('Save Error:', error)
            setError(error)
        } finally {
            setLoading(false)
        }
    }

    const toggleGoal = (goal: string) => {
        setFormData(prev => {
            const exists = prev.primary_goals.includes(goal)
            if (exists) {
                return { ...prev, primary_goals: prev.primary_goals.filter(g => g !== goal) }
            } else {
                return { ...prev, primary_goals: [...prev.primary_goals, goal] }
            }
        })
    }

    const updatePillar = (index: number, value: string) => {
        const newPillars = [...formData.content_pillars]
        newPillars[index] = value
        setFormData({ ...formData, content_pillars: newPillars })
    }

    if (loading && !formData.positioning_statement) {
        return (
            <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
        )
    }

    return (
        <div className="max-w-4xl mx-auto">
            <div className="glass rounded-2xl p-8 border border-white/10">
                <div className="flex items-center gap-3 mb-8">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg shadow-primary/20">
                        <Target className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-white">
                            {existingId ? 'Edit Strategy' : 'Create Strategy'}
                        </h2>
                        <p className="text-gray-400">
                            {existingId
                                ? 'Update your content strategy and positioning.'
                                : `Define the positioning and content pillars for ${clientRole} in ${clientIndustry}.`}
                        </p>
                    </div>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-200 flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="font-bold">Error saving strategy</p>
                            <p className="text-sm opacity-80">{error.message || 'An error occurred'}</p>
                        </div>
                    </div>
                )}

                <form onSubmit={handleManualSave} className="space-y-8">
                    {/* Positioning Statement */}
                    <div className="space-y-3">
                        <label className="block text-sm font-medium text-gray-300">
                            Positioning Statement
                        </label>
                        <textarea
                            value={formData.positioning_statement}
                            onChange={(e) => setFormData({ ...formData, positioning_statement: e.target.value })}
                            className="w-full h-32 bg-white/5 border border-white/10 rounded-xl p-4 text-white placeholder-gray-500 focus:ring-2 focus:ring-primary focus:border-transparent transition-all resize-none"
                            placeholder="e.g. Helping SaaS founders scale through organic LinkedIn growth..."
                            required
                        />
                    </div>

                    {/* Primary Goals (Multi-select) */}
                    <div className="space-y-3 relative">
                        <label className="block text-sm font-medium text-gray-300">
                            Primary Goals
                        </label>
                        <button
                            type="button"
                            onClick={() => setGoalsDropdownOpen(!goalsDropdownOpen)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-left text-white flex justify-between items-center hover:bg-white/10 transition-colors"
                        >
                            <span className={formData.primary_goals.length === 0 ? 'text-gray-500' : ''}>
                                {formData.primary_goals.length > 0
                                    ? formData.primary_goals.join(', ')
                                    : 'Select goals...'}
                            </span>
                            <ChevronDown className="w-4 h-4 text-gray-400" />
                        </button>

                        {goalsDropdownOpen && (
                            <div className="absolute top-full left-0 right-0 mt-2 bg-slate-800 border border-slate-700 rounded-xl shadow-xl z-10 p-2 max-h-60 overflow-y-auto">
                                {GOAL_OPTIONS.map(goal => (
                                    <div
                                        key={goal}
                                        onClick={() => toggleGoal(goal)}
                                        className="flex items-center gap-3 p-3 hover:bg-slate-700 rounded-lg cursor-pointer transition-colors"
                                    >
                                        <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${formData.primary_goals.includes(goal)
                                                ? 'bg-primary border-primary'
                                                : 'border-gray-600'
                                            }`}>
                                            {formData.primary_goals.includes(goal) && <Check className="w-3 h-3 text-white" />}
                                        </div>
                                        <span className="text-gray-200">{goal}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Content Pillars (6 Boxes) */}
                    <div className="space-y-3">
                        <label className="block text-sm font-medium text-gray-300">
                            Content Pillars
                        </label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {formData.content_pillars.map((pillar, index) => (
                                <div key={index} className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs font-bold">
                                        {index + 1}
                                    </span>
                                    <input
                                        type="text"
                                        value={pillar}
                                        onChange={(e) => updatePillar(index, e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-8 pr-4 text-white placeholder-gray-600 focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                                        placeholder={`Pillar ${index + 1}`}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                        {/* Tone & Voice */}
                        <div className="space-y-3">
                            <label className="block text-sm font-medium text-gray-300">
                                Tone & Voice
                            </label>
                            <input
                                type="text"
                                value={formData.tone_voice}
                                onChange={(e) => setFormData({ ...formData, tone_voice: e.target.value })}
                                className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white placeholder-gray-500 focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                                placeholder="e.g. Professional, Authoritative, Empathetic"
                                required
                            />
                        </div>

                        {/* Audience Insights */}
                        <div className="space-y-3">
                            <label className="block text-sm font-medium text-gray-300">
                                Target Audience
                            </label>
                            <input
                                type="text"
                                value={formData.audience_insights}
                                onChange={(e) => setFormData({ ...formData, audience_insights: e.target.value })}
                                className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white placeholder-gray-500 focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                                placeholder="e.g. Series A Founders, CTOs"
                                required
                            />
                        </div>
                    </div>

                    {/* Strengths & Weaknesses */}
                    <div className="space-y-3">
                        <label className="block text-sm font-medium text-gray-300">
                            Strengths & Weaknesses
                        </label>
                        <textarea
                            value={formData.strengths_weaknesses}
                            onChange={(e) => setFormData({ ...formData, strengths_weaknesses: e.target.value })}
                            className="w-full h-32 bg-white/5 border border-white/10 rounded-xl p-4 text-white placeholder-gray-500 focus:ring-2 focus:ring-primary focus:border-transparent transition-all resize-none"
                            placeholder="Strengths: Deep technical knowledge...&#10;Weaknesses: Inconsistent posting..."
                            required
                        />
                    </div>

                    {/* Relevant Content */}
                    <div className="space-y-3">
                        <label className="block text-sm font-medium text-gray-300">
                            Relevant Content / Notes
                        </label>
                        <textarea
                            value={formData.relevant_content}
                            onChange={(e) => setFormData({ ...formData, relevant_content: e.target.value })}
                            className="w-full h-24 bg-white/5 border border-white/10 rounded-xl p-4 text-white placeholder-gray-500 focus:ring-2 focus:ring-primary focus:border-transparent transition-all resize-none"
                            placeholder="Any specific topics, links, or additional context..."
                        />
                    </div>

                    <div className="pt-4 flex gap-4">
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 bg-gradient-to-r from-primary to-secondary hover:opacity-90 text-white py-4 rounded-xl font-bold transition-all shadow-lg shadow-primary/25 disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Save className="w-5 h-5" />
                                    Save Strategy
                                </>
                            )}
                        </button>

                        <button
                            type="button"
                            onClick={handleGenerate}
                            disabled={loading}
                            className="px-6 bg-white/5 hover:bg-white/10 border border-white/10 text-white py-4 rounded-xl font-bold transition-all flex items-center gap-2 shadow-sm"
                        >
                            <Sparkles className="w-5 h-5 text-secondary" />
                            Auto-Generate with AI
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

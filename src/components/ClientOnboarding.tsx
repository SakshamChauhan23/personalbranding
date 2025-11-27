'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { ChevronRight, ChevronLeft, Upload, Check, User, Briefcase, Palette, Mail, Layout } from 'lucide-react'

export default function ClientOnboarding() {
    const router = useRouter()
    const supabase = createClient()
    const [step, setStep] = useState(1)
    const [loading, setLoading] = useState(false)

    const [formData, setFormData] = useState({
        name: '',
        role: '',
        industry: '',
        linkedin_url: '',
        company_linkedin_url: '',
        bio: '',
        goals: '',
        target_audience: '',
        tone_preferences: '',
        approval_email: '',
        brand_colors: { primary: '#4F46E5', secondary: '#10B981' }, // Default Indigo/Emerald
        logo_url: ''
    })

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    const handleColorChange = (type: 'primary' | 'secondary', value: string) => {
        setFormData(prev => ({
            ...prev,
            brand_colors: { ...prev.brand_colors, [type]: value }
        }))
    }

    const handleSubmit = async () => {
        setLoading(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('Not authenticated')

            const { data, error } = await supabase
                .from('clients')
                .insert({
                    user_id: user.id,
                    name: formData.name,
                    role: formData.role,
                    industry: formData.industry,
                    linkedin_url: formData.linkedin_url,
                    company_linkedin_url: formData.company_linkedin_url,
                    bio: formData.bio,
                    goals: formData.goals,
                    target_audience: formData.target_audience,
                    tone_preferences: formData.tone_preferences,
                    approval_email: formData.approval_email,
                    brand_colors: formData.brand_colors,
                    logo_url: formData.logo_url,
                    onboarding_data: formData // Store full raw data for reference
                })
                .select()
                .single()

            if (error) throw error

            // Redirect to the new client's workspace
            router.push(`/dashboard/${data.id}`)
        } catch (error) {
            console.error('Error creating client:', error)
            alert('Failed to create client. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    const nextStep = () => setStep(s => s + 1)
    const prevStep = () => setStep(s => s - 1)

    return (
        <div className="max-w-3xl mx-auto">
            {/* Progress Steps */}
            <div className="mb-8">
                <div className="flex justify-between items-center relative">
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-gray-800 -z-10"></div>
                    {[1, 2, 3, 4].map((s) => (
                        <div
                            key={s}
                            className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-colors ${step >= s ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-500'
                                }`}
                        >
                            {step > s ? <Check className="w-5 h-5" /> : s}
                        </div>
                    ))}
                </div>
                <div className="flex justify-between mt-2 text-sm text-gray-400 px-1">
                    <span>Basics</span>
                    <span>Strategy</span>
                    <span>Brand</span>
                    <span>Approval</span>
                </div>
            </div>

            <div className="bg-slate-900 border border-gray-800 rounded-xl p-8 shadow-xl">
                {/* Step 1: Basic Info */}
                {step === 1 && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-3 bg-indigo-500/10 rounded-lg">
                                <User className="w-6 h-6 text-indigo-400" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-white">Client Basics</h2>
                                <p className="text-gray-400 text-sm">Who are we managing?</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Client Name</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    className="w-full bg-slate-950 border border-gray-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    placeholder="e.g. Sarah Connor"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Role / Title</label>
                                <input
                                    type="text"
                                    name="role"
                                    value={formData.role}
                                    onChange={handleChange}
                                    className="w-full bg-slate-950 border border-gray-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    placeholder="e.g. CEO"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Industry</label>
                                <input
                                    type="text"
                                    name="industry"
                                    value={formData.industry}
                                    onChange={handleChange}
                                    className="w-full bg-slate-950 border border-gray-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    placeholder="e.g. Tech / AI"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">LinkedIn URL</label>
                                <input
                                    type="text"
                                    name="linkedin_url"
                                    value={formData.linkedin_url}
                                    onChange={handleChange}
                                    className="w-full bg-slate-950 border border-gray-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    placeholder="https://linkedin.com/in/..."
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Company LinkedIn URL</label>
                                <input
                                    type="text"
                                    name="company_linkedin_url"
                                    value={formData.company_linkedin_url}
                                    onChange={handleChange}
                                    className="w-full bg-slate-950 border border-gray-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    placeholder="https://linkedin.com/company/..."
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">Short Bio</label>
                            <textarea
                                name="bio"
                                value={formData.bio}
                                onChange={handleChange}
                                rows={3}
                                className="w-full bg-slate-950 border border-gray-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                placeholder="Brief professional background..."
                            />
                        </div>
                    </div>
                )}

                {/* Step 2: Strategy */}
                {step === 2 && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-3 bg-purple-500/10 rounded-lg">
                                <Briefcase className="w-6 h-6 text-purple-400" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-white">Content Strategy</h2>
                                <p className="text-gray-400 text-sm">What are we trying to achieve?</p>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">Primary Goals</label>
                            <textarea
                                name="goals"
                                value={formData.goals}
                                onChange={handleChange}
                                rows={2}
                                className="w-full bg-slate-950 border border-gray-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                placeholder="e.g. Build authority, generate leads, hiring..."
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">Target Audience</label>
                            <input
                                type="text"
                                name="target_audience"
                                value={formData.target_audience}
                                onChange={handleChange}
                                className="w-full bg-slate-950 border border-gray-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                placeholder="e.g. CTOs, Founders, Investors"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">Tone & Voice</label>
                            <select
                                name="tone_preferences"
                                value={formData.tone_preferences}
                                onChange={handleChange}
                                className="w-full bg-slate-950 border border-gray-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            >
                                <option value="">Select a tone...</option>
                                <option value="Professional & Authoritative">Professional & Authoritative</option>
                                <option value="Conversational & Relatable">Conversational & Relatable</option>
                                <option value="Bold & Contrarian">Bold & Contrarian</option>
                                <option value="Educational & Helpful">Educational & Helpful</option>
                            </select>
                        </div>
                    </div>
                )}

                {/* Step 3: Brand */}
                {step === 3 && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-3 bg-pink-500/10 rounded-lg">
                                <Palette className="w-6 h-6 text-pink-400" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-white">Brand Identity</h2>
                                <p className="text-gray-400 text-sm">Visuals for carousels and assets.</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2">Primary Color</label>
                                <div className="flex items-center gap-3">
                                    <input
                                        type="color"
                                        value={formData.brand_colors.primary}
                                        onChange={(e) => handleColorChange('primary', e.target.value)}
                                        className="w-12 h-12 rounded cursor-pointer bg-transparent border-0 p-0"
                                    />
                                    <input
                                        type="text"
                                        value={formData.brand_colors.primary}
                                        onChange={(e) => handleColorChange('primary', e.target.value)}
                                        className="flex-1 bg-slate-950 border border-gray-700 rounded-lg p-3 text-white font-mono uppercase"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2">Secondary Color</label>
                                <div className="flex items-center gap-3">
                                    <input
                                        type="color"
                                        value={formData.brand_colors.secondary}
                                        onChange={(e) => handleColorChange('secondary', e.target.value)}
                                        className="w-12 h-12 rounded cursor-pointer bg-transparent border-0 p-0"
                                    />
                                    <input
                                        type="text"
                                        value={formData.brand_colors.secondary}
                                        onChange={(e) => handleColorChange('secondary', e.target.value)}
                                        className="flex-1 bg-slate-950 border border-gray-700 rounded-lg p-3 text-white font-mono uppercase"
                                    />
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">Logo URL (Optional)</label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    name="logo_url"
                                    value={formData.logo_url}
                                    onChange={handleChange}
                                    className="w-full bg-slate-950 border border-gray-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    placeholder="https://..."
                                />
                                <button className="px-4 py-2 bg-slate-800 border border-gray-700 rounded-lg hover:bg-slate-700 transition-colors">
                                    <Upload className="w-5 h-5 text-gray-400" />
                                </button>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">Paste a direct link to the logo image.</p>
                        </div>
                    </div>
                )}

                {/* Step 4: Approval */}
                {step === 4 && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-3 bg-green-500/10 rounded-lg">
                                <Mail className="w-6 h-6 text-green-400" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-white">Approval Workflow</h2>
                                <p className="text-gray-400 text-sm">Where should we send content for review?</p>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">Client Approval Email</label>
                            <input
                                type="email"
                                name="approval_email"
                                value={formData.approval_email}
                                onChange={handleChange}
                                className="w-full bg-slate-950 border border-gray-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                placeholder="client@company.com"
                            />
                            <p className="text-xs text-gray-500 mt-2">
                                We will send "Approve / Request Changes" emails to this address. The client does not need to log in.
                            </p>
                        </div>

                        <div className="bg-slate-950/50 rounded-lg p-4 border border-gray-800 mt-4">
                            <h4 className="text-sm font-bold text-gray-300 mb-2">Workflow Preview</h4>
                            <div className="flex items-center gap-3 text-sm text-gray-400">
                                <div className="flex items-center gap-2">
                                    <Layout className="w-4 h-4" />
                                    <span>You Create</span>
                                </div>
                                <ChevronRight className="w-4 h-4" />
                                <div className="flex items-center gap-2">
                                    <Mail className="w-4 h-4" />
                                    <span>Email Sent</span>
                                </div>
                                <ChevronRight className="w-4 h-4" />
                                <div className="flex items-center gap-2">
                                    <Check className="w-4 h-4" />
                                    <span>Client Approves</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Navigation Buttons */}
                <div className="flex justify-between mt-8 pt-6 border-t border-gray-800">
                    <button
                        onClick={prevStep}
                        disabled={step === 1}
                        className={`px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${step === 1 ? 'text-gray-600 cursor-not-allowed' : 'text-gray-300 hover:text-white hover:bg-slate-800'
                            }`}
                    >
                        <ChevronLeft className="w-4 h-4" />
                        Back
                    </button>

                    <div className="flex gap-3">
                        {step < 4 && (
                            <button
                                onClick={handleSubmit}
                                disabled={loading || !formData.name}
                                className="px-4 py-2 text-gray-400 hover:text-white transition-colors font-medium"
                            >
                                Skip & Create
                            </button>
                        )}

                        {step < 4 ? (
                            <button
                                onClick={nextStep}
                                className="bg-indigo-600 hover:bg-indigo-700 px-6 py-2 rounded-lg font-medium text-white transition-colors flex items-center gap-2"
                            >
                                Next Step
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        ) : (
                            <button
                                onClick={handleSubmit}
                                disabled={loading || !formData.name}
                                className="bg-green-600 hover:bg-green-700 px-8 py-2 rounded-lg font-bold text-white transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        Creating...
                                    </>
                                ) : (
                                    <>
                                        <Check className="w-4 h-4" />
                                        Create Client Workspace
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function Onboarding() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        linkedin_url: '',
        bio: '',
        goals: '',
        tone_preferences: '',
        industry: '',
        role: '',
        target_audience: ''
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            // 1. Save Client Data
            const res = await fetch('/api/onboarding', {
                method: 'POST',
                body: JSON.stringify(formData),
                headers: { 'Content-Type': 'application/json' }
            })

            if (!res.ok) throw new Error('Onboarding failed')

            const { client } = await res.json()

            // 2. Trigger Profile Audit
            const auditRes = await fetch('/api/generate-audit', {
                method: 'POST',
                body: JSON.stringify({ client_id: client.id }),
                headers: { 'Content-Type': 'application/json' }
            })

            if (!auditRes.ok) {
                const errorData = await auditRes.json()
                console.error('❌ Audit generation failed:', errorData)
                alert(`Strategy generation failed: ${errorData.error}.\n\nPlease check:\n1. Your Gemini API key is valid\n2. The API key has access to Gemini models\n3. Check the terminal logs for details`)
                setLoading(false)
                return // Stop here, don't redirect
            }

            // 3. Redirect to Dashboard
            console.log('✅ Onboarding complete!')
            router.push('/dashboard')
        } catch (error: any) {
            console.error('❌ Onboarding error:', error)
            alert(`Error: ${error.message}`)
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
            <div className="max-w-md w-full space-y-8">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold">
                        Setup your Profile
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-400">
                        Tell us about yourself so AI can craft your strategy.
                    </p>
                </div>
                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div className="rounded-md shadow-sm -space-y-px">
                        <div className="mb-4">
                            <label htmlFor="linkedin-url" className="sr-only">LinkedIn URL</label>
                            <input
                                id="linkedin-url"
                                name="linkedin_url"
                                type="url"
                                required
                                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-700 placeholder-gray-500 text-white bg-slate-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                                placeholder="LinkedIn URL"
                                value={formData.linkedin_url}
                                onChange={(e) => setFormData({ ...formData, linkedin_url: e.target.value })}
                            />
                        </div>
                        <div className="mb-4">
                            <label htmlFor="bio" className="sr-only">Short Bio</label>
                            <textarea
                                id="bio"
                                name="bio"
                                required
                                rows={3}
                                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-700 placeholder-gray-500 text-white bg-slate-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                                placeholder="Short Bio & Achievements"
                                value={formData.bio}
                                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                            />
                        </div>
                        <div className="mb-4">
                            <label htmlFor="industry" className="block text-sm font-medium text-gray-300 mb-2">Industry</label>
                            <select
                                id="industry"
                                name="industry"
                                required
                                className="appearance-none relative block w-full px-3 py-2 border border-gray-700 text-white bg-slate-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                value={formData.industry}
                                onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                            >
                                <option value="">Select your industry</option>
                                <option value="Technology & Software">Technology & Software</option>
                                <option value="Finance & Banking">Finance & Banking</option>
                                <option value="Healthcare & Pharma">Healthcare & Pharma</option>
                                <option value="Consulting">Consulting</option>
                                <option value="Manufacturing">Manufacturing</option>
                                <option value="Retail & E-commerce">Retail & E-commerce</option>
                                <option value="Marketing & Advertising">Marketing & Advertising</option>
                                <option value="Real Estate">Real Estate</option>
                                <option value="Education">Education</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                        <div className="mb-4">
                            <label htmlFor="role" className="block text-sm font-medium text-gray-300 mb-2">Your Role</label>
                            <select
                                id="role"
                                name="role"
                                required
                                className="appearance-none relative block w-full px-3 py-2 border border-gray-700 text-white bg-slate-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                value={formData.role}
                                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                            >
                                <option value="">Select your role</option>
                                <option value="CEO">CEO</option>
                                <option value="CTO">CTO</option>
                                <option value="CFO">CFO</option>
                                <option value="CMO">CMO</option>
                                <option value="COO">COO</option>
                                <option value="VP/Director">VP/Director</option>
                                <option value="Founder/Entrepreneur">Founder/Entrepreneur</option>
                                <option value="Other C-Suite">Other C-Suite</option>
                            </select>
                        </div>
                        <div className="mb-4">
                            <label htmlFor="goals" className="block text-sm font-medium text-gray-300 mb-2">Primary Goal</label>
                            <select
                                id="goals"
                                name="goals"
                                required
                                className="appearance-none relative block w-full px-3 py-2 border border-gray-700 text-white bg-slate-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                value={formData.goals}
                                onChange={(e) => setFormData({ ...formData, goals: e.target.value })}
                            >
                                <option value="">Select your primary goal</option>
                                <option value="Build thought leadership">Build thought leadership</option>
                                <option value="Generate leads">Generate leads</option>
                                <option value="Recruit talent">Recruit talent</option>
                                <option value="Network with peers">Network with peers</option>
                                <option value="Share industry insights">Share industry insights</option>
                                <option value="Promote company brand">Promote company brand</option>
                            </select>
                        </div>
                        <div className="mb-4">
                            <label htmlFor="target_audience" className="block text-sm font-medium text-gray-300 mb-2">Target Audience</label>
                            <select
                                id="target_audience"
                                name="target_audience"
                                required
                                className="appearance-none relative block w-full px-3 py-2 border border-gray-700 text-white bg-slate-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                value={formData.target_audience}
                                onChange={(e) => setFormData({ ...formData, target_audience: e.target.value })}
                            >
                                <option value="">Select your target audience</option>
                                <option value="Other C-level executives">Other C-level executives</option>
                                <option value="Industry professionals">Industry professionals</option>
                                <option value="Potential clients/customers">Potential clients/customers</option>
                                <option value="Job seekers/talent">Job seekers/talent</option>
                                <option value="Investors">Investors</option>
                                <option value="General business community">General business community</option>
                            </select>
                        </div>
                    </div>
                    <div className="mb-4">
                        <label htmlFor="tone" className="block text-sm font-medium text-gray-300 mb-2">Preferred Tone</label>
                        <select
                            id="tone"
                            name="tone"
                            required
                            className="appearance-none relative block w-full px-3 py-2 border border-gray-700 text-white bg-slate-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            value={formData.tone_preferences}
                            onChange={(e) => setFormData({ ...formData, tone_preferences: e.target.value })}
                        >
                            <option value="">Select preferred tone</option>
                            <option value="Professional & Authoritative">Professional & Authoritative</option>
                            <option value="Conversational & Friendly">Conversational & Friendly</option>
                            <option value="Inspirational & Motivational">Inspirational & Motivational</option>
                            <option value="Direct & No-nonsense">Direct & No-nonsense</option>
                            <option value="Witty & Humorous">Witty & Humorous</option>
                            <option value="Educational & Informative">Educational & Informative</option>
                        </select>
                    </div>
                    <div className="mb-4">
                        <label htmlFor="model" className="sr-only">AI Model Preference</label>
                        <select
                            id="model"
                            name="model"
                            className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-700 placeholder-gray-500 text-white bg-slate-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                            defaultValue="auto"
                        >
                            <option value="auto">Auto-Select Best Model (Recommended)</option>
                            <option value="gemini-2.5-flash">Gemini 2.5 Flash (Fastest)</option>
                            <option value="gemini-1.5-flash">Gemini 1.5 Flash (Stable)</option>
                            <option value="gemini-1.5-pro">Gemini 1.5 Pro (High Quality)</option>
                        </select>
                    </div>

                    <div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                        >
                            {loading ? 'Generating Strategy...' : 'Complete Setup'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

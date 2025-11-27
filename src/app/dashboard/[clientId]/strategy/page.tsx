'use client'

import { useParams } from 'next/navigation'
import StrategyCreator from '@/components/StrategyCreator'

export default function StrategyPage() {
    const params = useParams()
    const clientId = params.clientId as string

    // In a real app, we might fetch client details here to pass to StrategyCreator
    // For now, we'll pass placeholders or fetch inside the component if needed
    // The component accepts clientId, clientRole, clientIndustry
    // We might need to fetch these.

    return (
        <div className="max-w-5xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-white mb-2">Content Strategy</h1>
                <p className="text-gray-400">Manage and refine the content strategy.</p>
            </div>

            <StrategyCreator
                clientId={clientId}
                clientRole="Executive" // Placeholder, ideally fetched
                clientIndustry="Technology" // Placeholder, ideally fetched
            />
        </div>
    )
}

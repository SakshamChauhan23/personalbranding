import ClientOnboarding from '@/components/ClientOnboarding'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function NewClientPage() {
    return (
        <div className="min-h-screen bg-slate-950 text-white p-8">
            <div className="max-w-3xl mx-auto">
                <div className="mb-8">
                    <Link
                        href="/dashboard"
                        className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Dashboard
                    </Link>
                    <h1 className="text-3xl font-bold">Add New Client</h1>
                    <p className="text-gray-400 mt-2">Set up a workspace for a new client. We'll configure their strategy and approval workflow.</p>
                </div>

                <ClientOnboarding />
            </div>
        </div>
    )
}

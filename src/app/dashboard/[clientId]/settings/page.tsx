export default function PlaceholderPage({ params }: { params: { clientId: string } }) {
    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold text-white mb-4">Client Settings</h1>
            <p className="text-gray-400">Manage client details, branding, and preferences.</p>
        </div>
    )
}

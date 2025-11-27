'use client'

import { useState } from 'react'
import { ContentCalendarItem } from '@/types'
import Link from 'next/link'

export default function CalendarList({
    initialItems,
    clientId
}: {
    initialItems: ContentCalendarItem[],
    clientId: string
}) {
    const [items, setItems] = useState<ContentCalendarItem[]>(initialItems)
    const [loading, setLoading] = useState(false)

    const generateCalendar = async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/generate-calendar', {
                method: 'POST',
                body: JSON.stringify({ client_id: clientId }),
                headers: { 'Content-Type': 'application/json' }
            })
            const data = await res.json()
            if (data.success) {
                setItems(data.items)
            }
        } catch (error) {
            console.error(error)
            alert('Failed to generate calendar')
        } finally {
            setLoading(false)
        }
    }

    const generateScript = async (itemId: string) => {
        // In a real app, we might show a loading state for the specific item
        // For MVP, we'll just redirect to the script page which will handle generation/fetching
        window.location.href = `/dashboard/scripts/${itemId}`
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-bold">Content Calendar</h2>
                {items.length === 0 && (
                    <button
                        onClick={generateCalendar}
                        disabled={loading}
                        className="bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-md font-medium disabled:opacity-50"
                    >
                        {loading ? 'Generating Ideas...' : 'Generate 12 Ideas'}
                    </button>
                )}
            </div>

            {items.length === 0 ? (
                <div className="text-center py-20 bg-slate-900 rounded-lg border border-gray-800">
                    <p className="text-gray-400 mb-4">No content ideas yet.</p>
                    <button
                        onClick={generateCalendar}
                        disabled={loading}
                        className="text-indigo-400 hover:text-indigo-300 underline"
                    >
                        Generate your first batch
                    </button>
                </div>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {items.map((item) => (
                        <div key={item.id} className="bg-slate-900 rounded-lg border border-gray-800 p-6 flex flex-col">
                            <div className="flex justify-between items-start mb-4">
                                <span className={`text-xs font-bold px-2 py-1 rounded uppercase ${item.format === 'carousel' ? 'bg-purple-900 text-purple-200' :
                                        item.format === 'story' ? 'bg-pink-900 text-pink-200' :
                                            'bg-blue-900 text-blue-200'
                                    }`}>
                                    {item.format}
                                </span>
                                <span className="text-xs text-gray-500">{item.pillar}</span>
                            </div>

                            <h3 className="font-semibold text-lg mb-2 line-clamp-2">{item.title}</h3>
                            <p className="text-gray-400 text-sm mb-4 flex-1 line-clamp-3">{item.brief}</p>

                            <div className="mt-auto pt-4 border-t border-gray-800 flex justify-between items-center">
                                <span className={`text-xs capitalize ${item.status === 'approved' ? 'text-green-400' : 'text-yellow-400'
                                    }`}>
                                    {item.status}
                                </span>
                                <button
                                    onClick={() => generateScript(item.id)}
                                    className="text-sm bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded transition-colors"
                                >
                                    {item.status === 'approved' ? 'View Script' : 'Draft Script'}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

'use client'

import { X, ExternalLink, Mail } from 'lucide-react'

interface EmailPreviewModalProps {
    isOpen: boolean
    onClose: () => void
    previewUrl: string | null
}

export default function EmailPreviewModal({ isOpen, onClose, previewUrl }: EmailPreviewModalProps) {
    if (!isOpen || !previewUrl) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-slate-900 border border-gray-800 rounded-xl w-full max-w-4xl h-[80vh] flex flex-col shadow-2xl animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-800 bg-slate-950/50 rounded-t-xl">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-500/10 rounded-lg">
                            <Mail className="w-5 h-5 text-indigo-400" />
                        </div>
                        <div>
                            <h3 className="font-bold text-white">Email Preview</h3>
                            <p className="text-xs text-gray-400">This is what your client will see</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <a
                            href={previewUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 hover:bg-slate-800 rounded-lg text-gray-400 hover:text-white transition-colors"
                            title="Open in new tab"
                        >
                            <ExternalLink className="w-5 h-5" />
                        </a>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-slate-800 rounded-lg text-gray-400 hover:text-white transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 bg-white relative">
                    <iframe
                        src={previewUrl}
                        className="w-full h-full border-none"
                        title="Email Preview"
                    />
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-800 bg-slate-950/50 rounded-b-xl flex justify-between items-center text-sm text-gray-400">
                    <span>Powered by Ethereal Email (Dev Mode)</span>
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-medium transition-colors"
                    >
                        Close Preview
                    </button>
                </div>
            </div>
        </div>
    )
}

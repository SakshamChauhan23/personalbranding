'use client'

import Link from 'next/link'
import { useParams, usePathname } from 'next/navigation'
import { LayoutDashboard, Calendar, Settings, Users, ArrowLeft, ClipboardList, Target, PlusCircle } from 'lucide-react'
import Notifications from '@/components/Notifications'

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const params = useParams()
    const pathname = usePathname()
    const clientId = params.clientId as string | undefined

    const isActive = (path: string) => pathname === path || pathname.startsWith(path + '/')

    return (
        <div className="flex min-h-screen bg-transparent text-gray-100 font-sans selection:bg-primary/30">
            {/* Sidebar */}
            <aside className="w-64 fixed inset-y-0 left-0 z-50 m-4 glass rounded-2xl flex flex-col transition-all duration-300">
                <div className="p-6 border-b border-white/5">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg shadow-primary/20">
                            <LayoutDashboard className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                            SocialRipple
                        </span>
                    </div>
                </div>

                <nav className="flex-1 p-4 space-y-1 overflow-y-auto custom-scrollbar">
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4 px-4 mt-2">
                        Platform
                    </div>

                    <Link
                        href="/dashboard"
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${isActive('/dashboard') && !clientId
                            ? 'bg-primary/10 text-white shadow-inner shadow-primary/5 border border-primary/20'
                            : 'text-gray-400 hover:text-white hover:bg-white/5'
                            }`}
                    >
                        <LayoutDashboard className={`w-5 h-5 ${isActive('/dashboard') && !clientId ? 'text-secondary' : 'text-gray-500 group-hover:text-gray-300'}`} />
                        Overview
                    </Link>

                    <Link
                        href="/dashboard/new-client"
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${isActive('/dashboard/new-client')
                            ? 'bg-primary/10 text-white shadow-inner shadow-primary/5 border border-primary/20'
                            : 'text-gray-400 hover:text-white hover:bg-white/5'
                            }`}
                    >
                        <PlusCircle className={`w-5 h-5 ${isActive('/dashboard/new-client') ? 'text-secondary' : 'text-gray-500 group-hover:text-gray-300'}`} />
                        New Client
                    </Link>

                    {clientId && (
                        <>
                            <div className="my-6 border-t border-white/5 mx-4"></div>
                            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4 px-4">
                                Client Workspace
                            </div>

                            <Link
                                href={`/dashboard/${clientId}`}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${isActive(`/dashboard/${clientId}`)
                                    ? 'bg-primary/10 text-white shadow-inner shadow-primary/5 border border-primary/20'
                                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                                    }`}
                            >
                                <Users className={`w-5 h-5 ${isActive(`/dashboard/${clientId}`) ? 'text-secondary' : 'text-gray-500 group-hover:text-gray-300'}`} />
                                Dashboard
                            </Link>

                            <Link
                                href={`/dashboard/${clientId}/positioning`}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${isActive(`/dashboard/${clientId}/positioning`)
                                    ? 'bg-primary/10 text-white shadow-inner shadow-primary/5 border border-primary/20'
                                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                                    }`}
                            >
                                <Target className={`w-5 h-5 ${isActive(`/dashboard/${clientId}/positioning`) ? 'text-secondary' : 'text-gray-500 group-hover:text-gray-300'}`} />
                                Positioning
                            </Link>

                            <Link
                                href={`/dashboard/${clientId}/strategy`}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${isActive(`/dashboard/${clientId}/strategy`)
                                    ? 'bg-primary/10 text-white shadow-inner shadow-primary/5 border border-primary/20'
                                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                                    }`}
                            >
                                <ClipboardList className={`w-5 h-5 ${isActive(`/dashboard/${clientId}/strategy`) ? 'text-secondary' : 'text-gray-500 group-hover:text-gray-300'}`} />
                                Strategy
                            </Link>

                            <Link
                                href={`/dashboard/${clientId}/calendar`}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${isActive(`/dashboard/${clientId}/calendar`)
                                    ? 'bg-primary/10 text-white shadow-inner shadow-primary/5 border border-primary/20'
                                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                                    }`}
                            >
                                <Calendar className={`w-5 h-5 ${isActive(`/dashboard/${clientId}/calendar`) ? 'text-secondary' : 'text-gray-500 group-hover:text-gray-300'}`} />
                                Calendar
                            </Link>

                            <Link
                                href={`/dashboard/${clientId}/settings`}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${isActive(`/dashboard/${clientId}/settings`)
                                    ? 'bg-primary/10 text-white shadow-inner shadow-primary/5 border border-primary/20'
                                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                                    }`}
                            >
                                <Settings className={`w-5 h-5 ${isActive(`/dashboard/${clientId}/settings`) ? 'text-secondary' : 'text-gray-500 group-hover:text-gray-300'}`} />
                                Settings
                            </Link>
                        </>
                    )}
                </nav>

                <div className="p-4 border-t border-white/5">
                    <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5 border border-white/5">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-primary to-secondary flex items-center justify-center text-xs font-bold text-white">
                            AD
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate">Admin User</p>
                            <p className="text-xs text-gray-500 truncate">admin@socialripple.ai</p>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 ml-72 p-8 min-h-screen">
                <div className="max-w-7xl mx-auto">
                    {/* Top Bar */}
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            {/* Breadcrumbs or Title could go here */}
                        </div>
                        <div className="flex items-center gap-4">
                            <Notifications />
                        </div>
                    </div>
                    {children}
                </div>
            </main>
        </div>
    )
}

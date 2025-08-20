import React from 'react'
import { Outlet, NavLink } from 'react-router-dom'

function Icon({ name, className = 'h-5 w-5' }) {
    const common = `inline-block ${className}`
    switch (name) {
        case 'home':
            return (
                <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12l9-9 9 9" /><path d="M9 21V9h6v12" /></svg>
            )
        case 'chat':
            return (
                <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a4 4 0 0 1-4 4H7l-4 4V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" /></svg>
            )
        case 'teams':
            return (
                <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
            )
        case 'history':
            return (
                <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3v5h5" /><path d="M3.05 13A9 9 0 1 0 7 4.6L3 8" /><path d="M12 7v5l3 3" /></svg>
            )
        case 'profile':
            return (
                <svg className={common} viewBox="0 0 24 24" fill="currentColor"><path d="M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5Zm0 2c-5 0-9 2.69-9 6v2h18v-2c0-3.31-4-6-9-6Z" /></svg>
            )
        case 'msg':
            return (
                <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a4 4 0 0 1-4 4H7l-4 4V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" /></svg>
            )
        default:
            return null
    }
}

function SidebarLink({ to, icon, children }) {
    return (
        <NavLink
            to={to}
            end
            className={({ isActive }) => `flex items-center gap-3 rounded-md px-3 py-2 text-sm ${isActive ? 'bg-black text-white' : 'text-neutral-700 hover:bg-neutral-100'}`}
        >
            <Icon name={icon} />
            <span>{children}</span>
        </NavLink>
    )
}

export default function WorkspaceLayout() {
    return (
        <div className="min-h-screen bg-[#F4F4F4]">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
                <div className="grid grid-cols-12 gap-6">
                    <aside className="col-span-12 sm:col-span-3 lg:col-span-3">
                        <div className="sticky top-6 space-y-6">
                            <a href="/profile" className="block rounded-xl border border-neutral-200 bg-white p-4 hover:bg-neutral-50">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-full bg-neutral-100 border border-neutral-200 flex items-center justify-center">
                                        <Icon name="profile" className="h-5 w-5 text-neutral-500" />
                                    </div>
                                    <div>
                                        <div className="text-sm font-semibold text-neutral-900">Your Profile</div>
                                        <div className="text-xs text-neutral-500">View and edit</div>
                                    </div>
                                </div>
                            </a>

                            <nav className="rounded-xl border border-neutral-200 bg-white p-2 space-y-1">
                                <SidebarLink to="/workspace" icon="home">Home</SidebarLink>
                                <SidebarLink to="/workspace/messages" icon="chat">Messages</SidebarLink>
                                <SidebarLink to="/workspace/teams" icon="teams">Teams</SidebarLink>
                                <SidebarLink to="/workspace/history" icon="history">History</SidebarLink>
                            </nav>
                        </div>
                    </aside>

                    <main className="col-span-12 sm:col-span-9 lg:col-span-9">
                        <Outlet />
                    </main>
                </div>
            </div>
        </div>
    )
}



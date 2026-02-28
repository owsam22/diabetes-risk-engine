import React, { useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { Menu, X, Bell } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import Sidebar from './Sidebar';

export default function AppLayout() {
    const token = useAuthStore((s) => s.token);
    const [sidebarOpen, setSidebarOpen] = useState(false);

    if (!token) return <Navigate to="/login" replace />;

    return (
        <div className="flex h-screen overflow-hidden bg-slate-50">
            {/* Desktop Sidebar */}
            <aside className="hidden lg:flex lg:flex-col w-72 flex-shrink-0 bg-white border-r border-slate-100 shadow-sm">
                <Sidebar />
            </aside>

            {/* Mobile Sidebar Overlay */}
            {sidebarOpen && (
                <div className="lg:hidden fixed inset-0 z-50 flex">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
                    <aside className="relative z-10 w-72 bg-white flex flex-col border-r border-slate-200">
                        <button onClick={() => setSidebarOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-2">
                            <X size={20} />
                        </button>
                        <Sidebar mobile onClose={() => setSidebarOpen(false)} />
                    </aside>
                </div>
            )}

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Top Header */}
                <header className="flex items-center justify-between px-6 py-4 bg-white border-b border-slate-100 shadow-sm lg:shadow-none">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-slate-500 hover:text-slate-900 transition-colors">
                            <Menu size={24} />
                        </button>
                        <h1 className="lg:hidden font-bold text-slate-900 text-lg">Health<span className="text-emerald-600">Check</span></h1>
                        <div className="hidden lg:block">
                            <span className="text-sm font-semibold text-slate-400">Clinical Dashboard / v2.0</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <button className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all">
                            <Bell size={20} />
                        </button>
                        <div className="h-4 w-px bg-slate-200" />
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-xs font-bold text-emerald-700">P</div>
                            <span className="text-sm font-semibold text-slate-700 hidden sm:block">Patient View</span>
                        </div>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto p-4 md:p-8 lg:p-12">
                    <div className="animate-in fade-in duration-700 max-w-7xl mx-auto">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
}

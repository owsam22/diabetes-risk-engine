import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard, ClipboardList, History, Sliders, LogOut, Activity, User
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';

const nav = [
    { to: '/', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
    { to: '/assess', icon: <ClipboardList size={20} />, label: 'New Assessment' },
    { to: '/history', icon: <History size={20} />, label: 'Patient History' },
    { to: '/whatif', icon: <Sliders size={20} />, label: 'What-If Simulator' },
];

export default function Sidebar({ mobile, onClose }) {
    const { user, logout } = useAuthStore();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        toast.success('Logged out successfully');
        navigate('/login');
    };

    const linkClass = ({ isActive }) =>
        `flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-semibold transition-all ${isActive
            ? 'bg-emerald-50 text-emerald-600 border border-emerald-100 shadow-sm'
            : 'text-slate-500 hover:text-emerald-500 hover:bg-slate-50 border border-transparent'
        }`;

    return (
        <div className="flex flex-col h-full bg-white">
            {/* Logo */}
            <div className="flex items-center gap-3 px-6 py-8 border-b border-slate-50">
                <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center flex-shrink-0 shadow-lg shadow-emerald-100">
                    <Activity size={22} color="white" />
                </div>
                <span className="font-bold text-slate-900 text-xl tracking-tight">Health<span className="text-emerald-600">Check</span></span>
            </div>

            {/* Nav */}
            <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
                {nav.map((item) => (
                    <NavLink key={item.to} to={item.to} end={item.to === '/'} className={linkClass} onClick={mobile ? onClose : undefined}>
                        <span className="flex-shrink-0 transition-colors">{item.icon}</span>
                        {item.label}
                    </NavLink>
                ))}
            </nav>

            {/* User + Logout */}
            <div className="px-4 py-6 border-t border-slate-50 space-y-3">
                <div className="flex items-center gap-3 px-3 py-3.5 rounded-2xl bg-slate-50 border border-slate-100 mb-2">
                    <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center text-sm font-bold text-emerald-600 border border-emerald-100 shadow-sm">
                        {(user?.name || user?.email || 'U')[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-900 truncate">{user?.name || 'Patient'}</p>
                        <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                    </div>
                </div>
                <button onClick={handleLogout} className="btn-ghost w-full flex items-center justify-center gap-2 hover:bg-red-50 hover:text-red-600 hover:border-red-100 font-bold py-3">
                    <LogOut size={16} /> Sign Out
                </button>
            </div>
        </div>
    );
}

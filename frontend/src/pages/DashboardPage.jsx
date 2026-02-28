import React, { useEffect, useState } from 'react';
import { Activity, ClipboardList, TrendingUp, Calendar, ArrowRight, User } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import api from '../lib/api';

function StatCard({ icon, label, value, sub, color, bg }) {
    return (
        <div className="card p-6 card-hover shadow-sm hover:shadow-md transition-all">
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-sm font-semibold text-slate-400 mb-1">{label}</p>
                    <p className="text-3xl font-bold text-slate-900 tracking-tight">{value}</p>
                    {sub && <p className="text-xs font-medium text-slate-500 mt-1">{sub}</p>}
                </div>
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner" style={{ background: bg || (color + '15'), border: `1px solid ${color}20` }}>
                    <span style={{ color }}>{icon}</span>
                </div>
            </div>
        </div>
    );
}

export default function DashboardPage() {
    const { user } = useAuthStore();
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/history').then(({ data }) => {
            setHistory(data);
        }).catch(() => { }).finally(() => setLoading(false));
    }, []);

    const totalAssessments = history.length;
    const highRisk = history.filter((a) => a.prediction === 1).length;
    const lastAssessment = history[0];
    const avgScore = history.length
        ? (history.reduce((s, a) => s + a.risk_score, 0) / history.length * 100).toFixed(1)
        : null;

    return (
        <div className="space-y-10 animate-in fade-in duration-700">
            {/* Greeting */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                <div>
                    <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                        Hi, <span className="text-emerald-600">{user?.name || 'Patient'}</span> 👋
                    </h2>
                    <p className="text-slate-500 mt-1.5 text-lg font-medium">Here's your personal health risk summary.</p>
                </div>
                <Link to="/assess" className="btn-primary py-3 px-8 text-base shadow-lg shadow-emerald-200 w-auto hover:-translate-y-0.5 transition-transform">
                    <ClipboardList size={20} /> New Assessment
                </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard icon={<ClipboardList size={22} />} label="Total Assessments" value={loading ? '—' : totalAssessments} color="#10b981" />
                <StatCard icon={<Activity size={22} />} label="High Risk Alerts" value={loading ? '—' : highRisk} sub="assessments" color="#ef4444" />
                <StatCard icon={<TrendingUp size={22} />} label="Avg Risk Score" value={loading ? '—' : (avgScore ? `${avgScore}%` : 'N/A')} color="#8b5cf6" />
                <StatCard
                    icon={<Calendar size={22} />}
                    label="Last Assessment"
                    value={loading ? '—' : (lastAssessment ? new Date(lastAssessment.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : 'None')}
                    color="#f59e0b"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Recent assessments */}
                <div className="lg:col-span-2 card p-8 shadow-sm">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="text-lg font-bold text-slate-900">Recent Assessments</h3>
                        <Link to="/history" className="text-sm font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 group transition-colors">
                            Full History <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </div>

                    <div className="space-y-4">
                        {history.slice(0, 4).map((a) => (
                            <div key={a._id} className="flex items-center justify-between py-4 px-5 rounded-2xl bg-white border border-slate-100 hover:border-emerald-200 hover:bg-emerald-50/30 transition-all group">
                                <div className="flex items-center gap-4">
                                    <div className={`w-3 h-3 rounded-full flex-shrink-0 ${a.prediction === 1 ? 'bg-red-400 shadow-[0_0_10px_rgba(248,113,113,0.5)]' : 'bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.5)]'}`} />
                                    <div>
                                        <p className="text-sm font-bold text-slate-900">{new Date(a.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mt-0.5">BMI {a.bmi} · HbA1c {a.HbA1c_level}%</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className={`text-sm font-bold px-4 py-2 rounded-xl border border-transparent group-hover:bg-white group-hover:border-slate-200 transition-all ${a.prediction === 1 ? 'text-red-600' : 'text-emerald-700'}`}>
                                        {(a.risk_score * 100).toFixed(1)}% Risk
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>

                    {!loading && history.length === 0 && (
                        <div className="py-12 text-center">
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-50 text-slate-300 mb-4">
                                <ClipboardList size={32} />
                            </div>
                            <p className="text-slate-500 text-lg font-semibold">No assessments found</p>
                            <p className="text-slate-400 text-sm mt-1">Complete your first clinical assessment to see results.</p>
                            <Link to="/assess">
                                <button className="btn-primary mt-8 px-10 py-3 shadow-md">
                                    Run Assessment
                                </button>
                            </Link>
                        </div>
                    )}
                </div>

                {/* Action Panel */}
                <div className="space-y-4">
                    <div className="card p-8 bg-emerald-600 text-white shadow-xl shadow-emerald-100 overflow-hidden relative">
                        <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-emerald-500/20 rounded-full blur-2xl" />
                        <div className="relative z-10">
                            {/* Changed to emerald-700 for visibility */}
                            <TrendingUp size={32} className="mb-4 text-emerald-700" />

                            {/* Changed text to emerald-900 or slate-900 for a strong header */}
                            <h3 className="text-xl font-bold mb-2 text-emerald-900">Simulate Changes</h3>

                            {/* Changed to emerald-800 for readability */}
                            <p className="text-emerald-800 text-sm leading-relaxed mb-6">
                                Adjust clinical parameters like BMI and Glucose to see how much your risk could drop.
                            </p>

                            <Link to="/whatif">
                                {/* Swapped colors: Background is now dark emerald, text is white */}
                                <button className="w-full bg-emerald-700 text-white font-extrabold py-3.5 rounded-2xl shadow-sm hover:bg-emerald-800 transition-colors">
                                    Open Simulator
                                </button>
                            </Link>
                        </div>
                    </div>

                    <div className="card p-8 bg-white border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-center">
                        <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 mb-4">
                            <User size={24} />
                        </div>
                        <h4 className="text-sm font-bold text-slate-900 mb-1">Health Tips</h4>
                        <p className="text-xs text-slate-500 px-4 leading-relaxed">
                            Did you know? Regular walking can reduce diabetes risk by up to 30%.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

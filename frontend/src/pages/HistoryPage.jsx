import React, { useEffect, useState } from 'react';
import { Download, RefreshCw, TrendingUp, Calendar, FileText } from 'lucide-react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import api from '../lib/api';
import toast from 'react-hot-toast';

const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-white shadow-xl border border-slate-200 rounded-2xl p-4 text-sm">
            <p className="text-slate-900 font-bold mb-2 pb-1 border-b border-slate-50">{label}</p>
            {payload.map((p) => (
                <div key={p.dataKey} className="flex items-center justify-between gap-6 py-1">
                    <span className="text-slate-500 font-semibold">{p.name}:</span>
                    <span className="font-black" style={{ color: p.color }}>{p.value}</span>
                </div>
            ))}
        </div>
    );
};

export default function HistoryPage() {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchHistory = async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/history');
            setHistory(data);
        } catch {
            toast.error('Failed to load history.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchHistory(); }, []);

    const handleExport = async () => {
        try {
            const token = JSON.parse(localStorage.getItem('diabetes-auth') || '{}')?.state?.token;
            const res = await fetch('/api/export/csv', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!res.ok) throw new Error();
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'diabetes_history.csv';
            a.click();
            URL.revokeObjectURL(url);
            toast.success('CSV downloaded!');
        } catch {
            toast.error('Export failed.');
        }
    };

    const chartData = [...history].reverse().map((a, idx) => ({
        date: new Date(a.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
        HbA1c: parseFloat(a.HbA1c_level),
        BMI: parseFloat(a.bmi),
        Glucose: parseFloat(a.blood_glucose_level),
        Risk: parseFloat((a.risk_score * 100).toFixed(1)),
        idx,
    }));

    return (
        <div className="space-y-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight">Health History</h2>
                    <p className="text-slate-500 mt-1 font-semibold">Track your metabolic trends and risk progression.</p>
                </div>
                <div className="flex gap-3">
                    <button onClick={fetchHistory} className="btn-ghost flex items-center gap-2 px-6 font-bold" disabled={loading}>
                        <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Refresh
                    </button>
                    <button onClick={handleExport} className="btn-primary flex items-center gap-2 px-6 font-bold shadow-lg shadow-emerald-50" disabled={history.length === 0}>
                        <Download size={16} /> Export CSV
                    </button>
                </div>
            </div>

            {chartData.length > 1 && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="card p-8 bg-white shadow-sm border-slate-100">
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                            <TrendingUp size={14} className="text-red-500" /> Risk Score Probability (%)
                        </h3>
                        <ResponsiveContainer width="100%" height={240}>
                            <LineChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 700 }} axisLine={false} tickLine={false} dy={10} />
                                <YAxis tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 700 }} axisLine={false} tickLine={false} dx={-10} />
                                <Tooltip content={<CustomTooltip />} />
                                <Line type="monotone" dataKey="Risk" name="Risk %" stroke="#ef4444" strokeWidth={4} dot={{ fill: '#ef4444', r: 6, strokeWidth: 3, stroke: '#fff' }} activeDot={{ r: 8, strokeWidth: 0 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="card p-8 bg-white shadow-sm border-slate-100">
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                            <TrendingUp size={14} className="text-emerald-500" /> HbA1c & BMI Indicators
                        </h3>
                        <ResponsiveContainer width="100%" height={240}>
                            <LineChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 700 }} axisLine={false} tickLine={false} dy={10} />
                                <YAxis tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 700 }} axisLine={false} tickLine={false} dx={-10} />
                                <Tooltip content={<CustomTooltip />} />
                                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }} />
                                <Line type="monotone" dataKey="HbA1c" name="HbA1c %" stroke="#8b5cf6" strokeWidth={4} dot={{ fill: '#8b5cf6', r: 6, strokeWidth: 3, stroke: '#fff' }} />
                                <Line type="monotone" dataKey="BMI" name="BMI" stroke="#10b981" strokeWidth={4} dot={{ fill: '#10b981', r: 6, strokeWidth: 3, stroke: '#fff' }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}

            <div className="card bg-white shadow-sm border-slate-100 overflow-hidden">
                <div className="px-8 py-6 border-b border-slate-50 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <FileText size={18} className="text-slate-400" />
                        <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">{history.length} Clinical Records</h3>
                    </div>
                </div>

                {loading ? (
                    <div className="p-20 text-center">
                        <RefreshCw size={40} className="mx-auto text-slate-200 animate-spin mb-4" />
                        <p className="text-slate-400 font-bold uppercase tracking-widest">Loading Records...</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-slate-50">
                                    {['Date', 'BMI', 'HbA1c', 'Glucose', 'Smoking', 'Risk Score', 'Result'].map((h) => (
                                        <th key={h} className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {history.map((a) => (
                                    <tr key={a._id} className="hover:bg-slate-50/50 transition-all">
                                        <td className="px-8 py-5 font-bold text-slate-900 whitespace-nowrap">
                                            {new Date(a.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                                        </td>
                                        <td className="px-8 py-5 font-black text-slate-600">{a.bmi}</td>
                                        <td className="px-8 py-5 font-black text-slate-600">{a.HbA1c_level}%</td>
                                        <td className="px-8 py-5 font-black text-slate-600">{a.blood_glucose_level} <span className="text-[10px] text-slate-300">mg/dL</span></td>
                                        <td className="px-8 py-5 font-bold text-slate-400 capitalize">{a.smoking_history}</td>
                                        <td className="px-8 py-5 font-black text-lg" style={{ color: a.prediction === 1 ? '#ef4444' : '#10b981' }}>
                                            {(a.risk_score * 100).toFixed(1)}%
                                        </td>
                                        <td className="px-8 py-5">
                                            <span className={`text-[10px] font-black px-4 py-2 rounded-xl uppercase tracking-widest ${a.prediction === 1 ? 'badge-high' : 'badge-low'}`}>
                                                {a.prediction === 1 ? 'High Risk' : 'Low Risk'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}

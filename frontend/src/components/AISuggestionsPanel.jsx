import React, { useState } from 'react';
import { UtensilsCrossed, Dumbbell, Leaf, Sparkles, Info } from 'lucide-react';

const TABS = [
    { key: 'diet', label: 'Dietary Plan', icon: <UtensilsCrossed size={16} />, color: '#f59e0b', bg: '#fffbeb', border: '#fef3c7' },
    { key: 'exercise', label: 'Physical Activity', icon: <Dumbbell size={16} />, color: '#3b82f6', bg: '#eff6ff', border: '#dbeafe' },
    { key: 'lifestyle', label: 'Lifestyle Habits', icon: <Leaf size={16} />, color: '#10b981', bg: '#ecfdf5', border: '#d1fae5' },
];

export default function AISuggestionsPanel({ suggestions, riskLevel }) {
    const [activeTab, setActiveTab] = useState('diet');

    if (!suggestions) return null;
    const tab = TABS.find((t) => t.key === activeTab);
    const tips = suggestions[activeTab] || [];

    return (
        <div className="card p-8 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <Sparkles size={18} className="text-emerald-500" />
                        <h3 className="text-xl font-bold text-slate-900">Personalized Health Strategy</h3>
                    </div>
                    <p className="text-sm font-semibold text-slate-500">
                        {riskLevel === 1 ? 'High Risk Protocol: Corrective metabolic actions' : 'Preventive Protocol: Long-term maintenance steps'}
                    </p>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-100 rounded-2xl">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Model: GPT-OSS-120B</span>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex flex-wrap gap-3 mb-8">
                {TABS.map((t) => (
                    <button
                        key={t.key}
                        onClick={() => setActiveTab(t.key)}
                        className="flex items-center gap-2.5 px-6 py-3 rounded-2xl text-sm font-bold transition-all border-2"
                        style={activeTab === t.key
                            ? { background: t.bg, color: t.color, borderColor: t.border, boxShadow: `0 4px 12px ${t.color}15` }
                            : { background: 'white', color: '#64748b', borderColor: '#f1f5f9' }
                        }
                    >
                        <span style={{ color: activeTab === t.key ? t.color : '#94a3b8' }}>{t.icon}</span>
                        {t.label}
                    </button>
                ))}
            </div>

            {/* Tips */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {tips.length > 0 ? tips.map((tip, idx) => (
                    <div key={idx} className="flex flex-col gap-4 p-6 rounded-3xl border-2 transition-all hover:scale-[1.02]"
                        style={{ background: tab.bg, borderColor: tab.border }}>
                        <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-sm font-black shadow-sm"
                            style={{ background: tab.color, color: 'white' }}>
                            {idx + 1}
                        </div>
                        <p className="text-sm font-bold text-slate-700 leading-relaxed">{tip}</p>
                    </div>
                )) : (
                    <p className="text-slate-400 text-sm font-medium italic py-8 border-2 border-dashed border-slate-100 rounded-3xl text-center md:col-span-3">No suggestions generated.</p>
                )}
            </div>

            <div className="mt-8 p-4 bg-slate-50 rounded-2xl flex items-center gap-3">
                <Info size={14} className="text-slate-400" />
                <p className="text-[10px] uppercase font-black tracking-widest text-slate-400">Disclaimer: AI suggestions are for educational purposes and not a prescription.</p>
            </div>
        </div>
    );
}

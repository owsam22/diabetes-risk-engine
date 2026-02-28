import React from 'react';
import { ShieldCheck, ShieldAlert, TrendingUp, Info } from 'lucide-react';

export default function RiskResultCard({ result }) {
    if (!result) return null;
    const isHigh = result.prediction === 1;
    const pct = (result.risk_score * 100).toFixed(1);

    // Circle gauge
    const radius = 54;
    const circumference = 2 * Math.PI * radius;
    const dashOffset = circumference - (result.risk_score * circumference);

    return (
        <div className="card p-8 shadow-lg md:p-10 card-hover border-2" style={{ borderColor: isHigh ? '#fee2e2' : '#d1fae5' }}>
            <div className="flex flex-col md:flex-row items-center gap-10">
                {/* Gauge */}
                <div className="relative flex-shrink-0">
                    <svg width="150" height="150" viewBox="0 0 150 150">
                        {/* Track */}
                        <circle cx="75" cy="75" r={radius} fill="none" stroke="#f1f5f9" strokeWidth="12" />
                        {/* Progress */}
                        <circle
                            cx="75" cy="75" r={radius} fill="none"
                            stroke={isHigh ? '#ef4444' : '#10b981'}
                            strokeWidth="12"
                            strokeLinecap="round"
                            strokeDasharray={circumference}
                            strokeDashoffset={dashOffset}
                            transform="rotate(-90 75 75)"
                            className="transition-all duration-1000 ease-out"
                        />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        {isHigh
                            ? <ShieldAlert size={28} className="text-red-500" />
                            : <ShieldCheck size={28} className="text-emerald-500" />
                        }
                        <span className="text-3xl font-extrabold mt-1 tracking-tight" style={{ color: isHigh ? '#ef4444' : '#059669' }}>{pct}%</span>
                    </div>
                </div>

                {/* Info */}
                <div className="flex-1 text-center md:text-left">
                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mb-5">
                        <span className={`inline-flex items-center gap-2 px-6 py-2 rounded-full text-sm font-bold shadow-sm ${isHigh ? 'badge-high border-red-200' : 'badge-low border-emerald-200'}`}>
                            {isHigh ? <ShieldAlert size={16} /> : <ShieldCheck size={16} />}
                            {isHigh ? 'High Risk Assessment' : 'Low Risk Assessment'}
                        </span>
                        <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-widest">
                            <Info size={14} /> Ref: Clin-ML v2.0
                        </div>
                    </div>

                    <h3 className="text-4xl font-black text-slate-900 mb-3 tracking-tight leading-tight">
                        {isHigh ? 'Attention Required' : 'Healthy Indicators'}
                    </h3>

                    <p className="text-slate-500 text-lg font-medium leading-relaxed mb-8 max-w-xl">
                        {isHigh
                            ? 'Your clinical indicators suggest an elevated probability of diabetes. We recommend sharing these results with your doctor for diagnostic testing.'
                            : 'Your risk score is currently low. Maintaining these healthy clinical values through exercise and diet is recommended for prevention.'}
                    </p>

                    {/* Key metrics summary */}
                    <div className="flex flex-wrap justify-center md:justify-start gap-4">
                        {[
                            { label: 'BMI', value: result.inputs?.bmi, color: 'emerald' },
                            { label: 'HbA1c', value: `${result.inputs?.HbA1c_level}%`, color: 'emerald' },
                            { label: 'Glucose', value: `${result.inputs?.blood_glucose_level} mg/dL`, color: 'emerald' },
                        ].map((m) => (
                            <div key={m.label} className="flex flex-col px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 min-w-[120px]">
                                <span className="text-xs font-extrabold text-slate-400 uppercase tracking-widest mb-1">{m.label}</span>
                                <span className="text-2xl font-black text-slate-900">{m.value}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="mt-10 pt-8 border-t border-slate-100">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-xl text-xs font-bold text-slate-500">
                    <TrendingUp size={14} className="text-emerald-500" /> Probability Score: {result.risk_score.toFixed(4)}
                </div>
            </div>
        </div>
    );
}

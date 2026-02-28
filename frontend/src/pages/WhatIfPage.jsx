import React, { useState, useEffect } from 'react';
import { Sliders, Info, TrendingDown, TrendingUp, Sparkles, Scale, RefreshCw } from 'lucide-react';
import api from '../lib/api';
import toast from 'react-hot-toast';

const SLIDERS = [
    { key: 'bmi', label: 'BMI (Body Mass Index)', min: 15, max: 60, step: 0.5, unit: '', ref_low: 18.5, ref_high: 25, color: '#10b981', bg: '#ecfdf5' },
    { key: 'HbA1c_level', label: 'HbA1c Level', min: 3.5, max: 15, step: 0.1, unit: '%', ref_low: 4, ref_high: 5.7, color: '#8b5cf6', bg: '#f5f3ff' },
    { key: 'blood_glucose_level', label: 'Blood Glucose', min: 50, max: 400, step: 1, unit: ' mg/dL', ref_low: 70, ref_high: 100, color: '#f59e0b', bg: '#fffbeb' },
];

const BASE_PARAMS = {
    gender: 'Male', age: 50, hypertension: 0, heart_disease: 0, smoking_history: 'never',
};

function useDebounce(value, delay) {
    const [debounced, setDebounced] = useState(value);
    useEffect(() => {
        const t = setTimeout(() => setDebounced(value), delay);
        return () => clearTimeout(t);
    }, [value, delay]);
    return debounced;
}

export default function WhatIfPage() {
    const [sliders, setSliders] = useState({ bmi: 27, HbA1c_level: 6.0, blood_glucose_level: 130 });
    const [baseResult, setBaseResult] = useState(null);
    const [simResult, setSimResult] = useState(null);
    const [simulating, setSimulating] = useState(false);
    const debouncedSliders = useDebounce(sliders, 600);

    useEffect(() => {
        const payload = { ...BASE_PARAMS, ...debouncedSliders };
        setSimulating(true);
        api.post('/simulate', payload)
            .then(({ data }) => {
                setSimResult(data);
                if (!baseResult) setBaseResult(data);
            })
            .catch(() => toast.error('Simulation failed.'))
            .finally(() => setSimulating(false));
    }, [debouncedSliders]);

    const setBaseline = () => {
        setBaseResult(simResult);
        toast.success('Baseline recorded!');
    };

    const resetSliders = () => {
        setSliders({ bmi: 27, HbA1c_level: 6.0, blood_glucose_level: 130 });
        setBaseResult(null);
        setSimResult(null);
    };

    const delta = simResult && baseResult ? (simResult.risk_score - baseResult.risk_score) * 100 : null;
    const isHigh = simResult?.prediction === 1;

    return (
        <div className="max-w-4xl mx-auto space-y-10 animate-in fade-in duration-700">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight">Risk Simulator</h2>
                    <p className="text-slate-500 mt-1 font-semibold">Adjust clinical variables to visualize risk mitigation scenarios.</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={setBaseline} className="btn-primary w-auto px-6 shadow-md shadow-emerald-50">Set Baseline</button>
                    <button onClick={resetSliders} className="btn-ghost w-auto px-6 font-bold">Reset</button>
                </div>
            </div>

            <div className="flex items-start gap-4 p-6 rounded-3xl bg-emerald-50 border border-emerald-100 shadow-sm shadow-emerald-50/50">
                <Info size={20} className="text-emerald-500 mt-0.5 flex-shrink-0" />
                <p className="text-sm font-bold text-emerald-800/80 leading-relaxed">
                    This sandbox uses a standard patient profile (Male, Age 50, No comorbidities). Use the sliders to explore how improving your metabolic metrics could lower your predictive diabetes risk.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                {/* Sliders Panel */}
                <div className="lg:col-span-3 card p-10 bg-white">
                    <div className="flex items-center gap-3 mb-10">
                        <div className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400">
                            <Sliders size={20} />
                        </div>
                        <h3 className="text-lg font-black text-slate-900 uppercase tracking-widest">Adjust Variables</h3>
                    </div>

                    <div className="space-y-12">
                        {SLIDERS.map((s) => {
                            const val = sliders[s.key];
                            return (
                                <div key={s.key} className="group">
                                    <div className="flex items-center justify-between mb-4">
                                        <label className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">{s.label}</label>
                                        <div className="px-4 py-1.5 rounded-xl font-black text-lg border-2" style={{ color: s.color, backgroundColor: s.bg, borderColor: s.color + '20' }}>
                                            {val}{s.unit}
                                        </div>
                                    </div>
                                    <input
                                        type="range" min={s.min} max={s.max} step={s.step} value={val}
                                        onChange={(e) => setSliders((prev) => ({ ...prev, [s.key]: parseFloat(e.target.value) }))}
                                        className="slider-range"
                                        style={{ accentColor: s.color }}
                                    />
                                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-400 mt-3 px-1">
                                        <span>Min {s.min}{s.unit}</span>
                                        <span className="text-emerald-500">Optimum Range: {s.ref_low}–{s.ref_high}{s.unit}</span>
                                        <span>Max {s.max}{s.unit}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Results Panel */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="card p-10 bg-white border-2 overflow-hidden relative" style={{ borderColor: isHigh ? '#fee2e2' : '#d1fae5' }}>
                        {simulating && <div className="absolute inset-x-0 top-0 h-1 bg-emerald-500 animate-[loading-bar_1.5s_infinite]" />}
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-8">Simulated Risk</h3>

                        {simResult ? (
                            <div className="text-center">
                                <div className="mb-6 relative inline-block">
                                    <div className="text-6xl font-black tracking-tighter" style={{ color: isHigh ? '#ef4444' : '#10b981' }}>
                                        {(simResult.risk_score * 100).toFixed(1)}%
                                    </div>
                                    {simulating && (
                                        <div className="absolute -right-8 top-0">
                                            <RefreshCw size={16} className="text-slate-300 animate-spin" />
                                        </div>
                                    )}
                                </div>

                                <div className="flex justify-center mb-10">
                                    <span className={`text-[10px] font-black px-6 py-2.5 rounded-2xl uppercase tracking-widest border-2 ${isHigh ? 'badge-high' : 'badge-low'}`}>
                                        {isHigh ? 'High Risk Scenario' : 'Low Risk Scenario'}
                                    </span>
                                </div>

                                <div className="relative pt-1">
                                    <div className="overflow-hidden h-4 mb-4 text-xs flex rounded-2xl bg-slate-50 border border-slate-100">
                                        <div
                                            style={{ width: `${simResult.risk_score * 100}%`, backgroundColor: isHigh ? '#ef4444' : '#10b981' }}
                                            className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center transition-all duration-700 ease-out"
                                        />
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="py-20 text-center text-slate-300">
                                <Scale size={40} className="mx-auto mb-4 opacity-50" />
                                <p className="text-xs uppercase font-black tracking-widest">Awaiting Simulation...</p>
                            </div>
                        )}
                    </div>

                    {baseResult && simResult && delta !== null && (
                        <div className={`card p-8 border-2 shadow-lg transition-all ${delta < 0 ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-100'}`}>
                            <div className="flex items-center gap-6">
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm ${delta < 0 ? 'bg-white text-emerald-500 shadow-emerald-100' : 'bg-white text-red-500 shadow-red-100'}`}>
                                    {delta < 0 ? <TrendingDown size={30} /> : <TrendingUp size={30} />}
                                </div>
                                <div>
                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Impact Analysis</h4>
                                    <p className="text-3xl font-black tracking-tight" style={{ color: delta < 0 ? '#059669' : '#ef4444' }}>
                                        {delta >= 0 ? '+' : ''}{delta.toFixed(1)}% <span className="text-sm font-bold opacity-70 italic tracking-normal ml-1">Risk Delta</span>
                                    </p>
                                </div>
                            </div>
                            <div className="mt-6 pt-6 border-t border-slate-100/50 flex items-start gap-3">
                                <Sparkles size={14} className={delta < 0 ? 'text-emerald-500' : 'text-red-400'} />
                                <p className="text-xs font-bold leading-relaxed text-slate-600">
                                    {delta < -5
                                        ? 'Clinical projection suggests a significant improvement in metabolic health trajectory.'
                                        : delta > 5
                                            ? 'Projected values move patient into an elevated risk category. Corrective action recommended.'
                                            : 'Minor fluctuation from baseline profile detected.'}
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

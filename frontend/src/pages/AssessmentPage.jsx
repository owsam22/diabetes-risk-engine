import React, { useState } from 'react';
import { Send, AlertTriangle, ArrowLeft } from 'lucide-react';
import api from '../lib/api';
import toast from 'react-hot-toast';
import RiskResultCard from '../components/RiskResultCard';
import AISuggestionsPanel from '../components/AISuggestionsPanel';

const ABNORMAL_CHECKS = [
    { field: 'blood_glucose_level', max: 300, msg: '⚠️ Critically high blood glucose detected (>300 mg/dL)' },
    { field: 'HbA1c_level', max: 10, msg: '⚠️ Very high HbA1c level detected (>10%)' },
    { field: 'bmi', max: 40, msg: '⚠️ BMI indicates severe obesity (>40)' },
    { field: 'age', max: 100, msg: '⚠️ Please verify patient age (>100)' },
];

const defaultForm = {
    gender: 'Male',
    age: '',
    hypertension: '0',
    heart_disease: '0',
    smoking_history: 'never',
    bmi: '',
    HbA1c_level: '',
    blood_glucose_level: '',
};

// --- Helper Components Moved Outside to Fix Focus Bug ---
const SelectField = ({ label, name, value, onChange, options }) => (
    <div className="space-y-1.5">
        <label className="block text-sm font-semibold text-slate-700">{label}</label>
        <select name={name} value={value} onChange={onChange} className="input-field">
            {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
    </div>
);

const NumberField = ({ label, name, value, onChange, placeholder, step = '1', min, max }) => (
    <div className="space-y-1.5">
        <label className="block text-sm font-semibold text-slate-700">{label}</label>
        <input type="number" name={name} value={value} onChange={onChange}
            placeholder={placeholder} step={step} min={min} max={max}
            className="input-field" required />
    </div>
);

export default function AssessmentPage() {
    const [form, setForm] = useState(defaultForm);
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));

        // Real-time abnormal value notifications
        const numVal = parseFloat(value);
        if (!isNaN(numVal)) {
            ABNORMAL_CHECKS.forEach((check) => {
                if (check.field === name && numVal > check.max) {
                    toast(check.msg, {
                        icon: '⚠️',
                        style: { background: '#fef2f2', color: '#ef4444', border: '1px solid #fee2e2' },
                        duration: 4000,
                    });
                }
            });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const payload = {
                ...form,
                age: parseInt(form.age),
                hypertension: parseInt(form.hypertension),
                heart_disease: parseInt(form.heart_disease),
                bmi: parseFloat(form.bmi),
                HbA1c_level: parseFloat(form.HbA1c_level),
                blood_glucose_level: parseFloat(form.blood_glucose_level),
            };
            const { data } = await api.post('/predict', payload);
            setResult({ ...data, inputs: payload });
            setSubmitted(true);
            toast.success('Assessment complete!');
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } catch (err) {
            toast.error(err.response?.data?.error || 'Prediction failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setForm(defaultForm);
        setResult(null);
        setSubmitted(false);
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="mb-8">
                <h2 className="text-3xl font-bold text-slate-900 mb-1">Patient Assessment</h2>
                <p className="text-muted text-lg">Enter clinical measurements to calculate diabetes risk probability.</p>
            </div>

            {!submitted ? (
                <div className="card p-8 shadow-sm">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Row 1 */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <SelectField label="Gender" name="gender" value={form.gender} onChange={handleChange} options={[
                                { value: 'Male', label: 'Male' },
                                { value: 'Female', label: 'Female' },
                                { value: 'Other', label: 'Other' },
                            ]} />
                            <NumberField label="Age" name="age" value={form.age} onChange={handleChange} placeholder="e.g. 45" min="1" max="120" />
                        </div>

                        {/* Row 2 */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <SelectField label="Hypertension" name="hypertension" value={form.hypertension} onChange={handleChange} options={[
                                { value: '0', label: 'No' },
                                { value: '1', label: 'Yes' },
                            ]} />
                            <SelectField label="Heart Disease" name="heart_disease" value={form.heart_disease} onChange={handleChange} options={[
                                { value: '0', label: 'No' },
                                { value: '1', label: 'Yes' },
                            ]} />
                        </div>

                        {/* Row 3 */}
                        <SelectField label="Smoking History" name="smoking_history" value={form.smoking_history} onChange={handleChange} options={[
                            { value: 'never', label: 'Never' },
                            { value: 'former', label: 'Former Smoker' },
                            { value: 'current', label: 'Current Smoker' },
                            { value: 'not current', label: 'Not Currently Smoking' },
                        ]} />

                        {/* Row 4 */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                            <NumberField label="BMI" name="bmi" value={form.bmi} onChange={handleChange} placeholder="24.5" step="0.1" min="10" max="80" />
                            <NumberField label="HbA1c Level (%)" name="HbA1c_level" value={form.HbA1c_level} onChange={handleChange} placeholder="5.7" step="0.1" min="3" max="15" />
                            <NumberField label="Blood Glucose (mg/dL)" name="blood_glucose_level" value={form.blood_glucose_level} onChange={handleChange} placeholder="100" min="50" max="500" />
                        </div>

                        {/* Info banner */}
                        <div className="flex items-start gap-3 p-4 rounded-xl bg-slate-50 border border-slate-100">
                            <AlertTriangle size={16} className="text-amber-500 mt-0.5 flex-shrink-0" />
                            <p className="text-xs text-slate-500">Abnormal values (glucose &gt;300, HbA1c &gt;10%, BMI &gt;40) will trigger a warning. AI suggestions are generated via OpenRouter.</p>
                        </div>

                        <button type="submit" disabled={loading} className="btn-primary py-4 text-base shadow-md hover:shadow-lg">
                            {loading ? (
                                <>
                                    <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24" fill="none">
                                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" strokeOpacity="0.3" />
                                        <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
                                    </svg>
                                    Running Diagnostic...
                                </>
                            ) : (
                                <>
                                    <Send size={18} /> Run Diagnostic Prediction
                                </>
                            )}
                        </button>
                    </form>
                </div>
            ) : (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <RiskResultCard result={result} />
                    <AISuggestionsPanel suggestions={result?.ai_suggestions} riskLevel={result?.prediction} />
                    <div className="flex justify-center pt-4">
                        <button onClick={resetForm} className="btn-ghost px-12 py-3 flex items-center gap-2 font-semibold">
                            <ArrowLeft size={16} /> New Assessment
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Activity, Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const login = useAuthStore((s) => s.login);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await login(email, password);
            toast.success('Welcome back!');
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.error || 'Login failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center px-4 bg-slate-50">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-500 text-white mb-4 shadow-lg shadow-emerald-200">
                        <Activity size={28} />
                    </div>
                    <h1 className="text-3xl font-bold text-slate-900">Health<span className="text-emerald-600">Check</span></h1>
                    <p className="text-slate-500 mt-2 text-sm font-medium">Predictive Diabetes Risk Engine</p>
                </div>

                {/* Card */}
                <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-xl shadow-slate-200/50">
                    <div className="mb-6">
                        <h2 className="text-xl font-bold text-slate-900">Sign In</h2>
                        <p className="text-slate-500 text-sm">Welcome back! Please enter your details.</p>
                    </div>

                    {error && (
                        <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-xl p-3 mb-5 text-red-600 text-sm font-medium">
                            <AlertCircle size={16} />
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email Address</label>
                            <div className="relative">
                                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                <br />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="input-field pl-10"
                                    placeholder="name@company.com"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Password</label>
                            <div className="relative">
                                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                <br />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="input-field pl-10 pr-10"
                                    placeholder="••••••••"
                                    required
                                />
                                <button type="button" onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>

                        <button type="submit" disabled={loading} className="btn-primary py-3.5 mt-2 font-bold shadow-md shadow-emerald-100">
                            {loading ? 'Authenticating...' : 'Sign In'}
                        </button>
                    </form>

                    <p className="text-center text-slate-500 text-sm mt-8">
                        Don't have an account?{' '}
                        <Link to="/register" className="text-emerald-600 font-bold hover:underline">
                            Create an account
                        </Link>
                    </p>
                </div>

                <p className="text-center text-slate-400 text-xs mt-8 px-6">
                    This system uses advanced analytics for risk prediction. Always consult with a certified medical professional for diagnosis.
                </p>
            </div>
        </div>
    );
}

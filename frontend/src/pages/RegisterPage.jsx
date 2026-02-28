import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Activity, Mail, Lock, User, Eye, EyeOff, AlertCircle, ArrowLeft } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';

export default function RegisterPage() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const register = useAuthStore((s) => s.register);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (password.length < 6) {
            setError('Password must be at least 6 characters.');
            return;
        }
        setLoading(true);
        try {
            await register(email, password, name);
            toast.success('Success! Welcome to HealthCheck.');
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.error || 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center px-4 bg-slate-50">
            <div className="w-full max-w-md py-12">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-500 text-white mb-4 shadow-lg shadow-emerald-200">
                        <Activity size={28} />
                    </div>
                    <h1 className="text-3xl font-bold text-slate-900">Health<span className="text-emerald-600">Check</span></h1>
                    <p className="text-slate-500 mt-2 text-sm font-medium">Create your patient health profile</p>
                </div>

                <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-xl shadow-slate-200/50">
                    <Link to="/login" className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-600 mb-6 transition-colors">
                        <ArrowLeft size={14} /> Back to Sign In
                    </Link>

                    <div className="mb-6">
                        <h2 className="text-xl font-bold text-slate-900">Create Account</h2>
                        <p className="text-slate-500 text-sm">Join thousands in tracking their health risk.</p>
                    </div>

                    {error && (
                        <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-xl p-3 mb-5 text-red-600 text-sm font-medium">
                            <AlertCircle size={16} />
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Preferred Name</label>
                            <div className="relative">
                                <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                <br />
                                <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                                    className="input-field pl-10" placeholder="e.g. sam" />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email Address</label>
                            <div className="relative">
                                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                <br />
                                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                                    className="input-field pl-10" placeholder="name@email.com" required />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Secure Password</label>
                            <div className="relative">
                                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                <br />
                                <input type={showPassword ? 'text' : 'password'} value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="input-field pl-10 pr-10" placeholder="At least 6 characters" required />
                                <button type="button" onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>

                        <button type="submit" disabled={loading} className="btn-primary py-3.5 mt-2 font-bold shadow-md shadow-emerald-100">
                            {loading ? 'Creating Account...' : 'Get Started'}
                        </button>
                    </form>

                    <p className="text-center text-slate-400 text-sm mt-8 font-medium">
                        Already registered?{' '}
                        <Link to="/login" className="text-emerald-600 font-bold hover:underline">Sign In</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}

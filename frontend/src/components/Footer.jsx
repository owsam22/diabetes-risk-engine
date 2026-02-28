import React from 'react';
import { Github, Heart, Shield, Terminal } from 'lucide-react';

export default function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="mt-auto border-t border-slate-200/60 bg-white/50 backdrop-blur-md py-8 px-6 lg:px-12">
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden">

                {/* Left Side: Brand & Version */}
                <div className="flex flex-col items-center md:items-start gap-1">
                    <div className="flex items-center gap-2 text-slate-900 font-bold tracking-tight">
                        <div className="p-1.5 bg-emerald-500 rounded-lg shadow-sm shadow-emerald-200">
                            <Shield size={16} className="text-white" />
                        </div>
                        <span>Health<span className="text-emerald-600">Check</span></span>
                    </div>
                    <p className="text-[11px] font-medium uppercase tracking-widest text-slate-400">
                        Clinical Decision Support System | v2.0
                    </p>
                </div>

                {/* Center: Developer Credit */}
                <div className="flex items-center justify-center gap-2 px-6 py-2 bg-slate-50 rounded-full border border-slate-100 shadow-sm transition-all hover:bg-white hover:shadow-md group">
                    <span className="text-sm font-medium text-slate-500">Developed with</span>
                    <Heart size={14} className="text-emerald-500 fill-emerald-500 group-hover:scale-110 transition-transform" />
                    <span className="text-sm font-bold text-slate-700">by Sam</span>
                </div>

                {/* Right Side: Links & Socials */}
                <div className="flex items-center gap-5">
                    <a
                        href="https://github.com/owsam22"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-all group"
                    >
                        <div className="p-2 bg-slate-100 rounded-xl group-hover:bg-slate-900 group-hover:text-white transition-colors shadow-sm">
                            <Github size={18} />
                        </div>
                        <span className="text-sm font-semibold hidden sm:block">GitHub</span>
                    </a>

                    <div className="h-4 w-px bg-slate-200 hidden sm:block" />

                    <div className="flex items-center gap-2 text-slate-400">
                        <Terminal size={14} />
                        <span className="text-xs font-mono">© {currentYear}</span>
                    </div>
                </div>
            </div>

            {/* Bottom Subtle Bar (Mobile only) */}
            <div className="md:hidden mt-6 text-center">
                <p className="text-[10px] text-slate-300 font-medium">Empowering Precision Medicine</p>
            </div>
        </footer>
    );
}

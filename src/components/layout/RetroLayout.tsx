import React, { useState, useEffect } from 'react';
import { Terminal, ShieldCheck, Wifi, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
export function RetroLayout({ children }: { children: React.ReactNode }) {
    const [time, setTime] = useState(new Date());
    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);
    return (
        <div className="min-h-screen bg-terminal-black text-terminal-green selection:bg-terminal-green selection:text-terminal-black">
            {/* Top Status Bar */}
            <header className="fixed top-0 left-0 right-0 h-10 border-b border-terminal-green bg-terminal-black/80 backdrop-blur-sm z-50 flex items-center px-4 justify-between text-xs font-mono">
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                        <Terminal size={14} className="animate-pulse" />
                        <span className="font-bold tracking-widest">RUNE_TERMINAL_V1.0</span>
                    </div>
                    <div className="hidden md:flex items-center gap-2 text-terminal-amber">
                        <ShieldCheck size={14} />
                        <span>CONNECTION: SECURE</span>
                    </div>
                </div>
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                        <Wifi size={14} />
                        <span className="animate-pulse">WIKI_UPLINK: ACTIVE</span>
                    </div>
                    <div className="flex items-center gap-2 text-terminal-amber font-bold">
                        <Clock size={14} />
                        <span>{time.toLocaleTimeString()}</span>
                    </div>
                </div>
            </header>
            {/* Main Content Area */}
            <main className="pt-14 pb-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="relative border-2 border-terminal-green/30 p-4 md:p-6 min-h-[calc(100vh-8rem)]">
                    {/* Corner Accents */}
                    <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-terminal-green" />
                    <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-terminal-green" />
                    <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-terminal-green" />
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-terminal-green" />
                    {children}
                </div>
            </main>
            {/* Footer */}
            <footer className="fixed bottom-0 left-0 right-0 h-8 border-t border-terminal-green/30 bg-terminal-black flex items-center px-4 text-[10px] justify-between uppercase tracking-tighter opacity-70">
                <div>SYSTEM_LOAD: NORMAL // CACHE_STATUS: HIT</div>
                <div>EST_TAX_ADJUSTMENT: 1.0% // COPYRIGHT 1999-2024 TERMINAL_CORP</div>
            </footer>
        </div>
    );
}
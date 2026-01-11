import React, { useState, useEffect } from 'react';
import { Terminal, ShieldCheck, Wifi, Clock, LayoutDashboard, Zap, Database, Brain } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Link, useLocation } from 'react-router-dom';
export function RetroLayout({ children }: { children: React.ReactNode }) {
    const [time, setTime] = useState(new Date());
    const location = useLocation();
    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);
    const navItems = [
        { label: 'TERMINAL', path: '/', icon: LayoutDashboard },
        { label: 'FLIPPER', path: '/flipper', icon: Zap },
        { label: 'BUDDY', path: '/buddy', icon: Brain },
        { label: 'INTEL', path: '/intelligence', icon: Database },
    ];
    return (
        <div className="min-h-screen bg-terminal-black text-terminal-green selection:bg-terminal-green selection:text-terminal-black">
            {/* Top Status Bar */}
            <header className="fixed top-0 left-0 right-0 h-10 border-b border-terminal-green bg-terminal-black/80 backdrop-blur-sm z-50 flex items-center px-4 justify-between text-xs font-mono">
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                        <Terminal size={14} className="animate-pulse" />
                        <span className="font-bold tracking-widest">RUNE_TERMINAL_V1.1</span>
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
                        <span className="tabular-nums">{time.toLocaleTimeString()}</span>
                    </div>
                </div>
            </header>
            {/* Folder Tab Navigation */}
            <nav className="fixed top-10 left-0 right-0 h-12 bg-terminal-black border-b border-terminal-green/20 z-40 flex items-end px-4 md:px-8">
                <div className="flex gap-1">
                    {navItems.map((item) => {
                        const isActive = location.pathname === item.path;
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={cn(
                                    "flex items-center gap-2 px-6 py-2 text-xs font-mono border-x border-t transition-all relative",
                                    isActive
                                        ? "bg-terminal-green text-terminal-black border-terminal-green"
                                        : "bg-transparent text-terminal-green border-terminal-green/30 hover:bg-terminal-green/10"
                                )}
                                style={{
                                    clipPath: 'polygon(10% 0%, 90% 0%, 100% 100%, 0% 100%)'
                                }}
                            >
                                <item.icon size={14} />
                                <span className="font-bold">{item.label}</span>
                            </Link>
                        );
                    })}
                </div>
            </nav>
            {/* Main Content Area */}
            <main className="pt-28 pb-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="relative border-2 border-terminal-green/30 p-4 md:p-6 min-h-[calc(100vh-10rem)] bg-terminal-black/40 backdrop-blur-[2px]">
                    {/* Corner Accents */}
                    <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-terminal-green shadow-[0_0_8px_rgba(57,255,20,0.5)]" />
                    <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-terminal-green shadow-[0_0_8px_rgba(57,255,20,0.5)]" />
                    <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-terminal-green shadow-[0_0_8px_rgba(57,255,20,0.5)]" />
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-terminal-green shadow-[0_0_8px_rgba(57,255,20,0.5)]" />
                    {children}
                </div>
            </main>
            {/* Footer */}
            <footer className="fixed bottom-0 left-0 right-0 h-8 border-t border-terminal-green/30 bg-terminal-black flex items-center px-4 text-[10px] justify-between uppercase tracking-tighter opacity-70">
                <div className="flex gap-4">
                    <span>SYSTEM_LOAD: NORMAL // UPLINK: {Math.floor(Math.random() * 100)}ms</span>
                    <span className="hidden md:inline text-terminal-amber animate-pulse">BUDDY_LINK_STABLE</span>
                </div>
                <div>EST_TAX_ADJUSTMENT: 1.0% // COPYRIGHT 1999-2024 TERMINAL_CORP</div>
            </footer>
        </div>
    );
}
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
            <header className="fixed top-0 left-0 right-0 h-10 border-b border-terminal-green bg-terminal-black/90 backdrop-blur-md z-50 flex items-center px-4 justify-between text-xs font-mono shadow-lg transition-shadow duration-300">
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                        <Terminal size={14} className="animate-pulse text-terminal-green" />
                        <span className="font-bold tracking-widest glow-text">RUNE_TERMINAL_V1.1</span>
                    </div>
                    <div className="hidden md:flex items-center gap-2 text-terminal-amber">
                        <ShieldCheck size={14} />
                        <span>CONNECTION: SECURE</span>
                    </div>
                </div>
                <div className="flex items-center gap-4 md:gap-6">
                    <div className="flex items-center gap-2">
                        <Wifi size={14} className="text-terminal-green/80" />
                        <span className="animate-pulse hidden sm:inline">WIKI_UPLINK: ACTIVE</span>
                    </div>
                    <div className="flex items-center gap-2 text-terminal-amber font-bold border-l border-terminal-green/20 pl-4">
                        <Clock size={14} />
                        <span className="tabular-nums">{time.toLocaleTimeString([], { hour12: false })}</span>
                    </div>
                </div>
            </header>
            {/* Folder Tab Navigation */}
            <nav className="fixed top-10 left-0 right-0 h-12 bg-terminal-black border-b border-terminal-green/20 z-40 flex items-end px-2 md:px-8 overflow-x-auto no-scrollbar">
                <div className="flex gap-1 min-w-max pb-px">
                    {navItems.map((item) => {
                        const isActive = location.pathname === item.path;
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={cn(
                                    "flex items-center gap-2 px-4 md:px-6 py-2 text-[10px] md:text-xs font-mono border-x border-t transition-all relative group",
                                    isActive
                                        ? "bg-terminal-green text-terminal-black border-terminal-green"
                                        : "bg-transparent text-terminal-green border-terminal-green/30 hover:bg-terminal-green/10"
                                )}
                                style={{
                                    clipPath: 'polygon(8% 0%, 92% 0%, 100% 100%, 0% 100%)'
                                }}
                            >
                                <item.icon size={14} className={cn(isActive ? "text-terminal-black" : "group-hover:animate-bounce")} />
                                <span className="font-bold tracking-tighter md:tracking-normal">{item.label}</span>
                            </Link>
                        );
                    })}
                </div>
            </nav>
            {/* Main Content Area */}
            <main className="pt-28 pb-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="relative border-2 border-terminal-green/30 p-4 md:p-8 min-h-[calc(100vh-11rem)] bg-terminal-black/40 backdrop-blur-[1px] shadow-[0_0_20px_rgba(57,255,20,0.05)]">
                    {/* Corner Accents */}
                    <div className="absolute -top-1 -left-1 w-6 h-6 border-t-2 border-l-2 border-terminal-green shadow-[0_0_8px_rgba(57,255,20,0.5)]" />
                    <div className="absolute -top-1 -right-1 w-6 h-6 border-t-2 border-r-2 border-terminal-green shadow-[0_0_8px_rgba(57,255,20,0.5)]" />
                    <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-2 border-l-2 border-terminal-green shadow-[0_0_8px_rgba(57,255,20,0.5)]" />
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-2 border-r-2 border-terminal-green shadow-[0_0_8px_rgba(57,255,20,0.5)]" />
                    {children}
                </div>
            </main>
            {/* Footer */}
            <footer className="fixed bottom-0 left-0 right-0 h-8 border-t border-terminal-green/30 bg-terminal-black/95 flex items-center px-4 text-[9px] md:text-[10px] justify-between uppercase tracking-tighter z-50 shadow-[0_-4px_10px_rgba(0,0,0,0.5)]">
                <div className="flex gap-4">
                    <span className="hidden sm:inline">SYSTEM_LOAD: NORMAL</span>
                    <span className="text-terminal-amber animate-pulse">BUDDY_LINK_STABLE</span>
                </div>
                <div className="font-mono text-terminal-green/60">
                    EST_TAX: 1.0% // <span className="text-terminal-green">TERMINAL_CORP © 1999-2024</span>
                </div>
            </footer>
        </div>
    );
}
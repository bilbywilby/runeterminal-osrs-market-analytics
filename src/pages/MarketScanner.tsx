import React, { useState, useMemo, useEffect } from 'react';
import { RetroLayout } from '@/components/layout/RetroLayout';
import { useMarketStore, enrichItem } from '@/store/marketStore';
import { Search, SlidersHorizontal, ArrowUpDown, Volume2, BellRing } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Link } from 'react-router-dom';
export function MarketScanner() {
    const rawItems = useMarketStore(s => s.items);
    const prices = useMarketStore(s => s.prices);
    const favorites = useMarketStore(s => s.favorites);
    const [minRoi, setMinRoi] = useState(2);
    const [minMargin, setMinMargin] = useState(5000);
    const [scanProgress, setScanProgress] = useState(0);
    // Simulated scanning animation
    useEffect(() => {
        const interval = setInterval(() => {
            setScanProgress(prev => (prev + 1) % 101);
        }, 50);
        return () => clearInterval(interval);
    }, []);
    const playAlert = () => {
        try {
            const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'square';
            osc.frequency.setValueAtTime(880, ctx.currentTime);
            gain.gain.setValueAtTime(0.1, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 0.1);
        } catch (e) {
            console.error('Audio alert failed', e);
        }
    };
    const results = useMemo(() => {
        return rawItems
            .map(item => enrichItem(item, prices, favorites))
            .filter(item => item.roi >= minRoi && item.margin >= minMargin)
            .sort((a, b) => b.roi - a.roi)
            .slice(0, 50);
    }, [rawItems, prices, favorites, minRoi, minMargin]);
    return (
        <RetroLayout>
            <div className="max-w-7xl mx-auto space-y-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-[0.2em] uppercase glow-text">Market_Scanner</h1>
                        <p className="text-xs text-terminal-green/50 font-mono">MODULE_04 // FREQUENCY_SWEEP_ACTIVE</p>
                    </div>
                    <div className="w-full md:w-64 space-y-1">
                        <div className="flex justify-between text-[10px] font-mono">
                            <span>SCAN_PROGRESS</span>
                            <span>{scanProgress}%</span>
                        </div>
                        <Progress value={scanProgress} className="h-1 bg-terminal-green/10" />
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border border-terminal-green/20 p-4 bg-terminal-green/5">
                    <div className="space-y-2">
                        <label className="text-[10px] font-mono text-terminal-green/70">MIN_ROI (%)</label>
                        <Input 
                            type="number" 
                            value={minRoi} 
                            onChange={(e) => setMinRoi(Number(e.target.value))}
                            className="bg-terminal-black border-terminal-green/30 h-10 rounded-none text-terminal-green font-mono"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-mono text-terminal-green/70">MIN_MARGIN (GP)</label>
                        <Input 
                            type="number" 
                            value={minMargin} 
                            onChange={(e) => setMinMargin(Number(e.target.value))}
                            className="bg-terminal-black border-terminal-green/30 h-10 rounded-none text-terminal-green font-mono"
                        />
                    </div>
                    <div className="flex items-end gap-2">
                        <Button onClick={playAlert} variant="outline" className="flex-1 border-terminal-green/30 text-terminal-green hover:bg-terminal-green/10 rounded-none h-10 font-mono">
                            <Volume2 size={16} className="mr-2" /> TEST_AUDIO
                        </Button>
                    </div>
                </div>
                <div className="overflow-x-auto border border-terminal-green/20">
                    <table className="w-full text-left font-mono text-xs border-collapse">
                        <thead>
                            <tr className="bg-terminal-green/10 border-b border-terminal-green/20">
                                <th className="p-3 text-terminal-green/50">ITEM_ID</th>
                                <th className="p-3">ASSET_NAME</th>
                                <th className="p-3">BUY_PRICE</th>
                                <th className="p-3">SELL_PRICE</th>
                                <th className="p-3 text-terminal-amber">EST_PROFIT</th>
                                <th className="p-3 text-terminal-green">ROI%</th>
                            </tr>
                        </thead>
                        <tbody>
                            {results.map((item) => (
                                <tr key={item.id} className="border-b border-terminal-green/5 hover:bg-terminal-green/5 transition-colors group">
                                    <td className="p-3 text-terminal-green/30">#{item.id}</td>
                                    <td className="p-3">
                                        <Link to={`/item/${item.id}`} className="text-terminal-green hover:underline font-bold">
                                            {item.name}
                                        </Link>
                                    </td>
                                    <td className="p-3">{item.high.toLocaleString()}</td>
                                    <td className="p-3">{item.low.toLocaleString()}</td>
                                    <td className="p-3 text-terminal-amber">+{item.margin.toLocaleString()}</td>
                                    <td className="p-3">
                                        <div className="flex items-center gap-2">
                                            <div className="w-12 h-1 bg-terminal-green/10">
                                                <div className="h-full bg-terminal-green" style={{ width: `${Math.min(item.roi * 5, 100)}%` }} />
                                            </div>
                                            {item.roi.toFixed(1)}%
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </RetroLayout>
    );
}
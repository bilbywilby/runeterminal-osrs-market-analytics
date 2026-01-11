import React, { useMemo } from 'react';
import { RetroLayout } from '@/components/layout/RetroLayout';
import { useMarketStore, enrichItem } from '@/store/marketStore';
import { Database, Target, TrendingUp, ShieldAlert } from 'lucide-react';
import { Link } from 'react-router-dom';
export function IntelligencePage() {
    const rawItems = useMarketStore(s => s.items);
    const prices = useMarketStore(s => s.prices);
    const favorites = useMarketStore(s => s.favorites);
    const trackedItems = useMemo(() => {
        return rawItems
            .filter(i => favorites.includes(i.id))
            .map(item => enrichItem(item, prices, favorites));
    }, [rawItems, prices, favorites]);
    const stats = useMemo(() => {
        const totalProfit = trackedItems.reduce((acc, curr) => acc + curr.margin, 0);
        const avgRoi = trackedItems.length ? trackedItems.reduce((acc, curr) => acc + curr.roi, 0) / trackedItems.length : 0;
        return { totalProfit, avgRoi };
    }, [trackedItems]);
    return (
        <RetroLayout>
            <div className="max-w-7xl mx-auto py-6 space-y-8">
                <div className="flex items-center gap-4 border-l-4 border-terminal-amber pl-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-widest uppercase text-terminal-amber">Priority_Intel</h1>
                        <p className="text-[10px] font-mono text-terminal-green/50">TRACKING_{trackedItems.length}_HIGH_VALUE_TARGETS</p>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="border border-terminal-green/30 p-6 bg-terminal-green/5">
                        <div className="flex items-center gap-3 mb-4 text-terminal-green">
                            <Target size={20} />
                            <h2 className="font-bold uppercase">Mission_Summary</h2>
                        </div>
                        <div className="space-y-4 font-mono">
                            <div className="flex justify-between">
                                <span className="text-terminal-green/50">POTENTIAL_NET_GAIN:</span>
                                <span className="text-xl font-bold text-terminal-amber">+{stats.totalProfit.toLocaleString()} GP</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-terminal-green/50">AVG_FLIP_ROI:</span>
                                <span className="text-terminal-green">{stats.avgRoi.toFixed(2)}%</span>
                            </div>
                            <div className="h-px bg-terminal-green/10" />
                            <div className="text-[10px] uppercase text-terminal-green/40">
                                STATUS: STANDBY // MONITORING_GE_FREQUENCY
                            </div>
                        </div>
                    </div>
                    <div className="border border-terminal-green/30 p-6 bg-terminal-black flex flex-col justify-center">
                        <div className="flex items-center gap-3 text-terminal-red animate-pulse mb-2">
                            <ShieldAlert size={20} />
                            <h2 className="font-bold uppercase">System_Alerts</h2>
                        </div>
                        <p className="text-xs text-terminal-green/70 font-mono">
                            NO_ANOMALIES_DETECTED. ALL_TRACKED_ASSETS_WITHIN_NORMAL_VOLATILITY_RANGE.
                        </p>
                    </div>
                </div>
                <div className="grid grid-cols-1 gap-4">
                    {trackedItems.length === 0 ? (
                        <div className="h-40 border border-dashed border-terminal-green/20 flex items-center justify-center font-mono opacity-50">
                            NO_TRACKED_TARGETS_IN_DATABASE
                        </div>
                    ) : (
                        trackedItems.map(item => (
                            <Link 
                                key={item.id} 
                                to={`/item/${item.id}`}
                                className="border border-terminal-green/20 p-4 flex items-center justify-between hover:bg-terminal-green/5 transition-colors"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 border border-terminal-green/10 flex items-center justify-center bg-terminal-black">
                                        <img src={`https://static.runescape.wiki/images/${item.icon.replace(/ /g, '_')}`} className="w-6 h-6" alt="" />
                                    </div>
                                    <div>
                                        <div className="font-bold text-terminal-green uppercase">{item.name}</div>
                                        <div className="text-[10px] text-terminal-green/40">LIMIT: {item.limit?.toLocaleString() ?? 'N/A'}</div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-terminal-amber font-bold">+{item.margin.toLocaleString()} GP</div>
                                    <div className="text-[10px] text-terminal-green">{item.roi.toFixed(1)}% ROI</div>
                                </div>
                            </Link>
                        ))
                    )}
                </div>
            </div>
        </RetroLayout>
    );
}
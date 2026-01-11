import React, { useMemo, useState, useEffect } from 'react';
import { RetroLayout } from '@/components/layout/RetroLayout';
import { useMarketStore, enrichItem, UI_THRESHOLDS, EnrichedItem } from '@/store/marketStore';
import { Search, LayoutGrid, List, Zap, TrendingUp, Database } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
export function MarketScanner() {
    const rawItems = useMarketStore(s => s.items);
    const prices = useMarketStore(s => s.prices);
    const history = useMarketStore(s => s.history);
    const favorites = useMarketStore(s => s.favorites);
    const searchQuery = useMarketStore(s => s.searchQuery);
    const setSearchQuery = useMarketStore(s => s.setSearchQuery);
    const viewPreference = useMarketStore(s => s.viewPreference);
    const setViewPreference = useMarketStore(s => s.setViewPreference);
    const scannerConfig = useMarketStore(s => s.scannerConfig);
    const updateScannerConfig = useMarketStore(s => s.updateScannerConfig);
    const lastUpdated = useMarketStore(s => s.lastUpdated);
    const subscribeToPrices = useMarketStore(s => s.subscribeToPrices);
    const [pulse, setPulse] = useState(false);
    const [, setTick] = useState(0);
    useEffect(() => {
        // Subscribe to store event bus for immediate ranking updates
        const unsubscribe = subscribeToPrices(() => {
            setTick(t => t + 1);
            setPulse(true);
            setTimeout(() => setPulse(false), 1000);
        });
        return unsubscribe;
    }, [subscribeToPrices]);
    const results = useMemo(() => {
        const query = searchQuery.toLowerCase();
        return rawItems
            .filter(item => item.name.toLowerCase().includes(query))
            .map(item => enrichItem(item, prices, favorites, history))
            .filter(item =>
                item.metrics.marginVolume >= (scannerConfig.minMarginVolume || 0) &&
                (item.advanced?.historicalVolatility || 0) <= (scannerConfig.maxVolatility || 100)
            )
            .sort((a, b) => (b.metrics.margin * (b.advanced?.turnoverRate || 0)) - (a.metrics.margin * (a.advanced?.turnoverRate || 0)))
            .slice(0, scannerConfig.topN || 50);
    }, [rawItems, prices, favorites, history, searchQuery, scannerConfig]);
    const getVolatilityColor = (score: number) => {
        if (score < UI_THRESHOLDS.volatilityLow) return 'text-terminal-green';
        if (score < UI_THRESHOLDS.volatilityHigh) return 'text-terminal-amber';
        return 'text-terminal-red';
    };
    return (
        <RetroLayout>
            <div className="max-w-7xl mx-auto space-y-8 px-4 py-4 md:py-6 relative">
                <AnimatePresence>
                    {pulse && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 0.1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-terminal-green pointer-events-none z-[60]"
                        />
                    )}
                </AnimatePresence>
                <div className="flex flex-col md:flex-row justify-between items-end gap-6 border-b border-terminal-green/20 pb-6">
                    <div className="space-y-1 flex-1 w-full">
                        <h1 className="text-3xl font-black tracking-tighter uppercase glow-text flex items-center gap-3">
                            <Zap className="text-terminal-amber fill-terminal-amber/20" />
                            Quantum_Flipper_Panel
                        </h1>
                        <div className="flex items-center gap-4 text-[10px] text-terminal-green/50 font-mono uppercase">
                            <span>Liquidity_Heuristics: {pulse ? 'SYNCING_LIVE' : 'IDLE'}</span>
                            <span className="flex items-center gap-1 text-terminal-amber">
                                <Database size={10} /> 
                                HISTORICAL_DEPTH: {history.length}_SNAPS
                            </span>
                        </div>
                    </div>
                    <div className="flex bg-terminal-green/5 border border-terminal-green/20 p-1">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setViewPreference('table')}
                            className={cn("rounded-none h-8 w-10 p-0", viewPreference === 'table' && "bg-terminal-green text-terminal-black")}
                        >
                            <List size={16} />
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setViewPreference('grid')}
                            className={cn("rounded-none h-8 w-10 p-0", viewPreference === 'grid' && "bg-terminal-green text-terminal-black")}
                        >
                            <LayoutGrid size={16} />
                        </Button>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-terminal-green/5 border border-terminal-green/20 p-4">
                    <div className="space-y-1">
                        <label className="text-[9px] font-mono text-terminal-green/70 uppercase">Search_Buffer</label>
                        <Input
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="IDENTIFY_ASSET..."
                            className="bg-terminal-black border-terminal-green/30 h-9 rounded-none text-terminal-green font-mono text-xs uppercase"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[9px] font-mono text-terminal-green/70 uppercase">Min_M×V (GP)</label>
                        <Input
                            type="number"
                            value={scannerConfig.minMarginVolume || ''}
                            onChange={(e) => updateScannerConfig({ minMarginVolume: Number(e.target.value) })}
                            className="bg-terminal-black border-terminal-green/30 h-9 rounded-none text-terminal-green font-mono text-xs"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[9px] font-mono text-terminal-green/70 uppercase">Max_Volatility (%)</label>
                        <Input
                            type="number"
                            value={scannerConfig.maxVolatility || ''}
                            onChange={(e) => updateScannerConfig({ maxVolatility: Number(e.target.value) })}
                            className="bg-terminal-black border-terminal-green/30 h-9 rounded-none text-terminal-green font-mono text-xs"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[9px] font-mono text-terminal-green/70 uppercase">Display_Limit (N)</label>
                        <Input
                            type="number"
                            value={scannerConfig.topN || ''}
                            onChange={(e) => updateScannerConfig({ topN: Number(e.target.value) })}
                            className="bg-terminal-black border-terminal-green/30 h-9 rounded-none text-terminal-green font-mono text-xs"
                        />
                    </div>
                </div>
                <div className="overflow-x-auto border border-terminal-green/20 bg-terminal-black">
                    <table className="w-full text-left font-mono text-[11px] border-collapse min-w-[700px]">
                        <thead>
                            <tr className="bg-terminal-green/10 border-b border-terminal-green/20">
                                <th className="p-3 text-terminal-green/50">ASSET_MAPPING</th>
                                <th className="p-3 text-right">BUY</th>
                                <th className="p-3 text-right">SELL</th>
                                <th className="p-3 text-right">MARGIN</th>
                                <th className="p-3 text-right text-terminal-amber font-bold">ALGO_RANK <TrendingUp size={10} className="inline ml-1" /></th>
                                <th className="p-3 text-right text-terminal-green">ROI%</th>
                                <th className="p-3 text-right">HIST_VOLATILITY</th>
                            </tr>
                        </thead>
                        <tbody>
                            {results.map((item) => (
                                <tr key={item.id} className="border-b border-terminal-green/5 hover:bg-terminal-green/5 transition-colors group h-12">
                                    <td className="p-3">
                                        <Link to={`/item/${item.id}`} className="flex items-center gap-2 text-terminal-green hover:underline font-bold uppercase truncate max-w-[180px]">
                                            <ItemIconSmall item={item} />
                                            {item.name}
                                        </Link>
                                    </td>
                                    <td className="p-3 text-right font-bold">{item.low.toLocaleString()}</td>
                                    <td className="p-3 text-right font-bold">{item.high.toLocaleString()}</td>
                                    <td className="p-3 text-right">
                                        <span className="font-bold underline decoration-terminal-green/30">
                                            +{item.margin.toLocaleString()}
                                        </span>
                                    </td>
                                    <td className="p-3 text-right text-terminal-amber font-bold">
                                        {Math.floor(item.metrics.margin * (item.advanced?.turnoverRate || 0)).toLocaleString()}
                                    </td>
                                    <td className="p-3 text-right font-bold text-terminal-green">{item.roi.toFixed(1)}%</td>
                                    <td className={cn("p-3 text-right font-bold", getVolatilityColor(item.advanced?.historicalVolatility || 0))}>
                                        {item.advanced?.historicalVolatility.toFixed(2)}%
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
function ItemIconSmall({ item, size = "w-5 h-5" }: { item: EnrichedItem, size?: string }) {
    const [failed, setFailed] = useState(false);
    if (failed) return <div className={cn("flex items-center justify-center bg-terminal-green/10 text-terminal-green font-bold text-[10px] shrink-0", size)}>{item.name.charAt(0)}</div>;
    return <img src={`https://static.runescape.wiki/images/${item.icon.replace(/ /g, '_')}`} className={cn("object-contain shrink-0", size)} onError={() => setFailed(true)} />;
}
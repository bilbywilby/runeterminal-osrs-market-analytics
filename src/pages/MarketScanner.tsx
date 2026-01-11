import React, { useMemo, useState, useEffect } from 'react';
import { RetroLayout } from '@/components/layout/RetroLayout';
import { useMarketStore, enrichItem, UI_THRESHOLDS, EnrichedItem } from '@/store/marketStore';
import { Search, LayoutGrid, List, Zap, Database, SlidersHorizontal, Info, TriangleAlert } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
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
    const subscribeToPrices = useMarketStore(s => s.subscribeToPrices);
    const lastUpdated = useMarketStore(s => s.lastUpdated);
    const [pulse, setPulse] = useState(false);
    const [showConfig, setShowConfig] = useState(false);
    useEffect(() => {
        const unsubscribe = subscribeToPrices(() => {
            setPulse(true);
            const timer = setTimeout(() => setPulse(false), 800);
            return () => clearTimeout(timer);
        });
        return unsubscribe;
    }, [subscribeToPrices]);
    const results = useMemo(() => {
        const query = searchQuery.toLowerCase();
        return rawItems
            .filter(item => item.name.toLowerCase().includes(query))
            .map(item => enrichItem(item, prices, favorites, history, scannerConfig))
            .filter(item => {
                const vol = item.advanced?.historicalVolatility ?? 0;
                const mv = item.metrics.marginVolume ?? 0;
                return mv >= (scannerConfig.minMarginVolume || 0) && vol <= (scannerConfig.maxVolatility || 100);
            })
            .sort((a, b) => {
                const scoreA = a.advanced?.rankScore ?? -Infinity;
                const scoreB = b.advanced?.rankScore ?? -Infinity;
                return scoreB - scoreA;
            })
            .slice(0, scannerConfig.topN || 50);
    }, [rawItems, prices, favorites, history, searchQuery, scannerConfig, lastUpdated]);
    const getVolatilityColor = (score: number) => {
        if (score < UI_THRESHOLDS.volatilityLow) return 'text-terminal-green';
        if (score < UI_THRESHOLDS.volatilityHigh) return 'text-terminal-amber';
        return 'text-terminal-red';
    };
    return (
        <RetroLayout>
            <div className="max-w-7xl mx-auto space-y-6 relative">
                <AnimatePresence>
                    {pulse && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 0.05 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-terminal-green pointer-events-none z-[60]"
                        />
                    )}
                </AnimatePresence>
                <div className="flex flex-col md:flex-row justify-between items-end gap-6 border-b border-terminal-green/20 pb-4">
                    <div className="space-y-1 flex-1 w-full">
                        <h1 className="text-3xl font-black tracking-tighter uppercase glow-text flex items-center gap-3">
                            <Zap className="text-terminal-amber fill-terminal-amber/20" />
                            Quantum_Flipper_Panel
                        </h1>
                        <div className="flex items-center gap-4 text-[10px] text-terminal-green/50 font-mono uppercase">
                            <span>ALGO_STATE: {pulse ? 'RECOMPUTING' : 'READY'}</span>
                            <span className="flex items-center gap-1 text-terminal-amber">
                                <Database size={10} />
                                BUFFER: {history.length} SNAPS
                            </span>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowConfig(!showConfig)}
                            className={cn("rounded-none h-8 border-terminal-green/30 text-terminal-green transition-colors", showConfig && "bg-terminal-green text-terminal-black")}
                        >
                            <SlidersHorizontal size={14} className="mr-2" />
                            TUNING
                        </Button>
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
                </div>
                {showConfig && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 bg-terminal-green/5 border border-terminal-green/20 p-4 font-mono overflow-hidden"
                    >
                        <ConfigInput label="SENSITIVITY (GP)" value={scannerConfig.sensitivityGpPerTrade} onChange={v => updateScannerConfig({ sensitivityGpPerTrade: v })} />
                        <ConfigInput label="ALPHA_RISK" value={scannerConfig.alphaRisk} onChange={v => updateScannerConfig({ alphaRisk: v })} />
                        <ConfigInput label="SLIPPAGE (%)" value={scannerConfig.slippage * 100} onChange={v => updateScannerConfig({ slippage: v / 100 })} />
                        <ConfigInput label="HUMAN_CAP" value={scannerConfig.humanCap} onChange={v => updateScannerConfig({ humanCap: v })} />
                        <ConfigInput label="MIN_M×V (GP)" value={scannerConfig.minMarginVolume} onChange={v => updateScannerConfig({ minMarginVolume: v })} />
                        <ConfigInput label="MAX_VOL (%)" value={scannerConfig.maxVolatility} onChange={v => updateScannerConfig({ maxVolatility: v })} />
                    </motion.div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-terminal-green/50" size={16} />
                        <Input
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="IDENTIFY_ASSET..."
                            className="bg-terminal-black border-terminal-green/30 h-10 rounded-none text-terminal-green font-mono text-xs uppercase pl-10"
                        />
                    </div>
                    <div className="flex items-center gap-2 border border-terminal-green/20 bg-terminal-green/5 px-3">
                        <Info size={14} className="text-terminal-amber" />
                        <span className="text-[9px] uppercase text-terminal-green/70">Sorting by Weighted Rank Score</span>
                    </div>
                </div>
                <div className="overflow-x-auto border border-terminal-green/20 bg-terminal-black">
                    {results.length > 0 ? (
                        <table className="w-full text-left font-mono text-[10px] border-collapse min-w-[900px]">
                            <thead>
                                <tr className="bg-terminal-green/10 border-b border-terminal-green/20 uppercase tracking-tighter">
                                    <th className="p-3 text-terminal-green/50">ASSET</th>
                                    <th className="p-3 text-right">BUY/SELL</th>
                                    <th className="p-3 text-right">NET_MARGIN</th>
                                    <th className="p-3 text-right text-terminal-amber">EST_P/HR</th>
                                    <th className="p-3 text-right">VOL %</th>
                                    <th className="p-3 text-right text-terminal-green">RANK_SCORE</th>
                                    <th className="p-3 text-right">SAMPLES</th>
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
                                        <td className="p-3 text-right whitespace-nowrap">
                                            <div className="text-terminal-green/50">{(item.low || 0).toLocaleString()}</div>
                                            <div>{(item.high || 0).toLocaleString()}</div>
                                        </td>
                                        <td className="p-3 text-right font-bold text-terminal-green">
                                            +{(item.margin || 0).toLocaleString()}
                                        </td>
                                        <td className="p-3 text-right text-terminal-amber font-bold">
                                            {item.advanced?.riskAdjustedProfit ? Math.floor(item.advanced.riskAdjustedProfit).toLocaleString() : '---'}
                                        </td>
                                        <td className={cn("p-3 text-right font-bold", getVolatilityColor(item.advanced?.historicalVolatility || 0))}>
                                            {item.advanced?.historicalVolatility.toFixed(2)}%
                                        </td>
                                        <td className="p-3 text-right font-bold text-terminal-green">
                                            {item.advanced?.rankScore.toFixed(2)}
                                        </td>
                                        <td className="p-3 text-right text-terminal-green/40">
                                            {item.advanced?.sampleSize}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div className="p-20 flex flex-col items-center justify-center gap-4 text-terminal-green/40 font-mono uppercase">
                            <TriangleAlert size={40} className="text-terminal-amber animate-pulse" />
                            <div className="text-center">
                                <p className="text-sm font-bold text-terminal-green">ZERO_MATCHES_IN_BUFFER</p>
                                <p className="text-[10px]">Try adjusting volatility or margin-volume thresholds</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </RetroLayout>
    );
}
function ConfigInput({ label, value, onChange }: { label: string, value: number, onChange: (v: number) => void }) {
    return (
        <div className="space-y-1">
            <label className="text-[8px] text-terminal-green/50 uppercase">{label}</label>
            <Input
                type="number"
                value={value}
                onChange={(e) => onChange(Number(e.target.value))}
                className="bg-terminal-black border-terminal-green/30 h-7 rounded-none text-terminal-green text-[10px] p-1 px-2 focus-visible:ring-1 focus-visible:ring-terminal-green/50"
            />
        </div>
    );
}
function ItemIconSmall({ item, size = "w-5 h-5" }: { item: EnrichedItem, size?: string }) {
    const [failed, setFailed] = useState(false);
    if (failed) return <div className={cn("flex items-center justify-center bg-terminal-green/10 text-terminal-green font-bold text-[10px] shrink-0", size)}>{item.name.charAt(0)}</div>;
    return <img src={`https://static.runescape.wiki/images/${item.icon.replace(/ /g, '_')}`} className={cn("object-contain shrink-0", size)} onError={() => setFailed(true)} alt="" />;
}
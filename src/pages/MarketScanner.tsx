import React, { useMemo, useState } from 'react';
import { RetroLayout } from '@/components/layout/RetroLayout';
import { useMarketStore, enrichItem } from '@/store/marketStore';
import { Search, Zap, Database, SlidersHorizontal, Download, Play, TriangleAlert } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { downloadMarketCsv } from '@/lib/api';
import { runBacktestSim } from '@/lib/flippingEngine';
export function MarketScanner() {
    const rawItems = useMarketStore(s => s.items);
    const prices = useMarketStore(s => s.prices);
    const volumes24h = useMarketStore(s => s.volumes24h);
    const history = useMarketStore(s => s.history);
    const perItemAggs = useMarketStore(s => s.perItemAggs);
    const favorites = useMarketStore(s => s.favorites);
    const searchQuery = useMarketStore(s => s.searchQuery);
    const setSearchQuery = useMarketStore(s => s.setSearchQuery);
    const scannerConfig = useMarketStore(s => s.scannerConfig);
    const updateScannerConfig = useMarketStore(s => s.updateScannerConfig);
    const [showConfig, setShowConfig] = useState(false);
    const results = useMemo(() => {
        const query = searchQuery.toLowerCase();
        return rawItems
            .filter(item => item.name.toLowerCase().includes(query))
            .map(item => enrichItem(item, prices, favorites, history, scannerConfig, volumes24h, perItemAggs))
            .filter(item => {
                const vol = item.advanced.historicalVolatility;
                const pot = item.metrics.potentialProfit;
                return pot >= (scannerConfig.minMarginVolume || 0) && vol <= (scannerConfig.maxVolatility || 100);
            })
            .sort((a, b) => b.advanced.rankScore - a.advanced.rankScore)
            .slice(0, scannerConfig.topN || 50);
    }, [rawItems, prices, favorites, history, searchQuery, scannerConfig, volumes24h, perItemAggs]);
    return (
        <RetroLayout>
            <div className="max-w-7xl mx-auto space-y-6">
                <div className="flex flex-col md:flex-row justify-between items-end gap-6 border-b border-terminal-green/20 pb-4">
                    <div className="space-y-1 flex-1">
                        <h1 className="text-3xl font-black tracking-tighter uppercase glow-text flex items-center gap-3">
                            <Zap className="text-terminal-amber" /> Quantum_Scanner_X
                        </h1>
                        <div className="flex items-center gap-4 text-[10px] text-terminal-green/50 font-mono">
                            <span>ALGO: QUANT_RANK_WEIGHTED</span>
                            <span className="text-terminal-amber flex items-center gap-1">
                                <Database size={10} /> BUFFER: {history.length} SNAPS
                            </span>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button onClick={() => setShowConfig(!showConfig)} variant="outline" size="sm" className="rounded-none border-terminal-green/30 text-terminal-green">
                            <SlidersHorizontal size={14} className="mr-2" /> TUNING
                        </Button>
                        <Button onClick={downloadMarketCsv} variant="outline" size="sm" className="rounded-none border-terminal-green/30 text-terminal-green">
                            <Download size={14} className="mr-2" /> EXPORT
                        </Button>
                        <Button onClick={() => runBacktestSim(rawItems)} variant="outline" size="sm" className="rounded-none border-terminal-amber/50 text-terminal-amber">
                            <Play size={14} className="mr-2" /> SIM
                        </Button>
                    </div>
                </div>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-terminal-green/50" size={18} />
                    <Input
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="FILTER_SCAN_RESULTS..."
                        className="bg-terminal-black border-terminal-green/30 text-terminal-green rounded-none pl-10 h-12 font-mono uppercase"
                    />
                </div>
                <AnimatePresence>
                    {showConfig && (
                        <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 bg-terminal-green/5 border border-terminal-green/20 p-4 font-mono overflow-hidden">
                            <ConfigField label="W_MARGIN" value={scannerConfig.weightMargin} onChange={v => updateScannerConfig({ weightMargin: v })} />
                            <ConfigField label="W_VOL" value={scannerConfig.weightVolume} onChange={v => updateScannerConfig({ weightVolume: v })} />
                            <ConfigField label="W_RISK" value={scannerConfig.weightRisk} onChange={v => updateScannerConfig({ weightRisk: v })} />
                            <ConfigField label="MIN_POT" value={scannerConfig.minMarginVolume} onChange={v => updateScannerConfig({ minMarginVolume: v })} />
                            <ConfigField label="MAX_VOL%" value={scannerConfig.maxVolatility} onChange={v => updateScannerConfig({ maxVolatility: v })} />
                            <ConfigField label="SLIP%" value={scannerConfig.slippage * 100} onChange={v => updateScannerConfig({ slippage: v / 100 })} />
                        </motion.div>
                    )}
                </AnimatePresence>
                <div className="overflow-x-auto border border-terminal-green/20">
                    {results.length > 0 ? (
                        <table className="w-full text-left font-mono text-[10px]">
                            <thead className="bg-terminal-green/10 uppercase">
                                <tr>
                                    <th className="p-3">ASSET</th>
                                    <th className="p-3 text-right">NET_MARGIN</th>
                                    <th className="p-3 text-right">VOL_24H</th>
                                    <th className="p-3 text-right text-terminal-amber">POTENTIAL_GP</th>
                                    <th className="p-3 text-right">HIST_VOL %</th>
                                    <th className="p-3 text-right text-terminal-green">QUANT_RANK</th>
                                </tr>
                            </thead>
                            <tbody>
                                {results.map(item => (
                                    <tr key={item.id} className="border-b border-terminal-green/5 hover:bg-terminal-green/5 h-12">
                                        <td className="p-3">
                                            <Link to={`/item/${item.id}`} className="font-bold text-terminal-green uppercase hover:underline">
                                                {item.name}
                                            </Link>
                                        </td>
                                        <td className="p-3 text-right">+{item.margin.toLocaleString()}</td>
                                        <td className="p-3 text-right">{item.metrics.volume24h.toLocaleString()}</td>
                                        <td className="p-3 text-right text-terminal-amber font-bold">
                                            {item.metrics.potentialProfit > 1e6 ? `${(item.metrics.potentialProfit/1e6).toFixed(1)}M` : item.metrics.potentialProfit.toLocaleString()}
                                        </td>
                                        <td className="p-3 text-right">
                                            {item.advanced.historicalVolatility.toFixed(2)}%
                                        </td>
                                        <td className="p-3 text-right text-terminal-green font-bold">{item.advanced.rankScore.toFixed(2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div className="p-20 flex flex-col items-center opacity-50">
                            <TriangleAlert className="mb-2 text-terminal-amber" /> 
                            ZERO_DATA_IN_BUFFER_MATCHING_QUANT_CONSTRAINTS
                        </div>
                    )}
                </div>
            </div>
        </RetroLayout>
    );
}
function ConfigField({ label, value, onChange }: { label: string, value: number, onChange: (v: number) => void }) {
    return (
        <div className="space-y-1">
            <label className="text-[8px] opacity-50">{label}</label>
            <Input type="number" value={value} onChange={e => onChange(Number(e.target.value))} className="bg-terminal-black border-terminal-green/30 h-7 rounded-none text-[10px] p-1" />
        </div>
    );
}
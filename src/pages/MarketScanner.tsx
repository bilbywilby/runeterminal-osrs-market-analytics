import React, { useMemo } from 'react';
import { RetroLayout } from '@/components/layout/RetroLayout';
import { useMarketStore, enrichItem, UI_THRESHOLDS } from '@/store/marketStore';
import { Search, LayoutGrid, List, TrendingUp, AlertTriangle, Zap, Activity } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
export function MarketScanner() {
    const rawItems = useMarketStore(s => s.items);
    const prices = useMarketStore(s => s.prices);
    const favorites = useMarketStore(s => s.favorites);
    const searchQuery = useMarketStore(s => s.searchQuery);
    const setSearchQuery = useMarketStore(s => s.setSearchQuery);
    const viewPreference = useMarketStore(s => s.viewPreference);
    const setViewPreference = useMarketStore(s => s.setViewPreference);
    const scannerConfig = useMarketStore(s => s.scannerConfig);
    const updateScannerConfig = useMarketStore(s => s.updateScannerConfig);
    const results = useMemo(() => {
        const query = searchQuery.toLowerCase();
        return rawItems
            .filter(item => item.name.toLowerCase().includes(query))
            .map(item => enrichItem(item, prices, favorites))
            .filter(item => 
                item.metrics.marginVolume >= scannerConfig.minMarginVolume && 
                item.metrics.volatilityScore <= scannerConfig.maxVolatility
            )
            .sort((a, b) => b.metrics.marginVolume - a.metrics.marginVolume)
            .slice(0, scannerConfig.topN);
    }, [rawItems, prices, favorites, searchQuery, scannerConfig]);
    const getVolatilityColor = (score: number) => {
        if (score < UI_THRESHOLDS.volatilityLow) return 'text-terminal-green';
        if (score < UI_THRESHOLDS.volatilityHigh) return 'text-terminal-amber';
        return 'text-terminal-red';
    };
    const isHighValue = (margin: number, roi: number) => 
        margin >= UI_THRESHOLDS.highMargin && roi >= UI_THRESHOLDS.highRoi;
    return (
        <RetroLayout>
            <div className="max-w-7xl mx-auto space-y-8 px-4 py-4 md:py-6">
                <div className="flex flex-col md:flex-row justify-between items-end gap-6 border-b border-terminal-green/20 pb-6">
                    <div className="space-y-1 flex-1 w-full">
                        <h1 className="text-3xl font-black tracking-tighter uppercase glow-text flex items-center gap-3">
                            <Zap className="text-terminal-amber fill-terminal-amber/20" />
                            Quantum_Flipper_Panel
                        </h1>
                        <p className="text-[10px] text-terminal-green/50 font-mono">LIQUIDITY_HEURISTICS: ENGAGED // RANKING_BY_MARGIN_VOLUME</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-4">
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
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-terminal-green/5 border border-terminal-green/20 p-4">
                    <div className="space-y-1">
                        <label className="text-[9px] font-mono text-terminal-green/70 uppercase">Search_Buffer</label>
                        <div className="relative">
                            <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-terminal-green/40" size={14} />
                            <Input
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="IDENTIFY_ASSET..."
                                className="bg-terminal-black border-terminal-green/30 h-9 pl-8 rounded-none text-terminal-green font-mono text-xs uppercase"
                            />
                        </div>
                    </div>
                    <div className="space-y-1">
                        <label className="text-[9px] font-mono text-terminal-green/70 uppercase">Min_M×V (GP)</label>
                        <Input
                            type="number"
                            value={scannerConfig.minMarginVolume}
                            onChange={(e) => updateScannerConfig({ minMarginVolume: Number(e.target.value) })}
                            className="bg-terminal-black border-terminal-green/30 h-9 rounded-none text-terminal-green font-mono text-xs"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[9px] font-mono text-terminal-green/70 uppercase">Max_Volatility (%)</label>
                        <Input
                            type="number"
                            value={scannerConfig.maxVolatility}
                            onChange={(e) => updateScannerConfig({ maxVolatility: Number(e.target.value) })}
                            className="bg-terminal-black border-terminal-green/30 h-9 rounded-none text-terminal-green font-mono text-xs"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[9px] font-mono text-terminal-green/70 uppercase">Display_Limit (N)</label>
                        <Input
                            type="number"
                            value={scannerConfig.topN}
                            onChange={(e) => updateScannerConfig({ topN: Number(e.target.value) })}
                            className="bg-terminal-black border-terminal-green/30 h-9 rounded-none text-terminal-green font-mono text-xs"
                        />
                    </div>
                </div>
                {viewPreference === 'table' ? (
                    <div className="overflow-x-auto border border-terminal-green/20 bg-terminal-black">
                        <table className="w-full text-left font-mono text-[11px] border-collapse">
                            <thead>
                                <tr className="bg-terminal-green/10 border-b border-terminal-green/20">
                                    <th className="p-3 text-terminal-green/50">ASSET_MAPPING</th>
                                    <th className="p-3 text-right">BUY</th>
                                    <th className="p-3 text-right">SELL</th>
                                    <th className="p-3 text-right">MARGIN</th>
                                    <th className="p-3 text-right text-terminal-amber">M×V (P_CAP)</th>
                                    <th className="p-3 text-right text-terminal-green">ROI%</th>
                                    <th className="p-3 text-right">VOLATILITY</th>
                                </tr>
                            </thead>
                            <tbody>
                                {results.map((item) => (
                                    <tr key={item.id} className="border-b border-terminal-green/5 hover:bg-terminal-green/5 transition-colors group h-12">
                                        <td className="p-3">
                                            <Link to={`/item/${item.id}`} className="flex items-center gap-2 text-terminal-green hover:underline font-bold uppercase truncate max-w-[180px]">
                                                <img src={`https://static.runescape.wiki/images/${item.icon.replace(/ /g, '_')}`} className="w-5 h-5" alt="" />
                                                {item.name}
                                            </Link>
                                        </td>
                                        <td className="p-3 text-right font-bold">{item.low.toLocaleString()}</td>
                                        <td className="p-3 text-right font-bold">{item.high.toLocaleString()}</td>
                                        <td className="p-3 text-right">
                                            <span className={cn("font-bold", isHighValue(item.margin, item.roi) && "text-terminal-green underline decoration-double")}>
                                                +{item.margin.toLocaleString()}
                                            </span>
                                        </td>
                                        <td className="p-3 text-right text-terminal-amber font-bold">
                                            {item.metrics.marginVolume > 1000000 ? `${(item.metrics.marginVolume/1000000).toFixed(1)}M` : item.metrics.marginVolume.toLocaleString()}
                                        </td>
                                        <td className="p-3 text-right font-bold text-terminal-green">{item.roi.toFixed(1)}%</td>
                                        <td className={cn("p-3 text-right font-bold", getVolatilityColor(item.metrics.volatilityScore))}>
                                            {item.metrics.volatilityScore.toFixed(1)}%
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {results.map((item) => (
                            <Link key={item.id} to={`/item/${item.id}`}>
                                <Card className="bg-terminal-black border-terminal-green/30 rounded-none p-4 hover:border-terminal-green transition-all group h-full flex flex-col gap-4">
                                    <div className="flex justify-between items-start">
                                        <div className="flex gap-2">
                                            <div className="p-1 border border-terminal-green/20 bg-terminal-green/5">
                                                <img src={`https://static.runescape.wiki/images/${item.icon.replace(/ /g, '_')}`} className="w-8 h-8 object-contain" alt="" />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-xs uppercase group-hover:animate-text-glitch truncate max-w-[100px]">{item.name}</h3>
                                                <p className="text-[9px] text-terminal-green/40 font-mono">ID_{item.id}</p>
                                            </div>
                                        </div>
                                        <Badge variant="outline" className="rounded-none border-terminal-amber text-terminal-amber text-[9px]">
                                            ROI {item.roi.toFixed(1)}%
                                        </Badge>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-[10px] font-mono">
                                            <span className="text-terminal-green/50">PROFIT_H:</span>
                                            <span className="text-terminal-green font-bold">+{item.metrics.profitPerHour.toLocaleString()} GP</span>
                                        </div>
                                        <div className="flex justify-between text-[10px] font-mono">
                                            <span className="text-terminal-green/50">CAPACITY:</span>
                                            <span className="text-terminal-amber font-bold">{item.metrics.marginVolume > 1000000 ? `${(item.metrics.marginVolume/1000000).toFixed(1)}M` : item.metrics.marginVolume.toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between text-[10px] font-mono">
                                            <span className="text-terminal-green/50">VOLATILITY:</span>
                                            <span className={cn("font-bold", getVolatilityColor(item.metrics.volatilityScore))}>{item.metrics.volatilityScore.toFixed(1)}%</span>
                                        </div>
                                    </div>
                                    <div className="mt-auto pt-2 border-t border-terminal-green/10 flex justify-between items-end">
                                        <div className="text-[9px] font-mono text-terminal-green/30 uppercase">Net_Margin</div>
                                        <div className="text-lg font-black glow-text">+{item.margin.toLocaleString()}</div>
                                    </div>
                                </Card>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </RetroLayout>
    );
}
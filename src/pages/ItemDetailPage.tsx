import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { RetroLayout } from '@/components/layout/RetroLayout';
import { useMarketStore, enrichItem } from '@/store/marketStore';
import { fetchItemTimeseries, TimeseriesPoint } from '@/lib/api';
import { ItemChart } from '@/components/market/ItemChart';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Star, Copy, Calculator, Info } from 'lucide-react';
import { toast } from 'sonner';
export function ItemDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const itemId = parseInt(id || '0');
    const items = useMarketStore(s => s.items);
    const prices = useMarketStore(s => s.prices);
    const favorites = useMarketStore(s => s.favorites);
    const toggleFavorite = useMarketStore(s => s.toggleFavorite);
    const [chartData, setChartData] = useState<TimeseriesPoint[]>([]);
    const [isLoadingChart, setIsLoadingChart] = useState(true);
    const item = useMemo(() => {
        const raw = items.find(i => i.id === itemId);
        return raw ? enrichItem(raw, prices, favorites) : null;
    }, [items, prices, favorites, itemId]);
    useEffect(() => {
        if (!itemId) return;
        const loadTimeline = async () => {
            setIsLoadingChart(true);
            try {
                const data = await fetchItemTimeseries(itemId, '1h');
                setChartData(data);
            } catch (error) {
                console.error('Failed to load chart data', error);
            } finally {
                setIsLoadingChart(false);
            }
        };
        loadTimeline();
    }, [itemId]);
    if (!item) {
        return (
            <RetroLayout>
                <div className="flex flex-col items-center justify-center h-64 font-mono">
                    <p className="text-terminal-red mb-4 tracking-widest animate-pulse">ERROR: ITEM_NOT_FOUND [ID_{id}]</p>
                    <Button onClick={() => navigate('/')} variant="outline" className="border-terminal-green text-terminal-green rounded-none">
                        RETURN_TO_BASE
                    </Button>
                </div>
            </RetroLayout>
        );
    }
    const copyToClipboard = (val: number, label: string) => {
        navigator.clipboard.writeText(val.toString());
        toast.success(`COPIED_${label}: ${val}gp`);
    };
    return (
        <RetroLayout>
            <div className="mb-6 flex items-center justify-between">
                <Button onClick={() => navigate('/')} variant="ghost" className="text-terminal-green hover:bg-terminal-green/10 rounded-none p-2 h-8">
                    <ArrowLeft size={16} className="mr-2" />
                    BACK_TO_TERMINAL
                </Button>
                <Button
                    onClick={() => toggleFavorite(item.id)}
                    variant="ghost"
                    className={`rounded-none h-8 ${item.isFavorite ? 'text-terminal-amber' : 'text-terminal-green/50'}`}
                >
                    <Star size={16} className={item.isFavorite ? 'fill-terminal-amber' : ''} />
                    {item.isFavorite ? 'FAVORITED' : 'MARK_AS_TARGET'}
                </Button>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1 space-y-6">
                    <div className="border border-terminal-green/30 p-6 bg-terminal-green/5 relative">
                        <div className="absolute top-2 right-2 opacity-20">
                            <Info size={40} />
                        </div>
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-16 h-16 border border-terminal-green/30 flex items-center justify-center bg-terminal-black">
                                <img
                                    src={`https://static.runescape.wiki/images/${item.icon.replace(/ /g, '_')}`}
                                    alt={item.name}
                                    className="w-12 h-12 object-contain"
                                />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold tracking-tighter uppercase glow-text leading-none">{item.name}</h1>
                                <p className="text-[10px] text-terminal-green/50 font-mono mt-1">UUID: {item.id} // TYPE: {item.members ? 'MEMBERS' : 'F2P'}</p>
                            </div>
                        </div>
                        <p className="text-xs italic text-terminal-green/80 font-mono border-l-2 border-terminal-green/20 pl-3 py-2">
                            "{item.examine}"
                        </p>
                    </div>
                    <div className="border border-terminal-green/30 p-6 space-y-4">
                        <h3 className="text-sm font-bold flex items-center gap-2 border-b border-terminal-green/20 pb-2">
                            <Calculator size={14} /> FLIPPING_CALCULATOR
                        </h3>
                        <div className="space-y-3 font-mono text-sm">
                            <div className="flex justify-between items-center group cursor-pointer" onClick={() => copyToClipboard(item.high, 'BUY_PRICE')}>
                                <span className="text-terminal-green/60">BUY_PRICE:</span>
                                <span className="flex items-center gap-2 text-terminal-green font-bold">
                                    {item.high.toLocaleString()}gp <Copy size={12} className="opacity-0 group-hover:opacity-100" />
                                </span>
                            </div>
                            <div className="flex justify-between items-center group cursor-pointer" onClick={() => copyToClipboard(item.low, 'SELL_PRICE')}>
                                <span className="text-terminal-green/60">SELL_PRICE:</span>
                                <span className="flex items-center gap-2 text-terminal-amber font-bold">
                                    {item.low.toLocaleString()}gp <Copy size={12} className="opacity-0 group-hover:opacity-100" />
                                </span>
                            </div>
                            <div className="h-px bg-terminal-green/20 my-2" />
                            <div className="flex justify-between">
                                <span className="text-terminal-green/60 text-xs">GROSS_MARGIN:</span>
                                <span>{(item.high - item.low).toLocaleString()}gp</span>
                            </div>
                            <div className="flex justify-between text-terminal-red/80">
                                <span className="text-xs">EST_GE_TAX (1%):</span>
                                <span>-{Math.floor(item.high * 0.01).toLocaleString()}gp</span>
                            </div>
                            <div className="flex justify-between items-end pt-2">
                                <span className="text-terminal-green font-bold">NET_PROFIT:</span>
                                <span className="text-xl font-bold glow-text">+{item.margin.toLocaleString()}gp</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="lg:col-span-2 border border-terminal-green/30 p-6 bg-terminal-black">
                    <div className="flex justify-between items-center border-b border-terminal-green/20 pb-4 mb-4">
                        <h2 className="font-bold tracking-widest text-lg uppercase flex items-center gap-3">
                            <span className="w-2 h-2 bg-terminal-green animate-pulse" />
                            PRICE_HISTORY_LOG
                        </h2>
                    </div>
                    <ItemChart data={chartData} isLoading={isLoadingChart} />
                </div>
            </div>
        </RetroLayout>
    );
}
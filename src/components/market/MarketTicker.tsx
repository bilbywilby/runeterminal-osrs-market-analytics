import React, { useMemo } from 'react';
import { useMarketStore, enrichItem } from '@/store/marketStore';
import { TrendingUp, TrendingDown, Activity } from 'lucide-react';
export function MarketTicker() {
    const items = useMarketStore(s => s.items);
    const prices = useMarketStore(s => s.prices);
    const favorites = useMarketStore(s => s.favorites);
    const isLoading = useMarketStore(s => s.isLoading);
    const enrichedDisplayItems = useMemo(() => {
        if (!items.length || Object.keys(prices).length === 0) return [];
        // Filter for active items with valid price data to avoid "0gp" flickering
        const validItems = items
            .filter(item => prices[item.id] && prices[item.id].high > 0)
            .slice(0, 15)
            .map(item => enrichItem(item, prices, favorites));
        if (validItems.length === 0) return [];
        // Duplicate for seamless infinite loop
        return [...validItems, ...validItems];
    }, [items, prices, favorites]);
    if (isLoading && enrichedDisplayItems.length === 0) {
        return (
            <div className="w-full bg-terminal-green/5 border-y border-terminal-green/20 py-2 mb-6 overflow-hidden">
                <div className="flex items-center justify-center gap-3 text-xs font-mono animate-pulse">
                    <Activity size={14} />
                    <span>SYNCHRONIZING_MARKET_FREQUENCIES...</span>
                </div>
            </div>
        );
    }
    if (enrichedDisplayItems.length === 0) return null;
    return (
        <div className="w-full bg-terminal-green/5 border-y border-terminal-green/20 py-2 overflow-hidden whitespace-nowrap mb-6 shadow-[inset_0_0_10px_rgba(57,255,20,0.05)]">
            <div className="flex animate-marquee hover:[animation-play-state:paused] cursor-default">
                {enrichedDisplayItems.map((item, idx) => (
                    <div key={`${item.id}-${idx}`} className="flex items-center gap-3 px-10 font-mono text-xs md:text-sm border-r border-terminal-green/10">
                        <span className="text-terminal-green/40">#</span>
                        <span className="text-terminal-amber font-bold uppercase">{item.name}</span>
                        <span className="text-terminal-green glow-text">
                            {item.high.toLocaleString()}GP
                        </span>
                        {item.roi > 5 ? (
                            <TrendingUp size={14} className="text-terminal-green drop-shadow-[0_0_2px_#39ff14]" />
                        ) : (
                            <TrendingDown size={14} className="text-terminal-red opacity-50" />
                        )}
                        <span className={cn(
                            "font-bold",
                            item.roi > 5 ? 'text-terminal-green' : 'text-terminal-green/50'
                        )}>
                            {item.roi.toFixed(1)}%
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}
import { cn } from '@/lib/utils';
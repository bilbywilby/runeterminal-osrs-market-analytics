import React from 'react';
import { useMarketStore, selectEnrichedItems } from '@/store/marketStore';
import { TrendingUp, TrendingDown } from 'lucide-react';
export function MarketTicker() {
    const items = useMarketStore(selectEnrichedItems);
    // Create a duplicated list for seamless marquee
    const displayItems = [...items.slice(0, 15), ...items.slice(0, 15)];
    if (items.length === 0) return null;
    return (
        <div className="w-full bg-terminal-green/5 border-y border-terminal-green/20 py-2 overflow-hidden whitespace-nowrap mb-6">
            <div className="flex animate-marquee">
                {displayItems.map((item, idx) => (
                    <div key={`${item.id}-${idx}`} className="flex items-center gap-2 px-8 font-mono text-sm border-r border-terminal-green/10">
                        <span className="text-terminal-amber">{item.name}</span>
                        <span className="text-terminal-green font-bold">
                            {item.high.toLocaleString()}gp
                        </span>
                        {item.roi > 5 ? (
                            <TrendingUp size={14} className="text-terminal-green" />
                        ) : (
                            <TrendingDown size={14} className="text-terminal-red opacity-50" />
                        )}
                        <span className={item.roi > 5 ? 'text-terminal-green' : 'text-terminal-muted'}>
                            {item.roi.toFixed(1)}%
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}
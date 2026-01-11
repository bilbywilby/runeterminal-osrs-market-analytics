import React from 'react';
import { useMarketStore, selectEnrichedItems } from '@/store/marketStore';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
export function ItemGrid() {
    const items = useMarketStore(selectEnrichedItems);
    const isLoading = useMarketStore(s => s.isLoading);
    if (isLoading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => (
                    <div key={i} className="h-40 border border-terminal-green/20 animate-pulse bg-terminal-green/5" />
                ))}
            </div>
        );
    }
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {items.map((item) => (
                <Card key={item.id} className="bg-terminal-black border-terminal-green/30 hover:border-terminal-green transition-colors rounded-none p-4 flex flex-col gap-3 group">
                    <div className="flex justify-between items-start">
                        <div className="flex gap-3">
                            <div className="w-10 h-10 border border-terminal-green/20 flex items-center justify-center bg-terminal-green/5">
                                <img 
                                    src={`https://static.runescape.wiki/images/${item.icon.replace(/ /g, '_')}`} 
                                    alt={item.name}
                                    className="w-8 h-8 object-contain"
                                    onError={(e) => (e.currentTarget.style.display = 'none')}
                                />
                            </div>
                            <div>
                                <h3 className="text-terminal-green font-bold text-sm leading-tight group-hover:animate-text-glitch truncate max-w-[150px]">
                                    {item.name}
                                </h3>
                                <p className="text-[10px] text-terminal-green/50 uppercase">Limit: {item.limit?.toLocaleString() ?? '???'}</p>
                            </div>
                        </div>
                        <Badge variant="outline" className="border-terminal-amber text-terminal-amber rounded-none text-[10px]">
                            ROI {item.roi.toFixed(1)}%
                        </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                        <div className="border border-terminal-green/10 p-1">
                            <div className="text-terminal-green/50 uppercase">Buy (High)</div>
                            <div className="text-terminal-green">{item.high.toLocaleString()}</div>
                        </div>
                        <div className="border border-terminal-green/10 p-1">
                            <div className="text-terminal-green/50 uppercase">Sell (Low)</div>
                            <div className="text-terminal-green">{item.low.toLocaleString()}</div>
                        </div>
                    </div>
                    <div className="mt-auto pt-2 border-t border-terminal-green/20 flex justify-between items-center">
                        <span className="text-[10px] text-terminal-green/50">EST_PROFIT:</span>
                        <span className="text-sm font-bold text-terminal-green">+{item.margin.toLocaleString()}gp</span>
                    </div>
                </Card>
            ))}
        </div>
    );
}
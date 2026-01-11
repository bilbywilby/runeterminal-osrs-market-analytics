import React from 'react';
import { useMarketStore, selectEnrichedItems, selectIsLoading } from '@/store/marketStore';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star } from 'lucide-react';
import { Link } from 'react-router-dom';
export function ItemGrid() {
    const items = useMarketStore(selectEnrichedItems);
    const isLoading = useMarketStore(selectIsLoading);
    const toggleFavorite = useMarketStore(s => s.toggleFavorite);
    if (isLoading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {[...Array(8)].map((_, i) => (
                    <div key={i} className="h-40 border border-terminal-green/20 animate-pulse bg-terminal-green/5" />
                ))}
            </div>
        );
    }
    if (items.length === 0) {
        return (
            <div className="h-64 border border-dashed border-terminal-green/20 flex flex-col items-center justify-center font-mono opacity-50">
                <p>ZERO_RESULTS_IN_BUFFER</p>
                <p className="text-[10px]">ADJUST_FILTERS_AND_RETRY</p>
            </div>
        );
    }
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {items.map((item) => (
                <Link key={item.id} to={`/item/${item.id}`} className="block focus:outline-none">
                    <Card className="bg-terminal-black border-terminal-green/30 hover:border-terminal-green transition-all rounded-none p-4 flex flex-col gap-3 group relative h-full">
                        {/* Favorite Button Overlay */}
                        <button 
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                toggleFavorite(item.id);
                            }}
                            className="absolute top-2 right-2 z-10 p-1 hover:scale-110 transition-transform"
                        >
                            <Star 
                                size={14} 
                                className={item.isFavorite ? 'fill-terminal-amber text-terminal-amber' : 'text-terminal-green/20 hover:text-terminal-green/50'} 
                            />
                        </button>
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
                                    <h3 className="text-terminal-green font-bold text-sm leading-tight group-hover:animate-text-glitch truncate max-w-[120px]">
                                        {item.name}
                                    </h3>
                                    <p className="text-[10px] text-terminal-green/50 uppercase">Limit: {item.limit?.toLocaleString() ?? '???'}</p>
                                </div>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                                <Badge variant="outline" className="border-terminal-amber text-terminal-amber rounded-none text-[9px] px-1 h-5">
                                    ROI {item.roi.toFixed(1)}%
                                </Badge>
                                <span className="text-[8px] opacity-0 group-hover:opacity-100 transition-opacity font-mono animate-pulse">ANALYZING...</span>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                            <div className="border border-terminal-green/10 p-1 bg-terminal-green/5">
                                <div className="text-terminal-green/40 uppercase text-[9px]">High (Buy)</div>
                                <div className="text-terminal-green">{item.high > 1000000 ? `${(item.high/1000000).toFixed(1)}m` : item.high.toLocaleString()}</div>
                            </div>
                            <div className="border border-terminal-green/10 p-1">
                                <div className="text-terminal-green/40 uppercase text-[9px]">Low (Sell)</div>
                                <div className="text-terminal-green">{item.low > 1000000 ? `${(item.low/1000000).toFixed(1)}m` : item.low.toLocaleString()}</div>
                            </div>
                        </div>
                        <div className="mt-auto pt-2 border-t border-terminal-green/20 flex justify-between items-center">
                            <span className="text-[9px] text-terminal-green/50">EST_NET:</span>
                            <span className="text-sm font-bold text-terminal-green glow-text">
                                +{item.margin > 1000 ? `${(item.margin/1000).toFixed(1)}k` : item.margin}gp
                            </span>
                        </div>
                    </Card>
                </Link>
            ))}
        </div>
    );
}
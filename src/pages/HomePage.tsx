import React, { useEffect, useState, useRef } from 'react';
import { RetroLayout } from '@/components/layout/RetroLayout';
import { MarketTicker } from '@/components/market/MarketTicker';
import { ItemGrid } from '@/components/market/ItemGrid';
import { useMarketStore } from '@/store/marketStore';
import { Search, RotateCcw, Loader2, Database } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Toaster, toast } from 'sonner';
export function HomePage() {
    const loadData = useMarketStore(s => s.loadData);
    const refreshPrices = useMarketStore(s => s.refreshPrices);
    const searchQuery = useMarketStore(s => s.searchQuery);
    const setSearchQuery = useMarketStore(s => s.setSearchQuery);
    const lastUpdated = useMarketStore(s => s.lastUpdated);
    const historyLength = useMarketStore(s => s.history.length);
    const isLoading = useMarketStore(s => s.isLoading);
    const [isSyncing, setIsSyncing] = useState(false);
    const lastPulseRef = useRef<number>(0);
    useEffect(() => {
        loadData();
    }, [loadData]);
    useEffect(() => {
        const interval = setInterval(() => {
            const now = Date.now();
            // Guard against double triggers or excessive polling during re-mounts
            if (!isSyncing && !isLoading && (now - lastPulseRef.current > 110000)) {
                lastPulseRef.current = now;
                refreshPrices().catch(err => {
                    console.error("[AUTO_SYNC_ERR]", err);
                });
            }
        }, 120000); 
        return () => clearInterval(interval);
    }, [isSyncing, isLoading, refreshPrices]);
    const handleManualRefresh = async () => {
        if (isSyncing || isLoading) return;
        setIsSyncing(true);
        try {
            await refreshPrices();
            toast.success('UPLINK_SYNC_SUCCESS', {
                description: 'MARKET_DATA_LOCKED_AND_LOADED'
            });
        } catch (error: any) {
            if (error?.message?.includes('429')) {
                toast.error('UPLINK_THROTTLED', {
                    description: 'WIKI_SERVER_LIMIT_REACHED. STAND_BY.'
                });
            } else {
                toast.error('UPLINK_SYNC_FAILED', {
                    description: 'CONNECTION_INTERRUPTED'
                });
            }
        } finally {
            setIsSyncing(false);
        }
    };
    return (
        <RetroLayout>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="py-6 md:py-8 lg:py-10 space-y-8">
                    <MarketTicker />
                    <div className="flex flex-col md:flex-row gap-6 items-end">
                        <div className="flex-1 w-full group">
                            <label className="text-[10px] text-terminal-green/70 mb-2 block uppercase font-mono tracking-widest flex items-center gap-2">
                                <Database size={12} className="text-terminal-amber" />
                                INGRESS_FILTER {'>'} GRAND_EXCHANGE_INDEX
                            </label>
                            <div className="relative group-focus-within:shadow-[0_0_15px_rgba(57,255,20,0.15)] transition-shadow duration-300">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-terminal-green/50" size={18} />
                                <Input
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="SEARCH_MARKET_DATABASE..."
                                    className="bg-terminal-black border-terminal-green/30 text-terminal-green rounded-none pl-12 h-14 font-mono uppercase focus:border-terminal-green text-sm md:text-base placeholder:text-terminal-green/20"
                                />
                            </div>
                        </div>
                        <Button
                            onClick={handleManualRefresh}
                            disabled={isSyncing || isLoading}
                            variant="outline"
                            className="border-terminal-green/30 text-terminal-green hover:bg-terminal-green/20 rounded-none h-14 px-8 font-mono min-w-[200px] uppercase font-bold tracking-tighter"
                        >
                            {isSyncing ? <Loader2 className="animate-spin mr-3" size={18} /> : <RotateCcw className="mr-3" size={18} />}
                            {isSyncing ? 'SYNCING...' : 'RE_SYNC_UPLINK'}
                        </Button>
                    </div>
                    <div className="space-y-6 pt-4">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end border-b border-terminal-green/10 pb-3 gap-2">
                            <h2 className="text-xl md:text-2xl font-bold tracking-[0.3em] uppercase glow-text">
                                {searchQuery ? 'SEARCH_RESULTS' : 'TOP_MARKET_FLIPS'}
                            </h2>
                            <div className="text-[10px] font-mono text-terminal-green/40 text-left sm:text-right uppercase leading-tight">
                                PULSE: 120s // LAST_UPLINK: {lastUpdated ? new Date(lastUpdated).toLocaleTimeString() : 'INITIALIZING...'} <br/>
                                CACHE_STATE: {historyLength} / {isLoading ? 'SYNCING' : 'STABLE'}
                            </div>
                        </div>
                        <ItemGrid
                            variant={(!searchQuery && !isLoading) ? 'line' : 'card'}
                            limit={(!searchQuery && !isLoading) ? 20 : 64}
                        />
                    </div>
                </div>
            </div>
            <Toaster 
                theme="dark" 
                position="bottom-right" 
                toastOptions={{
                    style: {
                        background: '#050505',
                        border: '1px solid #39ff14',
                        color: '#39ff14',
                        borderRadius: '0px',
                        fontFamily: 'monospace',
                        textTransform: 'uppercase',
                        fontSize: '11px'
                    }
                }} 
            />
        </RetroLayout>
    );
}
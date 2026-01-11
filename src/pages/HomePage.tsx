import React, { useEffect, useState } from 'react';
import { RetroLayout } from '@/components/layout/RetroLayout';
import { MarketTicker } from '@/components/market/MarketTicker';
import { ItemGrid } from '@/components/market/ItemGrid';
import { useMarketStore } from '@/store/marketStore';
import { Search, RotateCcw, Loader2 } from 'lucide-react';
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
    useEffect(() => {
        loadData();
    }, [loadData]);
    useEffect(() => {
        const interval = setInterval(() => {
            if (!isSyncing && !isLoading) {
                refreshPrices().catch(err => console.error("[SYNC_ERR]", err));
            }
        }, 120000); // 120s polling interval
        return () => clearInterval(interval);
    }, [isSyncing, isLoading, refreshPrices]);
    const handleManualRefresh = async () => {
        if (isSyncing) return;
        setIsSyncing(true);
        try {
            await refreshPrices();
            toast.success('UPLINK_SYNC_SUCCESS');
        } catch (error) {
            toast.error('UPLINK_SYNC_FAILED');
        } finally {
            setIsSyncing(false);
        }
    };
    return (
        <RetroLayout>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="py-8 md:py-10 lg:py-12 space-y-8">
                    <MarketTicker />
                    <div className="flex flex-col md:flex-row gap-4 items-end">
                        <div className="flex-1 w-full">
                            <label className="text-[10px] text-terminal-green/70 mb-1 block uppercase font-mono tracking-widest">
                                INGRESS_FILTER {'>'} GRAND_EXCHANGE_INDEX
                            </label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-terminal-green/50" size={18} />
                                <Input
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="SEARCH_MARKET_DATABASE..."
                                    className="bg-terminal-black border-terminal-green/30 text-terminal-green rounded-none pl-10 h-12 font-mono uppercase focus:border-terminal-green"
                                />
                            </div>
                        </div>
                        <Button
                            onClick={handleManualRefresh}
                            disabled={isSyncing || isLoading}
                            variant="outline"
                            className="border-terminal-green/30 text-terminal-green hover:bg-terminal-green/10 rounded-none h-12 font-mono min-w-[160px] uppercase"
                        >
                            {isSyncing ? <Loader2 className="animate-spin mr-2" size={16} /> : <RotateCcw className="mr-2" size={16} />}
                            {isSyncing ? 'SYNCING...' : 'RE_SYNC_UPLINK'}
                        </Button>
                    </div>
                    <div className="space-y-4">
                        <div className="flex justify-between items-end border-b border-terminal-green/10 pb-2">
                            <h2 className="text-xl font-bold tracking-[0.2em] uppercase glow-text">
                                {searchQuery ? 'SEARCH_RESULTS' : 'TOP_MARKET_FLIPS'}
                            </h2>
                            <div className="text-[9px] font-mono text-terminal-green/40 text-right uppercase leading-tight">
                                PULSE_RATE: 120s // LAST_UPLINK: {lastUpdated ? new Date(lastUpdated).toLocaleTimeString() : 'INITIALIZING...'} <br/>
                                BUFFER_STATE: {historyLength} / 120 SNAPSHOTS
                            </div>
                        </div>
                        <ItemGrid
                            variant={(!searchQuery && !isLoading) ? 'line' : 'card'}
                            limit={(!searchQuery && !isLoading) ? 15 : 60}
                        />
                    </div>
                </div>
            </div>
            <Toaster theme="dark" position="bottom-right" toastOptions={{
                style: {
                    background: '#050505',
                    border: '1px solid #39ff14',
                    color: '#39ff14',
                    borderRadius: '0px',
                    fontFamily: 'monospace'
                }
            }} />
        </RetroLayout>
    );
}
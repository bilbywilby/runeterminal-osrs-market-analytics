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
    const [isSyncing, setIsSyncing] = useState(false);
    useEffect(() => {
        loadData();
        const interval = setInterval(() => {
            if (!isSyncing) refreshPrices();
        }, 30000);
        return () => clearInterval(interval);
    }, [loadData, refreshPrices]);
    const handleManualRefresh = async () => {
        if (isSyncing) return;
        setIsSyncing(true);
        try {
            await refreshPrices();
            toast.success('UPLINK_SYNC_SUCCESSFUL');
        } catch {
            toast.error('UPLINK_SYNC_FAILED');
        } finally {
            setIsSyncing(false);
        }
    };
    return (
        <RetroLayout>
            <MarketTicker />
            <div className="mb-8 flex flex-col md:flex-row gap-4 items-end">
                <div className="flex-1 w-full">
                    <label className="text-[10px] text-terminal-green/70 mb-1 block uppercase font-mono">Input_Query {'>'} Filter_Items</label>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-terminal-green/50" size={18} />
                        <Input
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="SEARCH_GRAND_EXCHANGE..."
                            className="bg-terminal-black border-terminal-green/30 text-terminal-green rounded-none pl-10 h-12 font-mono uppercase"
                        />
                    </div>
                </div>
                <Button
                    onClick={handleManualRefresh}
                    disabled={isSyncing}
                    variant="outline"
                    className="border-terminal-green/30 text-terminal-green rounded-none h-12 font-mono min-w-[140px]"
                >
                    {isSyncing ? <Loader2 className="animate-spin" /> : <RotateCcw className="mr-2" size={16} />}
                    {isSyncing ? 'SYNCING...' : 'RE-SYNC'}
                </Button>
            </div>
            <div className="mb-4 flex justify-between items-end border-b border-terminal-green/10 pb-2">
                <h2 className="text-lg font-bold tracking-widest uppercase glow-text">Top_Market_Margins</h2>
                <div className="text-[9px] font-mono text-terminal-green/50 text-right uppercase">
                    PULSE: {lastUpdated ? new Date(lastUpdated).toLocaleTimeString() : 'WAITING...'} <br/>
                    VOL_BUFFER: {historyLength} SNAPS
                </div>
            </div>
            <ItemGrid />
            <Toaster theme="dark" position="bottom-right" toastOptions={{
                style: { background: '#050505', border: '1px solid #39ff14', color: '#39ff14', borderRadius: '0px' }
            }} />
        </RetroLayout>
    );
}
import { create } from 'zustand';
import { fetchLatestPrices, fetchItemMapping, fetch24hPrices, ItemMapping, RawPrice, Volume24h } from '@/lib/api';
import { calculateFlippingMetrics, FlippingMetrics, calculateAdvancedMetrics, AdvancedMetrics, AnalyticsConfig, DEFAULT_ANALYTICS_CONFIG } from '@/lib/flippingEngine';
import { IncrementalStats } from '@/lib/analytics';
export interface EnrichedItem extends ItemMapping {
    high: number;
    low: number;
    margin: number;
    roi: number;
    isFavorite: boolean;
    metrics: FlippingMetrics;
    advanced: AdvancedMetrics;
}
interface ScannerConfig extends AnalyticsConfig {
    minMarginVolume: number;
    maxVolatility: number;
    topN: number;
}
interface MarketState {
    items: ItemMapping[];
    prices: Record<string, RawPrice>;
    volumes24h: Record<string, Volume24h>;
    history: Record<string, RawPrice>[];
    incrementalStats: Map<number, IncrementalStats>;
    favorites: number[];
    isLoading: boolean;
    lastUpdated: number;
    searchQuery: string;
    viewPreference: 'table' | 'grid';
    scannerConfig: ScannerConfig;
    loadData: () => Promise<void>;
    refreshPrices: () => Promise<void>;
    addSnapshot: (newPrices: Record<string, RawPrice>) => void;
    setSearchQuery: (query: string) => void;
    toggleFavorite: (id: number) => void;
    setViewPreference: (pref: 'table' | 'grid') => void;
    updateScannerConfig: (config: Partial<ScannerConfig>) => void;
}
export const useMarketStore = create<MarketState>((set, get) => ({
    items: [],
    prices: {},
    volumes24h: {},
    history: [],
    incrementalStats: new Map(),
    favorites: JSON.parse(localStorage.getItem('rune_terminal_favorites') || '[]'),
    isLoading: false,
    lastUpdated: 0,
    searchQuery: '',
    viewPreference: 'table',
    scannerConfig: {
        ...DEFAULT_ANALYTICS_CONFIG,
        minMarginVolume: 100000,
        maxVolatility: 10,
        topN: 50
    },
    setSearchQuery: (query) => set({ searchQuery: query }),
    setViewPreference: (viewPreference) => set({ viewPreference }),
    updateScannerConfig: (config) => set((state) => ({
        scannerConfig: { ...state.scannerConfig, ...config },
        lastUpdated: Date.now()
    })),
    toggleFavorite: (id) => {
        const favs = get().favorites;
        const next = favs.includes(id) ? favs.filter(f => f !== id) : [...favs, id];
        localStorage.setItem('rune_terminal_favorites', JSON.stringify(next));
        set({ favorites: next });
    },
    addSnapshot: (newPrices) => {
        const { incrementalStats } = get();
        Object.entries(newPrices).forEach(([idStr, price]) => {
            const id = parseInt(idStr);
            if (!incrementalStats.has(id)) incrementalStats.set(id, new IncrementalStats());
            if (price.high && price.low) {
                incrementalStats.get(id)!.update((price.high + price.low) / 2);
            }
        });
        set((state) => ({ 
            history: [newPrices, ...state.history].slice(0, 120),
            incrementalStats 
        }));
    },
    loadData: async () => {
        set({ isLoading: true });
        try {
            const [mapping, latest, v24] = await Promise.all([
                fetchItemMapping(),
                fetchLatestPrices(),
                fetch24hPrices()
            ]);
            const stats = new Map<number, IncrementalStats>();
            Object.entries(latest).forEach(([id, p]) => {
                const s = new IncrementalStats();
                if (p.high && p.low) s.update((p.high + p.low) / 2);
                stats.set(parseInt(id), s);
            });
            set({
                items: mapping,
                prices: latest,
                volumes24h: v24,
                history: [latest],
                incrementalStats: stats,
                isLoading: false,
                lastUpdated: Date.now()
            });
        } catch (error) {
            set({ isLoading: false });
        }
    },
    refreshPrices: async () => {
        try {
            const [latest, v24] = await Promise.all([fetchLatestPrices(), fetch24hPrices()]);
            get().addSnapshot(latest);
            set({ prices: latest, volumes24h: v24, lastUpdated: Date.now() });
        } catch {}
    }
}));
export function enrichItem(
    item: ItemMapping,
    prices: Record<string, RawPrice>,
    favorites: number[],
    history: Record<string, RawPrice>[] = [],
    config: AnalyticsConfig = DEFAULT_ANALYTICS_CONFIG,
    volumes24h: Record<string, Volume24h> = {}
): EnrichedItem {
    const p = prices[item.id] || { high: 0, low: 0, highTime: 0, lowTime: 0 };
    const v24 = volumes24h[item.id];
    const metrics = calculateFlippingMetrics(item, p, v24);
    const advanced = calculateAdvancedMetrics(item, p, history, config, v24);
    return {
        ...item,
        high: metrics.sellPrice,
        low: metrics.buyPrice,
        margin: metrics.margin,
        roi: metrics.roi,
        isFavorite: favorites.includes(item.id),
        metrics,
        advanced
    };
}
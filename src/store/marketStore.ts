import { create } from 'zustand';
import { fetchLatestPrices, fetchItemMapping, fetch24hPrices, fetch5mPrices, ItemMapping, RawPrice, Volume24h, TimeStepPrice } from '@/lib/api';
import { calculateFlippingMetrics, FlippingMetrics, calculateAdvancedMetrics, AdvancedMetrics, AnalyticsConfig, DEFAULT_ANALYTICS_CONFIG } from '@/lib/flippingEngine';
import { ItemAggregate } from '@/lib/analytics';
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
    prices5m: Record<string, TimeStepPrice>;
    volumes24h: Record<string, Volume24h>;
    history: Record<string, RawPrice>[];
    perItemAggs: Record<number, ItemAggregate>;
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
const PERSISTENCE_KEY = 'rune_terminal_state_v3';
const MAX_SNAPSHOTS = 120;
const MAX_PERSISTED_HISTORY = 10;
export const useMarketStore = create<MarketState>((set, get) => ({
    items: [],
    prices: {},
    prices5m: {},
    volumes24h: {},
    history: [],
    perItemAggs: {},
    favorites: JSON.parse(localStorage.getItem('rune_terminal_favorites') || '[]'),
    isLoading: false,
    lastUpdated: 0,
    searchQuery: '',
    viewPreference: 'table',
    scannerConfig: (() => {
        const saved = localStorage.getItem('rune_terminal_scanner_config');
        return saved ? { ...DEFAULT_ANALYTICS_CONFIG, ...JSON.parse(saved) } : {
            ...DEFAULT_ANALYTICS_CONFIG,
            minMarginVolume: 100000,
            maxVolatility: 10,
            topN: 50
        };
    })(),
    setSearchQuery: (searchQuery) => set({ searchQuery }),
    setViewPreference: (viewPreference) => set({ viewPreference }),
    updateScannerConfig: (config) => set((state) => {
        const next = { ...state.scannerConfig, ...config };
        localStorage.setItem('rune_terminal_scanner_config', JSON.stringify(next));
        return { scannerConfig: next, lastUpdated: Date.now() };
    }),
    toggleFavorite: (id) => {
        set((state) => {
            const next = state.favorites.includes(id)
                ? state.favorites.filter(f => f !== id)
                : [...state.favorites, id];
            localStorage.setItem('rune_terminal_favorites', JSON.stringify(next));
            return { favorites: next };
        });
    },
    addSnapshot: (newPrices) => {
        set((state) => {
            const newHistory = [newPrices, ...state.history].slice(0, MAX_SNAPSHOTS);
            const nextAggs = { ...state.perItemAggs };
            Object.entries(newPrices).forEach(([idStr, p]) => {
                const id = parseInt(idStr);
                if (!nextAggs[id]) nextAggs[id] = new ItemAggregate();
                if (p.high && p.low) {
                    nextAggs[id].add((p.high + p.low) / 2);
                }
            });
            // Eviction logic for aggregates if history was exceeded
            if (state.history.length >= MAX_SNAPSHOTS) {
                const evicted = state.history[state.history.length - 1];
                if (evicted) {
                    Object.entries(evicted).forEach(([idStr, p]) => {
                        const id = parseInt(idStr);
                        if (nextAggs[id] && p.high && p.low) {
                            nextAggs[id].removeSample((p.high + p.low) / 2);
                        }
                    });
                }
            }
            // Quota-safe persistence attempt for a small window of history
            try {
                const persistBundle = {
                    history: newHistory.slice(0, MAX_PERSISTED_HISTORY),
                    lastUpdated: Date.now()
                };
                localStorage.setItem(PERSISTENCE_KEY, JSON.stringify(persistBundle));
            } catch (e) {
                console.warn("[QUOTA_EXCEEDED] History persistence skipped");
            }
            return { history: newHistory, perItemAggs: nextAggs };
        });
    },
    loadData: async () => {
        // Optimization: Don't reload if we already have items unless it's very stale (> 10 mins)
        if (get().items.length > 0 && (Date.now() - get().lastUpdated < 600000)) {
            return;
        }
        set({ isLoading: true });
        try {
            const mapping = await fetchItemMapping();
            await new Promise(resolve => setTimeout(resolve, 800));
            const latest = await fetchLatestPrices();
            await new Promise(resolve => setTimeout(resolve, 800));
            const v24 = await fetch24hPrices();
            await new Promise(resolve => setTimeout(resolve, 800));
            const p5m = await fetch5mPrices();
            let history: Record<string, RawPrice>[] = [latest];
            let perItemAggs: Record<number, ItemAggregate> = {};
            const saved = localStorage.getItem(PERSISTENCE_KEY);
            if (saved) {
                try {
                    const parsed = JSON.parse(saved);
                    if (parsed.history) history = [...parsed.history];
                } catch (e) {
                    console.warn("[HYDRATION_ERROR]", e);
                }
            }
            // Rebuild aggregates from restored history
            history.forEach(snap => {
                Object.entries(snap).forEach(([idStr, p]) => {
                    const id = parseInt(idStr);
                    if (!perItemAggs[id]) perItemAggs[id] = new ItemAggregate();
                    if (p.high && p.low) perItemAggs[id].add((p.high + p.low) / 2);
                });
            });
            set({
                items: mapping,
                prices: latest,
                prices5m: p5m,
                volumes24h: v24,
                history,
                perItemAggs,
                isLoading: false,
                lastUpdated: Date.now()
            });
        } catch (error) {
            console.error("Critical store load failure:", error);
            set({ isLoading: false });
        }
    },
    refreshPrices: async () => {
        try {
            const latest = await fetchLatestPrices();
            await new Promise(resolve => setTimeout(resolve, 800));
            const v24 = await fetch24hPrices();
            await new Promise(resolve => setTimeout(resolve, 800));
            const p5m = await fetch5mPrices();
            get().addSnapshot(latest);
            set({ prices: latest, prices5m: p5m, volumes24h: v24, lastUpdated: Date.now() });
        } catch (error) {
            console.error("Price refresh cycle failure:", error);
            throw error; // Rethrow for UI feedback
        }
    }
}));
export function enrichItem(
    item: ItemMapping,
    prices: Record<string, RawPrice>,
    favorites: number[],
    history: Record<string, RawPrice> = {},
    config: AnalyticsConfig = DEFAULT_ANALYTICS_CONFIG,
    volumes24h: Record<string, Volume24h> = {},
    aggs: Record<number, ItemAggregate> = {}
): EnrichedItem {
    const p = prices[item.id] || { high: 0, low: 0, highTime: 0, lowTime: 0 };
    const v24 = volumes24h[item.id];
    const metrics = calculateFlippingMetrics(item, p, v24);
    const agg = aggs[item.id];
    const advanced = calculateAdvancedMetrics(item, p, [], config, v24, agg);
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
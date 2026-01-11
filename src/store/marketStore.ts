import { create } from 'zustand';
import { fetchLatestPrices, fetchItemMapping, fetch24hPrices, ItemMapping, RawPrice, Volume24h } from '@/lib/api';
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
const PERSISTENCE_KEY = 'rune_terminal_state_v1';
const MAX_SNAPSHOTS = 120;
export const useMarketStore = create<MarketState>((set, get) => ({
    items: [],
    prices: {},
    volumes24h: {},
    history: [],
    perItemAggs: {},
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
    setSearchQuery: (searchQuery) => set({ searchQuery }),
    setViewPreference: (viewPreference) => set({ viewPreference }),
    updateScannerConfig: (config) => set((state) => ({
        scannerConfig: { ...state.scannerConfig, ...config },
        lastUpdated: Date.now()
    })),
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
            const newHistory = [newPrices, ...state.history];
            const nextAggs = { ...state.perItemAggs };
            // Update aggregates for new prices
            Object.entries(newPrices).forEach(([idStr, p]) => {
                const id = parseInt(idStr);
                if (!nextAggs[id]) nextAggs[id] = new ItemAggregate();
                if (p.high && p.low) {
                    nextAggs[id].add((p.high + p.low) / 2);
                }
            });
            // Evict oldest snapshot if limit reached
            if (newHistory.length > MAX_SNAPSHOTS) {
                const evicted = newHistory.pop();
                if (evicted) {
                    Object.entries(evicted).forEach(([idStr, p]) => {
                        const id = parseInt(idStr);
                        if (nextAggs[id] && p.high && p.low) {
                            nextAggs[id].removeSample((p.high + p.low) / 2);
                        }
                    });
                }
            }
            // Deferred Persistence to avoid UI jank
            setTimeout(() => {
                try {
                    const storageData = {
                        history: newHistory,
                        perItemAggs: Object.fromEntries(
                            Object.entries(nextAggs).map(([k, v]) => [k, v.toJSON()])
                        )
                    };
                    localStorage.setItem(PERSISTENCE_KEY, JSON.stringify(storageData));
                } catch (e) {
                    console.error("[STORAGE_FAIL]", e);
                }
            }, 500);
            return { history: newHistory, perItemAggs: nextAggs };
        });
    },
    loadData: async () => {
        set({ isLoading: true });
        try {
            const [mapping, latest, v24] = await Promise.all([
                fetchItemMapping(),
                fetchLatestPrices(),
                fetch24hPrices()
            ]);
            let history: Record<string, RawPrice>[] = [latest];
            let perItemAggs: Record<number, ItemAggregate> = {};
            const saved = localStorage.getItem(PERSISTENCE_KEY);
            if (saved) {
                try {
                    const parsed = JSON.parse(saved);
                    history = parsed.history || [latest];
                    // Hydrate aggregates
                    Object.entries(parsed.perItemAggs || {}).forEach(([id, data]) => {
                        perItemAggs[parseInt(id)] = new ItemAggregate(data as any);
                    });
                    // Verification: If Aggregates are missing but history exists, rebuild
                    if (Object.keys(perItemAggs).length === 0 && history.length > 0) {
                        console.warn("[HYDRATION] REBUILDING_AGGS_FROM_HISTORY");
                        history.forEach(snap => {
                            Object.entries(snap).forEach(([idStr, p]) => {
                                const id = parseInt(idStr);
                                if (!perItemAggs[id]) perItemAggs[id] = new ItemAggregate();
                                if (p.high && p.low) perItemAggs[id].add((p.high + p.low) / 2);
                            });
                        });
                    }
                } catch (e) {
                    console.warn("[HYDRATION_ERROR] Resetting to clean state", e);
                }
            }
            if (Object.keys(perItemAggs).length === 0) {
                Object.entries(latest).forEach(([idStr, p]) => {
                    const id = parseInt(idStr);
                    const agg = new ItemAggregate();
                    if (p.high && p.low) agg.add((p.high + p.low) / 2);
                    perItemAggs[id] = agg;
                });
            }
            set({
                items: mapping,
                prices: latest,
                volumes24h: v24,
                history,
                perItemAggs,
                isLoading: false,
                lastUpdated: Date.now()
            });
        } catch (error) {
            console.error("Critical store load failure", error);
            set({ isLoading: false });
        }
    },
    refreshPrices: async () => {
        try {
            const [latest, v24] = await Promise.all([fetchLatestPrices(), fetch24hPrices()]);
            get().addSnapshot(latest);
            set({ prices: latest, volumes24h: v24, lastUpdated: Date.now() });
        } catch (error) {
            console.error("Price refresh cycle failure", error);
        }
    }
}));
export function enrichItem(
    item: ItemMapping,
    prices: Record<string, RawPrice>,
    favorites: number[],
    history: Record<string, RawPrice>[] = [],
    config: AnalyticsConfig = DEFAULT_ANALYTICS_CONFIG,
    volumes24h: Record<string, Volume24h> = {},
    aggs: Record<number, ItemAggregate> = {}
): EnrichedItem {
    const p = prices[item.id] || { high: 0, low: 0, highTime: 0, lowTime: 0 };
    const v24 = volumes24h[item.id];
    const metrics = calculateFlippingMetrics(item, p, v24);
    const agg = aggs[item.id];
    const advanced = calculateAdvancedMetrics(item, p, history, config, v24, agg);
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
import { create } from 'zustand';
import { fetchLatestPrices, fetchItemMapping, ItemMapping, RawPrice } from '@/lib/api';
import { calculateFlippingMetrics, FlippingMetrics, calculateAdvancedMetrics, AdvancedMetrics } from '@/lib/flippingEngine';
export interface EnrichedItem extends ItemMapping {
    high: number;
    low: number;
    margin: number;
    roi: number;
    isFavorite: boolean;
    metrics: FlippingMetrics;
    advanced?: AdvancedMetrics;
}
export const UI_THRESHOLDS = {
    highMargin: 10000,
    highRoi: 3,
    volatilityLow: 5,
    volatilityHigh: 10
};
interface ScannerConfig {
    minMarginVolume: number;
    maxVolatility: number;
    topN: number;
}
interface MarketState {
    items: ItemMapping[];
    prices: Record<string, RawPrice>;
    history: Record<string, RawPrice>[];
    favorites: number[];
    isLoading: boolean;
    lastUpdated: number;
    searchQuery: string;
    viewPreference: 'table' | 'grid';
    scannerConfig: ScannerConfig;
    onPricesUpdateListeners: Set<() => void>;
    loadData: () => Promise<void>;
    refreshPrices: () => Promise<void>;
    addSnapshot: (newPrices: Record<string, RawPrice>) => void;
    subscribeToPrices: (callback: () => void) => () => void;
    setSearchQuery: (query: string) => void;
    resetSearch: () => void;
    toggleFavorite: (id: number) => void;
    setViewPreference: (pref: 'table' | 'grid') => void;
    updateScannerConfig: (config: Partial<ScannerConfig>) => void;
}
const STORAGE_KEY_FAVORITES = 'rune_terminal_favorites';
const STORAGE_KEY_HISTORY = 'rune_terminal_history_buffer';
const MAX_HISTORY_LENGTH = 120;
const PERSIST_HISTORY_LIMIT = 20;
export const useMarketStore = create<MarketState>((set, get) => ({
    items: [],
    prices: {},
    history: [],
    favorites: JSON.parse(localStorage.getItem(STORAGE_KEY_FAVORITES) || '[]'),
    isLoading: false,
    lastUpdated: 0,
    searchQuery: '',
    viewPreference: 'table',
    scannerConfig: {
        minMarginVolume: 100000,
        maxVolatility: 10,
        topN: 50
    },
    onPricesUpdateListeners: new Set(),
    setSearchQuery: (query) => set({ searchQuery: query }),
    resetSearch: () => set({ searchQuery: '' }),
    setViewPreference: (viewPreference) => set({ viewPreference }),
    updateScannerConfig: (config) => set((state) => ({
        scannerConfig: { ...state.scannerConfig, ...config }
    })),
    toggleFavorite: (id) => {
        const currentFavorites = get().favorites;
        const newFavorites = currentFavorites.includes(id)
            ? currentFavorites.filter(fid => fid !== id)
            : [...currentFavorites, id];
        localStorage.setItem(STORAGE_KEY_FAVORITES, JSON.stringify(newFavorites));
        set({ favorites: newFavorites });
    },
    addSnapshot: (newPrices) => {
        set((state) => {
            const updatedHistory = [newPrices, ...state.history].slice(0, MAX_HISTORY_LENGTH);
            // Persist a smaller slice to avoid localStorage quota issues
            localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(updatedHistory.slice(0, PERSIST_HISTORY_LIMIT)));
            return { history: updatedHistory };
        });
    },
    subscribeToPrices: (callback) => {
        const listeners = get().onPricesUpdateListeners;
        listeners.add(callback);
        return () => listeners.delete(callback);
    },
    loadData: async () => {
        set({ isLoading: true });
        try {
            const savedHistory = JSON.parse(localStorage.getItem(STORAGE_KEY_HISTORY) || '[]');
            const [mapping, latestPrices] = await Promise.all([
                fetchItemMapping(),
                fetchLatestPrices()
            ]);
            set({
                items: mapping,
                prices: latestPrices,
                history: savedHistory.length > 0 ? savedHistory : [latestPrices],
                isLoading: false,
                lastUpdated: Date.now()
            });
        } catch (error) {
            console.error('Failed to load initial market data', error);
            set({ isLoading: false });
        }
    },
    refreshPrices: async () => {
        try {
            const latestPrices = await fetchLatestPrices();
            const { addSnapshot, onPricesUpdateListeners } = get();
            addSnapshot(latestPrices);
            set({ prices: latestPrices, lastUpdated: Date.now() });
            // Fire event bus
            onPricesUpdateListeners.forEach(cb => cb());
        } catch (error) {
            console.error('Failed to refresh prices', error);
        }
    }
}));
export function enrichItem(
    item: ItemMapping, 
    prices: Record<string, RawPrice>, 
    favorites: number[],
    history: Record<string, RawPrice>[] = []
): EnrichedItem {
    const p = prices[item.id] || { high: 0, low: 0, highTime: 0, lowTime: 0 };
    const metrics = calculateFlippingMetrics(item, p);
    const advanced = calculateAdvancedMetrics(item, p, history);
    return {
        ...item,
        high: metrics.sellPrice || 0,
        low: metrics.buyPrice || 0,
        margin: metrics.margin || 0,
        roi: metrics.roi || 0,
        isFavorite: favorites.includes(item.id),
        metrics,
        advanced
    };
}
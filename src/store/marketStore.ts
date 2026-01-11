import { create } from 'zustand';
import { fetchLatestPrices, fetchItemMapping, ItemMapping, RawPrice } from '@/lib/api';
import { calculateFlippingMetrics, FlippingMetrics } from '@/lib/flippingEngine';
export interface EnrichedItem extends ItemMapping {
    high: number;
    low: number;
    margin: number;
    roi: number;
    isFavorite: boolean;
    metrics: FlippingMetrics;
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
    favorites: number[];
    isLoading: boolean;
    lastUpdated: number;
    searchQuery: string;
    viewPreference: 'table' | 'grid';
    scannerConfig: ScannerConfig;
    loadData: () => Promise<void>;
    refreshPrices: () => Promise<void>;
    setSearchQuery: (query: string) => void;
    resetSearch: () => void;
    toggleFavorite: (id: number) => void;
    setViewPreference: (pref: 'table' | 'grid') => void;
    updateScannerConfig: (config: Partial<ScannerConfig>) => void;
}
const STORAGE_KEY = 'rune_terminal_favorites';
export const useMarketStore = create<MarketState>((set, get) => ({
    items: [],
    prices: {},
    favorites: JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'),
    isLoading: false,
    lastUpdated: 0,
    searchQuery: '',
    viewPreference: 'table',
    scannerConfig: {
        minMarginVolume: 100000,
        maxVolatility: 10,
        topN: 50
    },
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
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newFavorites));
        set({ favorites: newFavorites });
    },
    loadData: async () => {
        set({ isLoading: true });
        try {
            const [mapping, latestPrices] = await Promise.all([
                fetchItemMapping(),
                fetchLatestPrices()
            ]);
            set({
                items: mapping,
                prices: latestPrices,
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
            set({ prices: latestPrices, lastUpdated: Date.now() });
        } catch (error) {
            console.error('Failed to refresh prices', error);
        }
    }
}));
export function enrichItem(item: ItemMapping, prices: Record<string, RawPrice>, favorites: number[]): EnrichedItem {
    const p = prices[item.id] || { high: 0, low: 0, highTime: 0, lowTime: 0 };
    const metrics = calculateFlippingMetrics(item, p);
    return {
        ...item,
        high: metrics.sellPrice || 0,
        low: metrics.buyPrice || 0,
        margin: metrics.margin || 0,
        roi: metrics.roi || 0,
        isFavorite: favorites.includes(item.id),
        metrics
    };
}
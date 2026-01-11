import { create } from 'zustand';
import { fetchLatestPrices, fetchItemMapping, ItemMapping, RawPrice } from '@/lib/api';
export interface EnrichedItem extends ItemMapping {
    high: number;
    low: number;
    margin: number;
    roi: number;
    isFavorite: boolean;
}
interface MarketState {
    items: ItemMapping[];
    prices: Record<string, RawPrice>;
    favorites: number[];
    isLoading: boolean;
    lastUpdated: number;
    searchQuery: string;
    loadData: () => Promise<void>;
    refreshPrices: () => Promise<void>;
    setSearchQuery: (query: string) => void;
    toggleFavorite: (id: number) => void;
}
const STORAGE_KEY = 'rune_terminal_favorites';
export const useMarketStore = create<MarketState>((set, get) => ({
    items: [],
    prices: {},
    favorites: JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'),
    isLoading: false,
    lastUpdated: 0,
    searchQuery: '',
    setSearchQuery: (query) => set({ searchQuery: query }),
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
// SELECTORS
export const selectSearchQuery = (state: MarketState) => state.searchQuery;
export const selectIsLoading = (state: MarketState) => state.isLoading;
export const selectLastUpdated = (state: MarketState) => state.lastUpdated;
export const selectFavorites = (state: MarketState) => state.favorites;
export const selectEnrichedItems = (state: MarketState): EnrichedItem[] => {
    const { items, prices, searchQuery, favorites } = state;
    const query = searchQuery.toLowerCase();
    // Cache calculation of filtered items to avoid infinite loops if results are used in hooks
    return items
        .filter(item => item.name.toLowerCase().includes(query))
        .map(item => {
            const p = prices[item.id] || { high: 0, low: 0 };
            const margin = p.high > 0 && p.low > 0 ? (p.high - p.low) : 0;
            const tax = Math.floor(p.high * 0.01);
            const netMargin = Math.max(0, margin - tax);
            const roi = p.low > 0 ? (netMargin / p.low) * 100 : 0;
            return {
                ...item,
                high: p.high,
                low: p.low,
                margin: netMargin,
                roi: roi,
                isFavorite: favorites.includes(item.id)
            };
        })
        .sort((a, b) => b.margin - a.margin)
        .slice(0, 100);
};
export const selectItemById = (id: number) => (state: MarketState): EnrichedItem | null => {
    const item = state.items.find(i => i.id === id);
    if (!item) return null;
    const p = state.prices[id] || { high: 0, low: 0 };
    const margin = p.high > 0 && p.low > 0 ? (p.high - p.low) : 0;
    const tax = Math.floor(p.high * 0.01);
    const netMargin = Math.max(0, margin - tax);
    const roi = p.low > 0 ? (netMargin / p.low) * 100 : 0;
    return {
        ...item,
        high: p.high,
        low: p.low,
        margin: netMargin,
        roi: roi,
        isFavorite: state.favorites.includes(id)
    };
};
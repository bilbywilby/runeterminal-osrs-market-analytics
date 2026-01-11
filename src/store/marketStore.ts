import { create } from 'zustand';
import { fetchLatestPrices, fetchItemMapping, ItemMapping, RawPrice } from '@/lib/api';
export interface EnrichedItem extends ItemMapping {
    high: number;
    low: number;
    margin: number;
    roi: number;
}
interface MarketState {
    items: ItemMapping[];
    prices: Record<string, RawPrice>;
    isLoading: boolean;
    lastUpdated: number;
    searchQuery: string;
    loadData: () => Promise<void>;
    refreshPrices: () => Promise<void>;
    setSearchQuery: (query: string) => void;
}
export const useMarketStore = create<MarketState>((set, get) => ({
    items: [],
    prices: {},
    isLoading: false,
    lastUpdated: 0,
    searchQuery: '',
    setSearchQuery: (query) => set({ searchQuery: query }),
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
// Derived selectors following store law
export const selectEnrichedItems = (state: MarketState): EnrichedItem[] => {
    const { items, prices, searchQuery } = state;
    const query = searchQuery.toLowerCase();
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
                roi: roi
            };
        })
        .sort((a, b) => b.margin - a.margin)
        .slice(0, 100);
};
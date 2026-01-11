import { RawPrice, ItemMapping } from './api';
export interface FlippingMetrics {
  buyPrice: number;
  sellPrice: number;
  tax: number;
  margin: number;
  roi: number;
  estimatedVolume: number;
  marginVolume: number;
  profitPerHour: number;
  volatilityScore: number;
}
/**
 * Calculates sophisticated flipping metrics for an item based on real-time price data.
 * OSRS GE Tax: 1% of the sale price, capped at 5M GP per item.
 */
export function calculateFlippingMetrics(item: ItemMapping, price: RawPrice): FlippingMetrics {
  const buyPrice = price.low || 0;
  const sellPrice = price.high || 0;
  // Tax calculation: 1% of sell price, max 5,000,000
  const tax = sellPrice > 0 ? Math.min(5000000, Math.floor(sellPrice * 0.01)) : 0;
  // Gross margin vs Net margin
  const grossMargin = sellPrice - buyPrice;
  const margin = Math.max(0, grossMargin - tax);
  const roi = buyPrice > 0 ? (margin / buyPrice) * 100 : 0;
  // Heuristic Volume Estimation
  // Based on the recency of the last high/low transactions.
  // Smaller deltas (time since last trade) suggest higher liquidity.
  const now = Math.floor(Date.now() / 1000);
  const highDelta = Math.max(0, now - price.highTime);
  const lowDelta = Math.max(0, now - price.lowTime);
  // Scoring volume: shorter time since last update = higher score (max 1000)
  // Decays significantly after 5 minutes (300s)
  const highScore = Math.max(0, 500 - (highDelta / 1.2));
  const lowScore = Math.max(0, 500 - (lowDelta / 1.2));
  const estimatedVolume = Math.floor(highScore + lowScore);
  // Margin Volume: Total potential profit available in the current spread
  const marginVolume = margin * estimatedVolume;
  // Profit Per Hour: Assuming max 4 flips per limit duration (4 hours)
  // We use the item limit to cap the hourly potential
  const limit = item.limit || 0;
  const hourlyVolumeCap = limit / 4;
  const profitPerHour = margin * Math.min(estimatedVolume, hourlyVolumeCap);
  // Volatility: relative spread percentage
  const midPoint = (sellPrice + buyPrice) / 2;
  const volatilityScore = midPoint > 0 ? (grossMargin / midPoint) * 100 : 0;
  return {
    buyPrice,
    sellPrice,
    tax,
    margin,
    roi,
    estimatedVolume,
    marginVolume,
    profitPerHour,
    volatilityScore
  };
}
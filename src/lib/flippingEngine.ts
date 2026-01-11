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
export interface AdvancedMetrics {
  turnoverRate: number;
  stdDev: number;
  historicalVolatility: number;
  sampleSize: number;
}
export function calculateFlippingMetrics(item: ItemMapping, price: RawPrice): FlippingMetrics {
  const buyPrice = price.low || 0;
  const sellPrice = price.high || 0;
  const tax = sellPrice > 0 ? Math.min(5000000, Math.floor(sellPrice * 0.01)) : 0;
  const grossMargin = sellPrice - buyPrice;
  const margin = Math.max(0, grossMargin - tax);
  const roi = buyPrice > 0 ? (margin / buyPrice) * 100 : 0;
  const now = Math.floor(Date.now() / 1000);
  const highScore = Math.max(0, 500 - ((now - price.highTime) / 1.2));
  const lowScore = Math.max(0, 500 - ((now - price.lowTime) / 1.2));
  const estimatedVolume = Math.floor(highScore + lowScore);
  const marginVolume = margin * estimatedVolume;
  const limit = item.limit || 0;
  const hourlyVolumeCap = limit / 4;
  const profitPerHour = margin * Math.min(estimatedVolume, hourlyVolumeCap);
  const midPoint = (sellPrice + buyPrice) / 2;
  const volatilityScore = midPoint > 0 ? (grossMargin / midPoint) * 100 : 0;
  return {
    buyPrice, sellPrice, tax, margin, roi,
    estimatedVolume, marginVolume, profitPerHour, volatilityScore
  };
}
export function calculateAdvancedMetrics(
  item: ItemMapping, 
  currentPrice: RawPrice, 
  history: Record<string, RawPrice>[]
): AdvancedMetrics {
  const itemIdStr = item.id.toString();
  const midPrices: number[] = [];
  let changeCount = 0;
  // Extract history for this specific item
  for (let i = 0; i < history.length; i++) {
    const snap = history[i][itemIdStr];
    if (snap && snap.high && snap.low) {
      midPrices.push((snap.high + snap.low) / 2);
      // Count price changes in the last 10 snapshots for volume heuristic
      if (i < 10 && i > 0) {
        const prevSnap = history[i-1][itemIdStr];
        if (prevSnap && (prevSnap.high !== snap.high || prevSnap.low !== snap.low)) {
          changeCount++;
        }
      }
    }
  }
  // turnoverRate: 0 to 1 based on frequency of updates in buffer
  const turnoverRate = midPrices.length > 0 ? Math.min(1, changeCount / Math.min(10, midPrices.length)) : 0.1;
  // Calculate Standard Deviation
  let stdDev = 0;
  if (midPrices.length > 1) {
    const mean = midPrices.reduce((a, b) => a + b, 0) / midPrices.length;
    const variance = midPrices.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / midPrices.length;
    stdDev = Math.sqrt(variance);
  }
  const currentMid = (currentPrice.high + currentPrice.low) / 2;
  const historicalVolatility = currentMid > 0 ? (stdDev / currentMid) * 100 : 0;
  return {
    turnoverRate,
    stdDev,
    historicalVolatility,
    sampleSize: midPrices.length
  };
}
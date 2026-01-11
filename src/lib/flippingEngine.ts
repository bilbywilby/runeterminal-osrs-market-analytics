import { RawPrice, ItemMapping, Volume24h } from './api';
import { RollingStats, tanhNormalize, calculateRankScore } from './analytics';
export interface FlippingMetrics {
  buyPrice: number;
  sellPrice: number;
  tax: number;
  margin: number;
  roi: number;
  volume24h: number;
  potentialProfit: number;
  profitPerHour24h: number;
  volatilityScore: number;
}
export interface AdvancedMetrics {
  historicalVolatility: number;
  sampleSize: number;
  riskAdjustedProfit: number;
  rankScore: number;
}
export interface AnalyticsConfig {
  sensitivityGpPerTrade: number;
  alphaRisk: number;
  slippage: number;
  humanCap: number;
  minSnapshots: number;
  weightMargin: number;
  weightVolume: number;
  weightRisk: number;
}
export const DEFAULT_ANALYTICS_CONFIG: AnalyticsConfig = {
  sensitivityGpPerTrade: 50,
  alphaRisk: 6,
  slippage: 0.05,
  humanCap: 1000,
  minSnapshots: 6,
  weightMargin: 1.0,
  weightVolume: 0.8,
  weightRisk: 2.0
};
export function calculateFlippingMetrics(
    item: ItemMapping, 
    price: RawPrice, 
    vol?: Volume24h
): FlippingMetrics {
  const buyPrice = price.low || 0;
  const sellPrice = price.high || 0;
  const tax = sellPrice > 0 ? Math.min(5000000, Math.floor(sellPrice * 0.01)) : 0;
  const grossMargin = sellPrice - buyPrice;
  const margin = Math.max(0, grossMargin - tax);
  const roi = buyPrice > 0 ? (margin / buyPrice) * 100 : 0;
  const v24 = vol ? (vol.highPriceVolume + vol.lowPriceVolume) : 0;
  const limit = item.limit || 0;
  const effectiveVol = v24 > 0 ? Math.min(v24, limit * 24) : 0; // Cap at 24 limit cycles
  const potentialProfit = margin * effectiveVol;
  const profitPerHour24h = potentialProfit / 24;
  const midPoint = (sellPrice + buyPrice) / 2;
  const volatilityScore = midPoint > 0 ? (grossMargin / midPoint) * 100 : 0;
  return {
    buyPrice, sellPrice, tax, margin, roi,
    volume24h: v24, potentialProfit, profitPerHour24h, volatilityScore
  };
}
export function calculateAdvancedMetrics(
  item: ItemMapping,
  currentPrice: RawPrice,
  history: Record<string, RawPrice>[],
  config: AnalyticsConfig = DEFAULT_ANALYTICS_CONFIG,
  vol24?: Volume24h
): AdvancedMetrics {
  const itemIdStr = item.id.toString();
  const stats = new RollingStats();
  for (let i = 0; i < history.length; i++) {
    const snap = history[i][itemIdStr];
    if (snap?.high && snap?.low) {
      stats.add((snap.high + snap.low) / 2);
    }
  }
  const currentMid = (currentPrice.high + currentPrice.low) / 2;
  const historicalVolatility = currentMid > 0 ? (stats.stdDev / currentMid) * 100 : 0;
  const riskScore = tanhNormalize(historicalVolatility / 100, config.alphaRisk);
  const metrics = calculateFlippingMetrics(item, currentPrice, vol24);
  const riskAdjustedProfit = metrics.profitPerHour24h * (1 - config.slippage) * (1 - riskScore);
  const rankScore = calculateRankScore(
    metrics.margin,
    metrics.volume24h,
    riskScore,
    item.limit || 1,
    { margin: config.weightMargin, volume: config.weightVolume, risk: config.weightRisk }
  );
  return {
    historicalVolatility,
    sampleSize: stats.count,
    riskAdjustedProfit,
    rankScore
  };
}
export function runBacktestSim(items: ItemMapping[]) {
    console.log("--- STARTING BACKTEST SIMULATION ---");
    const results = items.slice(0, 5).map(item => {
        const basePrice = 10000 + Math.random() * 50000;
        const vol = 500 + Math.random() * 5000;
        const delta = (Math.random() - 0.5) * 500;
        return {
            name: item.name,
            score: (vol * Math.abs(delta)) / 100
        };
    }).sort((a,b) => b.score - a.score);
    console.table(results);
    console.log("--- BACKTEST COMPLETE ---");
}
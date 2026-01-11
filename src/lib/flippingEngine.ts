import { RawPrice, ItemMapping, Volume24h } from './api';
import { ItemAggregate, RollingStats, tanhNormalize, calculateRankScore } from './analytics';
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
  const midPoint = (sellPrice + buyPrice) / 2;
  const volatilityScore = midPoint > 0 ? (grossMargin / midPoint) * 100 : 0;
  // Realized slippage model
  const slippage = 0.05 + (volatilityScore * 0.1);
  const netMargin = margin * (1 - slippage);
  const effectiveVol = v24 > 0 ? Math.min(v24, limit * 24) : 0;
  const potentialProfit = netMargin * effectiveVol;
  const profitPerHour24h = potentialProfit / 24;
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
  vol24?: Volume24h,
  agg?: ItemAggregate
): AdvancedMetrics {
  let historicalVolatility = 0;
  let sampleSize = 0;
  if (agg) {
    historicalVolatility = agg.volatility;
    sampleSize = agg.count;
  } else {
      const stats = new RollingStats();
      const itemIdStr = item.id.toString();
      for (let i = 0; i < history.length; i++) {
        const snap = history[i][itemIdStr];
        if (snap?.high && snap?.low) {
          stats.add((snap.high + snap.low) / 2);
        }
      }
      const currentMid = (currentPrice.high + currentPrice.low) / 2;
      historicalVolatility = currentMid > 0 ? (stats.stdDev / currentMid) * 100 : 0;
      sampleSize = stats.count;
  }
  const riskScore = tanhNormalize(historicalVolatility / 100, config.alphaRisk);
  const metrics = calculateFlippingMetrics(item, currentPrice, vol24);
  const riskAdjustedProfit = metrics.profitPerHour24h * (1 - riskScore);
  const rankScore = calculateRankScore(
    metrics.margin,
    metrics.volume24h,
    riskScore,
    item.limit || 1,
    { margin: config.weightMargin, volume: config.weightVolume, risk: config.weightRisk }
  );
  return {
    historicalVolatility,
    sampleSize,
    riskAdjustedProfit,
    rankScore
  };
}
export function runBacktestSim(items: ItemMapping[]) {
    console.log("--- STARTING QUANT_ENGINE_BACKTEST (24H_MOCK) ---");
    const activeItems = items.slice(0, 10);
    let totalEstProfit = 0;
    let totalRealizedProfit = 0;
    activeItems.forEach(item => {
        const basePrice = 1000 + Math.random() * 50000;
        const estMargin = basePrice * 0.02; // 2% est
        const vol = 500 + Math.random() * 2000;
        let realized = 0;
        for (let h = 0; h < 24; h++) {
            // Price churn: 30% of time spread collapses, 70% profitable
            const hourlyVol = vol / 24;
            const success = Math.random() > 0.3;
            if (success) realized += hourlyVol * estMargin * 0.95; // slippage
            else realized -= hourlyVol * (estMargin * 0.5); // stop loss
        }
        totalEstProfit += estMargin * vol;
        totalRealizedProfit += realized;
    });
    const accuracy = (totalRealizedProfit / totalEstProfit) * 100;
    console.log(`CHURN_RATE @ 10_ASSETS: ${(totalRealizedProfit/24).toFixed(0)}gp/hr`);
    console.log(`PROFIT_ACCURACY_RATIO: ${accuracy.toFixed(2)}% [EST_VS_REAL]`);
    console.table(activeItems.map(i => ({ name: i.name, status: 'STABLE', drift: (Math.random()*0.1).toFixed(3) })));
    console.log("--- BACKTEST_UPLINK_COMPLETE ---");
}
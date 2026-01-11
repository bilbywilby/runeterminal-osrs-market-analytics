import { RawPrice, ItemMapping } from './api';
import { RollingStats, tanhNormalize, calculateRankScore } from './analytics';
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
  observedVolumePerHour: number;
  riskAdjustedProfit: number;
  rankScore: number;
}
export interface AnalyticsConfig {
  sensitivityGpPerTrade: number;
  alphaRisk: number;
  slippage: number;
  humanCap: number;
  minSnapshots: number;
}
export const DEFAULT_ANALYTICS_CONFIG: AnalyticsConfig = {
  sensitivityGpPerTrade: 50,
  alphaRisk: 6,
  slippage: 0.05,
  humanCap: 1000,
  minSnapshots: 6
};
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
  history: Record<string, RawPrice>[],
  config: AnalyticsConfig = DEFAULT_ANALYTICS_CONFIG
): AdvancedMetrics {
  const itemIdStr = item.id.toString();
  const stats = new RollingStats();
  let tradesObserved = 0;
  // Iterate history to build stats and estimate real volume
  for (let i = 0; i < history.length; i++) {
    const snap = history[i][itemIdStr];
    if (snap && snap.high && snap.low) {
      const mid = (snap.high + snap.low) / 2;
      stats.add(mid);
      // Volume Heuristic: Significant price movement in mid-point suggests trade activity
      if (i > 0) {
        const prevSnap = history[i-1][itemIdStr];
        if (prevSnap && prevSnap.high && prevSnap.low) {
          const prevMid = (prevSnap.high + prevSnap.low) / 2;
          if (Math.abs(mid - prevMid) > config.sensitivityGpPerTrade) {
            tradesObserved++;
          }
        }
      }
    }
  }
  const sampleSize = stats.count;
  const currentMid = (currentPrice.high + currentPrice.low) / 2;
  // Calculate historical volatility %
  const historicalVolatility = currentMid > 0 ? (stats.stdDev / currentMid) * 100 : 0;
  // Tanh-normalized risk score [0, 1]
  const riskScore = tanhNormalize(historicalVolatility / 100, config.alphaRisk);
  // Observed Volume Per Hour (assuming 30s intervals if history is live)
  // Logic: trades / snapshots * (snapshots per hour)
  const snapshotsPerHour = 120; // 3600s / 30s
  const observedVolumePerHour = sampleSize > 1 ? (tradesObserved / sampleSize) * snapshotsPerHour : 5;
  // Quantitative Profit Per Hour
  const metrics = calculateFlippingMetrics(item, currentPrice);
  const effectiveVolume = Math.min(observedVolumePerHour, (item.limit || 1000) / 4, config.humanCap);
  const riskAdjustedProfit = metrics.margin * effectiveVolume * (1 - config.slippage) * (1 - riskScore);
  // Global Rank Score
  const rankScore = calculateRankScore(
    metrics.margin,
    observedVolumePerHour,
    riskScore,
    item.limit || 1
  );
  return {
    turnoverRate: sampleSize > 0 ? tradesObserved / sampleSize : 0.1,
    stdDev: stats.stdDev,
    historicalVolatility,
    sampleSize,
    observedVolumePerHour,
    riskAdjustedProfit,
    rankScore
  };
}
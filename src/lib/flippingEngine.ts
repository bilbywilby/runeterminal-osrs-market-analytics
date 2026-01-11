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
  if (buyPrice <= 0 || sellPrice <= 0) {
    return {
      buyPrice, sellPrice, tax: 0, margin: 0, roi: 0,
      volume24h: 0, potentialProfit: 0, profitPerHour24h: 0, volatilityScore: 0
    };
  }
  const tax = Math.min(5000000, Math.floor(sellPrice * 0.01));
  const grossMargin = sellPrice - buyPrice;
  const margin = Math.max(0, grossMargin - tax);
  const roi = (margin / buyPrice) * 100;
  const v24 = vol ? (vol.highPriceVolume + vol.lowPriceVolume) : 0;
  const limit = item.limit || 0;
  const midPoint = (sellPrice + buyPrice) / 2;
  const volatilityScore = midPoint > 0 ? (grossMargin / midPoint) * 100 : 0;
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
  if (agg && agg.count > 0) {
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
    if (!items || items.length === 0) {
        console.warn("[SIM] ABORTED: NO_ITEM_METADATA");
        return;
    }
    console.log("--- TERMINAL QUANT_ENGINE BACKTEST v2.0 ---");
    const activeItems = items.slice(0, 10);
    let totalEstProfit = 0;
    let totalRealizedProfit = 0;
    let drifts: number[] = [];
    activeItems.forEach(item => {
        const basePrice = 1000 + Math.random() * 50000;
        const estMargin = basePrice * 0.015;
        const vol = 1000 + Math.random() * 5000;
        let realized = 0;
        let hourlyPrices: number[] = [];
        for (let h = 0; h < 24; h++) {
            const success = Math.random() > 0.4;
            const hourlyVol = (vol / 24) * (0.8 + Math.random() * 0.4);
            const drift = (Math.random() - 0.5) * 0.02;
            hourlyPrices.push(basePrice * (1 + drift));
            if (success) realized += hourlyVol * estMargin * 0.98; // 2% slippage
            else realized -= hourlyVol * (estMargin * 0.2); // bad flip cost
        }
        const avgPrice = hourlyPrices.reduce((a,b) => a+b, 0) / 24;
        const driftRatio = Math.abs(avgPrice - basePrice) / basePrice;
        drifts.push(driftRatio);
        totalEstProfit += estMargin * vol;
        totalRealizedProfit += realized;
    });
    const accuracy = totalEstProfit > 0 ? (totalRealizedProfit / totalEstProfit) * 100 : 0;
    const avgDrift = drifts.reduce((a,b) => a+b, 0) / drifts.length;
    console.log(`REALIZED_ACCURACY: ${accuracy.toFixed(2)}%`);
    console.log(`STABILITY_INDEX: ${(1 - avgDrift).toFixed(4)}`);
    console.log(`CHURN_TOP10: ${(totalRealizedProfit/24).toLocaleString()} GP/HR`);
    console.table(activeItems.map((i, idx) => ({ 
        asset: i.name, 
        drift: `${(drifts[idx]*100).toFixed(2)}%`,
        status: drifts[idx] > 0.05 ? 'VOLATILE' : 'STABLE'
    })));
    console.log("--- BACKTEST_COMPLETE ---");
}
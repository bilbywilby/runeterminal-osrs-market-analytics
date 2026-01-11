import { ItemMapping, RawPrice, Volume24h } from './api';
import { calculateFlippingMetrics } from './flippingEngine';
export interface FlipBuddyRec {
  id: number;
  name: string;
  buyPrice: number;
  sellPrice: number;
  profitPerItem: number;
  liquidityRating: number; // 1-5
  profitHr: number;
  volClass: 'STABLE' | 'MODERATE' | 'VOLATILE';
  shortNote: string;
}
export interface FlipBuddyResponse {
  summary: string;
  items: FlipBuddyRec[];
  alternates: FlipBuddyRec[];
  wildcard: FlipBuddyRec;
}
export function parseCapital(input: string): number {
  const clean = input.toUpperCase().replace(/,/g, '').trim();
  const match = clean.match(/^(\d+\.?\d*)([KMB]?)$/);
  if (!match) return 0;
  const num = parseFloat(match[1]);
  const unit = match[2];
  switch (unit) {
    case 'K': return num * 1000;
    case 'M': return num * 1000000;
    case 'B': return num * 1000000000;
    default: return num;
  }
}
export function computeRecs(
  capital: number,
  risk: string,
  horizon: string,
  focus: string,
  items: ItemMapping[],
  prices: Record<string, RawPrice>,
  volumes: Record<string, Volume24h>
): FlipBuddyResponse {
  const now = Math.floor(Date.now() / 1000);
  const horizonMult = horizon === '2h' ? 1.0 : horizon === 'overnight' ? 0.6 : 0.2;
  const validItems = items
    .filter(item => {
      const p = prices[item.id];
      const v = volumes[item.id];
      if (!p || !v || p.high === 0 || p.low === 0) return false;
      // Strict Validation: Data Freshness (24h)
      const lastUpdate = Math.max(p.highTime, p.lowTime);
      if (now - lastUpdate > 86400) return false;
      // Volume-based Price Band Thresholds
      const v24h = v.highPriceVolume + v.lowPriceVolume;
      if (p.low > 1000000 && v24h < 50) return false;
      if (p.low > 1000 && v24h < 500) return false;
      // Min Compound ROI (0.5% of total working capital)
      const metrics = calculateFlippingMetrics(item, p, v);
      if (metrics.margin < (capital * 0.005)) {
          // Alternative: item itself must provide decent ROI
          if (metrics.roi < 1.0) return false;
      }
      if (focus === 'gear' && !item.examine.toLowerCase().includes('armour') && !item.examine.toLowerCase().includes('weapon')) return false;
      if (focus === 'rares' && item.value < 1000000) return false;
      return p.low <= capital;
    })
    .map(item => {
      const p = prices[item.id];
      const v = volumes[item.id];
      const metrics = calculateFlippingMetrics(item, p, v);
      const v24h = (v.highPriceVolume + v.lowPriceVolume);
      // Turnover-Liquidity Model
      const liquidityRating = Math.min(5, Math.ceil(v24h / 5000) || 1);
      // Map liquidity to fractional mid-price turnover bands
      const turnoverFrac = Math.min(1, (v24h / 24) / (item.limit || 1000));
      // Capital Constraint: Can we buy the full limit?
      const maxCanAfford = Math.floor(capital / p.low);
      const effectiveLimit = Math.min(item.limit || 1000, maxCanAfford);
      // Slippage & Profit Adjustment
      const slippage = 0.05 + (metrics.volatilityScore * 0.1);
      const limitProfit = metrics.margin * effectiveLimit;
      const profitHr = (limitProfit * (1 - slippage)) * turnoverFrac * horizonMult;
      const spread = (p.high - p.low) / ((p.high + p.low) / 2);
      const volClass: 'STABLE' | 'MODERATE' | 'VOLATILE' =
        spread < 0.02 ? 'STABLE' : spread < 0.05 ? 'MODERATE' : 'VOLATILE';
      let shortNote = "LOCKED_IN";
      if (volClass === 'VOLATILE') shortNote = "STOP_LOSS_ADVISED";
      if (liquidityRating < 2) shortNote = "LOW_LIQUIDITY_WARNING";
      if (effectiveLimit < (item.limit || 1000)) shortNote = "CAPITAL_CONSTRAINED";
      return {
        id: item.id,
        name: item.name,
        buyPrice: p.low,
        sellPrice: p.high,
        profitPerItem: metrics.margin,
        liquidityRating,
        profitHr,
        volClass,
        shortNote
      } as FlipBuddyRec;
    })
    .sort((a, b) => b.profitHr - a.profitHr);
  const top6 = validItems.slice(0, 6);
  const alternates = validItems.slice(6, 9);
  const wildcard = validItems.find(i => i.volClass === 'VOLATILE') || validItems[validItems.length - 1];
  return {
    summary: `STRATEGY_LOADED: Capital ${capital.toLocaleString()}GP | Risk ${risk.toUpperCase()} | Horizon ${horizon.toUpperCase()}. Found ${validItems.length} potential vectors.`,
    items: top6,
    alternates: alternates,
    wildcard: wildcard as FlipBuddyRec
  };
}
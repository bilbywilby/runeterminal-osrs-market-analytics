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
  const horizonMult = horizon === '2h' ? 1.0 : horizon === 'overnight' ? 0.6 : 0.3;
  const riskThresh = risk === 'high' ? 0.15 : risk === 'moderate' ? 0.08 : 0.03;
  const validItems = items
    .filter(item => {
      const p = prices[item.id];
      const v = volumes[item.id];
      if (!p || !v || p.high === 0 || p.low === 0) return false;
      if (focus === 'gear' && !item.examine.toLowerCase().includes('armour') && !item.examine.toLowerCase().includes('weapon')) return false;
      if (focus === 'rares' && item.value < 1000000) return false;
      return p.low <= capital;
    })
    .map(item => {
      const p = prices[item.id];
      const v = volumes[item.id];
      const metrics = calculateFlippingMetrics(item, p, v);
      const v24 = (v.highPriceVolume + v.lowPriceVolume);
      const liquidityRating = Math.min(5, Math.ceil(v24 / 5000) || 1);
      const turnoverFrac = Math.min(1, v24 / (item.limit || 1000));
      const profitHr = metrics.margin * turnoverFrac * 10 * horizonMult;
      const spread = (p.high - p.low) / ((p.high + p.low) / 2);
      const volClass: 'STABLE' | 'MODERATE' | 'VOLATILE' = 
        spread < 0.02 ? 'STABLE' : spread < 0.05 ? 'MODERATE' : 'VOLATILE';
      let shortNote = "LOCKED_IN";
      if (volClass === 'VOLATILE') shortNote = "STOP_LOSS_ADVISED";
      if (liquidityRating < 2) shortNote = "LOW_LIQUIDITY_WARNING";
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
    summary: `STRATEGY_LOADED: Capital ${capital.toLocaleString()}GP | Risk ${risk.toUpperCase()} | Horizon ${horizon.toUpperCase()}. Focus: ${focus.toUpperCase()}. Found ${validItems.length} potential vectors.`,
    items: top6,
    alternates: alternates,
    wildcard: wildcard as FlipBuddyRec
  };
}
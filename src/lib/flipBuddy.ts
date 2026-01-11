import { ItemMapping, RawPrice, Volume24h, TimeStepPrice } from './api';
import { calculateFlippingMetrics } from './flippingEngine';
export interface FlipBuddyRec {
  id: number;
  name: string;
  buyPrice: number;
  sellPrice: number;
  profitPerItem: number;
  liquidityRating: number; // 1-5 scale based on 5m velocity
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
  if (!input) return 0;
  // Strip common currency/formatting symbols and handle whitespace
  const clean = input.toUpperCase()
    .replace(/[$,\sGP]/g, '')
    .trim();
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
  volumes: Record<string, Volume24h>,
  prices5m: Record<string, TimeStepPrice>
): FlipBuddyResponse {
  const now = Math.floor(Date.now() / 1000);
  const horizonMult = horizon === '2h' ? 1.0 : 0.4;
  const validItems = items
    .filter(item => {
      const p = prices[item.id];
      const v = volumes[item.id];
      if (!p || !v || p.high === 0 || p.low === 0) return false;
      // Data Freshness Validation (24h)
      const lastUpdate = Math.max(p.highTime, p.lowTime);
      if (now - lastUpdate > 86400) return false;
      // Price-Band Volume Thresholds
      const v24h = (v.highPriceVolume || 0) + (v.lowPriceVolume || 0);
      if (p.low > 1000000 && v24h < 50) return false;
      if (p.low > 1000 && v24h < 500) return false;
      // Capital filter
      if (p.low > capital) return false;
      // Profitability check
      const metrics = calculateFlippingMetrics(item, p, v);
      if (metrics.margin < (capital * 0.0001)) return false; // Min 0.01% capital per flip
      // Focus filters
      if (focus === 'gear') {
          const examine = item.examine.toLowerCase();
          if (!examine.includes('armour') && !examine.includes('weapon') && !examine.includes('shield')) return false;
      }
      if (focus === 'rares' && item.value < 1000000) return false;
      return true;
    })
    .map(item => {
      const p = prices[item.id];
      const v = volumes[item.id];
      const p5m = prices5m[item.id];
      const metrics = calculateFlippingMetrics(item, p, v);
      // Liquidity Model using 5m data - Ensure 1 as baseline, never NaN
      const v5m = p5m ? ((p5m.highPriceVolume || 0) + (p5m.lowPriceVolume || 0)) : 0;
      const liquidityRating = Math.max(1, Math.min(5, Math.ceil(v5m / 20)));
      // Turnover forecasting
      const v24h = (v.highPriceVolume || 0) + (v.lowPriceVolume || 0);
      const turnoverFrac = Math.min(1, (v24h / 24) / (item.limit || 1000));
      const maxCanAfford = Math.floor(capital / p.low);
      const effectiveLimit = Math.min(item.limit || 1000, maxCanAfford);
      const slippage = 0.05 + (metrics.volatilityScore * 0.1);
      const profitHr = (metrics.margin * effectiveLimit * (1 - slippage)) * turnoverFrac * horizonMult;
      const spread = (p.high - p.low) / ((p.high + p.low) / 2 || 1);
      const volClass: 'STABLE' | 'MODERATE' | 'VOLATILE' =
        spread < 0.01 ? 'STABLE' : spread < 0.04 ? 'MODERATE' : 'VOLATILE';
      let shortNote = "TARGET_LOCKED";
      if (!p5m) shortNote = "FRESH_DATA_PENDING";
      else if (liquidityRating < 2) shortNote = "LOW_5M_VELOCITY";
      else if (volClass === 'VOLATILE') shortNote = "HIGH_SLIP_RISK";
      else if (effectiveLimit < (item.limit || 1)) shortNote = "CAPITAL_BOTTLENECK";
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
    summary: `UPLINK_U64: CAPITAL=${capital.toLocaleString()} RISK=${risk.toUpperCase()} VECTORS=${validItems.length}. SYSTEM_FRESHNESS_VERIFIED.`,
    items: top6,
    alternates: alternates,
    wildcard: wildcard as FlipBuddyRec
  };
}
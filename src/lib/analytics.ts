/**
 * Advanced Analytics Utility
 * Implements high-performance statistical algorithms for market data.
 */
/**
 * Welford's algorithm for calculating running mean and variance.
 * Highly stable numerically and memory efficient.
 */
export class RollingStats {
  private n: number = 0;
  private mean: number = 0;
  private m2: number = 0;
  /**
   * Add a new observation to the statistics
   */
  add(x: number | null | undefined): void {
    if (x === null || x === undefined || isNaN(x)) return;
    this.n++;
    const delta = x - this.mean;
    this.mean += delta / this.n;
    const delta2 = x - this.mean;
    this.m2 += delta * delta2;
  }
  get count(): number {
    return this.n;
  }
  get currentMean(): number {
    return this.mean;
  }
  get variance(): number {
    return this.n > 1 ? this.m2 / (this.n - 1) : 0;
  }
  get stdDev(): number {
    return Math.sqrt(this.variance);
  }
  get relativeStdDev(): number {
    return this.mean !== 0 ? (this.stdDev / Math.abs(this.mean)) * 100 : 0;
  }
}
/**
 * Normalizes a value using a hyperbolic tangent function for risk scoring.
 * Used to map volatility/risk into a controlled [0, 1] range.
 */
export function tanhNormalize(value: number, alpha: number = 1): number {
  return Math.tanh(alpha * value);
}
/**
 * Calculates a log-weighted score for ranking assets.
 */
export function calculateRankScore(margin: number, volume: number, risk: number, limit: number): number {
  const logMargin = Math.log10(Math.max(1, margin));
  const logVol = Math.log10(Math.max(1, volume));
  const logLimit = Math.log10(Math.max(1, limit));
  // Score = (Margin Power * Volume Power) / Risk Penalty * Limit Scale
  return (logMargin * 1.0 + logVol * 0.8 - risk * 2.0) * logLimit;
}
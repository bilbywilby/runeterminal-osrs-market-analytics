export class RollingStats {
  private n: number = 0;
  private mean: number = 0;
  private m2: number = 0;
  add(x: number | null | undefined): void {
    if (x === null || x === undefined || isNaN(x)) return;
    this.n++;
    const delta = x - this.mean;
    this.mean += delta / this.n;
    const delta2 = x - this.mean;
    this.m2 += delta * delta2;
  }
  get count(): number { return this.n; }
  get currentMean(): number { return this.mean; }
  get variance(): number { return this.n > 1 ? this.m2 / (this.n - 1) : 0; }
  get stdDev(): number { return Math.sqrt(this.variance); }
}
export class ItemAggregate {
  public count: number = 0;
  public sumMid: number = 0;
  public sumSq: number = 0;
  public lastMid: number = 0;
  constructor(data?: Partial<ItemAggregate>) {
    this.count = 0;
    this.sumMid = 0;
    this.sumSq = 0;
    this.lastMid = 0;
    if (data) {
      this.count = data.count ?? 0;
      this.sumMid = data.sumMid ?? 0;
      this.sumSq = data.sumSq ?? 0;
      this.lastMid = data.lastMid ?? 0;
    }
  }
  add(val: number): void {
    if (isNaN(val) || val <= 0) return;
    this.count++;
    this.sumMid += val;
    this.sumSq += val * val;
    this.lastMid = val;
  }
  removeSample(val: number): void {
    if (this.count <= 0 || isNaN(val)) {
      this.clear();
      return;
    }
    this.count--;
    this.sumMid -= val;
    this.sumSq -= val * val;
    // Safety check for floating point precision drift or underflow
    if (this.count <= 0 || this.sumMid < 0 || this.sumSq < 0) {
      this.clear();
    }
  }
  clear(): void {
    this.count = 0;
    this.sumMid = 0;
    this.sumSq = 0;
    this.lastMid = 0;
  }
  get mean(): number {
    return this.count > 0 ? this.sumMid / this.count : 0;
  }
  get stdDev(): number {
    if (this.count < 2) return 0;
    // Variance formula: (Sum(x^2) - (Sum(x)^2 / n)) / (n - 1)
    const variance = (this.sumSq - (this.sumMid * this.sumMid) / this.count) / (this.count - 1);
    return Math.sqrt(Math.max(0, variance));
  }
  get volatility(): number {
    const m = this.mean;
    return m > 0.000001 ? (this.stdDev / m) * 100 : 0;
  }
  toJSON() {
    return {
      count: this.count,
      sumMid: this.sumMid,
      sumSq: this.sumSq,
      lastMid: this.lastMid
    };
  }
}
export function tanhNormalize(value: number, alpha: number = 1): number {
  return Math.tanh(alpha * value);
}
export function calculateRankScore(
    margin: number,
    volume: number,
    risk: number,
    limit: number,
    weights = { margin: 1.0, volume: 0.8, risk: 2.0 }
): number {
  const logMargin = Math.log10(Math.max(1, margin));
  const logVol = Math.log10(Math.max(1, volume));
  const logLimit = Math.log10(Math.max(1, limit));
  // Score = (Weighted Margin + Weighted Volume - Weighted Risk) scaled by item limit importance
  return (logMargin * weights.margin + logVol * weights.volume - risk * weights.risk) * logLimit;
}
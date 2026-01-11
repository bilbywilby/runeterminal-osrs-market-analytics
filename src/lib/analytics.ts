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
    if (this.count <= 0 || isNaN(val)) return;
    this.count--;
    this.sumMid -= val;
    this.sumSq -= val * val;
    // Safety check for floating point precision drift
    if (this.count === 0) {
      this.sumMid = 0;
      this.sumSq = 0;
    }
  }
  get mean(): number {
    return this.count > 0 ? this.sumMid / this.count : 0;
  }
  get stdDev(): number {
    if (this.count < 2) return 0;
    const variance = (this.sumSq - (this.sumMid * this.sumMid) / this.count) / (this.count - 1);
    return Math.sqrt(Math.max(0, variance));
  }
  get volatility(): number {
    const m = this.mean;
    return m > 0 ? (this.stdDev / m) * 100 : 0;
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
export class IncrementalStats {
    private count: number = 0;
    private sum: number = 0;
    private sumSq: number = 0;
    update(val: number): void {
        this.count++;
        this.sum += val;
        this.sumSq += val * val;
    }
    get mean(): number {
        return this.count > 0 ? this.sum / this.count : 0;
    }
    get stdDev(): number {
        if (this.count < 2) return 0;
        const variance = (this.sumSq - (this.sum * this.sum) / this.count) / (this.count - 1);
        return Math.sqrt(Math.max(0, variance));
    }
    get volatility(): number {
        const m = this.mean;
        return m > 0 ? (this.stdDev / m) * 100 : 0;
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
  return (logMargin * weights.margin + logVol * weights.volume - risk * weights.risk) * logLimit;
}
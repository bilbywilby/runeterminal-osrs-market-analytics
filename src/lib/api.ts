export interface RawPrice {
    high: number;
    highTime: number;
    low: number;
    lowTime: number;
}
export interface ItemMapping {
    id: number;
    name: string;
    examine: string;
    members: boolean;
    lowalch?: number;
    highalch?: number;
    limit?: number;
    value: number;
    icon: string;
}
export interface TimeseriesPoint {
    timestamp: number;
    avgHighPrice: number | null;
    avgLowPrice: number | null;
    highPriceVolume: number;
    lowPriceVolume: number;
}
export async function fetchLatestPrices(): Promise<Record<string, RawPrice>> {
    const response = await fetch('/api/proxy/latest');
    const json = await response.json();
    return json.data;
}
export async function fetchItemMapping(): Promise<ItemMapping[]> {
    const response = await fetch('/api/proxy/mapping');
    return await response.json();
}
export async function fetchItemTimeseries(id: number, timestep: string = '5m'): Promise<TimeseriesPoint[]> {
    const response = await fetch(`/api/proxy/timeseries?id=${id}&timestep=${timestep}`);
    const json = await response.json();
    return json.data || [];
}
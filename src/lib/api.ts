export interface RawPrice {
    high: number;
    highTime: number;
    low: number;
    lowTime: number;
}
export interface Volume24h {
    highPriceVolume: number;
    lowPriceVolume: number;
}
export interface TimeStepPrice {
    avgHighPrice: number | null;
    avgLowPrice: number | null;
    highPriceVolume: number;
    lowPriceVolume: number;
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
function validateApiResponse<T>(data: any, validator: (d: any) => boolean, errorMessage: string): T {
    if (!data || !validator(data)) {
        console.error(`[API VALIDATION ERROR]: ${errorMessage}`, data);
        throw new Error(errorMessage);
    }
    return data as T;
}
export async function fetchLatestPrices(): Promise<Record<string, RawPrice>> {
    const response = await fetch('/api/proxy/latest');
    if (!response.ok) throw new Error(`HTTP_${response.status}_LATEST`);
    const json = await response.json();
    return validateApiResponse<Record<string, RawPrice>>(json.data, (d) => typeof d === 'object', 'INVALID_LATEST');
}
export async function fetch5mPrices(): Promise<Record<string, TimeStepPrice>> {
    const response = await fetch('/api/proxy/5m');
    if (!response.ok) throw new Error(`HTTP_${response.status}_5M`);
    const json = await response.json();
    return validateApiResponse<Record<string, TimeStepPrice>>(json.data, (d) => typeof d === 'object', 'INVALID_5M');
}
export async function fetch1hPrices(): Promise<Record<string, TimeStepPrice>> {
    const response = await fetch('/api/proxy/1h');
    if (!response.ok) throw new Error(`HTTP_${response.status}_1H`);
    const json = await response.json();
    return validateApiResponse<Record<string, TimeStepPrice>>(json.data, (d) => typeof d === 'object', 'INVALID_1H');
}
export async function fetch24hPrices(): Promise<Record<string, Volume24h>> {
    const response = await fetch('/api/proxy/24h');
    if (!response.ok) throw new Error(`HTTP_${response.status}_24H`);
    const json = await response.json();
    return validateApiResponse<Record<string, Volume24h>>(json.data, (d) => typeof d === 'object', 'INVALID_24H');
}
export async function fetchItemMapping(): Promise<ItemMapping[]> {
    const response = await fetch('/api/proxy/mapping');
    if (!response.ok) throw new Error(`HTTP_${response.status}_MAPPING`);
    const data = await response.json();
    return validateApiResponse<ItemMapping[]>(data, (d) => Array.isArray(d), 'INVALID_MAPPING');
}
export async function fetchItemTimeseries(id: number, timestep: string = '5m'): Promise<TimeseriesPoint[]> {
    const response = await fetch(`/api/proxy/timeseries?id=${id}&timestep=${timestep}`);
    if (!response.ok) return [];
    const json = await response.json();
    return json.data || [];
}
export function downloadMarketCsv() {
    window.location.href = '/api/export-csv';
}
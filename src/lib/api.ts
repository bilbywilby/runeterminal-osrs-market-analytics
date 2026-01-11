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
function validateApiResponse<T>(data: any, validator: (d: any) => boolean, errorMessage: string): T {
    if (!data || !validator(data)) {
        console.error(`[API VALIDATION ERROR]: ${errorMessage}`, data);
        throw new Error(errorMessage);
    }
    return data as T;
}
export async function fetchLatestPrices(): Promise<Record<string, RawPrice>> {
    try {
        const response = await fetch('/api/proxy/latest');
        if (!response.ok) throw new Error(`HTTP_${response.status}_LATEST`);
        const json = await response.json();
        return validateApiResponse<Record<string, RawPrice>>(
            json.data,
            (d) => typeof d === 'object' && d !== null,
            'INVALID_LATEST_PRICES_STRUCTURE'
        );
    } catch (err) {
        console.error('[UPLINK_FAILURE]: fetchLatestPrices', err);
        throw err;
    }
}
export async function fetchItemMapping(): Promise<ItemMapping[]> {
    try {
        const response = await fetch('/api/proxy/mapping');
        if (!response.ok) throw new Error(`HTTP_${response.status}_MAPPING`);
        const data = await response.json();
        return validateApiResponse<ItemMapping[]>(
            data,
            (d) => Array.isArray(d),
            'INVALID_MAPPING_ARRAY'
        );
    } catch (err) {
        console.error('[UPLINK_FAILURE]: fetchItemMapping', err);
        throw err;
    }
}
export async function fetchItemTimeseries(id: number, timestep: string = '5m'): Promise<TimeseriesPoint[]> {
    try {
        const response = await fetch(`/api/proxy/timeseries?id=${id}&timestep=${timestep}`);
        if (!response.ok) throw new Error(`HTTP_${response.status}_TIMESERIES`);
        const json = await response.json();
        if (!json.data || !Array.isArray(json.data)) {
            console.warn(`[API_WARNING]: Empty or malformed timeseries for item ${id}`);
            return [];
        }
        return json.data;
    } catch (err) {
        console.error(`[UPLINK_FAILURE]: fetchItemTimeseries id=${id}`, err);
        return [];
    }
}
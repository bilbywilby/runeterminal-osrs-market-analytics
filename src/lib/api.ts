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
export async function fetchLatestPrices(): Promise<Record<string, RawPrice>> {
    const response = await fetch('/api/proxy/latest');
    const json = await response.json();
    return json.data;
}
export async function fetchItemMapping(): Promise<ItemMapping[]> {
    const response = await fetch('/api/proxy/mapping');
    return await response.json();
}
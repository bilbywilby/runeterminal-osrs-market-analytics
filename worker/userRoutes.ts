import { Hono } from "hono";
import { Env } from './core-utils';
export function userRoutes(app: Hono<{ Bindings: Env }>) {
    const WIKI_USER_AGENT = 'RuneTerminal/1.1 (Market Analytics; contact@runeterminal.example.com)';
    async function fetchWithRetry(url: string, options: RequestInit, retries = 3, backoff = 500): Promise<Response> {
        try {
            const response = await fetch(url, options);
            if (response.status === 429 || (response.status >= 500 && response.status < 600)) {
                if (retries > 0) {
                    await new Promise(resolve => globalThis.setTimeout(resolve, backoff));
                    return fetchWithRetry(url, options, retries - 1, backoff * 2);
                }
            }
            return response;
        } catch (error) {
            if (retries > 0) {
                await new Promise(resolve => globalThis.setTimeout(resolve, backoff));
                return fetchWithRetry(url, options, retries - 1, backoff * 2);
            }
            throw error;
        }
    }
    app.get('/api/proxy/latest', async (c) => {
        try {
            const response = await fetchWithRetry('https://prices.runescape.wiki/api/v1/osrs/latest', {
                headers: { 'User-Agent': WIKI_USER_AGENT }
            });
            const data = await response.json();
            return c.json(data);
        } catch (error) {
            return c.json({ error: 'Failed to fetch latest prices' }, 500);
        }
    });
    app.get('/api/proxy/24h', async (c) => {
        try {
            const response = await fetchWithRetry('https://prices.runescape.wiki/api/v1/osrs/24h', {
                headers: { 'User-Agent': WIKI_USER_AGENT }
            });
            const data = await response.json();
            return c.json(data);
        } catch (error) {
            return c.json({ error: 'Failed to fetch 24h volume data' }, 500);
        }
    });
    app.get('/api/proxy/mapping', async (c) => {
        try {
            const response = await fetchWithRetry('https://prices.runescape.wiki/api/v1/osrs/mapping', {
                headers: { 'User-Agent': WIKI_USER_AGENT }
            });
            const data = await response.json();
            return c.json(data);
        } catch (error) {
            return c.json({ error: 'Failed to fetch mapping' }, 500);
        }
    });
    app.get('/api/proxy/timeseries', async (c) => {
        const id = c.req.query('id');
        const timestep = c.req.query('timestep') || '5m';
        if (!id) return c.json({ error: 'Missing ID' }, 400);
        try {
            const url = `https://prices.runescape.wiki/api/v1/osrs/timeseries?id=${id}&timestep=${timestep}`;
            const response = await fetchWithRetry(url, { headers: { 'User-Agent': WIKI_USER_AGENT } });
            const data = await response.json();
            return c.json(data);
        } catch (error) {
            return c.json({ error: 'Failed to fetch timeseries' }, 500);
        }
    });
    app.get('/api/flip-recs', async (c) => {
        const capitalStr = c.req.query('capital') || '10m';
        const risk = c.req.query('risk') || 'moderate';
        const horizon = c.req.query('horizon') || '2h';
        const focus = c.req.query('focus') || 'all';
        return c.json({
            summary: `UPLINK_STABLE: CAPITAL=${capitalStr.toUpperCase()} RISK=${risk.toUpperCase()} HORIZON=${horizon.toUpperCase()}`,
            timestamp: Date.now(),
            status: "STRATEGY_GENERATED",
            items: [],
            meta: { capitalStr, risk, horizon, focus }
        });
    });
    app.get('/api/export-csv', async (c) => {
        try {
            const [mapRes, latestRes, volRes] = await Promise.all([
                fetch('https://prices.runescape.wiki/api/v1/osrs/mapping', { headers: { 'User-Agent': WIKI_USER_AGENT } }),
                fetch('https://prices.runescape.wiki/api/v1/osrs/latest', { headers: { 'User-Agent': WIKI_USER_AGENT } }),
                fetch('https://prices.runescape.wiki/api/v1/osrs/24h', { headers: { 'User-Agent': WIKI_USER_AGENT } })
            ]);
            const mapping = (await mapRes.json()) as any[];
            const latestData = (await latestRes.json()) as { data: Record<string, any> };
            const volumesData = (await volRes.json()) as { data: Record<string, any> };
            const latest = latestData.data;
            const volumes = volumesData.data;
            let csv = "name,buy,sell,profit_per_item,limit,vol24h,potential_profit\n";
            mapping.forEach(item => {
                const p = latest[item.id];
                const v = volumes[item.id];
                if (p && v && p.high && p.low) {
                    const buy = p.low;
                    const sell = p.high;
                    const tax = Math.min(5000000, Math.floor(sell * 0.01));
                    const profit = Math.max(0, (sell - buy) - tax);
                    const vol24h = (v.highPriceVolume || 0) + (v.lowPriceVolume || 0);
                    const potential = profit * vol24h;
                    csv += `"${item.name}",${buy},${sell},${profit},${item.limit || 0},${vol24h},${potential}\n`;
                }
            });
            return new Response(csv, {
                headers: {
                    'Content-Type': 'text/csv',
                    'Content-Disposition': 'attachment; filename="osrs_market_export.csv"'
                }
            });
        } catch (error) {
            return c.json({ error: 'Export failed' }, 500);
        }
    });
}
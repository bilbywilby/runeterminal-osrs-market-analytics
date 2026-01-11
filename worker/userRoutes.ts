import { Hono } from "hono";
import { Env } from './core-utils';
export function userRoutes(app: Hono<{ Bindings: Env }>) {
    const WIKI_USER_AGENT = 'RuneTerminal/1.1 (Market Analytics; contact@runeterminal.example.com)';
    // Simple in-memory rate limiter for the proxy
    const rateLimitMap = new Map<string, number>();
    async function fetchWithRetry(url: string, options: RequestInit, retries = 3, backoff = 500): Promise<Response> {
        try {
            const response = await fetch(url, options);
            if (response.status === 429 || (response.status >= 500 && response.status < 600)) {
                if (retries > 0) {
                    await new Promise(resolve => setTimeout(resolve, backoff));
                    return fetchWithRetry(url, options, retries - 1, backoff * 2);
                }
            }
            return response;
        } catch (error) {
            if (retries > 0) {
                await new Promise(resolve => setTimeout(resolve, backoff));
                return fetchWithRetry(url, options, retries - 1, backoff * 2);
            }
            throw error;
        }
    }
    const checkRateLimit = (ip: string) => {
        const now = Date.now();
        const lastRequest = rateLimitMap.get(ip) || 0;
        if (lastRequest !== 0 && now - lastRequest < 500) return false; // 0.5s soft limit per IP
        rateLimitMap.set(ip, now);
        return true;
    };
    app.get('/api/proxy/latest', async (c) => {
        const ip = c.req.header('cf-connecting-ip') || 'anonymous';
        if (!checkRateLimit(ip)) return c.json({ error: 'Rate limit exceeded' }, 429);
        try {
            const response = await fetchWithRetry('https://prices.runescape.wiki/api/v1/osrs/latest', {
                headers: { 'User-Agent': WIKI_USER_AGENT }
            });
            const data = await response.json() as { data?: Record<string, any> };
            if (!data || typeof data !== 'object' || !data.data) {
                return c.json({ error: 'Invalid response from upstream' }, 502);
            }
            return c.json(data);
        } catch (error) {
            console.error('Latest prices proxy error:', error);
            return c.json({ error: 'Failed to fetch latest prices after retries' }, 500);
        }
    });
    app.get('/api/proxy/mapping', async (c) => {
        try {
            const response = await fetchWithRetry('https://prices.runescape.wiki/api/v1/osrs/mapping', {
                headers: { 'User-Agent': WIKI_USER_AGENT }
            });
            const data = await response.json();
            if (!Array.isArray(data)) {
                return c.json({ error: 'Invalid mapping data format' }, 502);
            }
            return c.json(data);
        } catch (error) {
            console.error('Mapping proxy error:', error);
            return c.json({ error: 'Failed to fetch item mapping' }, 500);
        }
    });
    app.get('/api/proxy/timeseries', async (c) => {
        const id = c.req.query('id');
        const timestep = c.req.query('timestep') || '5m';
        if (!id) return c.json({ error: 'Missing item ID' }, 400);
        try {
            const url = `https://prices.runescape.wiki/api/v1/osrs/timeseries?id=${id}&timestep=${timestep}`;
            const response = await fetchWithRetry(url, {
                headers: { 'User-Agent': WIKI_USER_AGENT }
            });
            const data = await response.json();
            return c.json(data);
        } catch (error) {
            console.error('Timeseries proxy error:', error);
            return c.json({ error: 'Failed to fetch timeseries' }, 500);
        }
    });
}
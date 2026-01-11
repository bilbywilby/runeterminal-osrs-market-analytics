import { Hono } from "hono";
import { Env } from './core-utils';
export function userRoutes(app: Hono<{ Bindings: Env }>) {
    const WIKI_USER_AGENT = 'RuneTerminal/1.0 (Market Analytics; contact@runeterminal.example.com)';
    app.get('/api/proxy/latest', async (c) => {
        try {
            const response = await fetch('https://prices.runescape.wiki/api/v1/osrs/latest', {
                headers: { 'User-Agent': WIKI_USER_AGENT }
            });
            const data = await response.json();
            return c.json(data);
        } catch (error) {
            return c.json({ error: 'Failed to fetch latest prices' }, 500);
        }
    });
    app.get('/api/proxy/mapping', async (c) => {
        try {
            const response = await fetch('https://prices.runescape.wiki/api/v1/osrs/mapping', {
                headers: { 'User-Agent': WIKI_USER_AGENT }
            });
            const data = await response.json();
            return c.json(data);
        } catch (error) {
            return c.json({ error: 'Failed to fetch item mapping' }, 500);
        }
    });
}
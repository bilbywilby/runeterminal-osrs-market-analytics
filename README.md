# Cloudflare Fullstack App Template

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/bilbywilby/runeterminal-osrs-market-analytics)

A production-ready fullstack application template powered by Cloudflare Workers (backend) and Vite + React (frontend). Features a modern UI with shadcn/ui, Tailwind CSS, and seamless integration for API routes, error handling, and deployment.

## Features

- **Fullstack Architecture**: React 18 frontend with TanStack Query for data fetching, Hono-based API backend on Cloudflare Workers.
- **Modern UI**: shadcn/ui components, Tailwind CSS with custom design system, dark mode support, responsive design.
- **Developer Experience**: Hot reload, TypeScript, Vite bundling, auto-generated types from Workers.
- **Production Ready**: CORS handling, logging, error boundaries, client error reporting, SPA routing.
- **Performance**: Optimized builds, code splitting, Cloudflare Assets for static hosting.
- **Extensibility**: Easy API route addition via `worker/userRoutes.ts`, sidebar layout, theming hooks.

## Tech Stack

- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS, shadcn/ui, Lucide icons, TanStack Query, React Router, Sonner (toasts), Framer Motion.
- **Backend**: Cloudflare Workers, Hono, TypeScript.
- **Utilities**: Zustand (state), Zod (validation), Immer, Date-fns, Recharts.
- **Dev Tools**: Bun (package manager), Wrangler (deployment), ESLint, Tailwind.

## Quick Start

### Prerequisites

- [Bun](https://bun.sh/) installed (`curl -fsSL https://bun.sh/install | bash`)
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/installation/) (`bunx wrangler@latest init` or global install)
- Cloudflare account and API token with Workers/Pages permissions.

### Installation

```bash
git clone <your-repo-url>
cd <project-name>
bun install
```

### Development

Start the development server (frontend + worker proxy):

```bash
bun dev
```

- Frontend: http://localhost:3000 (or `${PORT:-3000}`)
- API: http://localhost:3000/api/*
- Hot reload enabled.

Generate Worker types:

```bash
bun cf-typegen
```

Lint:

```bash
bun lint
```

### Build for Production

```bash
bun build
```

Outputs optimized assets to `dist/`.

### Deploy to Cloudflare

1. Login to Wrangler:
   ```bash
   bunx wrangler login
   ```

2. Deploy Worker + Assets:
   ```bash
   bun deploy
   ```

Or manually:

```bash
bun build
wrangler deploy
```

Assets are automatically handled via `assets` config in `wrangler.jsonc`. Preview at your Worker URL.

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/bilbywilby/runeterminal-osrs-market-analytics)

## Project Structure

```
├── src/                 # React frontend (Vite)
│   ├── components/      # UI components (shadcn/ui + custom)
│   ├── hooks/           # Custom React hooks
│   ├── lib/             # Utilities, error reporting
│   └── pages/           # Route-based pages
├── worker/              # Cloudflare Worker backend
│   ├── index.ts         # Core app (DO NOT MODIFY)
│   ├── userRoutes.ts    # Add your API routes here
│   └── core-utils.ts    # Env types (DO NOT MODIFY)
├── tailwind.config.js   # Design system
├── vite.config.ts       # Vite + Cloudflare plugin
└── wrangler.jsonc       # Worker config
```

## Usage

### Adding API Routes

Edit `worker/userRoutes.ts`:

```typescript
import { userRoutes } from 'worker/userRoutes';

userRoutes(app)
  .get('/api/users', (c) => c.json({ users: [] }))
  .post('/api/users', async (c) => {
    const body = await c.req.json();
    // Handle logic
    return c.json({ success: true });
  });
```

Routes auto-reload in dev.

### Frontend Pages

Edit `src/pages/HomePage.tsx` or add routes in `src/main.tsx`.

Use `AppLayout` for sidebar layout:

```tsx
import { AppLayout } from '@/components/layout/AppLayout';

function MyPage() {
  return (
    <AppLayout>
      <div>Your content</div>
    </AppLayout>
  );
}
```

### Client-Side Data Fetching

Uses TanStack Query. API calls proxy to `/api/*`.

```tsx
const { data } = useQuery({
  queryKey: ['users'],
  queryFn: () => fetch('/api/users').then(res => res.json()),
});
```

## Customization

- **UI Components**: Run `bunx shadcn-ui@latest add <component>` for new shadcn components.
- **Theme**: Edit `tailwind.config.js` and `src/index.css`.
- **Sidebar**: Customize `src/components/app-sidebar.tsx`.
- **Error Handling**: Client errors auto-reported to `/api/client-errors`.

## Scripts

| Command | Description |
|---------|-------------|
| `bun dev` | Start dev server |
| `bun build` | Build for production |
| `bun lint` | Lint code |
| `bun deploy` | Build + deploy to Cloudflare |
| `bun preview` | Preview production build |
| `bun cf-typegen` | Generate Worker types |

## Environment Variables

Set via Wrangler dashboard or `wrangler.toml`:

```toml
[vars]
API_KEY = "your-key"
```

Access in Worker: `env.API_KEY`.

## Contributing

1. Fork the repo.
2. Create a feature branch.
3. Install deps: `bun install`.
4. Commit changes: `git commit -m "feat: add X"`.
5. PR to `main`.

## License

MIT. See [LICENSE](LICENSE) for details.

---

⭐ Star this repo if it helps! Questions? [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
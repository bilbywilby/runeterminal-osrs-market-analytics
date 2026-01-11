import '@/lib/errorReporter';
import { enableMapSet } from "immer";
enableMapSet();
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { RouteErrorBoundary } from '@/components/RouteErrorBoundary';
import '@/index.css'
import { HomePage } from '@/pages/HomePage'
import { ItemDetailPage } from '@/pages/ItemDetailPage'
import { MarketScanner } from '@/pages/MarketScanner'
import { FlipBuddy } from '@/pages/FlipBuddy'
import { IntelligencePage } from '@/pages/IntelligencePage'
const queryClient = new QueryClient();
const router = createBrowserRouter([
  {
    path: "/",
    element: <HomePage />,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: "/item/:id",
    element: <ItemDetailPage />,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: "/flipper",
    element: <MarketScanner />,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: "/buddy",
    element: <FlipBuddy />,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: "/intelligence",
    element: <IntelligencePage />,
    errorElement: <RouteErrorBoundary />,
  }
]);
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        <RouterProvider router={router} />
      </ErrorBoundary>
    </QueryClientProvider>
  </StrictMode>,
)
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
    path: "/scanner",
    element: <div className="p-8 text-terminal-green">SCANNER_MODULE_OFFLINE: PENDING_DEPLOYMENT</div>,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: "/intelligence",
    element: <div className="p-8 text-terminal-green">INTEL_MODULE_OFFLINE: PENDING_PHASE_3</div>,
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
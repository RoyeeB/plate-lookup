/**
 * Renders a component inside the providers the app mounts at the root
 * (router + query client + toast), so component tests don't each rebuild
 * that tree. Each render gets a fresh QueryClient so no cache leaks between tests.
 */
import type { ReactElement, ReactNode } from 'react';
import { render } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ToastProvider } from '@/hooks/useToast';

interface Options {
  /** Initial URL, e.g. `/vehicle/1234567`. */
  route?: string;
  /** Route pattern the element is mounted at, e.g. `/vehicle/:plate`. */
  path?: string;
}

export function renderWithProviders(ui: ReactElement, { route = '/', path = '*' }: Options = {}) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[route]}>
        <ToastProvider>
          <Routes>
            <Route path={path} element={children} />
            <Route path="*" element={<p>other page</p>} />
          </Routes>
        </ToastProvider>
      </MemoryRouter>
    </QueryClientProvider>
  );
  return render(ui, { wrapper: Wrapper });
}

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';
import { readFileSync } from 'node:fs';

/**
 * The production security headers live in vercel.json. `vite preview` serves
 * the same ones, so the CSP is exercised locally (and by the e2e tests) before
 * it ever reaches a deploy. Dev keeps no CSP: Vite's HMR injects inline code.
 */
function productionHeaders(): Record<string, string> {
  const config = JSON.parse(readFileSync(new URL('./vercel.json', import.meta.url), 'utf8')) as {
    headers: Array<{ source: string; headers: Array<{ key: string; value: string }> }>;
  };
  const all = config.headers.find((rule) => rule.source === '/(.*)');
  return Object.fromEntries((all?.headers ?? []).map(({ key, value }) => [key, value]));
}

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      // Logic shared with the native app, at the repo root.
      '@shared': fileURLToPath(new URL('../shared', import.meta.url)),
    },
  },
  server: {
    host: true,
    port: 5173,
    // Allow serving ../shared in dev.
    fs: { allow: ['..'] },
  },
  preview: {
    port: 4173,
    headers: productionHeaders(),
  },
});

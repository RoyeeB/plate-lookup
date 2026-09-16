/**
 * Vitest configuration, kept separate from vite.config.ts so the test runner
 * never pulls the React plugin (or jsdom) into what is pure-logic unit testing.
 * Mirrors the `@/` -> `src/` alias from tsconfig/vite so test imports match
 * the app's own import style.
 */
import { defineConfig } from 'vitest/config';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  test: {
    environment: 'node',
  },
});

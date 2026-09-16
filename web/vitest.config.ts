/**
 * Vitest configuration, kept separate from vite.config.ts so the test runner
 * never pulls in the React plugin. Pure-logic tests run in `node`; component
 * tests opt into jsdom per file with a `@vitest-environment jsdom` docblock.
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
    setupFiles: ['./src/test/setup.ts'],
  },
});

/**
 * Shared test setup. Testing Library only auto-unmounts when Vitest globals
 * are on, which they aren't here, so unmount explicitly between tests.
 */
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

afterEach(() => {
  cleanup();
});

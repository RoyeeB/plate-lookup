/**
 * Monitoring stays completely off without a DSN, and never lets a plate number
 * out of the browser when it is on.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { initMonitoring, reportError, resetMonitoringForTests, scrubPlates } from '@/lib/monitoring';

afterEach(() => {
  resetMonitoringForTests();
  vi.restoreAllMocks();
});

describe('scrubPlates', () => {
  it('removes plate numbers from routes and text', () => {
    expect(scrubPlates('https://app.test/vehicle/8491639')).toBe('https://app.test/vehicle/:plate');
    expect(scrubPlates('/compare/8491639/35000902')).toBe('/compare/:plate/:plate');
    expect(scrubPlates('No vehicle record found for plate 8491639')).toBe(
      'No vehicle record found for plate #'
    );
  });

  it('leaves short numbers such as HTTP codes alone', () => {
    expect(scrubPlates('HTTP 503 from data.gov.il')).toBe('HTTP 503 from data.gov.il');
  });
});

describe('initMonitoring', () => {
  it('does nothing — and loads nothing — without a DSN', async () => {
    const load = vi.fn();
    await expect(initMonitoring(undefined, load)).resolves.toBe(false);
    expect(load).not.toHaveBeenCalled();
  });

  it('initialises Sentry without PII, tracing, or plate numbers', async () => {
    const init = vi.fn();
    const captureException = vi.fn();
    const sdk = { init, captureException } as unknown as typeof import('@sentry/react');

    await expect(initMonitoring('https://key@o1.ingest.sentry.io/1', async () => sdk)).resolves.toBe(true);

    const options = init.mock.calls[0][0];
    expect(options.sendDefaultPii).toBe(false);
    expect(options.tracesSampleRate).toBe(0);

    const event = options.beforeSend({
      request: { url: 'https://app.test/vehicle/8491639' },
      exception: { values: [{ value: 'failed for 8491639' }] },
    });
    expect(event.request.url).toBe('https://app.test/vehicle/:plate');
    expect(event.exception.values[0].value).toBe('failed for #');

    vi.spyOn(console, 'error').mockImplementation(() => {});
    reportError(new Error('boom'), { kind: 'query' });
    expect(captureException).toHaveBeenCalledWith(expect.any(Error), { extra: { kind: 'query' } });
  });
});

/**
 * Error reporting. Off unless VITE_SENTRY_DSN is set at build time — then the
 * Sentry SDK is loaded lazily (its own chunk; nothing is downloaded without a
 * DSN). Errors raised before it finishes loading are queued, not lost.
 *
 * Privacy: no default PII, and plate numbers are scrubbed from every URL and
 * message before an event leaves the browser.
 */
type Sentry = typeof import('@sentry/react');

interface PendingReport {
  error: unknown;
  context?: Record<string, unknown>;
}

let sentry: Sentry | null = null;
let pending: PendingReport[] = [];

/** "/vehicle/8491639" → "/vehicle/:plate"; any 5–8 digit run in a message → "#". */
export function scrubPlates(value: string): string {
  return value
    .replace(/\/(vehicle|compare)\/\d{5,8}(\/\d{5,8})?/g, (_, route, second) =>
      second ? `/${route}/:plate/:plate` : `/${route}/:plate`
    )
    .replace(/\b\d{5,8}\b/g, '#');
}

export async function initMonitoring(
  dsn: string | undefined = import.meta.env.VITE_SENTRY_DSN,
  load: () => Promise<Sentry> = () => import('@sentry/react')
): Promise<boolean> {
  if (!dsn) return false;

  const sdk = await load();
  sdk.init({
    dsn,
    release: import.meta.env.VITE_APP_VERSION,
    environment: import.meta.env.MODE,
    sendDefaultPii: false,
    // Errors only: no tracing or replay, so no timing data or screen captures.
    tracesSampleRate: 0,
    beforeSend(event) {
      if (event.request?.url) event.request.url = scrubPlates(event.request.url);
      for (const exception of event.exception?.values ?? []) {
        if (exception.value) exception.value = scrubPlates(exception.value);
      }
      if (event.message) event.message = scrubPlates(event.message);
      return event;
    },
    beforeBreadcrumb(breadcrumb) {
      if (typeof breadcrumb.data?.url === 'string') breadcrumb.data.url = scrubPlates(breadcrumb.data.url);
      if (typeof breadcrumb.data?.to === 'string') breadcrumb.data.to = scrubPlates(breadcrumb.data.to);
      if (typeof breadcrumb.data?.from === 'string') breadcrumb.data.from = scrubPlates(breadcrumb.data.from);
      if (breadcrumb.message) breadcrumb.message = scrubPlates(breadcrumb.message);
      return breadcrumb;
    },
  });

  sentry = sdk;
  for (const report of pending) sdk.captureException(report.error, { extra: report.context });
  pending = [];
  return true;
}

/** Report a handled error. Always logged; sent only when monitoring is on. */
export function reportError(error: unknown, context?: Record<string, unknown>): void {
  console.error(error, context ?? '');
  if (sentry) sentry.captureException(error, { extra: context });
  else if (import.meta.env.VITE_SENTRY_DSN) pending.push({ error, context });
}

/** Test hook: forget any loaded SDK and queued reports. */
export function resetMonitoringForTests(): void {
  sentry = null;
  pending = [];
}

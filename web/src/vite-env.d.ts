/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Sentry DSN; monitoring is off when unset. See .env.example. */
  readonly VITE_SENTRY_DSN?: string;
  /** Release name attached to error reports. */
  readonly VITE_APP_VERSION?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

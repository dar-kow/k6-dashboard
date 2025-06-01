/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_WS_URL: string;
  readonly VITE_APP_NAME: string;
  readonly VITE_APP_VERSION: string;
  readonly VITE_DEV_MODE: string;
  readonly VITE_LOG_LEVEL: string;
  readonly VITE_ENABLE_REDUX_DEVTOOLS: string;
  readonly VITE_ENABLE_CACHE: string;
  readonly VITE_CACHE_TTL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Global declarations for build-time variables
declare const __APP_VERSION__: string;
declare const __BUILD_TIME__: string;

// Jest DOM matchers for tests
declare global {
  namespace Vi {
    interface Assertion<T = any> {
      toBeInTheDocument(): T;
      toHaveClass(className: string): T;
      toBeDisabled(): T;
    }
  }
}

export {};

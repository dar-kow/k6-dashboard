interface EnvironmentConfig {
  apiUrl: string;
  wsUrl: string;
  appName: string;
  appVersion: string;
  isDevelopment: boolean;
  logLevel: "debug" | "info" | "warn" | "error";
  enableReduxDevTools: boolean;
  enableCache: boolean;
  cacheTTL: number;
}

const getEnvironmentConfig = (): EnvironmentConfig => {
  return {
    apiUrl: import.meta.env.VITE_API_URL || "http://localhost:4000/api",
    wsUrl: import.meta.env.VITE_WS_URL || "http://localhost:4000",
    appName: import.meta.env.VITE_APP_NAME || "K6 Dashboard",
    appVersion: import.meta.env.VITE_APP_VERSION || "1.0.0",
    isDevelopment: import.meta.env.VITE_DEV_MODE === "true",
    logLevel: (import.meta.env.VITE_LOG_LEVEL as any) || "info",
    enableReduxDevTools: import.meta.env.VITE_ENABLE_REDUX_DEVTOOLS === "true",
    enableCache: import.meta.env.VITE_ENABLE_CACHE !== "false",
    cacheTTL: parseInt(import.meta.env.VITE_CACHE_TTL || "300000", 10),
  };
};

export const env = getEnvironmentConfig();

// Type declarations for Vite
declare global {
  const __APP_VERSION__: string;
  const __BUILD_TIME__: string;
}

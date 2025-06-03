/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  // Dodaj tu inne zmienne środowiskowe, jeśli używasz
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

import axios, {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  AxiosError,
} from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

const config: AxiosRequestConfig = {
  baseURL: API_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
};

// Tworzenie instancji axios
const apiClient: AxiosInstance = axios.create(config);

// Interceptor dla requestów
apiClient.interceptors.request.use(
  (config) => {
    console.log("📡 API Request:", config.method?.toUpperCase(), config.url);
    return config;
  },
  (error) => {
    console.error("📡 API Request Error:", error);
    return Promise.reject(error);
  }
);

// Interceptor dla odpowiedzi
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    console.log("📡 API Response:", response.status, response.config.url);
    return response;
  },
  (error: AxiosError) => {
    console.error(
      "📡 API Error:",
      error.response?.status,
      error.message,
      error.config?.url
    );

    // Obsługa konkretnych kodów błędów
    if (error.response) {
      switch (error.response.status) {
        case 401:
          console.error("Unauthorized. Please login again.");
          break;
        case 403:
          console.error("Forbidden. You do not have permission.");
          break;
        case 404:
          console.error("Resource not found.");
          break;
        case 500:
          console.error("Server error. Please try again later.");
          break;
      }
    } else if (error.request) {
      console.error("No response received from server. Check your connection.");
    }

    return Promise.reject(error);
  }
);

// Mechanizm ponownych prób z exponential backoff
export const withRetry = async <T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  delay = 1000
): Promise<T> => {
  let lastError: any;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      console.warn(`Attempt ${attempt + 1} failed. Retrying in ${delay}ms...`);

      // Czekaj przed następną próbą
      await new Promise((resolve) => setTimeout(resolve, delay));

      // Zwiększ opóźnienie dla następnej próby (exponential backoff)
      delay *= 2;
    }
  }

  throw lastError;
};

// Cache dla wyników API
export const createApiCache = () => {
  const cache = new Map<string, { data: any; timestamp: number }>();
  const CACHE_TTL = 5 * 60 * 1000; // 5 minut

  const getCached = <T>(key: string): T | null => {
    const cached = cache.get(key);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.data as T;
    }
    return null;
  };

  const setCache = <T>(key: string, data: T): void => {
    cache.set(key, { data, timestamp: Date.now() });
  };

  const invalidateCache = (keyPattern?: string): void => {
    if (!keyPattern) {
      cache.clear();
      return;
    }

    // Usuń pasujące klucze
    const regex = new RegExp(keyPattern);
    for (const key of Array.from(cache.keys())) {
      if (regex.test(key)) {
        cache.delete(key);
      }
    }
  };

  return { getCached, setCache, invalidateCache };
};

export const apiCache = createApiCache();

export default apiClient;

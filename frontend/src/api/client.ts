import axios, {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  AxiosError,
} from "axios";

// Request/Response types
interface ApiResponse<T = any> {
  data: T;
  message?: string;
  status: "success" | "error";
}

interface ApiError {
  message: string;
  status: number;
  code?: string;
}

// Create axios instance
const createApiClient = (): AxiosInstance => {
  const client = axios.create({
    baseURL: process.env.REACT_APP_API_URL || "http://localhost:4000/api",
    timeout: 15000, // 15 seconds
    headers: {
      "Content-Type": "application/json",
    },
    withCredentials: true,
  });

  // Request interceptor
  client.interceptors.request.use(
    (config: AxiosRequestConfig) => {
      // Add timestamp to prevent caching
      if (config.method === "get") {
        config.params = {
          ...config.params,
          _t: Date.now(),
        };
      }

      // Add auth token if available
      const token = localStorage.getItem("authToken");
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      // Log requests in development
      if (process.env.NODE_ENV === "development") {
        console.log(
          `📡 API Request: ${config.method?.toUpperCase()} ${config.url}`,
          {
            params: config.params,
            data: config.data,
          }
        );
      }

      return config;
    },
    (error: AxiosError) => {
      console.error("📡 Request Error:", error);
      return Promise.reject(error);
    }
  );

  // Response interceptor
  client.interceptors.response.use(
    (response: AxiosResponse) => {
      // Log responses in development
      if (process.env.NODE_ENV === "development") {
        console.log(
          `📡 API Response: ${response.status} ${response.config.url}`,
          {
            data: response.data,
            duration: Date.now() - (response.config as any)._requestStart,
          }
        );
      }

      return response;
    },
    (error: AxiosError) => {
      const apiError: ApiError = {
        message: "Unknown error occurred",
        status: 500,
      };

      if (error.response) {
        // Server responded with error status
        apiError.status = error.response.status;
        apiError.message = error.response.data?.message || error.message;
        apiError.code = error.response.data?.code;

        // Handle specific status codes
        switch (error.response.status) {
          case 401:
            // Unauthorized - clear auth token
            localStorage.removeItem("authToken");
            apiError.message = "Session expired. Please log in again.";
            break;
          case 403:
            apiError.message = "Access denied.";
            break;
          case 404:
            apiError.message = "Resource not found.";
            break;
          case 429:
            apiError.message = "Too many requests. Please try again later.";
            break;
          case 500:
            apiError.message = "Server error. Please try again later.";
            break;
        }
      } else if (error.request) {
        // Network error
        apiError.message = "Network error. Please check your connection.";
        apiError.status = 0;
      }

      console.error("📡 API Error:", apiError);
      return Promise.reject(apiError);
    }
  );

  return client;
};

// Create singleton instance
export const apiClient = createApiClient();

// Utility functions for common operations
export const apiGet = async <T>(
  url: string,
  config?: AxiosRequestConfig
): Promise<T> => {
  const response = await apiClient.get<T>(url, config);
  return response.data;
};

export const apiPost = async <T>(
  url: string,
  data?: any,
  config?: AxiosRequestConfig
): Promise<T> => {
  const response = await apiClient.post<T>(url, data, config);
  return response.data;
};

export const apiPut = async <T>(
  url: string,
  data?: any,
  config?: AxiosRequestConfig
): Promise<T> => {
  const response = await apiClient.put<T>(url, data, config);
  return response.data;
};

export const apiDelete = async <T>(
  url: string,
  config?: AxiosRequestConfig
): Promise<T> => {
  const response = await apiClient.delete<T>(url, config);
  return response.data;
};

// Retry mechanism
export const apiWithRetry = async <T>(
  apiCall: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> => {
  let lastError: any;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await apiCall();
    } catch (error) {
      lastError = error;

      if (attempt === maxRetries) {
        break;
      }

      // Don't retry on client errors (4xx)
      if (error.status >= 400 && error.status < 500) {
        break;
      }

      // Exponential backoff
      const waitTime = delay * Math.pow(2, attempt - 1);
      await new Promise((resolve) => setTimeout(resolve, waitTime));

      console.log(`🔄 Retrying API call, attempt ${attempt + 1}/${maxRetries}`);
    }
  }

  throw lastError;
};

// Cache implementation
class ApiCache {
  private cache = new Map<
    string,
    { data: any; timestamp: number; ttl: number }
  >();

  set(key: string, data: any, ttl: number = 5 * 60 * 1000): void {
    // 5 minutes default
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  get(key: string): any | null {
    const item = this.cache.get(key);

    if (!item) return null;

    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  clear(): void {
    this.cache.clear();
  }

  delete(key: string): void {
    this.cache.delete(key);
  }
}

export const apiCache = new ApiCache();

// Cached API call
export const apiGetCached = async <T>(
  url: string,
  config?: AxiosRequestConfig,
  cacheKey?: string,
  ttl?: number
): Promise<T> => {
  const key = cacheKey || `${url}_${JSON.stringify(config?.params || {})}`;

  // Try cache first
  const cached = apiCache.get(key);
  if (cached) {
    console.log(`📦 Cache hit for: ${key}`);
    return cached;
  }

  // Fetch from API
  const data = await apiGet<T>(url, config);

  // Cache the result
  apiCache.set(key, data, ttl);
  console.log(`📦 Cached: ${key}`);

  return data;
};

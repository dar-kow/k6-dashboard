import axios, {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  AxiosError,
} from "axios";
import { ApiResponse, ApiErrorResponse } from "../types/api";

// 🔗 API Client Configuration for K6 Dashboard

class ApiClient {
  private client: AxiosInstance;
  private requestQueue: Map<string, AbortController> = new Map();

  constructor() {
    this.client = axios.create({
      baseURL: process.env.REACT_APP_API_URL || "http://localhost:4000/api",
      timeout: 30000, // 30 seconds
      withCredentials: true,
      headers: {
        "Content-Type": "application/json",
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        // Add request ID for tracking
        const requestId = `${config.method?.toUpperCase()}_${
          config.url
        }_${Date.now()}`;
        config.metadata = { requestId };

        // Add abort controller for request cancellation
        const controller = new AbortController();
        config.signal = controller.signal;
        this.requestQueue.set(requestId, controller);

        console.log(`📡 API Request [${requestId}]:`, {
          method: config.method?.toUpperCase(),
          url: config.url,
          params: config.params,
          timestamp: new Date().toISOString(),
        });

        return config;
      },
      (error) => {
        console.error("📡 Request Error:", error);
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response: AxiosResponse) => {
        const requestId = response.config.metadata?.requestId;

        // Clean up request from queue
        if (requestId) {
          this.requestQueue.delete(requestId);
        }

        console.log(`📡 API Response [${requestId}]:`, {
          status: response.status,
          url: response.config.url,
          responseTime: this.calculateResponseTime(response.config),
          timestamp: new Date().toISOString(),
        });

        return response;
      },
      (error: AxiosError) => {
        const requestId = error.config?.metadata?.requestId;

        // Clean up request from queue
        if (requestId) {
          this.requestQueue.delete(requestId);
        }

        console.error(`📡 API Error [${requestId}]:`, {
          status: error.response?.status,
          message: error.message,
          url: error.config?.url,
          timestamp: new Date().toISOString(),
        });

        // Transform error for consistent handling
        const transformedError = this.transformError(error);
        return Promise.reject(transformedError);
      }
    );
  }

  private calculateResponseTime(config: any): string {
    if (!config.metadata?.startTime) return "unknown";
    const duration = Date.now() - config.metadata.startTime;
    return `${duration}ms`;
  }

  private transformError(error: AxiosError): ApiErrorResponse {
    if (error.response?.data) {
      // Server responded with error
      return {
        error: {
          message: error.response.data.message || error.message,
          code: error.response.status,
          details: error.response.data,
        },
        status: error.response.status,
        success: false,
        timestamp: new Date().toISOString(),
      };
    } else if (error.request) {
      // Network error
      return {
        error: {
          message: "Network error - unable to reach server",
          code: "NETWORK_ERROR",
          details: error.message,
        },
        status: 0,
        success: false,
        timestamp: new Date().toISOString(),
      };
    } else {
      // Something else happened
      return {
        error: {
          message: error.message || "Unknown error occurred",
          code: "UNKNOWN_ERROR",
          details: error,
        },
        status: 0,
        success: false,
        timestamp: new Date().toISOString(),
      };
    }
  }

  // Public API methods
  async get<T = any>(
    url: string,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    const response = await this.client.get(url, config);
    return this.transformResponse(response);
  }

  async post<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    const response = await this.client.post(url, data, config);
    return this.transformResponse(response);
  }

  async put<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    const response = await this.client.put(url, data, config);
    return this.transformResponse(response);
  }

  async delete<T = any>(
    url: string,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    const response = await this.client.delete(url, config);
    return this.transformResponse(response);
  }

  async patch<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    const response = await this.client.patch(url, data, config);
    return this.transformResponse(response);
  }

  // Utility methods
  cancelRequest(requestId: string): void {
    const controller = this.requestQueue.get(requestId);
    if (controller) {
      controller.abort();
      this.requestQueue.delete(requestId);
      console.log(`📡 Request cancelled: ${requestId}`);
    }
  }

  cancelAllRequests(): void {
    this.requestQueue.forEach((controller, requestId) => {
      controller.abort();
      console.log(`📡 Request cancelled: ${requestId}`);
    });
    this.requestQueue.clear();
  }

  // Transform response to consistent format
  private transformResponse<T>(response: AxiosResponse): ApiResponse<T> {
    return {
      data: response.data,
      status: response.status,
      success: response.status >= 200 && response.status < 300,
      timestamp: new Date().toISOString(),
    };
  }

  // Health check method
  async healthCheck(): Promise<boolean> {
    try {
      await this.get("/health");
      return true;
    } catch (error) {
      console.error("Health check failed:", error);
      return false;
    }
  }
}

// Create and export singleton instance
export const apiClient = new ApiClient();
export default apiClient;

// Export types for use in services
export type { ApiResponse, ApiErrorResponse } from "../types/api";

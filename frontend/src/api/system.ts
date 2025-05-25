import axios from "axios";

const apiClient = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "http://localhost:4000/api",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

export interface SystemInfo {
  success: boolean;
  system: {
    name: string;
    version: string;
    description: string;
    repository: {
      url: string;
      branch: string;
    };
    testConfig: {
      defaultProfile: string;
      maxConcurrentTests: number;
      timeout: number;
    };
    availableEnvironments: string[];
  };
  dashboard: {
    version: string;
    nodeEnv: string;
    uptime: number;
  };
  timestamp: string;
}

export interface EnvironmentConfig {
  success: boolean;
  environment: string;
  config: {
    baseUrl: string;
    hasApiKey: boolean;
    apiKeyLength: number;
  };
  timestamp: string;
}

export interface TestConfiguration {
  success: boolean;
  configuration: {
    system: {
      name: string;
      version: string;
      description: string;
    };
    environments: Array<{
      name: string;
      baseUrl: string;
      hasApiKey: boolean;
    }>;
    testDefaults: {
      defaultProfile: string;
      maxConcurrentTests: number;
      timeout: number;
    };
    repository: {
      url: string;
      branch: string;
    };
  };
  timestamp: string;
}

export const getSystemInfo = async (): Promise<SystemInfo> => {
  try {
    const response = await apiClient.get<SystemInfo>("/system/info");
    return response.data;
  } catch (error: any) {
    console.error("Error getting system info:", error);
    throw error;
  }
};

export const getEnvironmentConfig = async (
  environment: string
): Promise<EnvironmentConfig> => {
  try {
    const response = await apiClient.get<EnvironmentConfig>(
      `/system/environment/${environment}`
    );
    return response.data;
  } catch (error: any) {
    console.error("Error getting environment config:", error);
    throw error;
  }
};

export const getTestConfiguration = async (): Promise<TestConfiguration> => {
  try {
    const response = await apiClient.get<TestConfiguration>("/system/config");
    return response.data;
  } catch (error: any) {
    console.error("Error getting test configuration:", error);
    throw error;
  }
};

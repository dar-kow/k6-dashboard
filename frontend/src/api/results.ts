import axios from "axios";
import { TestDirectory, TestFile, TestResult } from "../types/testResults";

// Create axios instance with proper configuration
const apiClient = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "http://localhost:4000/api",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// For debugging purposes
apiClient.interceptors.request.use((request) => {
  console.log("API Request:", request.url);
  return request;
});

apiClient.interceptors.response.use(
  (response) => {
    console.log("API Response:", response.status);
    return response;
  },
  (error) => {
    console.error("API Error:", error.message);
    return Promise.reject(error);
  }
);

export const fetchResultDirectories = async (): Promise<TestDirectory[]> => {
  try {
    const response = await apiClient.get<TestDirectory[]>("/results");
    return response.data.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  } catch (error) {
    console.error("Error fetching result directories:", error);
    throw error;
  }
};

export const fetchResultFiles = async (
  directory: string
): Promise<TestFile[]> => {
  try {
    const response = await apiClient.get<TestFile[]>(`/results/${directory}`);
    return response.data;
  } catch (error) {
    console.error(
      `Error fetching result files for directory ${directory}:`,
      error
    );
    throw error;
  }
};

export const fetchTestResult = async (
  directory: string,
  file: string
): Promise<TestResult> => {
  try {
    const response = await apiClient.get<TestResult>(
      `/results/${directory}/${file}`
    );
    return response.data;
  } catch (error) {
    console.error(`Error fetching test result for ${file}:`, error);
    throw error;
  }
};

// For testing API connectivity
export const testApiConnection = async (): Promise<{ status: string }> => {
  try {
    const response = await apiClient.get<{ status: string }>("/health");
    return response.data;
  } catch (error) {
    console.error("API health check failed:", error);
    throw error;
  }
};

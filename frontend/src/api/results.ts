import axios from "axios";
import { TestDirectory, TestFile, TestResult } from "../types/testResults";

const apiClient = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "http://localhost:4000/api",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use((request) => {
  console.log("📡 API Request:", request.method?.toUpperCase(), request.url);
  return request;
});

apiClient.interceptors.response.use(
  (response) => {
    console.log("📡 API Response:", response.status, response.config.url);
    return response;
  },
  (error) => {
    console.error(
      "📡 API Error:",
      error.response?.status,
      error.message,
      error.config?.url
    );
    return Promise.reject(error);
  }
);

const parseApiDate = (dateValue: any): Date => {
  try {
    if (dateValue instanceof Date) return dateValue;
    if (typeof dateValue === "string") {
      if (/^\d{13}$/.test(dateValue)) {
        return new Date(parseInt(dateValue));
      }
      return new Date(dateValue);
    }
    if (typeof dateValue === "number") {
      return new Date(dateValue);
    }
    return new Date();
  } catch (error) {
    console.error("❌ Error parsing API date:", dateValue, error);
    return new Date();
  }
};

export const fetchResultDirectories = async (
  repositoryId?: string
): Promise<TestDirectory[]> => {
  try {
    console.log("🔍 Fetching result directories...", { repositoryId });

    const url = repositoryId
      ? `/results?repositoryId=${repositoryId}`
      : "/results";

    const response = await apiClient.get<any[]>(url);
    console.log("📁 Raw API response:", response.data);

    if (!Array.isArray(response.data)) {
      console.error(
        "❌ API returned non-array:",
        typeof response.data,
        response.data
      );
      throw new Error(
        `API returned invalid format: expected array, got ${typeof response.data}`
      );
    }

    const processedDirectories = response.data.map((item, index) => {
      try {
        console.log(`📂 Processing directory ${index}:`, item);

        if (!item.name || !item.path) {
          console.warn(`⚠️ Directory ${index} missing required fields:`, item);
        }

        const directory: TestDirectory = {
          name: item.name || `unknown-${index}`,
          path: item.path || "",
          date: parseApiDate(item.date),
          // 🔧 DODANE: Repository info dla lepszego UX
          repositoryId: item.repositoryId,
          repositoryName: item.repositoryName,
          testName: item.testName,
        };

        console.log(`✅ Processed directory ${index}:`, {
          name: directory.name,
          date: directory.date.toISOString(),
          repositoryName: directory.repositoryName,
          testName: directory.testName,
          valid: !isNaN(directory.date.getTime()),
        });

        return directory;
      } catch (error) {
        console.error(`❌ Error processing directory ${index}:`, item, error);
        return {
          name: `error-directory-${index}`,
          path: "",
          date: new Date(),
        };
      }
    });

    const sortedDirectories = processedDirectories.sort(
      (a, b) => b.date.getTime() - a.date.getTime()
    );

    console.log(
      `✅ Successfully processed ${sortedDirectories.length} directories with repository info`
    );
    return sortedDirectories;
  } catch (error) {
    console.error("💥 Error fetching result directories:", error);

    if (axios.isAxiosError(error)) {
      if (error.response?.status === 404) {
        throw new Error(
          "Results endpoint not found. Check if backend is running."
        );
      } else if (error.response && error.response.status >= 500) {
        throw new Error(
          `Server error (${error.response.status}): ${error.response.statusText}`
        );
      } else if (error.code === "ECONNREFUSED") {
        throw new Error(
          "Cannot connect to backend. Check if backend server is running on port 4000."
        );
      }
    }

    throw error;
  }
};

export const fetchResultFiles = async (
  directory: string
): Promise<TestFile[]> => {
  try {
    console.log("📄 Fetching files for directory:", directory);

    const encodedDirectory = encodeURIComponent(directory);
    console.log("📄 Encoded directory:", encodedDirectory);

    const response = await apiClient.get<TestFile[]>(
      `/results/${encodedDirectory}`
    );
    console.log("📄 Files response:", response.data);

    if (!Array.isArray(response.data)) {
      console.error(
        "❌ Files API returned non-array:",
        typeof response.data,
        response.data
      );
      throw new Error(
        `Files API returned invalid format: expected array, got ${typeof response.data}`
      );
    }

    return response.data;
  } catch (error) {
    console.error(
      `💥 Error fetching result files for directory ${directory}:`,
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
    console.log("📊 Fetching test result:", { directory, file });

    const encodedDirectory = encodeURIComponent(directory);
    const encodedFile = encodeURIComponent(file);

    console.log("📊 Encoded paths:", { encodedDirectory, encodedFile });

    const response = await apiClient.get<TestResult>(
      `/results/${encodedDirectory}/${encodedFile}`
    );

    console.log("📊 Test result response:", {
      hasMetrics: !!response.data.metrics,
      metricsKeys: response.data.metrics
        ? Object.keys(response.data.metrics)
        : [],
      hasRootGroup: !!response.data.root_group,
      checksCount: response.data.root_group?.checks
        ? Object.keys(response.data.root_group.checks).length
        : 0,
    });

    return response.data;
  } catch (error) {
    console.error(`💥 Error fetching test result for ${file}:`, error);
    throw error;
  }
};

export const testApiConnection = async (): Promise<{ status: string }> => {
  try {
    const response = await apiClient.get<{ status: string }>("/health");
    return response.data;
  } catch (error) {
    console.error("💥 API health check failed:", error);
    throw error;
  }
};

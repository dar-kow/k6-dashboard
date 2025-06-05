#!/usr/bin/env node
// frontend/src/api/results.ts
import apiClient, { apiCache, withRetry } from "./client"; // Import shared client and utilities
import { TestDirectory, TestFile, TestResult } from "../types/testResults";
import axios from "axios"; // Keep axios import for isAxiosError if used, or type AxiosError

// Removed local apiClient creation and interceptors as they are now centralized in ./client.ts

const parseApiDate = (dateValue: any): Date => {
  try {
    if (dateValue instanceof Date) return dateValue;
    if (typeof dateValue === "string") {
      if (/^\d{13}$/.test(dateValue)) { // Check for timestamp in milliseconds
        return new Date(parseInt(dateValue));
      }
      return new Date(dateValue); // Standard ISO string or other parsable format
    }
    if (typeof dateValue === "number") { // Could be a timestamp
      return new Date(dateValue);
    }
    console.warn("Unparseable date encountered:", dateValue, "falling back to current date.");
    return new Date(); // Fallback, though might be better to throw or return null
  } catch (error) {
    console.error("❌ Error parsing API date:", dateValue, error);
    return new Date(); // Fallback
  }
};

export const fetchResultDirectories = async (
  repositoryId?: string
): Promise<TestDirectory[]> => {
  const cacheKey = repositoryId ? `result_directories_${repositoryId}` : "result_directories_default";
  const cached = apiCache.getCached<TestDirectory[]>(cacheKey);
  // if (cached) {
  //   console.log("📁 Serving result directories from cache:", { repositoryId });
  //   return cached.map(dir => ({...dir, date: parseApiDate(dir.date)})); // Ensure dates are Date objects from cache
  // }
  // Disabling cache for directories for now as they change frequently with new results.

  try {
    console.log("🔍 Fetching result directories...", { repositoryId });
    const url = repositoryId ? `/results?repositoryId=${repositoryId}` : "/results";

    // Using withRetry for fetching directories
    const response = await withRetry(() => apiClient.get<any[]>(url));
    console.log("📁 Raw API response:", response.data);

    if (!Array.isArray(response.data)) {
      console.error("❌ API returned non-array:", typeof response.data, response.data);
      throw new Error(`API returned invalid format: expected array, got ${typeof response.data}`);
    }

    const processedDirectories = response.data.map((item, index) => {
      try {
        // ... (rest of the processing logic remains the same)
        if (!item.name || !item.path) {
          console.warn(`⚠️ Directory ${index} missing required fields:`, item);
        }
        const directory: TestDirectory = {
          name: item.name || `unknown-${index}`,
          path: item.path || "",
          date: parseApiDate(item.date),
          repositoryId: item.repositoryId,
          repositoryName: item.repositoryName,
          testName: item.testName,
        };
        return directory;
      } catch (error) {
        console.error(`❌ Error processing directory ${index}:`, item, error);
        return { name: `error-directory-${index}`, path: "", date: new Date(), repositoryId: item.repositoryId, repositoryName: item.repositoryName, testName: item.testName };
      }
    });

    const sortedDirectories = processedDirectories.sort((a, b) => b.date.getTime() - a.date.getTime());
    // apiCache.setCache(cacheKey, sortedDirectories.map(dir => ({...dir, date: dir.date.toISOString()}) )); // Cache with ISO strings
    console.log(`✅ Successfully processed ${sortedDirectories.length} directories`);
    return sortedDirectories;
  } catch (error) {
    console.error("💥 Error fetching result directories:", error);
    if (axios.isAxiosError(error)) { // Ensure axios is imported for this check
      if (error.response?.status === 404) { throw new Error("Results endpoint not found. Check if backend is running."); }
      else if (error.response && error.response.status >= 500) { throw new Error(`Server error (${error.response.status}): ${error.response.statusText}`); }
      else if (error.code === "ECONNREFUSED") { throw new Error("Cannot connect to backend. Check if backend server is running on port 4000.");}
    }
    throw error;
  }
};

export const fetchResultFiles = async (directory: string): Promise<TestFile[]> => {
  // Caching for files of a specific directory might be useful if files dont change often after a run is complete.
  // const cacheKey = `result_files_${directory}`;
  // const cached = apiCache.getCached<TestFile[]>(cacheKey);
  // if (cached) { return cached; }

  try {
    console.log("📄 Fetching files for directory:", directory);
    const encodedDirectory = encodeURIComponent(directory);
    const response = await withRetry(() => apiClient.get<TestFile[]>(`/results/${encodedDirectory}`)); // Using withRetry
    if (!Array.isArray(response.data)) {
      console.error("❌ Files API returned non-array:", typeof response.data, response.data);
      throw new Error(`Files API returned invalid format: expected array, got ${typeof response.data}`);
    }
    // apiCache.setCache(cacheKey, response.data);
    return response.data;
  } catch (error) {
    console.error(`💥 Error fetching result files for directory ${directory}:`, error);
    throw error;
  }
};

export const fetchTestResult = async (directory: string, file: string): Promise<TestResult> => {
  // Caching for specific test result
  // const cacheKey = `test_result_${directory}_${file}`;
  // const cached = apiCache.getCached<TestResult>(cacheKey);
  // if (cached) { return cached; }
  try {
    console.log("📊 Fetching test result:", { directory, file });
    const encodedDirectory = encodeURIComponent(directory);
    const encodedFile = encodeURIComponent(file);
    const response = await withRetry(() => apiClient.get<TestResult>(`/results/${encodedDirectory}/${encodedFile}`)); // Using withRetry
    // apiCache.setCache(cacheKey, response.data);
    return response.data;
  } catch (error) {
    console.error(`💥 Error fetching test result for ${file}:`, error);
    throw error;
  }
};

export const testApiConnection = async (): Promise<{ status: string }> => {
  try {
    const response = await apiClient.get<{ status: string }>("/health"); // No retry for health check usually
    return response.data;
  } catch (error) {
    console.error("💥 API health check failed:", error);
    throw error;
  }
};

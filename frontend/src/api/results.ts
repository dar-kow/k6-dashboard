import { apiGet, apiGetCached, apiWithRetry, apiCache } from "./client";
import { TestDirectory, TestFile, TestResult } from "../types/testResults";

export const fetchResultDirectories = async (
  repositoryId?: string
): Promise<TestDirectory[]> => {
  const url = repositoryId
    ? `/results?repositoryId=${repositoryId}`
    : "/results";
  const cacheKey = `directories_${repositoryId || "default"}`;

  return apiWithRetry(
    () => apiGetCached<TestDirectory[]>(url, {}, cacheKey, 2 * 60 * 1000), // 2 minutes cache
    3,
    1000
  );
};

export const fetchResultFiles = async (
  directory: string
): Promise<TestFile[]> => {
  const encodedDirectory = encodeURIComponent(directory);
  const cacheKey = `files_${encodedDirectory}`;

  return apiWithRetry(
    () =>
      apiGetCached<TestFile[]>(
        `/results/${encodedDirectory}`,
        {},
        cacheKey,
        1 * 60 * 1000
      ), // 1 minute cache
    2,
    500
  );
};

export const fetchTestResult = async (
  directory: string,
  file: string
): Promise<TestResult> => {
  const encodedDirectory = encodeURIComponent(directory);
  const encodedFile = encodeURIComponent(file);
  const cacheKey = `result_${encodedDirectory}_${encodedFile}`;

  return apiWithRetry(
    () =>
      apiGetCached<TestResult>(
        `/results/${encodedDirectory}/${encodedFile}`,
        {},
        cacheKey,
        5 * 60 * 1000
      ), // 5 minutes cache
    2,
    500
  );
};

export const testApiConnection = async (): Promise<{ status: string }> => {
  return apiGet<{ status: string }>("/health");
};

// Utility to clear results cache
export const clearResultsCache = (): void => {
  apiCache.clear();
  console.log("📦 Results cache cleared");
};

// Preload commonly accessed data
export const preloadLatestResults = async (
  repositoryId?: string
): Promise<void> => {
  try {
    console.log("🚀 Preloading latest results...");

    // Preload directories
    const directories = await fetchResultDirectories(repositoryId);

    if (directories.length > 0) {
      // Preload files for the latest directory
      const latestDir = directories[0];
      await fetchResultFiles(latestDir.name);

      console.log("✅ Latest results preloaded");
    }
  } catch (error) {
    console.warn("⚠️ Failed to preload results:", error);
  }
};

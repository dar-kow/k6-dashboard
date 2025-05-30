import { apiClient } from "./api";
import { TestDirectory, TestFile, TestResult } from "@types/api";

export class TestResultsApi {
  async fetchDirectories(repositoryId?: string): Promise<TestDirectory[]> {
    const url = repositoryId
      ? `/results?repositoryId=${repositoryId}`
      : "/results";
    const data = await apiClient.get<TestDirectory[]>(url);

    return data.map((item) => ({
      ...item,
      date: new Date(item.date),
    }));
  }

  async fetchFiles(directory: string): Promise<TestFile[]> {
    const encodedDirectory = encodeURIComponent(directory);
    return apiClient.get<TestFile[]>(`/results/${encodedDirectory}`);
  }

  async fetchResult(directory: string, file: string): Promise<TestResult> {
    const encodedDirectory = encodeURIComponent(directory);
    const encodedFile = encodeURIComponent(file);
    return apiClient.get<TestResult>(
      `/results/${encodedDirectory}/${encodedFile}`
    );
  }

  async healthCheck(): Promise<{ status: string }> {
    return apiClient.get<{ status: string }>("/health");
  }
}

export const testResultsApi = new TestResultsApi();

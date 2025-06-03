
import axios from 'axios';
import { TestResult, TestDirectory, Repository } from '@/types/test.types';

const api = axios.create({
  baseURL: 'http://localhost:4000/api',
  timeout: 10000,
});

// Test API
export const testApi = {
  getTestDirectories: async (): Promise<TestDirectory[]> => {
    const response = await api.get('/test-results/directories');
    return response.data;
  },

  getTestResult: async (path: string): Promise<TestResult> => {
    const response = await api.get(`/test-results/result?path=${encodeURIComponent(path)}`);
    return response.data;
  },

  getTestFiles: async (directory: string) => {
    const response = await api.get(`/test-results/files?directory=${encodeURIComponent(directory)}`);
    return response.data;
  },

  executeTest: async (testConfig: any) => {
    const response = await api.post('/test-runner/execute', testConfig);
    return response.data;
  },

  executeAllTests: async (config: any) => {
    const response = await api.post('/test-runner/execute-all', config);
    return response.data;
  },

  stopTest: async (testId: string) => {
    const response = await api.post(`/test-runner/stop/${testId}`);
    return response.data;
  },

  getRunningTests: async () => {
    const response = await api.get('/test-runner/running');
    return response.data;
  },

  getAvailableTests: async () => {
    const response = await api.get('/tests');
    return response.data;
  },
};

// Dashboard API
export const dashboardApi = {
  getMetrics: async () => {
    const response = await api.get('/dashboard/metrics');
    return response.data;
  },

  getChartData: async () => {
    const response = await api.get('/dashboard/charts');
    return response.data;
  },
};

// Repository API
export const repositoryApi = {
  getRepositories: async (): Promise<Repository[]> => {
    const response = await api.get('/repositories');
    return response.data;
  },

  importRepository: async (repoConfig: any) => {
    const response = await api.post('/repositories/import', repoConfig);
    return response.data;
  },

  syncRepository: async (repositoryId: string) => {
    const response = await api.post(`/repositories/${repositoryId}/sync`);
    return response.data;
  },

  removeRepository: async (repositoryId: string) => {
    const response = await api.delete(`/repositories/${repositoryId}`);
    return response.data;
  },
};

export default api;

import { apiClient } from "./api";

export interface Repository {
  id: string;
  name: string;
  url: string;
  branch: string;
  createdAt: string;
  lastSync?: string;
  needsSync: boolean;
}

export interface CreateRepositoryRequest {
  name: string;
  url: string;
  branch?: string;
}

export interface RepositoryConfig {
  hosts: {
    PROD: string;
    DEV: string;
  };
  tokens: {
    PROD: { USER?: string; ADMIN?: string };
    DEV: { USER?: string; ADMIN?: string };
  };
  loadProfiles: Record<string, { vus: number; duration: string }>;
  availableProfiles: string[];
}

export class RepositoriesApi {
  async fetchRepositories(): Promise<Repository[]> {
    return apiClient.get<Repository[]>("/repositories");
  }

  async createRepository(data: CreateRepositoryRequest): Promise<Repository> {
    return apiClient.post<Repository>("/repositories", data);
  }

  async fetchConfig(repositoryId: string): Promise<RepositoryConfig> {
    return apiClient.get<RepositoryConfig>(
      `/repositories/${repositoryId}/config`
    );
  }

  async syncRepository(repositoryId: string): Promise<void> {
    return apiClient.post(`/repositories/${repositoryId}/sync`);
  }

  async deleteRepository(repositoryId: string): Promise<void> {
    return apiClient.delete(`/repositories/${repositoryId}`);
  }
}

export const repositoriesApi = new RepositoriesApi();

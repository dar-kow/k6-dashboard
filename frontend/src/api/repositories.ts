import apiClient, { withRetry, apiCache } from "./client";

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
    PROD: {
      USER?: string;
      ADMIN?: string;
    };
    DEV: {
      USER?: string;
      ADMIN?: string;
    };
  };
  loadProfiles: {
    [key: string]: {
      vus: number;
      duration: string;
    };
  };
  availableProfiles: string[];
}

export const fetchRepositories = async (): Promise<Repository[]> => {
  const cacheKey = "repositories";
  const cached = apiCache.getCached<Repository[]>(cacheKey);

  if (cached) {
    return cached;
  }

  try {
    const response = await withRetry(() =>
      apiClient.get<Repository[]>("/repositories")
    );
    const data = response.data;
    apiCache.setCache(cacheKey, data);
    return data;
  } catch (error) {
    console.error("Error fetching repositories:", error);
    throw error;
  }
};

export const createRepository = async (
  data: CreateRepositoryRequest
): Promise<Repository> => {
  try {
    const response = await apiClient.post<Repository>("/repositories", data);
    // Unieważnij cache
    apiCache.invalidateCache("repositories");
    return response.data;
  } catch (error) {
    console.error("Error creating repository:", error);
    throw error;
  }
};

export const fetchRepositoryConfig = async (
  repositoryId: string
): Promise<RepositoryConfig> => {
  const cacheKey = `repository_config_${repositoryId}`;
  const cached = apiCache.getCached<RepositoryConfig>(cacheKey);

  if (cached) {
    return cached;
  }

  try {
    const response = await withRetry(() =>
      apiClient.get<RepositoryConfig>(`/repositories/${repositoryId}/config`)
    );
    const data = response.data;
    apiCache.setCache(cacheKey, data);
    return data;
  } catch (error) {
    console.error("Error fetching repository config:", error);
    throw error;
  }
};

export const syncRepository = async (repositoryId: string): Promise<void> => {
  try {
    await apiClient.post(`/repositories/${repositoryId}/sync`);
    // Unieważnij cache
    apiCache.invalidateCache();
  } catch (error) {
    console.error("Error syncing repository:", error);
    throw error;
  }
};

export const deleteRepository = async (repositoryId: string): Promise<void> => {
  try {
    await apiClient.delete(`/repositories/${repositoryId}`);
    // Unieważnij cache
    apiCache.invalidateCache();
  } catch (error) {
    console.error("Error deleting repository:", error);
    throw error;
  }
};

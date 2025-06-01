import {
  apiGet,
  apiPost,
  apiDelete,
  apiWithRetry,
  apiGetCached,
} from "./client";

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
  return apiWithRetry(
    () =>
      apiGetCached<Repository[]>(
        "/repositories",
        {},
        "repositories_list",
        1 * 60 * 1000
      ), // 1 minute cache
    3,
    1000
  );
};

export const createRepository = async (
  data: CreateRepositoryRequest
): Promise<Repository> => {
  return apiPost<Repository>("/repositories", data);
};

export const fetchRepositoryConfig = async (
  repositoryId: string
): Promise<RepositoryConfig> => {
  const cacheKey = `config_${repositoryId}`;
  return apiGetCached<RepositoryConfig>(
    `/repositories/${repositoryId}/config`,
    {},
    cacheKey,
    5 * 60 * 1000
  ); // 5 minutes cache
};

export const syncRepository = async (repositoryId: string): Promise<void> => {
  return apiPost(`/repositories/${repositoryId}/sync`);
};

export const deleteRepository = async (repositoryId: string): Promise<void> => {
  return apiDelete(`/repositories/${repositoryId}`);
};

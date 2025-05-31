import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

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
  const response = await axios.get<Repository[]>(`${API_URL}/repositories`);
  return response.data;
};

export const createRepository = async (
  data: CreateRepositoryRequest
): Promise<Repository> => {
  const response = await axios.post<Repository>(
    `${API_URL}/repositories`,
    data
  );
  return response.data;
};

export const fetchRepositoryConfig = async (
  repositoryId: string
): Promise<RepositoryConfig> => {
  const response = await axios.get<RepositoryConfig>(
    `${API_URL}/repositories/${repositoryId}/config`
  );
  return response.data;
};

export const syncRepository = async (repositoryId: string): Promise<void> => {
  await axios.post(`${API_URL}/repositories/${repositoryId}/sync`);
};

export const deleteRepository = async (repositoryId: string): Promise<void> => {
  await axios.delete(`${API_URL}/repositories/${repositoryId}`);
};

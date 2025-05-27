import axios from "axios";

const apiClient = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "http://localhost:4000/api",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

export interface Repository {
  name: string;
  url?: string;
  config?: {
    HOSTS?: Record<string, string>;
    TOKENS?: Record<string, Record<string, string>>;
    LOAD_PROFILES?: Record<string, any>;
  };
  tests?: string[];
}

export interface CloneRepositoryRequest {
  name: string;
  url: string;
}

export const fetchRepositories = async (): Promise<Repository[]> => {
  try {
    const response = await apiClient.get<Repository[]>("/repositories");
    return response.data;
  } catch (error) {
    console.error("Error fetching repositories:", error);
    throw error;
  }
};

export const cloneRepository = async (
  request: CloneRepositoryRequest
): Promise<void> => {
  try {
    await apiClient.post("/repositories/clone", request);
  } catch (error) {
    console.error("Error cloning repository:", error);
    throw error;
  }
};

export const updateRepository = async (name: string): Promise<void> => {
  try {
    await apiClient.post(`/repositories/${name}/update`);
  } catch (error) {
    console.error("Error updating repository:", error);
    throw error;
  }
};

export const deleteRepository = async (name: string): Promise<void> => {
  try {
    await apiClient.delete(`/repositories/${name}`);
  } catch (error) {
    console.error("Error deleting repository:", error);
    throw error;
  }
};

export const getRepositoryConfig = async (name: string): Promise<any> => {
  try {
    const response = await apiClient.get(`/repositories/${name}/config`);
    return response.data;
  } catch (error) {
    console.error("Error fetching repository config:", error);
    throw error;
  }
};

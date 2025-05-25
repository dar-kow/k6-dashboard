import axios from "axios";

const apiClient = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "http://localhost:4000/api",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

export interface GitRefreshResponse {
  success: boolean;
  message: string;
  action?: "pull" | "clone";
  output?: string;
  error?: string;
  repoUrl?: string;
}

export interface GitStatusResponse {
  success: boolean;
  repoUrl: string;
  lastCommit?: {
    hash: string;
    author: string;
    date: string;
    message: string;
  };
  message?: string;
  error?: string;
}

export const refreshTestsFromRepo = async (): Promise<GitRefreshResponse> => {
  try {
    const response = await apiClient.post<GitRefreshResponse>("/git/refresh");
    return response.data;
  } catch (error: any) {
    console.error("Error refreshing tests from repository:", error);
    throw error;
  }
};

export const getRepoStatus = async (): Promise<GitStatusResponse> => {
  try {
    const response = await apiClient.get<GitStatusResponse>("/git/status");
    return response.data;
  } catch (error: any) {
    console.error("Error getting repository status:", error);
    throw error;
  }
};

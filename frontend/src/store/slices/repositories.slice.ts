import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import {
  Repository,
  RepositoryConfig,
  CreateRepositoryRequest,
} from "../../api/repositories";
import { AsyncState, createAsyncState } from "../types";

// State interface
export interface RepositoriesState {
  repositories: AsyncState<Repository[]>;
  selectedRepository: Repository | null;
  selectedRepositoryConfig: AsyncState<RepositoryConfig | null>;
  lastSyncTime: string | null;
}

// Initial state
const initialState: RepositoriesState = {
  repositories: createAsyncState<Repository[]>([]),
  selectedRepository: null,
  selectedRepositoryConfig: createAsyncState<RepositoryConfig | null>(null),
  lastSyncTime: null,
};

// Slice definition
const repositoriesSlice = createSlice({
  name: "repositories",
  initialState,
  reducers: {
    // Repository selection
    setSelectedRepository: (
      state,
      action: PayloadAction<Repository | null>
    ) => {
      state.selectedRepository = action.payload;
      // Clear config when changing repository
      if (!action.payload) {
        state.selectedRepositoryConfig =
          createAsyncState<RepositoryConfig | null>(null);
      }
    },

    // Fetch repositories
    fetchRepositoriesRequest: (state) => {
      state.repositories.loading = true;
      state.repositories.error = null;
    },

    fetchRepositoriesSuccess: (state, action: PayloadAction<Repository[]>) => {
      state.repositories.loading = false;
      state.repositories.data = action.payload;
      state.repositories.error = null;
      state.repositories.lastUpdated = new Date().toISOString();
    },

    fetchRepositoriesFailure: (state, action: PayloadAction<string>) => {
      state.repositories.loading = false;
      state.repositories.error = action.payload;
    },

    // Create repository
    createRepositoryRequest: (
      state,
      action: PayloadAction<CreateRepositoryRequest>
    ) => {
      // Will be handled by saga
      state.repositories.loading = true;
      state.repositories.error = null;
    },

    createRepositorySuccess: (state, action: PayloadAction<Repository>) => {
      state.repositories.loading = false;
      if (state.repositories.data) {
        state.repositories.data.push(action.payload);
      }
      state.repositories.error = null;
    },

    createRepositoryFailure: (state, action: PayloadAction<string>) => {
      state.repositories.loading = false;
      state.repositories.error = action.payload;
    },

    // Delete repository
    deleteRepositoryRequest: (state, action: PayloadAction<string>) => {
      state.repositories.loading = true;
      state.repositories.error = null;
    },

    deleteRepositorySuccess: (state, action: PayloadAction<string>) => {
      state.repositories.loading = false;
      if (state.repositories.data) {
        state.repositories.data = state.repositories.data.filter(
          (repo) => repo.id !== action.payload
        );
      }
      // Clear selection if deleted repository was selected
      if (state.selectedRepository?.id === action.payload) {
        state.selectedRepository = null;
        state.selectedRepositoryConfig =
          createAsyncState<RepositoryConfig | null>(null);
      }
      state.repositories.error = null;
    },

    deleteRepositoryFailure: (state, action: PayloadAction<string>) => {
      state.repositories.loading = false;
      state.repositories.error = action.payload;
    },

    // Sync repository
    syncRepositoryRequest: (state, action: PayloadAction<string>) => {
      state.repositories.loading = true;
      state.repositories.error = null;
    },

    syncRepositorySuccess: (state, action: PayloadAction<string>) => {
      state.repositories.loading = false;
      // Update the repository's sync status
      if (state.repositories.data) {
        const repo = state.repositories.data.find(
          (r) => r.id === action.payload
        );
        if (repo) {
          repo.lastSync = new Date().toISOString();
          repo.needsSync = false;
        }
      }
      state.lastSyncTime = new Date().toISOString();
      state.repositories.error = null;
    },

    syncRepositoryFailure: (state, action: PayloadAction<string>) => {
      state.repositories.loading = false;
      state.repositories.error = action.payload;
    },

    // Fetch repository config
    fetchRepositoryConfigRequest: (state, action: PayloadAction<string>) => {
      state.selectedRepositoryConfig.loading = true;
      state.selectedRepositoryConfig.error = null;
    },

    fetchRepositoryConfigSuccess: (
      state,
      action: PayloadAction<RepositoryConfig>
    ) => {
      state.selectedRepositoryConfig.loading = false;
      state.selectedRepositoryConfig.data = action.payload;
      state.selectedRepositoryConfig.error = null;
      state.selectedRepositoryConfig.lastUpdated = new Date().toISOString();
    },

    fetchRepositoryConfigFailure: (state, action: PayloadAction<string>) => {
      state.selectedRepositoryConfig.loading = false;
      state.selectedRepositoryConfig.error = action.payload;
    },

    // Clear state
    clearRepositories: (state) => {
      state.repositories = createAsyncState<Repository[]>([]);
      state.selectedRepository = null;
      state.selectedRepositoryConfig =
        createAsyncState<RepositoryConfig | null>(null);
      state.lastSyncTime = null;
    },

    // Update repository (for partial updates)
    updateRepository: (state, action: PayloadAction<Repository>) => {
      if (state.repositories.data) {
        const index = state.repositories.data.findIndex(
          (repo) => repo.id === action.payload.id
        );
        if (index !== -1) {
          state.repositories.data[index] = action.payload;
        }
      }
      // Update selected repository if it's the same
      if (state.selectedRepository?.id === action.payload.id) {
        state.selectedRepository = action.payload;
      }
    },
  },
});

// Export actions
export const {
  setSelectedRepository,
  fetchRepositoriesRequest,
  fetchRepositoriesSuccess,
  fetchRepositoriesFailure,
  createRepositoryRequest,
  createRepositorySuccess,
  createRepositoryFailure,
  deleteRepositoryRequest,
  deleteRepositorySuccess,
  deleteRepositoryFailure,
  syncRepositoryRequest,
  syncRepositorySuccess,
  syncRepositoryFailure,
  fetchRepositoryConfigRequest,
  fetchRepositoryConfigSuccess,
  fetchRepositoryConfigFailure,
  clearRepositories,
  updateRepository,
} = repositoriesSlice.actions;

// Export reducer
export default repositoriesSlice.reducer;

// Selectors
export const selectRepositories = (state: {
  repositories: RepositoriesState;
}) => state.repositories;
export const selectRepositoriesList = (state: {
  repositories: RepositoriesState;
}) => state.repositories.repositories.data || [];
export const selectRepositoriesLoading = (state: {
  repositories: RepositoriesState;
}) => state.repositories.repositories.loading;
export const selectRepositoriesError = (state: {
  repositories: RepositoriesState;
}) => state.repositories.repositories.error;
export const selectSelectedRepository = (state: {
  repositories: RepositoriesState;
}) => state.repositories.selectedRepository;
export const selectSelectedRepositoryConfig = (state: {
  repositories: RepositoriesState;
}) => state.repositories.selectedRepositoryConfig.data;
export const selectRepositoryConfigLoading = (state: {
  repositories: RepositoriesState;
}) => state.repositories.selectedRepositoryConfig.loading;
export const selectLastSyncTime = (state: {
  repositories: RepositoriesState;
}) => state.repositories.lastSyncTime;

// Derived selectors
export const selectRepositoryById =
  (repositoryId: string) => (state: { repositories: RepositoriesState }) => {
    const repositories = selectRepositoriesList(state);
    return repositories.find((repo) => repo.id === repositoryId) || null;
  };

export const selectRepositoriesNeedingSync = (state: {
  repositories: RepositoriesState;
}) => {
  const repositories = selectRepositoriesList(state);
  return repositories.filter((repo) => repo.needsSync);
};

// Action creators for saga integration
export const repositoriesActions = {
  fetchRepositoriesRequest,
  createRepositoryRequest,
  deleteRepositoryRequest,
  syncRepositoryRequest,
  fetchRepositoryConfigRequest,
  // Export success/failure for saga usage
  fetchRepositoriesSuccess,
  fetchRepositoriesFailure,
  createRepositorySuccess,
  createRepositoryFailure,
  deleteRepositorySuccess,
  deleteRepositoryFailure,
  syncRepositorySuccess,
  syncRepositoryFailure,
  fetchRepositoryConfigSuccess,
  fetchRepositoryConfigFailure,
} as const;

import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Repository, RepositoryConfig } from "../../api/repositories";

interface RepositoryState {
  repositories: Repository[];
  repositoriesLoading: boolean;
  repositoriesError: string | null;

  selectedRepository: Repository | null;
  selectedRepositoryConfig: RepositoryConfig | null;
  configLoading: boolean;
  configError: string | null;

  // Operations
  creating: boolean;
  syncing: Record<string, boolean>;
  deleting: Record<string, boolean>;
}

const initialState: RepositoryState = {
  repositories: [],
  repositoriesLoading: false,
  repositoriesError: null,

  selectedRepository: null,
  selectedRepositoryConfig: null,
  configLoading: false,
  configError: null,

  creating: false,
  syncing: {},
  deleting: {},
};

const repositorySlice = createSlice({
  name: "repository",
  initialState,
  reducers: {
    // Fetch repositories
    fetchRepositoriesStart: (state) => {
      state.repositoriesLoading = true;
      state.repositoriesError = null;
    },
    fetchRepositoriesSuccess: (state, action: PayloadAction<Repository[]>) => {
      state.repositories = action.payload;
      state.repositoriesLoading = false;
      state.repositoriesError = null;
    },
    fetchRepositoriesFailure: (state, action: PayloadAction<string>) => {
      state.repositoriesLoading = false;
      state.repositoriesError = action.payload;
    },

    // Selected repository
    setSelectedRepository: (
      state,
      action: PayloadAction<Repository | null>
    ) => {
      state.selectedRepository = action.payload;

      // Save to localStorage
      if (action.payload) {
        localStorage.setItem("selectedRepositoryId", action.payload.id);
      } else {
        localStorage.removeItem("selectedRepositoryId");
      }

      // Clear config when repository changes
      state.selectedRepositoryConfig = null;
      state.configError = null;
    },

    // Repository config
    fetchConfigStart: (state) => {
      state.configLoading = true;
      state.configError = null;
    },
    fetchConfigSuccess: (state, action: PayloadAction<RepositoryConfig>) => {
      state.selectedRepositoryConfig = action.payload;
      state.configLoading = false;
      state.configError = null;
    },
    fetchConfigFailure: (state, action: PayloadAction<string>) => {
      state.configLoading = false;
      state.configError = action.payload;
    },

    // Create repository
    createRepositoryStart: (state) => {
      state.creating = true;
    },
    createRepositorySuccess: (state, action: PayloadAction<Repository>) => {
      state.repositories.push(action.payload);
      state.creating = false;
    },
    createRepositoryFailure: (state) => {
      state.creating = false;
    },

    // Sync repository
    syncRepositoryStart: (state, action: PayloadAction<string>) => {
      state.syncing[action.payload] = true;
    },
    syncRepositorySuccess: (state, action: PayloadAction<string>) => {
      state.syncing[action.payload] = false;

      // Update repository lastSync
      const repo = state.repositories.find((r) => r.id === action.payload);
      if (repo) {
        repo.lastSync = new Date().toISOString();
        repo.needsSync = false;
      }
    },
    syncRepositoryFailure: (state, action: PayloadAction<string>) => {
      state.syncing[action.payload] = false;
    },

    // Delete repository
    deleteRepositoryStart: (state, action: PayloadAction<string>) => {
      state.deleting[action.payload] = true;
    },
    deleteRepositorySuccess: (state, action: PayloadAction<string>) => {
      state.repositories = state.repositories.filter(
        (r) => r.id !== action.payload
      );
      state.deleting[action.payload] = false;

      // Clear selected if deleted
      if (state.selectedRepository?.id === action.payload) {
        state.selectedRepository = null;
        state.selectedRepositoryConfig = null;
      }
    },
    deleteRepositoryFailure: (state, action: PayloadAction<string>) => {
      state.deleting[action.payload] = false;
    },

    // Reset state
    resetRepository: () => initialState,
  },
});

export const {
  fetchRepositoriesStart,
  fetchRepositoriesSuccess,
  fetchRepositoriesFailure,
  setSelectedRepository,
  fetchConfigStart,
  fetchConfigSuccess,
  fetchConfigFailure,
  createRepositoryStart,
  createRepositorySuccess,
  createRepositoryFailure,
  syncRepositoryStart,
  syncRepositorySuccess,
  syncRepositoryFailure,
  deleteRepositoryStart,
  deleteRepositorySuccess,
  deleteRepositoryFailure,
  resetRepository,
} = repositorySlice.actions;

export default repositorySlice.reducer;

// Selectors
export const selectRepositories = (state: { repository: RepositoryState }) =>
  state.repository.repositories;
export const selectRepositoriesLoading = (state: {
  repository: RepositoryState;
}) => state.repository.repositoriesLoading;
export const selectRepositoriesError = (state: {
  repository: RepositoryState;
}) => state.repository.repositoriesError;

export const selectSelectedRepository = (state: {
  repository: RepositoryState;
}) => state.repository.selectedRepository;
export const selectSelectedRepositoryConfig = (state: {
  repository: RepositoryState;
}) => state.repository.selectedRepositoryConfig;
export const selectConfigLoading = (state: { repository: RepositoryState }) =>
  state.repository.configLoading;

export const selectCreating = (state: { repository: RepositoryState }) =>
  state.repository.creating;
export const selectSyncing =
  (repositoryId: string) => (state: { repository: RepositoryState }) =>
    state.repository.syncing[repositoryId] || false;
export const selectDeleting =
  (repositoryId: string) => (state: { repository: RepositoryState }) =>
    state.repository.deleting[repositoryId] || false;

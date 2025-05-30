import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Repository, RepositoryConfig } from "@services/repositoriesApi";

interface RepositoriesState {
  repositories: Repository[];
  selectedRepository: Repository | null;
  selectedRepositoryConfig: RepositoryConfig | null;
  loading: {
    repositories: boolean;
    config: boolean;
    operations: boolean;
  };
  error: string | null;
}

const initialState: RepositoriesState = {
  repositories: [],
  selectedRepository: null,
  selectedRepositoryConfig: null,
  loading: {
    repositories: false,
    config: false,
    operations: false,
  },
  error: null,
};

export const repositoriesSlice = createSlice({
  name: "repositories",
  initialState,
  reducers: {
    // Fetch repositories
    fetchRepositoriesStart: (state) => {
      state.loading.repositories = true;
      state.error = null;
    },
    fetchRepositoriesSuccess: (state, action: PayloadAction<Repository[]>) => {
      state.repositories = action.payload;
      state.loading.repositories = false;
    },
    fetchRepositoriesFailure: (state, action: PayloadAction<string>) => {
      state.loading.repositories = false;
      state.error = action.payload;
    },

    // Create repository
    createRepositoryStart: (state) => {
      state.loading.operations = true;
      state.error = null;
    },
    createRepositorySuccess: (state, action: PayloadAction<Repository>) => {
      state.repositories.push(action.payload);
      state.loading.operations = false;
    },
    createRepositoryFailure: (state, action: PayloadAction<string>) => {
      state.loading.operations = false;
      state.error = action.payload;
    },

    // Select repository
    setSelectedRepository: (
      state,
      action: PayloadAction<Repository | null>
    ) => {
      state.selectedRepository = action.payload;
      state.selectedRepositoryConfig = null;

      // Save to localStorage
      if (action.payload) {
        localStorage.setItem("selectedRepositoryId", action.payload.id);
      } else {
        localStorage.removeItem("selectedRepositoryId");
      }
    },

    // Fetch config
    fetchConfigStart: (state) => {
      state.loading.config = true;
      state.error = null;
    },
    fetchConfigSuccess: (state, action: PayloadAction<RepositoryConfig>) => {
      state.selectedRepositoryConfig = action.payload;
      state.loading.config = false;
    },
    fetchConfigFailure: (state, action: PayloadAction<string>) => {
      state.loading.config = false;
      state.error = action.payload;
    },

    // Sync repository
    syncRepositoryStart: (state, action: PayloadAction<string>) => {
      state.loading.operations = true;
      state.error = null;

      // Update repository status
      const repo = state.repositories.find((r) => r.id === action.payload);
      if (repo) {
        repo.needsSync = false;
      }
    },
    syncRepositorySuccess: (state, action: PayloadAction<Repository>) => {
      state.loading.operations = false;

      // Update repository
      const index = state.repositories.findIndex(
        (r) => r.id === action.payload.id
      );
      if (index !== -1) {
        state.repositories[index] = action.payload;
      }
    },
    syncRepositoryFailure: (
      state,
      action: PayloadAction<{ id: string; error: string }>
    ) => {
      state.loading.operations = false;
      state.error = action.payload.error;

      // Restore needsSync status
      const repo = state.repositories.find((r) => r.id === action.payload.id);
      if (repo) {
        repo.needsSync = true;
      }
    },

    // Delete repository
    deleteRepositoryStart: (state) => {
      state.loading.operations = true;
      state.error = null;
    },
    deleteRepositorySuccess: (state, action: PayloadAction<string>) => {
      state.repositories = state.repositories.filter(
        (r) => r.id !== action.payload
      );
      state.loading.operations = false;

      // Clear selection if deleted repository was selected
      if (state.selectedRepository?.id === action.payload) {
        state.selectedRepository = null;
        state.selectedRepositoryConfig = null;
      }
    },
    deleteRepositoryFailure: (state, action: PayloadAction<string>) => {
      state.loading.operations = false;
      state.error = action.payload;
    },

    // Clear error
    clearError: (state) => {
      state.error = null;
    },
  },
});

export const {
  fetchRepositoriesStart,
  fetchRepositoriesSuccess,
  fetchRepositoriesFailure,
  createRepositoryStart,
  createRepositorySuccess,
  createRepositoryFailure,
  setSelectedRepository,
  fetchConfigStart,
  fetchConfigSuccess,
  fetchConfigFailure,
  syncRepositoryStart,
  syncRepositorySuccess,
  syncRepositoryFailure,
  deleteRepositoryStart,
  deleteRepositorySuccess,
  deleteRepositoryFailure,
  clearError,
} = repositoriesSlice.actions;

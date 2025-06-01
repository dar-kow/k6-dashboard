import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Repository, RepositoryConfig } from "@/api/repositories";

interface RepositoriesState {
  repositories: Repository[];
  selectedRepository: Repository | null;
  selectedRepositoryConfig: RepositoryConfig | null;
  loading: boolean;
  error: string | null;
}

const initialState: RepositoriesState = {
  repositories: [],
  selectedRepository: null,
  selectedRepositoryConfig: null,
  loading: false,
  error: null,
};

export const repositoriesSlice = createSlice({
  name: "repositories",
  initialState,
  reducers: {
    fetchRepositoriesRequest: (state) => {
      state.loading = true;
      state.error = null;
    },
    fetchRepositoriesSuccess: (state, action: PayloadAction<Repository[]>) => {
      state.repositories = action.payload;
      state.loading = false;
    },
    fetchRepositoriesFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },
    selectRepository: (state, action: PayloadAction<Repository | null>) => {
      state.selectedRepository = action.payload;
      state.selectedRepositoryConfig = null;
    },
    fetchRepositoryConfigRequest: (state, action: PayloadAction<string>) => {
      state.loading = true;
      state.error = null;
    },
    fetchRepositoryConfigSuccess: (
      state,
      action: PayloadAction<RepositoryConfig>
    ) => {
      state.selectedRepositoryConfig = action.payload;
      state.loading = false;
    },
    fetchRepositoryConfigFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },
    createRepositoryRequest: (state, action: PayloadAction<any>) => {
      state.loading = true;
      state.error = null;
    },
    createRepositorySuccess: (state, action: PayloadAction<Repository>) => {
      state.repositories.push(action.payload);
      state.loading = false;
    },
    createRepositoryFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },
    syncRepositoryRequest: (state, action: PayloadAction<string>) => {
      state.loading = true;
      state.error = null;
    },
    syncRepositorySuccess: (state) => {
      state.loading = false;
    },
    syncRepositoryFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },
    deleteRepositoryRequest: (state, action: PayloadAction<string>) => {
      state.loading = true;
      state.error = null;
    },
    deleteRepositorySuccess: (state, action: PayloadAction<string>) => {
      state.repositories = state.repositories.filter(
        (repo) => repo.id !== action.payload
      );
      state.loading = false;
    },
    deleteRepositoryFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },
  },
});

export const {
  fetchRepositoriesRequest,
  fetchRepositoriesSuccess,
  fetchRepositoriesFailure,
  selectRepository,
  fetchRepositoryConfigRequest,
  fetchRepositoryConfigSuccess,
  fetchRepositoryConfigFailure,
  createRepositoryRequest,
  createRepositorySuccess,
  createRepositoryFailure,
  syncRepositoryRequest,
  syncRepositorySuccess,
  syncRepositoryFailure,
  deleteRepositoryRequest,
  deleteRepositorySuccess,
  deleteRepositoryFailure,
} = repositoriesSlice.actions;

export default repositoriesSlice.reducer;


import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Repository } from '@/types/test.types';

interface RepositoryState {
  repositories: Repository[];
  selectedRepository: string | null;
  loading: boolean;
  error: string | null;
}

const initialState: RepositoryState = {
  repositories: [],
  selectedRepository: null,
  loading: false,
  error: null,
};

export const repositorySlice = createSlice({
  name: 'repository',
  initialState,
  reducers: {
    setRepositories: (state, action: PayloadAction<Repository[]>) => {
      state.repositories = action.payload;
    },
    setSelectedRepository: (state, action: PayloadAction<string>) => {
      state.selectedRepository = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    fetchRepositories: (state) => {
      state.loading = true;
    },
    importRepository: (state, action: PayloadAction<any>) => {
      state.loading = true;
    },
    syncRepository: (state, action: PayloadAction<string>) => {
      state.loading = true;
    },
    removeRepository: (state, action: PayloadAction<string>) => {
      state.loading = true;
    },
  },
});

export const {
  setRepositories,
  setSelectedRepository,
  setLoading,
  setError,
  fetchRepositories,
  importRepository,
  syncRepository,
  removeRepository,
} = repositorySlice.actions;

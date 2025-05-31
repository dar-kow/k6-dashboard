import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { TestDirectory } from "../../types/testResults";
import { AsyncState, createAsyncState } from "../types";

// State interface
export interface TestResultsState {
  directories: AsyncState<TestDirectory[]>;
  selectedDirectory: string | null;
  lastRefreshTime: string | null;
}

// Initial state
const initialState: TestResultsState = {
  directories: createAsyncState<TestDirectory[]>([]),
  selectedDirectory: null,
  lastRefreshTime: null,
};

// Slice definition
const testResultsSlice = createSlice({
  name: "testResults",
  initialState,
  reducers: {
    // Directory management
    setSelectedDirectory: (state, action: PayloadAction<string | null>) => {
      state.selectedDirectory = action.payload;
    },

    // Async directories actions
    fetchDirectoriesRequest: (
      state,
      action: PayloadAction<{ repositoryId?: string }>
    ) => {
      state.directories.loading = true;
      state.directories.error = null;
    },

    fetchDirectoriesSuccess: (
      state,
      action: PayloadAction<TestDirectory[]>
    ) => {
      state.directories.loading = false;
      state.directories.data = action.payload;
      state.directories.error = null;
      state.directories.lastUpdated = new Date().toISOString();
      state.lastRefreshTime = new Date().toISOString();
    },

    fetchDirectoriesFailure: (state, action: PayloadAction<string>) => {
      state.directories.loading = false;
      state.directories.error = action.payload;
    },

    // Manual refresh trigger
    refreshDataRequest: (
      state,
      action: PayloadAction<{ repositoryId?: string }>
    ) => {
      // Saga will handle this - just mark as loading
      state.directories.loading = true;
      state.directories.error = null;
    },

    // Clear state (for logout, reset etc.)
    clearTestResults: (state) => {
      state.directories = createAsyncState<TestDirectory[]>([]);
      state.selectedDirectory = null;
      state.lastRefreshTime = null;
    },

    // Update single directory (for partial updates)
    updateDirectory: (state, action: PayloadAction<TestDirectory>) => {
      if (state.directories.data) {
        const index = state.directories.data.findIndex(
          (dir) => dir.name === action.payload.name
        );
        if (index !== -1) {
          state.directories.data[index] = action.payload;
        }
      }
    },
  },
});

// Export actions
export const {
  setSelectedDirectory,
  fetchDirectoriesRequest,
  fetchDirectoriesSuccess,
  fetchDirectoriesFailure,
  refreshDataRequest,
  clearTestResults,
  updateDirectory,
} = testResultsSlice.actions;

// Export reducer
export default testResultsSlice.reducer;

// Selectors
export const selectTestResults = (state: { testResults: TestResultsState }) =>
  state.testResults;
export const selectDirectories = (state: { testResults: TestResultsState }) =>
  state.testResults.directories.data || [];
export const selectDirectoriesLoading = (state: {
  testResults: TestResultsState;
}) => state.testResults.directories.loading;
export const selectDirectoriesError = (state: {
  testResults: TestResultsState;
}) => state.testResults.directories.error;
export const selectSelectedDirectory = (state: {
  testResults: TestResultsState;
}) => state.testResults.selectedDirectory;
export const selectLastRefreshTime = (state: {
  testResults: TestResultsState;
}) => state.testResults.lastRefreshTime;

// Derived selectors
export const selectLatestDirectory = (state: {
  testResults: TestResultsState;
}) => {
  const directories = selectDirectories(state);
  return directories.length > 0 ? directories[0] : null;
};

export const selectDirectoryByName =
  (directoryName: string) => (state: { testResults: TestResultsState }) => {
    const directories = selectDirectories(state);
    return directories.find((dir) => dir.name === directoryName) || null;
  };

// Action creators for saga integration
export const testResultsActions = {
  fetchDirectoriesRequest,
  refreshDataRequest,
  // Export for saga usage
  fetchDirectoriesSuccess,
  fetchDirectoriesFailure,
} as const;

import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { TestDirectory, TestFile, TestResult } from "../../types/testResults";

interface TestResultsState {
  // Directories
  directories: TestDirectory[];
  directoriesLoading: boolean;
  directoriesError: string | null;

  // Selected directory
  selectedDirectory: string | null;

  // Files for selected directory
  files: TestFile[];
  filesLoading: boolean;
  filesError: string | null;

  // Test results cache
  testResults: Record<string, TestResult>; // key: "directory/file"
  testResultsLoading: Record<string, boolean>;
  testResultsError: Record<string, string | null>;

  // Latest results for dashboard
  latestResults: Record<string, TestResult>;
  latestResultsLoading: boolean;

  // Cache timestamps for invalidation
  lastFetchTimestamp: number | null;
}

const initialState: TestResultsState = {
  directories: [],
  directoriesLoading: false,
  directoriesError: null,

  selectedDirectory: null,

  files: [],
  filesLoading: false,
  filesError: null,

  testResults: {},
  testResultsLoading: {},
  testResultsError: {},

  latestResults: {},
  latestResultsLoading: false,

  lastFetchTimestamp: null,
};

const testResultsSlice = createSlice({
  name: "testResults",
  initialState,
  reducers: {
    // Directories actions
    fetchDirectoriesStart: (state) => {
      state.directoriesLoading = true;
      state.directoriesError = null;
    },
    fetchDirectoriesSuccess: (
      state,
      action: PayloadAction<TestDirectory[]>
    ) => {
      state.directories = action.payload;
      state.directoriesLoading = false;
      state.directoriesError = null;
      state.lastFetchTimestamp = Date.now();
    },
    fetchDirectoriesFailure: (state, action: PayloadAction<string>) => {
      state.directoriesLoading = false;
      state.directoriesError = action.payload;
    },

    // Selected directory
    setSelectedDirectory: (state, action: PayloadAction<string | null>) => {
      state.selectedDirectory = action.payload;
      // Clear files when directory changes
      if (action.payload !== state.selectedDirectory) {
        state.files = [];
        state.filesError = null;
      }
    },

    // Files actions
    fetchFilesStart: (state) => {
      state.filesLoading = true;
      state.filesError = null;
    },
    fetchFilesSuccess: (
      state,
      action: PayloadAction<{ directory: string; files: TestFile[] }>
    ) => {
      state.files = action.payload.files;
      state.filesLoading = false;
      state.filesError = null;
    },
    fetchFilesFailure: (state, action: PayloadAction<string>) => {
      state.filesLoading = false;
      state.filesError = action.payload;
    },

    // Test result actions
    fetchTestResultStart: (
      state,
      action: PayloadAction<{ directory: string; file: string }>
    ) => {
      const key = `${action.payload.directory}/${action.payload.file}`;
      state.testResultsLoading[key] = true;
      state.testResultsError[key] = null;
    },
    fetchTestResultSuccess: (
      state,
      action: PayloadAction<{
        directory: string;
        file: string;
        result: TestResult;
      }>
    ) => {
      const key = `${action.payload.directory}/${action.payload.file}`;
      state.testResults[key] = action.payload.result;
      state.testResultsLoading[key] = false;
      state.testResultsError[key] = null;
    },
    fetchTestResultFailure: (
      state,
      action: PayloadAction<{
        directory: string;
        file: string;
        error: string;
      }>
    ) => {
      const key = `${action.payload.directory}/${action.payload.file}`;
      state.testResultsLoading[key] = false;
      state.testResultsError[key] = action.payload.error;
    },

    // Latest results for dashboard
    fetchLatestResultsStart: (state) => {
      state.latestResultsLoading = true;
    },
    fetchLatestResultsSuccess: (
      state,
      action: PayloadAction<Record<string, TestResult>>
    ) => {
      state.latestResults = action.payload;
      state.latestResultsLoading = false;
    },
    fetchLatestResultsFailure: (state) => {
      state.latestResultsLoading = false;
    },

    // Clear cache
    clearCache: (state) => {
      state.testResults = {};
      state.testResultsLoading = {};
      state.testResultsError = {};
      state.latestResults = {};
    },

    // Reset state
    resetTestResults: () => initialState,
  },
});

export const {
  fetchDirectoriesStart,
  fetchDirectoriesSuccess,
  fetchDirectoriesFailure,
  setSelectedDirectory,
  fetchFilesStart,
  fetchFilesSuccess,
  fetchFilesFailure,
  fetchTestResultStart,
  fetchTestResultSuccess,
  fetchTestResultFailure,
  fetchLatestResultsStart,
  fetchLatestResultsSuccess,
  fetchLatestResultsFailure,
  clearCache,
  resetTestResults,
} = testResultsSlice.actions;

export default testResultsSlice.reducer;

// Selectors
export const selectDirectories = (state: { testResults: TestResultsState }) =>
  state.testResults.directories;
export const selectDirectoriesLoading = (state: {
  testResults: TestResultsState;
}) => state.testResults.directoriesLoading;
export const selectDirectoriesError = (state: {
  testResults: TestResultsState;
}) => state.testResults.directoriesError;

export const selectSelectedDirectory = (state: {
  testResults: TestResultsState;
}) => state.testResults.selectedDirectory;

export const selectFiles = (state: { testResults: TestResultsState }) =>
  state.testResults.files;
export const selectFilesLoading = (state: { testResults: TestResultsState }) =>
  state.testResults.filesLoading;
export const selectFilesError = (state: { testResults: TestResultsState }) =>
  state.testResults.filesError;

export const selectTestResult =
  (directory: string, file: string) =>
  (state: { testResults: TestResultsState }) =>
    state.testResults.testResults[`${directory}/${file}`];

export const selectTestResultLoading =
  (directory: string, file: string) =>
  (state: { testResults: TestResultsState }) =>
    state.testResults.testResultsLoading[`${directory}/${file}`] || false;

export const selectLatestResults = (state: { testResults: TestResultsState }) =>
  state.testResults.latestResults;
export const selectLatestResultsLoading = (state: {
  testResults: TestResultsState;
}) => state.testResults.latestResultsLoading;

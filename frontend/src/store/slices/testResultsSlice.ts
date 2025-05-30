import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { TestDirectory, TestResult, TestFile } from "../../types/api";

interface TestResultsState {
  directories: TestDirectory[];
  selectedDirectory: string | null;
  files: TestFile[];
  selectedFile: string | null;
  testResult: TestResult | null;
  loading: {
    directories: boolean;
    files: boolean;
    result: boolean;
  };
  error: string | null;
}

const initialState: TestResultsState = {
  directories: [],
  selectedDirectory: null,
  files: [],
  selectedFile: null,
  testResult: null,
  loading: {
    directories: false,
    files: false,
    result: false,
  },
  error: null,
};

export const testResultsSlice = createSlice({
  name: "testResults",
  initialState,
  reducers: {
    // Directories
    fetchDirectoriesStart: (state) => {
      state.loading.directories = true;
      state.error = null;
    },
    fetchDirectoriesSuccess: (
      state,
      action: PayloadAction<TestDirectory[]>
    ) => {
      state.directories = action.payload;
      state.loading.directories = false;
    },
    fetchDirectoriesFailure: (state, action: PayloadAction<string>) => {
      state.loading.directories = false;
      state.error = action.payload;
    },

    // Directory Selection
    setSelectedDirectory: (state, action: PayloadAction<string | null>) => {
      state.selectedDirectory = action.payload;
      state.files = [];
      state.selectedFile = null;
      state.testResult = null;
    },

    // Files
    fetchFilesStart: (state) => {
      state.loading.files = true;
      state.error = null;
    },
    fetchFilesSuccess: (state, action: PayloadAction<TestFile[]>) => {
      state.files = action.payload;
      state.loading.files = false;
    },
    fetchFilesFailure: (state, action: PayloadAction<string>) => {
      state.loading.files = false;
      state.error = action.payload;
    },

    // File Selection
    setSelectedFile: (state, action: PayloadAction<string | null>) => {
      state.selectedFile = action.payload;
      state.testResult = null;
    },

    // Test Result
    fetchTestResultStart: (state) => {
      state.loading.result = true;
      state.error = null;
    },
    fetchTestResultSuccess: (state, action: PayloadAction<TestResult>) => {
      state.testResult = action.payload;
      state.loading.result = false;
    },
    fetchTestResultFailure: (state, action: PayloadAction<string>) => {
      state.loading.result = false;
      state.error = action.payload;
    },

    // Clear Error
    clearError: (state) => {
      state.error = null;
    },
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
  setSelectedFile,
  fetchTestResultStart,
  fetchTestResultSuccess,
  fetchTestResultFailure,
  clearError,
} = testResultsSlice.actions;

import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { TestDirectory, TestFile, TestResult } from "@/types/testResults";

interface TestResultsState {
  directories: TestDirectory[];
  selectedDirectory: string | null;
  files: TestFile[];
  selectedFile: string | null;
  selectedTestResult: TestResult | null;
  loading: boolean;
  error: string | null;
}

const initialState: TestResultsState = {
  directories: [],
  selectedDirectory: null,
  files: [],
  selectedFile: null,
  selectedTestResult: null,
  loading: false,
  error: null,
};

export const testResultsSlice = createSlice({
  name: "testResults",
  initialState,
  reducers: {
    fetchDirectoriesRequest: (
      state,
      action: PayloadAction<string | undefined>
    ) => {
      state.loading = true;
      state.error = null;
    },
    fetchDirectoriesSuccess: (
      state,
      action: PayloadAction<TestDirectory[]>
    ) => {
      state.directories = action.payload;
      state.loading = false;
    },
    fetchDirectoriesFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },
    setSelectedDirectory: (state, action: PayloadAction<string | null>) => {
      state.selectedDirectory = action.payload;
      state.selectedFile = null;
      state.selectedTestResult = null;
    },
    fetchFilesRequest: (state, action: PayloadAction<string>) => {
      state.loading = true;
      state.error = null;
    },
    fetchFilesSuccess: (state, action: PayloadAction<TestFile[]>) => {
      state.files = action.payload;
      state.loading = false;

      // Auto-select first file if available
      if (state.files.length > 0 && !state.selectedFile) {
        state.selectedFile = state.files[0].name;
      }
    },
    fetchFilesFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },
    setSelectedFile: (state, action: PayloadAction<string | null>) => {
      state.selectedFile = action.payload;
    },
    fetchTestResultRequest: (
      state,
      action: PayloadAction<{ directory: string; file: string }>
    ) => {
      state.loading = true;
      state.error = null;
    },
    fetchTestResultSuccess: (state, action: PayloadAction<TestResult>) => {
      state.selectedTestResult = action.payload;
      state.loading = false;
    },
    fetchTestResultFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },
    refreshTestResults: (state) => {
      state.loading = true;
    },
  },
});

export const {
  fetchDirectoriesRequest,
  fetchDirectoriesSuccess,
  fetchDirectoriesFailure,
  setSelectedDirectory,
  fetchFilesRequest,
  fetchFilesSuccess,
  fetchFilesFailure,
  setSelectedFile,
  fetchTestResultRequest,
  fetchTestResultSuccess,
  fetchTestResultFailure,
  refreshTestResults,
} = testResultsSlice.actions;

export default testResultsSlice.reducer;


import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { TestResult, TestDirectory, TestFile, TestExecution } from '@/types/test.types';

interface TestState {
  selectedTest: string | null;
  testResults: TestResult | null;
  testDirectories: TestDirectory[];
  testFiles: TestFile[];
  runningTests: TestExecution[];
  loading: boolean;
  error: string | null;
}

const initialState: TestState = {
  selectedTest: null,
  testResults: null,
  testDirectories: [],
  testFiles: [],
  runningTests: [],
  loading: false,
  error: null,
};

export const testSlice = createSlice({
  name: 'test',
  initialState,
  reducers: {
    setSelectedTest: (state, action: PayloadAction<string>) => {
      state.selectedTest = action.payload;
    },
    setTestResults: (state, action: PayloadAction<TestResult>) => {
      state.testResults = action.payload;
    },
    setTestDirectories: (state, action: PayloadAction<TestDirectory[]>) => {
      state.testDirectories = action.payload;
    },
    setTestFiles: (state, action: PayloadAction<TestFile[]>) => {
      state.testFiles = action.payload;
    },
    setRunningTests: (state, action: PayloadAction<TestExecution[]>) => {
      state.runningTests = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    // Actions for sagas
    fetchTestDirectories: (state) => {
      state.loading = true;
    },
    fetchTestResult: (state, action: PayloadAction<string>) => {
      state.loading = true;
    },
    executeTest: (state, action: PayloadAction<any>) => {
      state.loading = true;
    },
  },
});

export const {
  setSelectedTest,
  setTestResults,
  setTestDirectories,
  setTestFiles,
  setRunningTests,
  setLoading,
  setError,
  fetchTestDirectories,
  fetchTestResult,
  executeTest,
} = testSlice.actions;

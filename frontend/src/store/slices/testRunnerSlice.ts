import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface TestConfig {
  name: string;
  description: string;
  file: string;
}

interface TestRunnerState {
  // Available tests
  tests: TestConfig[];
  testsLoading: boolean;
  testsError: string | null;

  // Selected test and profile
  selectedTest: string;
  selectedProfile: string;

  // Environment configuration
  environment: "PROD" | "DEV";
  customToken: string;
  customHost: string;

  // Test execution
  isRunning: boolean;
  runningTestId: string | null;
  output: string[];

  // WebSocket connection
  socketConnected: boolean;

  // Modals
  showTokenModal: boolean;
  showStopConfirmation: boolean;
}

const initialState: TestRunnerState = {
  tests: [],
  testsLoading: false,
  testsError: null,

  selectedTest: "",
  selectedProfile: "LIGHT",

  environment: "PROD",
  customToken: "",
  customHost: "",

  isRunning: false,
  runningTestId: null,
  output: [],

  socketConnected: false,

  showTokenModal: false,
  showStopConfirmation: false,
};

const testRunnerSlice = createSlice({
  name: "testRunner",
  initialState,
  reducers: {
    // Tests
    fetchTestsStart: (state) => {
      state.testsLoading = true;
      state.testsError = null;
    },
    fetchTestsSuccess: (state, action: PayloadAction<TestConfig[]>) => {
      state.tests = action.payload;
      state.testsLoading = false;
      state.testsError = null;

      // Auto-select first test if none selected
      if (action.payload.length > 0 && !state.selectedTest) {
        state.selectedTest = action.payload[0].name;
      }
    },
    fetchTestsFailure: (state, action: PayloadAction<string>) => {
      state.testsLoading = false;
      state.testsError = action.payload;
    },

    // Test selection
    setSelectedTest: (state, action: PayloadAction<string>) => {
      state.selectedTest = action.payload;
    },
    setSelectedProfile: (state, action: PayloadAction<string>) => {
      state.selectedProfile = action.payload;
    },

    // Environment
    setEnvironment: (state, action: PayloadAction<"PROD" | "DEV">) => {
      state.environment = action.payload;
    },
    setCustomToken: (state, action: PayloadAction<string>) => {
      state.customToken = action.payload;
    },
    setCustomHost: (state, action: PayloadAction<string>) => {
      state.customHost = action.payload;
    },

    // Test execution
    startTestRun: (state, action: PayloadAction<string>) => {
      state.isRunning = true;
      state.runningTestId = action.payload;
      state.output = [
        `🚀 Starting test: ${state.selectedTest} with profile: ${state.selectedProfile} on ${state.environment}`,
      ];
    },
    stopTestRun: (state) => {
      state.isRunning = false;
      state.runningTestId = null;
    },
    addOutput: (state, action: PayloadAction<string>) => {
      state.output.push(action.payload);
    },
    clearOutput: (state) => {
      state.output = [];
    },

    // WebSocket
    setSocketConnected: (state, action: PayloadAction<boolean>) => {
      state.socketConnected = action.payload;
    },

    // Modals
    setShowTokenModal: (state, action: PayloadAction<boolean>) => {
      state.showTokenModal = action.payload;
    },
    setShowStopConfirmation: (state, action: PayloadAction<boolean>) => {
      state.showStopConfirmation = action.payload;
    },

    // Load saved config from localStorage
    loadSavedConfig: (state) => {
      const savedConfig = localStorage.getItem("k6-dashboard-config");
      if (savedConfig) {
        try {
          const config = JSON.parse(savedConfig);
          state.environment = config.environment || "PROD";
          state.customToken = config.customToken || "";
          state.customHost = config.customHost || "";
        } catch (err) {
          console.error("Error parsing saved config:", err);
        }
      }
    },

    // Save config to localStorage
    saveConfig: (state) => {
      const config = {
        environment: state.environment,
        customToken: state.customToken,
        customHost: state.customHost,
      };
      localStorage.setItem("k6-dashboard-config", JSON.stringify(config));
    },
  },
});

export const {
  fetchTestsStart,
  fetchTestsSuccess,
  fetchTestsFailure,
  setSelectedTest,
  setSelectedProfile,
  setEnvironment,
  setCustomToken,
  setCustomHost,
  startTestRun,
  stopTestRun,
  addOutput,
  clearOutput,
  setSocketConnected,
  setShowTokenModal,
  setShowStopConfirmation,
  loadSavedConfig,
  saveConfig,
} = testRunnerSlice.actions;

export default testRunnerSlice.reducer;

// Selectors
export const selectTests = (state: { testRunner: TestRunnerState }) =>
  state.testRunner.tests;
export const selectTestsLoading = (state: { testRunner: TestRunnerState }) =>
  state.testRunner.testsLoading;
export const selectSelectedTest = (state: { testRunner: TestRunnerState }) =>
  state.testRunner.selectedTest;
export const selectSelectedProfile = (state: { testRunner: TestRunnerState }) =>
  state.testRunner.selectedProfile;
export const selectEnvironment = (state: { testRunner: TestRunnerState }) =>
  state.testRunner.environment;
export const selectCustomToken = (state: { testRunner: TestRunnerState }) =>
  state.testRunner.customToken;
export const selectCustomHost = (state: { testRunner: TestRunnerState }) =>
  state.testRunner.customHost;
export const selectIsRunning = (state: { testRunner: TestRunnerState }) =>
  state.testRunner.isRunning;
export const selectRunningTestId = (state: { testRunner: TestRunnerState }) =>
  state.testRunner.runningTestId;
export const selectOutput = (state: { testRunner: TestRunnerState }) =>
  state.testRunner.output;
export const selectSocketConnected = (state: { testRunner: TestRunnerState }) =>
  state.testRunner.socketConnected;

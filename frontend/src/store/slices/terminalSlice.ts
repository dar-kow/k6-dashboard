
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface TerminalState {
  output: string[];
  isConnected: boolean;
  isExecuting: boolean;
  currentCommand: string | null;
}

const initialState: TerminalState = {
  output: [],
  isConnected: false,
  isExecuting: false,
  currentCommand: null,
};

export const terminalSlice = createSlice({
  name: 'terminal',
  initialState,
  reducers: {
    addOutput: (state, action: PayloadAction<string>) => {
      state.output.push(action.payload);
    },
    clearOutput: (state) => {
      state.output = [];
    },
    setConnected: (state, action: PayloadAction<boolean>) => {
      state.isConnected = action.payload;
    },
    setExecuting: (state, action: PayloadAction<boolean>) => {
      state.isExecuting = action.payload;
    },
    setCurrentCommand: (state, action: PayloadAction<string | null>) => {
      state.currentCommand = action.payload;
    },
    connectWebSocket: (state) => {
      // Saga will handle the connection
    },
    disconnectWebSocket: (state) => {
      state.isConnected = false;
    },
  },
});

export const {
  addOutput,
  clearOutput,
  setConnected,
  setExecuting,
  setCurrentCommand,
  connectWebSocket,
  disconnectWebSocket,
} = terminalSlice.actions;

import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface UiState {
  // Global loading states
  globalLoading: boolean;

  // Notifications/Toasts
  notifications: Array<{
    id: string;
    type: "success" | "error" | "warning" | "info";
    title: string;
    message: string;
    timestamp: number;
  }>;

  // Modals
  modals: Record<string, boolean>;

  // PDF generation states
  pdfGenerating: boolean;

  // Auto-scroll for terminal
  terminalAutoScroll: boolean;

  // Theme/preferences
  theme: "light" | "dark";
  sidebarCollapsed: boolean;
}

const initialState: UiState = {
  globalLoading: false,
  notifications: [],
  modals: {},
  pdfGenerating: false,
  terminalAutoScroll: true,
  theme: "light",
  sidebarCollapsed: false,
};

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    setGlobalLoading: (state, action: PayloadAction<boolean>) => {
      state.globalLoading = action.payload;
    },

    addNotification: (
      state,
      action: PayloadAction<
        Omit<UiState["notifications"][0], "id" | "timestamp">
      >
    ) => {
      const notification = {
        ...action.payload,
        id: Date.now().toString(),
        timestamp: Date.now(),
      };
      state.notifications.push(notification);
    },

    removeNotification: (state, action: PayloadAction<string>) => {
      state.notifications = state.notifications.filter(
        (n) => n.id !== action.payload
      );
    },

    clearNotifications: (state) => {
      state.notifications = [];
    },

    setModal: (
      state,
      action: PayloadAction<{ modalId: string; isOpen: boolean }>
    ) => {
      state.modals[action.payload.modalId] = action.payload.isOpen;
    },

    setPdfGenerating: (state, action: PayloadAction<boolean>) => {
      state.pdfGenerating = action.payload;
    },

    setTerminalAutoScroll: (state, action: PayloadAction<boolean>) => {
      state.terminalAutoScroll = action.payload;
    },

    setTheme: (state, action: PayloadAction<"light" | "dark">) => {
      state.theme = action.payload;
      localStorage.setItem("theme", action.payload);
    },

    setSidebarCollapsed: (state, action: PayloadAction<boolean>) => {
      state.sidebarCollapsed = action.payload;
      localStorage.setItem("sidebarCollapsed", action.payload.toString());
    },
  },
});

export const {
  setGlobalLoading,
  addNotification,
  removeNotification,
  clearNotifications,
  setModal,
  setPdfGenerating,
  setTerminalAutoScroll,
  setTheme,
  setSidebarCollapsed,
} = uiSlice.actions;

export default uiSlice.reducer;

// Selectors
export const selectGlobalLoading = (state: { ui: UiState }) =>
  state.ui.globalLoading;
export const selectNotifications = (state: { ui: UiState }) =>
  state.ui.notifications;
export const selectModal = (modalId: string) => (state: { ui: UiState }) =>
  state.ui.modals[modalId] || false;
export const selectPdfGenerating = (state: { ui: UiState }) =>
  state.ui.pdfGenerating;
export const selectTerminalAutoScroll = (state: { ui: UiState }) =>
  state.ui.terminalAutoScroll;
export const selectTheme = (state: { ui: UiState }) => state.ui.theme;
export const selectSidebarCollapsed = (state: { ui: UiState }) =>
  state.ui.sidebarCollapsed;

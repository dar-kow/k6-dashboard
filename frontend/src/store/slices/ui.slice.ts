import { createSlice, PayloadAction } from "@reduxjs/toolkit";

// Notification types
export interface Notification {
  id: string;
  type: "success" | "error" | "warning" | "info";
  title: string;
  message?: string;
  duration?: number; // ms, undefined = persistent
  timestamp: string;
}

// Modal state
export interface ModalState {
  isOpen: boolean;
  type: string;
  data?: any;
}

// Loading states for different operations
export interface LoadingStates {
  globalLoading: boolean;
  testExecution: boolean;
  pdfGeneration: boolean;
  apiRequests: Record<string, boolean>; // key = request id, value = loading state
}

// UI State interface
export interface UIState {
  loading: LoadingStates;
  notifications: Notification[];
  modal: ModalState;
  theme: "light" | "dark";
  sidebarCollapsed: boolean;
  lastApiError: string | null;
  networkStatus: "online" | "offline";
}

// Initial state
const initialState: UIState = {
  loading: {
    globalLoading: false,
    testExecution: false,
    pdfGeneration: false,
    apiRequests: {},
  },
  notifications: [],
  modal: {
    isOpen: false,
    type: "",
    data: undefined,
  },
  theme: "light",
  sidebarCollapsed: false,
  lastApiError: null,
  networkStatus: "online",
};

// Helper to generate notification IDs
const generateNotificationId = () =>
  `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// Slice definition
const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    // Loading states management
    setGlobalLoading: (state, action: PayloadAction<boolean>) => {
      state.loading.globalLoading = action.payload;
    },

    setTestExecutionLoading: (state, action: PayloadAction<boolean>) => {
      state.loading.testExecution = action.payload;
    },

    setPdfGenerationLoading: (state, action: PayloadAction<boolean>) => {
      state.loading.pdfGeneration = action.payload;
    },

    setApiRequestLoading: (
      state,
      action: PayloadAction<{ requestId: string; loading: boolean }>
    ) => {
      const { requestId, loading } = action.payload;
      if (loading) {
        state.loading.apiRequests[requestId] = true;
      } else {
        delete state.loading.apiRequests[requestId];
      }
    },

    clearAllLoadingStates: (state) => {
      state.loading = {
        globalLoading: false,
        testExecution: false,
        pdfGeneration: false,
        apiRequests: {},
      };
    },

    // Notifications management
    addNotification: {
      reducer: (state, action: PayloadAction<Notification>) => {
        state.notifications.push(action.payload);
      },
      prepare: (notification: Omit<Notification, "id" | "timestamp">) => ({
        payload: {
          id: generateNotificationId(),
          timestamp: new Date().toISOString(),
          duration: 5000, // default 5 seconds
          ...notification,
        },
      }),
    },

    removeNotification: (state, action: PayloadAction<string>) => {
      state.notifications = state.notifications.filter(
        (notification) => notification.id !== action.payload
      );
    },

    clearAllNotifications: (state) => {
      state.notifications = [];
    },

    // Quick notification helpers
    showSuccessNotification: {
      reducer: (state, action: PayloadAction<Notification>) => {
        state.notifications.push(action.payload);
      },
      prepare: (title: string, message?: string) => ({
        payload: {
          id: generateNotificationId(),
          type: "success" as const,
          title,
          ...(message && { message }),
          timestamp: new Date().toISOString(),
          duration: 4000,
        },
      }),
    },

    showErrorNotification: {
      reducer: (state, action: PayloadAction<Notification>) => {
        state.notifications.push(action.payload);
        // Also store as last API error
        state.lastApiError = action.payload.message || action.payload.title;
      },
      prepare: (title: string, message?: string) => ({
        payload: {
          id: generateNotificationId(),
          type: "error" as const,
          title,
          ...(message && { message }),
          timestamp: new Date().toISOString(),
          duration: 8000, // Errors stay longer
        },
      }),
    },

    showWarningNotification: {
      reducer: (state, action: PayloadAction<Notification>) => {
        state.notifications.push(action.payload);
      },
      prepare: (title: string, message?: string) => ({
        payload: {
          id: generateNotificationId(),
          type: "warning" as const,
          title,
          ...(message && { message }),
          timestamp: new Date().toISOString(),
          duration: 6000,
        },
      }),
    },

    showInfoNotification: {
      reducer: (state, action: PayloadAction<Notification>) => {
        state.notifications.push(action.payload);
      },
      prepare: (title: string, message?: string) => ({
        payload: {
          id: generateNotificationId(),
          type: "info" as const,
          title,
          ...(message && { message }),
          timestamp: new Date().toISOString(),
          duration: 5000,
        },
      }),
    },

    // Modal management
    openModal: (state, action: PayloadAction<{ type: string; data?: any }>) => {
      state.modal = {
        isOpen: true,
        type: action.payload.type,
        data: action.payload.data,
      };
    },

    closeModal: (state) => {
      state.modal = {
        isOpen: false,
        type: "",
        data: undefined,
      };
    },

    // Theme management
    setTheme: (state, action: PayloadAction<"light" | "dark">) => {
      state.theme = action.payload;
    },

    toggleTheme: (state) => {
      state.theme = state.theme === "light" ? "dark" : "light";
    },

    // Sidebar management
    setSidebarCollapsed: (state, action: PayloadAction<boolean>) => {
      state.sidebarCollapsed = action.payload;
    },

    toggleSidebar: (state) => {
      state.sidebarCollapsed = !state.sidebarCollapsed;
    },

    // Error management
    setLastApiError: (state, action: PayloadAction<string | null>) => {
      state.lastApiError = action.payload;
    },

    clearLastApiError: (state) => {
      state.lastApiError = null;
    },

    // Network status
    setNetworkStatus: (state, action: PayloadAction<"online" | "offline">) => {
      state.networkStatus = action.payload;
    },

    // Reset UI state (for logout, etc.)
    resetUIState: (state) => {
      return {
        ...initialState,
        theme: state.theme, // Preserve theme preference
        sidebarCollapsed: state.sidebarCollapsed, // Preserve sidebar preference
      };
    },
  },
});

// Export actions
export const {
  setGlobalLoading,
  setTestExecutionLoading,
  setPdfGenerationLoading,
  setApiRequestLoading,
  clearAllLoadingStates,
  addNotification,
  removeNotification,
  clearAllNotifications,
  showSuccessNotification,
  showErrorNotification,
  showWarningNotification,
  showInfoNotification,
  openModal,
  closeModal,
  setTheme,
  toggleTheme,
  setSidebarCollapsed,
  toggleSidebar,
  setLastApiError,
  clearLastApiError,
  setNetworkStatus,
  resetUIState,
} = uiSlice.actions;

// Export reducer
export default uiSlice.reducer;

// Selectors
export const selectUI = (state: { ui: UIState }) => state.ui;
export const selectLoading = (state: { ui: UIState }) => state.ui.loading;
export const selectGlobalLoading = (state: { ui: UIState }) =>
  state.ui.loading.globalLoading;
export const selectTestExecutionLoading = (state: { ui: UIState }) =>
  state.ui.loading.testExecution;
export const selectPdfGenerationLoading = (state: { ui: UIState }) =>
  state.ui.loading.pdfGeneration;
export const selectApiRequestLoading =
  (requestId: string) => (state: { ui: UIState }) =>
    state.ui.loading.apiRequests[requestId] || false;
export const selectAnyApiRequestLoading = (state: { ui: UIState }) =>
  Object.keys(state.ui.loading.apiRequests).length > 0;

export const selectNotifications = (state: { ui: UIState }) =>
  state.ui.notifications;
export const selectActiveNotifications = (state: { ui: UIState }) =>
  state.ui.notifications.filter((notification) => {
    if (!notification.duration) return true; // Persistent notifications
    const now = Date.now();
    const notificationTime = new Date(notification.timestamp).getTime();
    return now - notificationTime < notification.duration;
  });

export const selectModal = (state: { ui: UIState }) => state.ui.modal;
export const selectTheme = (state: { ui: UIState }) => state.ui.theme;
export const selectSidebarCollapsed = (state: { ui: UIState }) =>
  state.ui.sidebarCollapsed;
export const selectLastApiError = (state: { ui: UIState }) =>
  state.ui.lastApiError;
export const selectNetworkStatus = (state: { ui: UIState }) =>
  state.ui.networkStatus;

// Derived selectors
export const selectHasNotifications = (state: { ui: UIState }) =>
  state.ui.notifications.length > 0;
export const selectUnreadNotificationsCount = (state: { ui: UIState }) =>
  selectActiveNotifications(state).length;

// Action creators for external usage
export const uiActions = {
  setGlobalLoading,
  setTestExecutionLoading,
  setPdfGenerationLoading,
  setApiRequestLoading,
  showSuccessNotification,
  showErrorNotification,
  showWarningNotification,
  showInfoNotification,
  openModal,
  closeModal,
} as const;

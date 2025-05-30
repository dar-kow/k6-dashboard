import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface NotificationState {
  id: string;
  type: "success" | "error" | "warning" | "info";
  title: string;
  message?: string;
  duration?: number;
  persistent?: boolean;
}

interface ModalState {
  id: string;
  type: string;
  props?: Record<string, any>;
}

interface UiState {
  // Loading states
  globalLoading: boolean;
  loadingStates: Record<string, boolean>;

  // Notifications
  notifications: NotificationState[];

  // Modals
  modals: ModalState[];

  // Sidebar
  sidebarCollapsed: boolean;

  // Theme
  theme: "light" | "dark" | "auto";

  // Preferences
  preferences: {
    autoRefresh: boolean;
    refreshInterval: number;
    chartAnimations: boolean;
    tablePageSize: number;
  };
}

const initialState: UiState = {
  globalLoading: false,
  loadingStates: {},
  notifications: [],
  modals: [],
  sidebarCollapsed: false,
  theme: "light",
  preferences: {
    autoRefresh: true,
    refreshInterval: 30000,
    chartAnimations: true,
    tablePageSize: 10,
  },
};

let notificationId = 0;

export const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    // Global loading
    setGlobalLoading: (state, action: PayloadAction<boolean>) => {
      state.globalLoading = action.payload;
    },

    // Specific loading states
    setLoadingState: (
      state,
      action: PayloadAction<{ key: string; loading: boolean }>
    ) => {
      const { key, loading } = action.payload;
      if (loading) {
        state.loadingStates[key] = true;
      } else {
        delete state.loadingStates[key];
      }
    },

    // Notifications
    addNotification: {
      reducer: (state, action: PayloadAction<NotificationState>) => {
        state.notifications.push(action.payload);
      },
      prepare: (notification: Omit<NotificationState, "id">) => ({
        payload: {
          id: `notification-${++notificationId}`,
          duration: 5000,
          ...notification,
        },
      }),
    },

    removeNotification: (state, action: PayloadAction<string>) => {
      state.notifications = state.notifications.filter(
        (n) => n.id !== action.payload
      );
    },

    clearNotifications: (state) => {
      state.notifications = [];
    },

    // Modals
    openModal: (state, action: PayloadAction<Omit<ModalState, "id">>) => {
      const modal = {
        id: `modal-${Date.now()}`,
        ...action.payload,
      };
      state.modals.push(modal);
    },

    closeModal: (state, action: PayloadAction<string>) => {
      state.modals = state.modals.filter((m) => m.id !== action.payload);
    },

    closeAllModals: (state) => {
      state.modals = [];
    },

    // Sidebar
    toggleSidebar: (state) => {
      state.sidebarCollapsed = !state.sidebarCollapsed;
    },

    setSidebarCollapsed: (state, action: PayloadAction<boolean>) => {
      state.sidebarCollapsed = action.payload;
    },

    // Theme
    setTheme: (state, action: PayloadAction<"light" | "dark" | "auto">) => {
      state.theme = action.payload;
      localStorage.setItem("theme", action.payload);
    },

    // Preferences
    updatePreferences: (
      state,
      action: PayloadAction<Partial<UiState["preferences"]>>
    ) => {
      state.preferences = { ...state.preferences, ...action.payload };
      localStorage.setItem(
        "userPreferences",
        JSON.stringify(state.preferences)
      );
    },

    // Load preferences from localStorage
    loadPreferences: (state) => {
      try {
        const saved = localStorage.getItem("userPreferences");
        if (saved) {
          state.preferences = { ...state.preferences, ...JSON.parse(saved) };
        }

        const savedTheme = localStorage.getItem("theme");
        if (savedTheme && ["light", "dark", "auto"].includes(savedTheme)) {
          state.theme = savedTheme as "light" | "dark" | "auto";
        }
      } catch (error) {
        console.error("Failed to load preferences:", error);
      }
    },
  },
});

export const {
  setGlobalLoading,
  setLoadingState,
  addNotification,
  removeNotification,
  clearNotifications,
  openModal,
  closeModal,
  closeAllModals,
  toggleSidebar,
  setSidebarCollapsed,
  setTheme,
  updatePreferences,
  loadPreferences,
} = uiSlice.actions;

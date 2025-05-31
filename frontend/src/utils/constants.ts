export const APP_CONSTANTS = {
  // 🎨 Colors - zgodne z Tailwind ale extensible
  COLORS: {
    PRIMARY: {
      50: "#eff6ff",
      100: "#dbeafe",
      500: "#3b82f6",
      600: "#2563eb",
      700: "#1d4ed8",
      900: "#1e3a8a",
    },
    SUCCESS: {
      50: "#f0fdf4",
      100: "#dcfce7",
      500: "#22c55e",
      600: "#16a34a",
      700: "#15803d",
    },
    WARNING: {
      50: "#fffbeb",
      100: "#fef3c7",
      500: "#f59e0b",
      600: "#d97706",
      700: "#b45309",
    },
    ERROR: {
      50: "#fef2f2",
      100: "#fee2e2",
      500: "#ef4444",
      600: "#dc2626",
      700: "#b91c1c",
    },
    GRAY: {
      50: "#f9fafb",
      100: "#f3f4f6",
      200: "#e5e7eb",
      300: "#d1d5db",
      400: "#9ca3af",
      500: "#6b7280",
      600: "#4b5563",
      700: "#374151",
      800: "#1f2937",
      900: "#111827",
    },
  },

  // 📊 Chart colors
  CHART_COLORS: {
    PRIMARY: "#3b82f6",
    SUCCESS: "#10b981",
    WARNING: "#f59e0b",
    ERROR: "#ef4444",
    INFO: "#06b6d4",
    SECONDARY: "#8b5cf6",
  },

  // 📏 Spacing & Sizing
  SPACING: {
    xs: "0.25rem", // 4px
    sm: "0.5rem", // 8px
    md: "1rem", // 16px
    lg: "1.5rem", // 24px
    xl: "2rem", // 32px
    "2xl": "3rem", // 48px
  },

  // 🔤 Typography
  FONT_SIZES: {
    xs: "0.75rem", // 12px
    sm: "0.875rem", // 14px
    md: "1rem", // 16px
    lg: "1.125rem", // 18px
    xl: "1.25rem", // 20px
    "2xl": "1.5rem", // 24px
    "3xl": "1.875rem", // 30px
  },

  // 🔘 Button variants
  BUTTON_VARIANTS: {
    PRIMARY: "primary",
    SECONDARY: "secondary",
    SUCCESS: "success",
    WARNING: "warning",
    ERROR: "error",
    GHOST: "ghost",
  } as const,

  // 📐 Sizes
  SIZES: {
    XS: "xs",
    SM: "sm",
    MD: "md",
    LG: "lg",
    XL: "xl",
  } as const,

  // 🎭 Status types
  STATUS_TYPES: {
    HEALTHY: "healthy",
    WARNING: "warning",
    CRITICAL: "critical",
    UNKNOWN: "unknown",
  } as const,

  // 🔄 Loading states
  LOADING_STATES: {
    IDLE: "idle",
    LOADING: "loading",
    SUCCESS: "success",
    ERROR: "error",
  } as const,
} as const;

// 🎯 Type helpers
export type ButtonVariant =
  (typeof APP_CONSTANTS.BUTTON_VARIANTS)[keyof typeof APP_CONSTANTS.BUTTON_VARIANTS];
export type Size =
  (typeof APP_CONSTANTS.SIZES)[keyof typeof APP_CONSTANTS.SIZES];
export type StatusType =
  (typeof APP_CONSTANTS.STATUS_TYPES)[keyof typeof APP_CONSTANTS.STATUS_TYPES];
export type LoadingState =
  (typeof APP_CONSTANTS.LOADING_STATES)[keyof typeof APP_CONSTANTS.LOADING_STATES];

// 🛠️ Utility functions
export const getStatusColor = (status: StatusType) => {
  switch (status) {
    case APP_CONSTANTS.STATUS_TYPES.HEALTHY:
      return APP_CONSTANTS.COLORS.SUCCESS;
    case APP_CONSTANTS.STATUS_TYPES.WARNING:
      return APP_CONSTANTS.COLORS.WARNING;
    case APP_CONSTANTS.STATUS_TYPES.CRITICAL:
      return APP_CONSTANTS.COLORS.ERROR;
    default:
      return APP_CONSTANTS.COLORS.GRAY;
  }
};

export const getButtonClasses = (variant: ButtonVariant, size: Size = "md") => {
  const baseClasses =
    "inline-flex items-center justify-center font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";

  const sizeClasses = {
    xs: "px-2 py-1 text-xs",
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base",
    xl: "px-8 py-4 text-lg",
  };

  const variantClasses = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500",
    secondary:
      "bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-500",
    success: "bg-green-600 text-white hover:bg-green-700 focus:ring-green-500",
    warning:
      "bg-yellow-600 text-white hover:bg-yellow-700 focus:ring-yellow-500",
    error: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500",
    ghost: "text-gray-700 hover:bg-gray-100 focus:ring-gray-500",
  };

  return `${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]}`;
};

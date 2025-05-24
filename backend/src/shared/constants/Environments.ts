export const ENVIRONMENT_CONFIG = {
  PROD: {
    name: "PROD",
    description: "Production environment",
    color: "blue",
    requiresAuth: true,
  },
  DEV: {
    name: "DEV",
    description: "Development environment",
    color: "orange",
    requiresAuth: false,
  },
} as const;

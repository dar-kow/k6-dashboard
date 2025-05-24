export const TEST_PROFILE_CONFIG = {
  LIGHT: {
    name: "LIGHT",
    description: "Light load testing",
    virtualUsers: 10,
    duration: "60s",
    rampUpTime: "10s",
    memoryUsage: "~50MB",
  },
  MEDIUM: {
    name: "MEDIUM",
    description: "Medium load testing",
    virtualUsers: 30,
    duration: "5m",
    rampUpTime: "30s",
    memoryUsage: "~150MB",
  },
  HEAVY: {
    name: "HEAVY",
    description: "Heavy load testing",
    virtualUsers: 100,
    duration: "10m",
    rampUpTime: "1m",
    memoryUsage: "~500MB",
  },
} as const;

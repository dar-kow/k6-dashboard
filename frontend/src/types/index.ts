// 🌍 Global Types for K6 Dashboard

// Common utility types
export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
export type Dict<T = any> = Record<string, T>;

// UI related types
export interface BaseComponentProps {
  className?: string;
  id?: string;
  "data-testid"?: string;
}

export interface LoadingState {
  isLoading: boolean;
  error?: string | null;
  lastUpdated?: Date;
}

// Chart related types
export interface ChartDataPoint {
  name: string;
  value: number;
  [key: string]: string | number;
}

export interface ChartSeries {
  key: string;
  name: string;
  color?: string;
}

export interface ChartProps extends BaseComponentProps {
  title?: string;
  data: ChartDataPoint[];
  loading?: boolean;
  error?: string;
}

// Status types
export type HealthStatus = "healthy" | "warning" | "critical" | "unknown";
export type TestStatus = "running" | "completed" | "failed" | "pending";

// Common API types (będą rozszerzone w api/types.ts)
export interface ApiError {
  message: string;
  code?: string | number;
  details?: any;
}

export interface ApiSuccessResponse<T = any> {
  data: T;
  message?: string;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
  };
}

// Form related types
export interface FormField {
  name: string;
  label: string;
  type: "text" | "select" | "textarea" | "number" | "checkbox";
  required?: boolean;
  options?: Array<{ label: string; value: string | number }>;
  placeholder?: string;
  validation?: {
    pattern?: RegExp;
    min?: number;
    max?: number;
    minLength?: number;
    maxLength?: number;
  };
}

// Navigation types
export interface NavigationItem {
  path: string;
  label: string;
  icon?: string;
  exact?: boolean;
  children?: NavigationItem[];
}

// Theme types (for future dark mode support)
export type ThemeMode = "light" | "dark" | "auto";

export interface ThemeConfig {
  mode: ThemeMode;
  primaryColor?: string;
  accentColor?: string;
}

// Environment types
export type Environment = "development" | "production" | "test";

// File types
export interface FileInfo {
  name: string;
  size: number;
  type: string;
  lastModified: Date;
}

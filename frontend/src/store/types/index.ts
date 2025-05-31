import { store } from "../index";

// Redux Types
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Common async state interface
export interface AsyncState<T = any> {
  data: T | null;
  loading: boolean;
  error: string | null;
  lastUpdated?: string;
}

// Common API response interface
export interface ApiResponse<T = any> {
  data: T;
  message?: string;
  status: number;
  success: boolean;
}

// Common pagination interface
export interface PaginationState {
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
}

// Common filter state
export interface FilterState {
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  filters?: Record<string, any>;
}

// Action types for async operations
export interface AsyncActionTypes {
  REQUEST: string;
  SUCCESS: string;
  FAILURE: string;
}

// Saga action interface
export interface SagaAction<T = any> {
  type: string;
  payload?: T;
  meta?: {
    requestId?: string;
    timestamp?: number;
  };
}

// Common entity state (for normalized data)
export interface EntityState<T> {
  ids: string[];
  entities: Record<string, T>;
  loading: boolean;
  error: string | null;
}

// Helper type for creating async slice initial state
export const createAsyncState = <T = any>(
  initialData: T | null = null
): AsyncState<T> => ({
  data: initialData,
  loading: false,
  error: null,
  lastUpdated: undefined,
});

// Helper type for creating entity state
export const createEntityState = <T>(): EntityState<T> => ({
  ids: [],
  entities: {},
  loading: false,
  error: null,
});

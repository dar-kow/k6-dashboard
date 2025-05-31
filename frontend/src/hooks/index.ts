import { useDispatch, useSelector, TypedUseSelectorHook } from "react-redux";
import { useCallback, useEffect, useRef } from "react";
import type { RootState, AppDispatch } from "../store/types";

// Typed hooks for Redux
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

// Custom hook for dispatching actions with loading state
export const useAsyncDispatch = () => {
  const dispatch = useAppDispatch();
  const loadingRef = useRef<Set<string>>(new Set());

  const dispatchAsync = useCallback(
    async (action: any, actionId?: string) => {
      const id = actionId || `${action.type}_${Date.now()}`;

      try {
        loadingRef.current.add(id);
        const result = await dispatch(action);
        return result;
      } finally {
        loadingRef.current.delete(id);
      }
    },
    [dispatch]
  );

  const isLoading = useCallback((actionId?: string) => {
    if (actionId) {
      return loadingRef.current.has(actionId);
    }
    return loadingRef.current.size > 0;
  }, []);

  return { dispatchAsync, isLoading };
};

// Hook for previous value (useful for comparing props/state)
export const usePrevious = <T>(value: T): T | undefined => {
  const ref = useRef<T>();
  useEffect(() => {
    ref.current = value;
  });
  return ref.current;
};

// Hook for debounced values
export const useDebounce = <T>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = React.useState<T>(value);

  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// Hook for local storage with Redux sync
export const useLocalStorage = <T>(
  key: string,
  initialValue: T
): [T, (value: T) => void] => {
  const [storedValue, setStoredValue] = React.useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const setValue = useCallback(
    (value: T) => {
      try {
        setStoredValue(value);
        window.localStorage.setItem(key, JSON.stringify(value));
      } catch (error) {
        console.error(`Error setting localStorage key "${key}":`, error);
      }
    },
    [key]
  );

  return [storedValue, setValue];
};

// Hook for async error handling
export const useAsyncError = () => {
  const [error, setError] = React.useState<Error | null>(null);

  const dispatchError = useCallback((error: Error) => {
    setError(error);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return { error, dispatchError, clearError };
};

// Import React for hooks that need it
import React from "react";

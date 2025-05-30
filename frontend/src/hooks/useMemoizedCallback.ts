import { useCallback, useRef, useMemo } from "react";

export function useMemoizedCallback<T extends (...args: any[]) => any>(
  callback: T,
  deps: React.DependencyList
): T {
  const ref = useRef<T>();

  return useMemo(() => {
    ref.current = callback;
    return ((...args) => ref.current?.(...args)) as T;
  }, deps);
}

export function useStableCallback<T extends (...args: any[]) => any>(
  callback: T
): T {
  const ref = useRef<T>(callback);
  ref.current = callback;

  return useCallback(((...args) => ref.current(...args)) as T, []);
}

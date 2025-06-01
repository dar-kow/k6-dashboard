import { useRef, useCallback } from "react";

export const useDeduplicatedRequest = <
  T extends (...args: any[]) => Promise<any>
>(
  requestFn: T,
  cacheKey?: string
) => {
  const pendingRequests = useRef<Record<string, Promise<any>>>({});

  const dedupedRequestFn = useCallback(
    async (...args: Parameters<T>): Promise<ReturnType<T>> => {
      const key = cacheKey || JSON.stringify(args);

      if (key in pendingRequests.current) {
        return pendingRequests.current[key];
      }

      const requestPromise = requestFn(...args) as Promise<ReturnType<T>>;
      pendingRequests.current[key] = requestPromise;

      try {
        const result = await requestPromise;
        return result;
      } finally {
        delete pendingRequests.current[key];
      }
    },
    [requestFn, cacheKey]
  );

  return dedupedRequestFn;
};

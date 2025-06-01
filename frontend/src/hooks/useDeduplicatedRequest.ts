import { useRef, useCallback } from "react";

export const useDeduplicatedRequest = <
  T extends (...args: any[]) => Promise<any>
>(
  requestFn: T,
  cacheKey?: string
) => {
  // Referencja przechowująca aktualnie wykonywane requesty
  const pendingRequests = useRef<Record<string, Promise<any>>>({});

  const dedupedRequestFn = useCallback(
    async (...args: Parameters<T>): Promise<ReturnType<T>> => {
      // Generuj klucz dla danego wywołania funkcji
      const key = cacheKey || JSON.stringify(args);

      // Jeśli request jest już w trakcie, zwróć jego Promise
      if (key in pendingRequests.current) {
        return pendingRequests.current[key];
      }

      // Wykonaj request i zapisz jego Promise
      const requestPromise = requestFn(...args) as Promise<ReturnType<T>>;
      pendingRequests.current[key] = requestPromise;

      try {
        // Czekaj na wynik
        const result = await requestPromise;
        return result;
      } finally {
        // Usuń z listy po zakończeniu
        delete pendingRequests.current[key];
      }
    },
    [requestFn, cacheKey]
  );

  return dedupedRequestFn;
};

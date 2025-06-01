import { useCallback } from "react";
import { apiCache } from "../api/client";

export const useApiCache = () => {
  const clearCache = useCallback(() => {
    apiCache.clear();
  }, []);

  const clearCacheByPattern = useCallback((pattern: string) => {
    // This would need to be implemented in the ApiCache class
    // For now, just clear all
    apiCache.clear();
  }, []);

  const invalidateResults = useCallback(() => {
    // Clear all results-related cache
    apiCache.delete("directories_default");
    // Could be more specific here
  }, []);

  return {
    clearCache,
    clearCacheByPattern,
    invalidateResults,
  };
};

import { useCallback } from "react";
import { apiCache } from "../api/client";

export const useApiCache = () => {
  const clearCache = useCallback(() => {
    apiCache.clear();
  }, []);

  const clearCacheByPattern = useCallback((pattern: string) => {
    // Simple pattern matching - clear all keys that include the pattern
    console.log(`Clearing cache entries matching pattern: ${pattern}`);
    apiCache.clear(); // For now, just clear all
  }, []);

  const invalidateResults = useCallback(() => {
    // Clear all results-related cache
    console.log('Invalidating results cache');
    apiCache.clear();
  }, []);

  return {
    clearCache,
    clearCacheByPattern,
    invalidateResults,
  };
};

// Default export
export default useApiCache;
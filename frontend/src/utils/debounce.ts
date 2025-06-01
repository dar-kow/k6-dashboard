export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;

  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(null, args), wait);
  };
};

// Debounced API calls
export const createDebouncedApiCall = <
  T extends (...args: any[]) => Promise<any>
>(
  apiCall: T,
  delay: number = 300
) => {
  let timeoutId: NodeJS.Timeout;
  let currentPromise: Promise<any> | null = null;

  return (...args: Parameters<T>): Promise<ReturnType<T>> => {
    return new Promise((resolve, reject) => {
      clearTimeout(timeoutId);

      timeoutId = setTimeout(async () => {
        try {
          if (currentPromise) {
            // Cancel previous request if still pending
            // Note: Axios doesn't support cancellation in this simple setup
            // You could implement AbortController here
          }

          currentPromise = apiCall(...args);
          const result = await currentPromise;
          currentPromise = null;
          resolve(result);
        } catch (error) {
          currentPromise = null;
          reject(error);
        }
      }, delay);
    });
  };
};

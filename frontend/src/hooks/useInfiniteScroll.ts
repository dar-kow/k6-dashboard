import { useState, useEffect, useCallback, useRef } from 'react';

interface UseInfiniteScrollOptions {
  threshold?: number;
  rootMargin?: string;
  enabled?: boolean;
}

export const useInfiniteScroll = (
  callback: () => void | Promise<void>,
  options: UseInfiniteScrollOptions = {}
) => {
  const { threshold = 1.0, rootMargin = '0px', enabled = true } = options;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const observer = useRef<IntersectionObserver | undefined>(undefined);

  const lastElementRef = useCallback(
    (node: Element | null) => {
      if (loading || !enabled) return;

      if (observer.current) observer.current.disconnect();

      observer.current = new IntersectionObserver(
        async entries => {
          if (entries[0].isIntersecting) {
            try {
              setLoading(true);
              setError(null);
              await callback();
            } catch (err) {
              setError(err instanceof Error ? err : new Error('Unknown error'));
            } finally {
              setLoading(false);
            }
          }
        },
        { threshold, rootMargin }
      );

      if (node) observer.current.observe(node);
    },
    [loading, enabled, callback, threshold, rootMargin]
  );

  useEffect(() => {
    return () => {
      if (observer.current) {
        observer.current.disconnect();
      }
    };
  }, []);

  return { lastElementRef, loading, error };
};

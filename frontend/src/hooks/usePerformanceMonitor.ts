import { useEffect, useRef } from "react";

interface PerformanceMetrics {
  renderTime: number;
  memoryUsage: number;
  componentName: string;
}

export const usePerformanceMonitor = (
  componentName: string,
  enabled: boolean = false
) => {
  const renderStartTime = useRef<number>(Date.now());
  const renderCount = useRef<number>(0);

  useEffect(() => {
    if (!enabled) return;

    renderStartTime.current = Date.now();
    renderCount.current++;
  });

  useEffect(() => {
    if (!enabled) return;

    const renderTime = Date.now() - renderStartTime.current;

    // Log performance metrics in development
    if (process.env.NODE_ENV === "development") {
      const metrics: PerformanceMetrics = {
        renderTime,
        memoryUsage: (performance as any).memory?.usedJSHeapSize || 0,
        componentName,
      };

      if (renderTime > 16) {
        // Longer than one frame (60fps)
        console.warn(`🐌 Slow render detected in ${componentName}:`, metrics);
      }

      // Log every 10th render for monitoring
      if (renderCount.current % 10 === 0) {
        console.log(`📊 Performance metrics for ${componentName}:`, metrics);
      }
    }
  });

  return {
    renderCount: renderCount.current,
  };
};

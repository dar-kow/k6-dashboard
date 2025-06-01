import React from 'react';

export const measurePerformance = async <T>(name: string, fn: () => Promise<T> | T): Promise<T> => {
  const start = performance.now();

  try {
    const result = await fn();
    const end = performance.now();
    const duration = end - start;

    const isDev = typeof import.meta !== 'undefined' && import.meta?.env?.DEV;
    if (isDev) {
      console.log(`⏱️ ${name} took ${duration.toFixed(2)}ms`);
    }

    return result;
  } catch (error) {
    const end = performance.now();
    const duration = end - start;

    console.error(`❌ ${name} failed after ${duration.toFixed(2)}ms:`, error);
    throw error;
  }
};

// Throttle function for performance
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;

  return function (this: any, ...args: Parameters<T>) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

// Memory usage tracker
export const trackMemoryUsage = (componentName: string) => {
  const isDev = typeof import.meta !== 'undefined' && import.meta?.env?.DEV;
  if (isDev && 'memory' in performance) {
    const memory = (performance as any).memory;
    const usage = {
      used: Math.round(memory.usedJSHeapSize / 1048576), // MB
      total: Math.round(memory.totalJSHeapSize / 1048576), // MB
      limit: Math.round(memory.jsHeapSizeLimit / 1048576), // MB
    };

    console.log(`🧠 Memory usage in ${componentName}:`, usage);

    if (usage.used > usage.limit * 0.9) {
      console.warn(`⚠️ High memory usage detected in ${componentName}!`);
    }
  }
};

// Component lazy loading utility
export const lazyLoad = <T extends React.ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>,
  fallback?: React.ComponentType
) => {
  const LazyComponent = React.lazy(importFunc);

  return React.memo((props: React.ComponentProps<T>) =>
    React.createElement(
      React.Suspense,
      {
        fallback: fallback
          ? React.createElement(fallback)
          : React.createElement('div', null, 'Loading...'),
      },
      React.createElement(LazyComponent, props)
    )
  );
};

// Bundle size analyzer (development only)
export const analyzeBundleSize = async () => {
  const isDev = typeof import.meta !== 'undefined' && import.meta?.env?.DEV;
  if (isDev) {
    try {
      // Dynamic import to avoid build issues
      console.log('Bundle analyzer would be available in development mode');
    } catch {
      console.log('Bundle analyzer not available - install webpack-bundle-analyzer');
    }
  }
};

// Default export
export default {
  measurePerformance,
  throttle,
  trackMemoryUsage,
  lazyLoad,
  analyzeBundleSize,
};
import { useMemo } from "react";
import { TestResult } from "@types/testResults";

interface DashboardMetrics {
  totalRequests: number;
  averageResponseTime: string;
  errorRate: number;
  healthStatus: string;
  healthStatusType: "healthy" | "warning" | "critical" | "unknown";
  requestsTrend?: { value: number; direction: "up" | "down"; isGood: boolean };
  responseTimeTrend?: {
    value: number;
    direction: "up" | "down";
    isGood: boolean;
  };
  errorRateTrend?: { value: number; direction: "up" | "down"; isGood: boolean };
}

export const useDashboardMetrics = (
  results: Record<string, TestResult>
): DashboardMetrics => {
  return useMemo(() => {
    const getMetricValue = (
      metric: any,
      property: string,
      defaultValue: number = 0
    ): number => {
      if (
        !metric ||
        typeof metric !== "object" ||
        metric[property] === undefined ||
        metric[property] === null
      ) {
        return defaultValue;
      }
      return typeof metric[property] === "number"
        ? metric[property]
        : defaultValue;
    };

    // Calculate metrics
    const totalRequests = Object.values(results).reduce((total, result) => {
      const count = getMetricValue(result.metrics?.http_reqs, "count");
      return total + count;
    }, 0);

    const avgResponseTime =
      Object.values(results).reduce((total, result) => {
        const avg = getMetricValue(result.metrics?.http_req_duration, "avg");
        return total + avg;
      }, 0) / Math.max(Object.keys(results).length, 1);

    const errorRate =
      (Object.values(results).reduce((total, result) => {
        const rate = getMetricValue(result.metrics?.http_req_failed, "value");
        return total + rate;
      }, 0) /
        Math.max(Object.keys(results).length, 1)) *
      100;

    // Determine health status
    let healthStatus: string;
    let healthStatusType: DashboardMetrics["healthStatusType"];

    if (errorRate === 0 && avgResponseTime < 500) {
      healthStatus = "Excellent";
      healthStatusType = "healthy";
    } else if (errorRate < 1 && avgResponseTime < 1000) {
      healthStatus = "Good";
      healthStatusType = "healthy";
    } else if (errorRate < 5 && avgResponseTime < 2000) {
      healthStatus = "Fair";
      healthStatusType = "warning";
    } else {
      healthStatus = "Poor";
      healthStatusType = "critical";
    }

    // Mock trend data (in real app, compare with previous results)
    const requestsTrend = { value: 12, direction: "up" as const, isGood: true };
    const responseTimeTrend = {
      value: 5,
      direction: "down" as const,
      isGood: true,
    };
    const errorRateTrend = {
      value: 2,
      direction: "down" as const,
      isGood: true,
    };

    return {
      totalRequests,
      averageResponseTime: avgResponseTime.toFixed(2),
      errorRate: parseFloat(errorRate.toFixed(2)),
      healthStatus,
      healthStatusType,
      requestsTrend,
      responseTimeTrend,
      errorRateTrend,
    };
  }, [results]);
};

import { createSelector } from "@reduxjs/toolkit";
import { RootState } from "../index";
import { Formatters } from "@utils/formatters";
import { APP_CONSTANTS } from "@utils/constants";

// Base selectors
const selectTestResultsState = (state: RootState) => state.testResults;

export const selectDirectories = createSelector(
  [selectTestResultsState],
  (testResults) => testResults.directories
);

export const selectSelectedDirectory = createSelector(
  [selectTestResultsState],
  (testResults) => testResults.selectedDirectory
);

export const selectFiles = createSelector(
  [selectTestResultsState],
  (testResults) => testResults.files
);

export const selectTestResult = createSelector(
  [selectTestResultsState],
  (testResults) => testResults.testResult
);

export const selectLoading = createSelector(
  [selectTestResultsState],
  (testResults) => testResults.loading
);

export const selectError = createSelector(
  [selectTestResultsState],
  (testResults) => testResults.error
);

// Computed selectors with memoization
export const selectFormattedDirectories = createSelector(
  [selectDirectories],
  (directories) =>
    directories.map((dir) => ({
      ...dir,
      displayName: Formatters.testName(dir.name),
      formattedDate: Formatters.date(dir.date),
      relativeDate: Formatters.relativeTime(dir.date),
      type: dir.name.includes("sequential")
        ? APP_CONSTANTS.TEST_TYPES.SEQUENTIAL
        : dir.name.includes("parallel")
        ? APP_CONSTANTS.TEST_TYPES.PARALLEL
        : APP_CONSTANTS.TEST_TYPES.INDIVIDUAL,
    }))
);

export const selectTestMetrics = createSelector(
  [selectTestResult],
  (testResult) => {
    if (!testResult?.metrics) {
      return {
        totalRequests: 0,
        avgResponseTime: 0,
        errorRate: 0,
        throughput: 0,
        p95ResponseTime: 0,
        successRate: 100,
      };
    }

    const metrics = testResult.metrics;
    const totalRequests = metrics.http_reqs?.count || 0;
    const avgResponseTime = metrics.http_req_duration?.avg || 0;
    const errorRate = (metrics.http_req_failed?.value || 0) * 100;
    const throughput = metrics.http_reqs?.rate || 0;
    const p95ResponseTime = metrics.http_req_duration?.["p(95)"] || 0;

    return {
      totalRequests,
      avgResponseTime,
      errorRate,
      throughput,
      p95ResponseTime,
      successRate: 100 - errorRate,
      formattedTotalRequests: Formatters.number(totalRequests),
      formattedAvgResponseTime: Formatters.duration(avgResponseTime),
      formattedErrorRate: Formatters.percentage(errorRate),
      formattedThroughput: `${Formatters.number(throughput, {
        maximumFractionDigits: 2,
      })} req/s`,
    };
  }
);

export const selectPerformanceStatus = createSelector(
  [selectTestMetrics],
  (metrics) => {
    const { avgResponseTime, errorRate, throughput } = metrics;
    const thresholds = APP_CONSTANTS.PERFORMANCE_THRESHOLDS;

    // Response time status
    const responseTimeStatus =
      avgResponseTime <= thresholds.RESPONSE_TIME.EXCELLENT
        ? "excellent"
        : avgResponseTime <= thresholds.RESPONSE_TIME.GOOD
        ? "good"
        : avgResponseTime <= thresholds.RESPONSE_TIME.ACCEPTABLE
        ? "acceptable"
        : "poor";

    // Error rate status
    const errorRateStatus =
      errorRate <= thresholds.ERROR_RATE.EXCELLENT
        ? "excellent"
        : errorRate <= thresholds.ERROR_RATE.GOOD
        ? "good"
        : errorRate <= thresholds.ERROR_RATE.ACCEPTABLE
        ? "acceptable"
        : "poor";

    // Throughput status
    const throughputStatus =
      throughput >= thresholds.THROUGHPUT.HIGH
        ? "high"
        : throughput >= thresholds.THROUGHPUT.MEDIUM
        ? "medium"
        : "low";

    // Overall status
    const overallStatus = [responseTimeStatus, errorRateStatus].includes("poor")
      ? "critical"
      : [responseTimeStatus, errorRateStatus].includes("acceptable")
      ? "warning"
      : "healthy";

    return {
      responseTime: responseTimeStatus,
      errorRate: errorRateStatus,
      throughput: throughputStatus,
      overall: overallStatus,
    };
  }
);

export const selectChartData = createSelector(
  [selectTestResult],
  (testResult) => {
    if (!testResult?.metrics?.http_req_duration) {
      return [];
    }

    const duration = testResult.metrics.http_req_duration;
    return [
      { name: "Min", value: duration.min || 0 },
      { name: "Avg", value: duration.avg || 0 },
      { name: "Median", value: duration.med || 0 },
      { name: "P90", value: duration["p(90)"] || 0 },
      { name: "P95", value: duration["p(95)"] || 0 },
      { name: "Max", value: duration.max || 0 },
    ];
  }
);

import React, { memo, useMemo } from 'react';
import { MetricCard } from '@components/molecules/MetricCard/MetricCard';
import { StatusCard } from '@components/molecules/StatusCard/StatusCard';
import { TestRunSelector } from '@components/organisms/TestRunSelector/TestRunSelector';
import { PerformanceCharts } from '@components/organisms/PerformanceCharts/PerformanceCharts';
import { TestResultsTable } from '@components/organisms/TestResultsTable/TestResultsTable';
import { useDashboardMetrics } from '@hooks/useDashboardMetrics';
import { TestResult, TestDirectory } from '@types/testResults';

interface DashboardContentProps {
    results: Record<string, TestResult>;
    directories: TestDirectory[];
    loading: boolean;
}

const DashboardContent: React.FC<DashboardContentProps> = memo(({
    results,
    directories,
    loading,
}) => {
    // Custom hook for metrics calculation (memoized)
    const metrics = useDashboardMetrics(results);

    // Memoized chart data
    const chartData = useMemo(() => ({
        responseTime: Object.entries(results).map(([name, result]) => ({
            name: name.replace(/-/g, ' '),
            avg: result.metrics?.http_req_duration?.avg || 0,
            p95: result.metrics?.http_req_duration?.['p(95)'] || 0,
        })),
        errorDistribution: [
            { name: 'Success', value: Math.round(metrics.totalRequests * (1 - metrics.errorRate / 100)) },
            { name: 'Errors', value: Math.round(metrics.totalRequests * (metrics.errorRate / 100)) },
        ],
    }), [results, metrics]);

    if (Object.keys(results).length === 0 && !loading) {
        return <EmptyState />;
    }

    return (
        <div className="space-y-8">
            {/* Test Run Selection */}
            <TestRunSelector loading={loading} />

            {/* Key Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatusCard
                    title="System Health"
                    value={metrics.healthStatus}
                    status={metrics.healthStatusType}
                    description={`${metrics.totalRequests.toLocaleString()} total requests processed`}
                />

                <MetricCard
                    title="Total Requests"
                    value={metrics.totalRequests.toLocaleString()}
                    type="number"
                    trend={metrics.requestsTrend}
                />

                <MetricCard
                    title="Avg Response Time"
                    value={`${metrics.averageResponseTime}ms`}
                    type="time"
                    subtitle="Across all endpoints"
                    trend={metrics.responseTimeTrend}
                />

                <MetricCard
                    title="Error Rate"
                    value={`${metrics.errorRate}%`}
                    type={metrics.errorRate > 5 ? 'error' : 'success'}
                    trend={metrics.errorRateTrend}
                />
            </div>

            {/* Performance Charts */}
            <PerformanceCharts
                data={chartData}
                loading={loading}
            />

            {/* Detailed Results Table */}
            <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold mb-4">Test Results Summary</h2>
                <TestResultsTable
                    results={results}
                    sortBy="avgResponse"
                    sortDirection="desc"
                />
            </div>
        </div>
    );
});

// Empty state component
const EmptyState: React.FC = memo(() => (
    <div className="text-center py-12">
        <div className="text-6xl mb-4">📊</div>
        <h3 className="text-xl font-medium text-gray-900 mb-2">
            No Performance Data Available
        </h3>
        <p className="text-gray-600 mb-6">
            Start by running some tests to see performance metrics and insights here.
        </p>
        <a
            href="/test-runner"
            className="btn btn--primary"
        >
            <span className="mr-2">🚀</span>
            Run Your First Test
        </a>
    </div>
));

DashboardContent.displayName = 'DashboardContent';
EmptyState.displayName = 'EmptyState';

export default DashboardContent;
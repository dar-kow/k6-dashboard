import React, { memo, useCallback, useMemo } from 'react';
import { MainLayout } from '@components/templates';
import { MetricCard, TestSelector, SearchBox } from '@components/molecules';
import { TestResultsTable, ChartContainer } from '@components/organisms';
import { Button, Icon } from '@components/atoms';
import { useTestResults } from '@hooks/useTestResults';
import { useRepositories } from '@hooks/useRepositories';
import './Dashboard.scss';

// Lazy load chart components
const AreaChart = React.lazy(() => import('@components/charts/AreaChart'));
const BarChart = React.lazy(() => import('@components/charts/BarChart'));
const PieChart = React.lazy(() => import('@components/charts/PieChart'));

export const Dashboard = memo(() => {
    const { selectedRepository } = useRepositories();
    const {
        directories,
        selectedDirectory,
        testResult,
        loading,
        error,
        actions: { selectDirectory },
    } = useTestResults(selectedRepository?.id);

    // Memoized calculations
    const metrics = useMemo(() => {
        if (!testResult?.metrics) {
            return {
                totalRequests: 0,
                avgResponseTime: 0,
                errorRate: 0,
                throughput: 0,
            };
        }

        return {
            totalRequests: testResult.metrics.http_reqs?.count || 0,
            avgResponseTime: testResult.metrics.http_req_duration?.avg || 0,
            errorRate: (testResult.metrics.http_req_failed?.value || 0) * 100,
            throughput: testResult.metrics.http_reqs?.rate || 0,
        };
    }, [testResult]);

    const chartData = useMemo(() => {
        if (!testResult?.metrics) return [];

        return [
            { name: 'Min', value: testResult.metrics.http_req_duration?.min || 0 },
            { name: 'Avg', value: testResult.metrics.http_req_duration?.avg || 0 },
            { name: 'Med', value: testResult.metrics.http_req_duration?.med || 0 },
            { name: 'Max', value: testResult.metrics.http_req_duration?.max || 0 },
            { name: 'P95', value: testResult.metrics.http_req_duration?.['p(95)'] || 0 },
        ];
    }, [testResult]);

    const handleSearch = useCallback((query: string) => {
        // Implement search logic
        console.log('Search:', query);
    }, []);

    const handleExportPDF = useCallback(() => {
        // Implement PDF export
        console.log('Export PDF');
    }, []);

    const testOptions = useMemo(() => {
        return directories.map(dir => ({
            id: dir.name,
            name: dir.name.split('/').pop() || dir.name,
            description: `Test run from ${dir.date.toLocaleDateString()}`,
            type: dir.name.includes('sequential') ? 'sequential' as const :
                dir.name.includes('parallel') ? 'parallel' as const :
                    'individual' as const,
            lastRun: dir.date,
            status: 'success' as const,
        }));
    }, [directories]);

    const headerActions = (
        <div className="dashboard__header-actions">
            <SearchBox
                placeholder="Search test results..."
                onSearch={handleSearch}
                className="dashboard__search"
            />
            <Button
                variant="primary"
                leftIcon={<Icon name="download" size="sm" />}
                onClick={handleExportPDF}
            >
                Export Report
            </Button>
        </div>
    );

    return (
        <MainLayout
            title="Performance Dashboard"
            actions={headerActions}
        >
            <div className="dashboard">
                {/* Test Selector */}
                <div className="dashboard__selector">
                    <TestSelector
                        options={testOptions}
                        selectedId={selectedDirectory}
                        onSelect={selectDirectory}
                        loading={loading.directories}
                    />
                </div>

                {/* Metrics Overview */}
                <div className="dashboard__metrics">
                    <MetricCard
                        title="Total Requests"
                        value={metrics.totalRequests.toLocaleString()}
                        icon="activity"
                        loading={loading.result}
                    />
                    <MetricCard
                        title="Avg Response Time"
                        value={`${metrics.avgResponseTime.toFixed(2)} ms`}
                        icon="clock"
                        variant={metrics.avgResponseTime > 1000 ? 'warning' : 'success'}
                        loading={loading.result}
                    />
                    <MetricCard
                        title="Error Rate"
                        value={`${metrics.errorRate.toFixed(2)}%`}
                        icon="alert-circle"
                        variant={metrics.errorRate > 5 ? 'error' : 'success'}
                        loading={loading.result}
                    />
                    <MetricCard
                        title="Throughput"
                        value={`${metrics.throughput.toFixed(2)} req/s`}
                        icon="trending-up"
                        loading={loading.result}
                    />
                </div>

                {/* Charts */}
                <div className="dashboard__charts">
                    <ChartContainer
                        title="Response Time Distribution"
                        subtitle="Performance metrics across percentiles"
                        loading={loading.result}
                        error={error}
                    >
                        <BarChart data={chartData} />
                    </ChartContainer>

                    <ChartContainer
                        title="Request Volume Over Time"
                        loading={loading.result}
                        error={error}
                    >
                        <AreaChart data={chartData} />
                    </ChartContainer>

                    <ChartContainer
                        title="Success vs Error Rate"
                        loading={loading.result}
                        error={error}
                    >
                        <PieChart
                            data={[
                                { name: 'Success', value: 100 - metrics.errorRate },
                                { name: 'Errors', value: metrics.errorRate },
                            ]}
                        />
                    </ChartContainer>
                </div>

                {/* Results Table */}
                <div className="dashboard__table">
                    <TestResultsTable
                        data={[]} // Convert testResult to table format
                        loading={loading.result}
                        onRowClick={(row) => console.log('Row clicked:', row)}
                        onExport={(rows) => console.log('Export rows:', rows)}
                    />
                </div>
            </div>
        </MainLayout>
    );
});

Dashboard.displayName = 'Dashboard';
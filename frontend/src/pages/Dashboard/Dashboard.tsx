import React, { memo, useCallback, useMemo, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MainLayout } from '@components/templates';
import { MetricCard, SearchBox } from '@components/molecules';
import { TestResultsTable, ChartContainer } from '@components/organisms';
import { Button, Icon } from '@components/atoms';
import { fetchTestResult, fetchResultFiles, fetchResultDirectories } from '../../api/results';
import { TestDirectory, TestResult } from '../../types/testResults';

// Lazy load chart components
const AreaChart = React.lazy(() => import('@components/charts/AreaChart'));
const BarChart = React.lazy(() => import('@components/charts/BarChart'));
const PieChart = React.lazy(() => import('@components/charts/PieChart'));
const MultiBarChart = React.lazy(() => import('../../components/charts/MultiBarChart'));
const MultiLineChart = React.lazy(() => import('../../components/charts/MultiLineChart'));

// Custom status card for overall health
interface StatusCardProps {
    title: string;
    value: string;
    status: 'healthy' | 'warning' | 'critical' | 'unknown';
}

const StatusCard: React.FC<StatusCardProps> = memo(({ title, value, status }) => {
    const getStatusColor = () => {
        switch (status) {
            case 'healthy':
                return 'bg-green-100 text-green-600';
            case 'warning':
                return 'bg-yellow-100 text-yellow-600';
            case 'critical':
                return 'bg-red-100 text-red-600';
            case 'unknown':
            default:
                return 'bg-gray-100 text-gray-600';
        }
    };

    const getStatusIcon = () => {
        switch (status) {
            case 'healthy':
                return <Icon name="check-circle" size="md" />;
            case 'warning':
                return <Icon name="alert-triangle" size="md" />;
            case 'critical':
                return <Icon name="x-circle" size="md" />;
            case 'unknown':
            default:
                return <Icon name="info" size="md" />;
        }
    };

    return (
        <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
                <div className={`p-3 rounded-full ${getStatusColor()} mr-4`}>
                    {getStatusIcon()}
                </div>
                <div>
                    <p className="text-sm font-medium text-gray-500">{title}</p>
                    <p className="text-2xl font-semibold">{value}</p>
                </div>
            </div>
        </div>
    );
});

// Test Run Selector
interface TestRunSelectorProps {
    directories: TestDirectory[];
    selectedDirectory: string | null;
    onDirectoryChange: (directory: string | null) => void;
    loading?: boolean;
}

const TestRunSelector: React.FC<TestRunSelectorProps> = memo(({
    directories,
    selectedDirectory,
    onDirectoryChange,
    loading = false
}) => {
    const formatDate = (date: Date) => {
        return new Date(date).toLocaleString('pl-PL', {
            timeZone: 'Europe/Warsaw',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    };

    const getTestTypeIcon = (directoryName: string) => {
        if (directoryName.includes('sequential_')) return '📋';
        if (directoryName.includes('parallel_')) return '⚡';
        if (directoryName.endsWith('.json')) return '🎯';
        return '📊';
    };

    const getTestTypeLabel = (directoryName: string) => {
        if (directoryName.includes('sequential_')) return 'Sequential';
        if (directoryName.includes('parallel_')) return 'Parallel';
        if (directoryName.endsWith('.json')) return 'Individual Test';
        return 'Test Run';
    };

    const getDisplayName = (directory: TestDirectory) => {
        if (directory.repositoryName && directory.testName) {
            const formattedTestName = directory.testName
                .replace(/-/g, ' ')
                .replace(/_/g, ' ')
                .split(' ')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ');
            return `${directory.repositoryName} / ${formattedTestName}`;
        }

        if (directory.repositoryName) {
            return `${directory.repositoryName} - ${getTestTypeLabel(directory.name)}`;
        }

        if (directory.name.endsWith('.json')) {
            const fileName = directory.name.split('/').pop() || '';
            const testName = fileName.replace('.json', '').replace(/^\d{8}_\d{6}_/, '');
            return testName
                .replace(/-/g, ' ')
                .replace(/_/g, ' ')
                .split(' ')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ');
        }

        return directory.name;
    };

    return (
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
            <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-medium text-gray-700">
                    📊 Select Test Run for Analysis
                </label>
                <div className="flex items-center space-x-2">
                    <button
                        onClick={() => onDirectoryChange(directories.length > 0 ? directories[0].name : null)}
                        className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                        disabled={loading}
                        title="Switch to latest test run"
                    >
                        🔄 Latest
                    </button>
                    <span className="text-xs text-gray-400">
                        {directories.length} runs available
                    </span>
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-3">
                    <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-2"></div>
                    <span className="text-sm text-gray-600">Loading test runs...</span>
                </div>
            ) : directories.length === 0 ? (
                <div className="text-center py-4">
                    <p className="text-gray-500 text-sm">No test runs available</p>
                    <p className="text-gray-400 text-xs mt-1">Run some tests to see results here</p>
                </div>
            ) : (
                <select
                    className="block w-full p-3 border border-gray-300 rounded-md bg-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={selectedDirectory || ''}
                    onChange={(e) => onDirectoryChange(e.target.value || null)}
                >
                    <option value="" disabled>
                        Choose a test run to analyze...
                    </option>
                    {directories.map((dir, index) => (
                        <option key={dir.name} value={dir.name}>
                            {getTestTypeIcon(dir.name)} {getDisplayName(dir)} - {formatDate(dir.date)}
                            {index === 0 && ' 🆕 (Latest)'}
                        </option>
                    ))}
                </select>
            )}

            {selectedDirectory && (
                <div className="mt-3 p-3 bg-gray-50 rounded-md">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-900">
                                {getTestTypeIcon(selectedDirectory)} Currently Analyzing
                            </p>
                            <p className="text-xs text-gray-600 mt-1">
                                {(() => {
                                    const dir = directories.find(d => d.name === selectedDirectory);
                                    if (dir) {
                                        return getDisplayName(dir);
                                    }
                                    return selectedDirectory;
                                })()}
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="text-xs text-gray-500">
                                {getTestTypeLabel(selectedDirectory)}
                            </p>
                            {directories.find(d => d.name === selectedDirectory) && (
                                <p className="text-xs text-gray-600">
                                    {formatDate(directories.find(d => d.name === selectedDirectory)!.date)}
                                </p>
                            )}
                        </div>
                    </div>

                    {(() => {
                        const selectedDir = directories.find(d => d.name === selectedDirectory);
                        return selectedDir?.repositoryName && (
                            <div className="mt-2 pt-2 border-t border-gray-200">
                                <p className="text-xs text-gray-500">
                                    📦 Repository: <span className="font-medium text-gray-700">{selectedDir.repositoryName}</span>
                                </p>
                            </div>
                        );
                    })()}

                    <div className="mt-2 pt-2 border-t border-gray-200">
                        <p className="text-xs text-gray-500">
                            💡 Tip: Switch between different test runs to compare performance over time
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
});

// Export PDF Button
interface ExportPDFButtonProps {
    latestResults: Record<string, TestResult>;
    totalRequests: number;
    averageResponseTime: string;
    errorRate: string;
    lastRunTime: string;
    overallHealthStatus: 'healthy' | 'warning' | 'critical' | 'unknown';
    directoryName?: string;
    disabled?: boolean;
}

const ExportPDFButton: React.FC<ExportPDFButtonProps> = memo(({
    disabled = false
}) => {
    const [isGenerating, setIsGenerating] = useState(false);

    const handleExport = async () => {
        setIsGenerating(true);
        try {
            // Simulate PDF generation
            await new Promise(resolve => setTimeout(resolve, 2000));
            console.log('PDF exported successfully');
        } catch (error) {
            console.error('Error generating PDF:', error);
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <Button
            onClick={handleExport}
            disabled={disabled || isGenerating}
            loading={isGenerating}
            variant="error"
            leftIcon={<Icon name="download" size="sm" />}
        >
            {isGenerating ? 'Generating PDF...' : 'Export Detailed PDF Report'}
        </Button>
    );
});

export const Dashboard = memo(() => {
    // State management
    const [directories, setDirectories] = useState<TestDirectory[]>([]);
    const [selectedTestRun, setSelectedTestRun] = useState<string | null>(null);
    const [latestResults, setLatestResults] = useState<Record<string, TestResult>>({});
    const [loading, setLoading] = useState<boolean>(true);
    const [latestResultsLoading, setLatestResultsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    // Load directories
    useEffect(() => {
        const loadDirectories = async () => {
            try {
                setLoading(true);
                const dirs = await fetchResultDirectories();
                setDirectories(dirs);
                if (dirs.length > 0 && !selectedTestRun) {
                    setSelectedTestRun(dirs[0].name);
                }
                setError(null);
            } catch (err) {
                console.error('Error fetching directories:', err);
                setError(`Failed to fetch test results: ${err instanceof Error ? err.message : 'Unknown error'}`);
            } finally {
                setLoading(false);
            }
        };

        loadDirectories();
    }, [selectedTestRun]);

    // Load test results
    useEffect(() => {
        const loadLatestResults = async () => {
            if (!directories.length || !selectedTestRun) return;

            setLatestResultsLoading(true);

            try {
                const selectedDir = directories.find(d => d.name === selectedTestRun);
                if (!selectedDir) return;

                const results: Record<string, TestResult> = {};

                if (selectedDir.name.endsWith('.json')) {
                    try {
                        const pathParts = selectedDir.name.split('/');
                        const fileName = pathParts[pathParts.length - 1];
                        const testKey = fileName.replace('.json', '').replace(/^\d{8}_\d{6}_/, '');
                        const result = await fetchTestResult(selectedDir.name, fileName);
                        results[testKey] = result;
                    } catch (err) {
                        console.error('Error loading virtual directory result:', err);
                    }
                } else {
                    try {
                        const files = await fetchResultFiles(selectedDir.name);
                        if (files.length === 0) {
                            setLatestResults({});
                            return;
                        }

                        const filesToProcess = files.slice(0, Math.min(10, files.length));
                        for (const file of filesToProcess) {
                            try {
                                if (!file || !file.name) continue;
                                const result = await fetchTestResult(selectedDir.name, file.name);
                                const testKey = file.name.replace('.json', '');
                                results[testKey] = result;
                            } catch (err) {
                                console.error(`Error loading result for ${file?.name || 'unknown'}:`, err);
                            }
                        }
                    } catch (err) {
                        console.error('Error loading files from directory:', err);
                    }
                }

                setLatestResults(results);
            } catch (err) {
                console.error('Critical error loading latest results:', err);
            } finally {
                setLatestResultsLoading(false);
            }
        };

        loadLatestResults();
    }, [directories, selectedTestRun]);

    // Utility functions
    const getMetricValue = useCallback((metric: any, property: string, defaultValue: number = 0): number => {
        if (!metric || typeof metric !== 'object' || metric[property] === undefined || metric[property] === null) {
            return defaultValue;
        }
        return typeof metric[property] === 'number' ? metric[property] : defaultValue;
    }, []);

    const getOverallHealthStatus = useCallback((): "healthy" | "warning" | "critical" | "unknown" => {
        if (Object.keys(latestResults).length === 0) return 'unknown';

        let passCount = 0;
        let totalCount = 0;

        Object.values(latestResults).forEach(result => {
            if (result.metrics && result.metrics.http_req_failed && result.metrics.http_req_failed.value < 0.1) {
                passCount++;
            }
            totalCount++;
        });

        if (passCount === totalCount) return 'healthy';
        if (passCount === 0) return 'critical';
        return 'warning';
    }, [latestResults]);

    const getTotalRequests = useCallback(() => {
        try {
            return Object.values(latestResults).reduce((total, result) => {
                const count = result.metrics?.http_reqs?.count || 0;
                return total + (typeof count === 'number' ? count : 0);
            }, 0);
        } catch (error) {
            console.error('Error calculating total requests:', error);
            return 0;
        }
    }, [latestResults]);

    const getAverageResponseTime = useCallback(() => {
        try {
            const values = Object.values(latestResults);
            if (values.length === 0) return '0';

            const total = values.reduce((total, result) => {
                const avg = result.metrics?.http_req_duration?.avg || 0;
                return total + (typeof avg === 'number' ? avg : 0);
            }, 0);

            return (total / values.length).toFixed(2);
        } catch (error) {
            console.error('Error calculating average response time:', error);
            return '0';
        }
    }, [latestResults]);

    const getErrorRate = useCallback(() => {
        try {
            const values = Object.values(latestResults);
            if (values.length === 0) return '0';

            const total = values.reduce((total, result) => {
                const rate = result.metrics?.http_req_failed?.value || 0;
                return total + (typeof rate === 'number' ? rate : 0);
            }, 0);

            return ((total / values.length) * 100).toFixed(2);
        } catch (error) {
            console.error('Error calculating error rate:', error);
            return '0';
        }
    }, [latestResults]);

    const getLastRunTime = useCallback(() => {
        if (!selectedTestRun || directories.length === 0) return 'No test run selected';

        const selectedDir = directories.find(d => d.name === selectedTestRun);
        if (!selectedDir) return 'Selected run not found';

        try {
            let date: Date;
            if (selectedDir.date instanceof Date) {
                date = selectedDir.date;
            } else if (typeof selectedDir.date === 'string') {
                date = new Date(selectedDir.date);
            } else if (typeof selectedDir.date === 'number') {
                date = new Date(selectedDir.date);
            } else {
                return 'Invalid date format';
            }

            if (isNaN(date.getTime())) {
                return 'Invalid date';
            }

            return date.toLocaleString("pl-PL", {
                timeZone: "Europe/Warsaw",
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });
        } catch (error) {
            console.error('Error formatting date:', error);
            return 'Date format error';
        }
    }, [selectedTestRun, directories]);

    // Chart data preparation
    const responseTimeComparisonData = useMemo(() => {
        return Object.entries(latestResults).map(([testName, result]) => ({
            name: testName.replace(/-/g, ' ').replace(/^\w/, c => c.toUpperCase()).substring(0, 15),
            avg: getMetricValue(result.metrics?.http_req_duration, 'avg'),
            p95: getMetricValue(result.metrics?.http_req_duration, 'p(95)'),
            min: getMetricValue(result.metrics?.http_req_duration, 'min'),
            max: getMetricValue(result.metrics?.http_req_duration, 'max'),
        }));
    }, [latestResults, getMetricValue]);

    const requestVolumeData = useMemo(() => {
        return Object.entries(latestResults).map(([testName, result]) => ({
            name: testName.replace(/-/g, ' ').replace(/^\w/, c => c.toUpperCase()).substring(0, 15),
            requests: getMetricValue(result.metrics?.http_reqs, 'count'),
            rate: getMetricValue(result.metrics?.http_reqs, 'rate'),
        }));
    }, [latestResults, getMetricValue]);

    const successErrorData = useMemo(() => {
        const totalRequests = Object.values(latestResults).reduce((sum, result) =>
            sum + getMetricValue(result.metrics?.http_reqs, 'count'), 0);

        const totalErrors = Object.values(latestResults).reduce((sum, result) =>
            sum + (getMetricValue(result.metrics?.http_reqs, 'count') * getMetricValue(result.metrics?.http_req_failed, 'value')), 0);

        const successRequests = totalRequests - totalErrors;

        return [
            { name: 'Successful', value: Math.round(successRequests) },
            { name: 'Failed', value: Math.round(totalErrors) },
        ];
    }, [latestResults, getMetricValue]);

    const performanceMetricsData = useMemo(() => {
        return Object.entries(latestResults).map(([testName, result]) => ({
            name: testName.replace(/-/g, ' ').substring(0, 8) + '...',
            'Avg Response': getMetricValue(result.metrics?.http_req_duration, 'avg'),
            'P95 Response': getMetricValue(result.metrics?.http_req_duration, 'p(95)'),
            'Error Rate %': getMetricValue(result.metrics?.http_req_failed, 'value') * 100,
        }));
    }, [latestResults, getMetricValue]);

    const throughputData = useMemo(() => {
        return Object.entries(latestResults).map(([testName, result]) => ({
            name: testName.replace(/-/g, ' ').substring(0, 8) + '...',
            'Requests/sec': getMetricValue(result.metrics?.http_reqs, 'rate'),
        }));
    }, [latestResults, getMetricValue]);

    // Event handlers
    const handleSearch = useCallback((query: string) => {
        console.log('Search:', query);
    }, []);

    const handleExportPDF = useCallback(() => {
        console.log('Export PDF');
    }, []);

    const handleCompareWith = useCallback((compareRunId: string) => {
        alert(`Comparison feature coming soon!\n\nWould compare:\n• Current: ${selectedTestRun}\n• With: ${compareRunId}`);
    }, [selectedTestRun]);

    // Memoized metrics
    const metrics = useMemo(() => {
        return {
            totalRequests: getTotalRequests(),
            avgResponseTime: parseFloat(getAverageResponseTime()),
            errorRate: parseFloat(getErrorRate()),
            throughput: Object.values(latestResults).reduce((sum, result) =>
                sum + getMetricValue(result.metrics?.http_reqs, 'rate'), 0)
        };
    }, [getTotalRequests, getAverageResponseTime, getErrorRate, latestResults, getMetricValue]);

    // Header actions
    const headerActions = (
        <div className="dashboard__header-actions">
            <SearchBox
                placeholder="Search test results..."
                onSearch={handleSearch}
                className="dashboard__search w-72"
            />
            <ExportPDFButton
                latestResults={latestResults}
                totalRequests={getTotalRequests()}
                averageResponseTime={getAverageResponseTime()}
                errorRate={getErrorRate()}
                lastRunTime={getLastRunTime()}
                overallHealthStatus={getOverallHealthStatus()}
                directoryName={selectedTestRun || ''}
                disabled={latestResultsLoading}
            />
        </div>
    );

    return (
        <MainLayout
            title="Performance Dashboard"
            actions={headerActions}
        >
            <div className="dashboard">
                {loading ? (
                    <div className="text-center py-10">
                        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                        <p className="mt-3 text-gray-600">Loading test results...</p>
                    </div>
                ) : error ? (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                        <p>{error}</p>
                        <p className="mt-2">Please make sure the backend server is running and accessible.</p>
                    </div>
                ) : (
                    <>
                        {/* Test Selector */}
                        <div className="dashboard__selector">
                            <TestRunSelector
                                directories={directories}
                                selectedDirectory={selectedTestRun}
                                onDirectoryChange={setSelectedTestRun}
                                loading={latestResultsLoading}
                            />
                        </div>

                        {/* Metrics Overview */}
                        <div className="dashboard__metrics">
                            <StatusCard
                                title="Overall Health"
                                value={getOverallHealthStatus() === 'healthy' ? 'Healthy' :
                                    getOverallHealthStatus() === 'warning' ? 'Warning' :
                                        getOverallHealthStatus() === 'critical' ? 'Critical' : 'Unknown'}
                                status={getOverallHealthStatus()}
                            />
                            <MetricCard
                                title="Total Requests"
                                value={metrics.totalRequests.toLocaleString()}
                                icon="activity"
                                loading={latestResultsLoading}
                            />
                            <MetricCard
                                title="Avg Response Time"
                                value={`${metrics.avgResponseTime.toFixed(2)} ms`}
                                icon="clock"
                                variant={metrics.avgResponseTime > 1000 ? 'warning' : 'success'}
                                loading={latestResultsLoading}
                            />
                            <MetricCard
                                title="Error Rate"
                                value={`${metrics.errorRate.toFixed(2)}%`}
                                icon="alert-circle"
                                variant={metrics.errorRate > 5 ? 'error' : 'success'}
                                loading={latestResultsLoading}
                            />
                        </div>

                        {/* Selected Test Run Analysis */}
                        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                            <div className="flex justify-between items-start mb-4">
                                <h2 className="text-xl font-semibold">Selected Test Run Analysis</h2>
                                {selectedTestRun && (
                                    <div className="flex items-center space-x-2">
                                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${selectedTestRun.includes('sequential_') ? 'bg-blue-100 text-blue-800' :
                                            selectedTestRun.includes('parallel_') ? 'bg-green-100 text-green-800' :
                                                selectedTestRun.endsWith('.json') ? 'bg-purple-100 text-purple-800' :
                                                    'bg-gray-100 text-gray-800'
                                            }`}>
                                            {selectedTestRun.includes('sequential_') ? '📋 Sequential' :
                                                selectedTestRun.includes('parallel_') ? '⚡ Parallel' :
                                                    selectedTestRun.endsWith('.json') ? '🎯 Individual Test' :
                                                        '📊 Test Run'}
                                        </span>
                                        {selectedTestRun === directories[0]?.name && (
                                            <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                                                🆕 Latest
                                            </span>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <p className="text-gray-600">
                                        <span className="font-medium">Run Time:</span> {getLastRunTime()}
                                    </p>
                                    <p className="text-gray-600 mt-2">
                                        <span className="font-medium">Tests Analyzed:</span> {Object.keys(latestResults).length}
                                    </p>
                                </div>
                                <div className="flex justify-between items-center">
                                    <Link
                                        to={`/results/${selectedTestRun || ''}`}
                                        className="text-blue-600 hover:text-blue-800 font-medium"
                                    >
                                        View Detailed Results →
                                    </Link>
                                    <div className="text-sm text-gray-500 bg-gray-50 px-3 py-2 rounded-md">
                                        <span className="font-medium text-green-600">✓ Clean PDF Report</span>
                                        <br />
                                        Professional 2-page analysis
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Charts */}
                        {latestResultsLoading ? (
                            <div className="text-center py-10">
                                <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                                <p className="mt-2 text-gray-600">Loading detailed analytics...</p>
                            </div>
                        ) : Object.keys(latestResults).length === 0 ? (
                            <div className="bg-white rounded-lg shadow-md p-6">
                                <div className="text-center py-8">
                                    <div className="text-4xl mb-4">📊</div>
                                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Test Data Available</h3>
                                    <p className="text-gray-600 mb-4">
                                        {selectedTestRun ?
                                            'The selected test run contains no analyzable data.' :
                                            'Please select a test run to analyze performance data.'
                                        }
                                    </p>
                                    <Link
                                        to="/test-runner"
                                        className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                                    >
                                        <span className="mr-2">🚀</span>
                                        Run New Tests
                                    </Link>
                                </div>
                            </div>
                        ) : (
                            <div className="dashboard__charts">
                                <ChartContainer
                                    title="Response Time Distribution"
                                    subtitle="Performance metrics across percentiles"
                                    loading={latestResultsLoading}
                                    error={error}
                                >
                                    <BarChart
                                        data={responseTimeComparisonData}
                                        xKey="name"
                                        yKey="avg"
                                        yLabel="Response Time (ms)"
                                    />
                                </ChartContainer>

                                <ChartContainer
                                    title="Request Volume Over Time"
                                    loading={latestResultsLoading}
                                    error={error}
                                >
                                    <AreaChart
                                        data={throughputData}
                                        xKey="name"
                                        yKey="Requests/sec"
                                        yLabel="Requests per Second"
                                    />
                                </ChartContainer>

                                <ChartContainer
                                    title="Success vs Error Rate"
                                    loading={latestResultsLoading}
                                    error={error}
                                >
                                    <PieChart
                                        data={successErrorData}
                                        nameKey="name"
                                        valueKey="value"
                                        colors={['#10b981', '#ef4444']}
                                    />
                                </ChartContainer>
                            </div>
                        )}

                        {/* Performance Summary Table */}
                        {Object.keys(latestResults).length > 0 && (
                            <div className="dashboard__table">
                                <TestResultsTable
                                    data={Object.entries(latestResults).map(([testName, result]) => ({
                                        id: testName,
                                        name: testName.replace(/-/g, ' ').replace(/^\w/, c => c.toUpperCase()),
                                        requests: getMetricValue(result.metrics?.http_reqs, 'count'),
                                        avgResponse: getMetricValue(result.metrics?.http_req_duration, 'avg'),
                                        p95Response: getMetricValue(result.metrics?.http_req_duration, 'p(95)'),
                                        errorRate: getMetricValue(result.metrics?.http_req_failed, 'value') * 100,
                                        throughput: getMetricValue(result.metrics?.http_reqs, 'rate'),
                                        status: getMetricValue(result.metrics?.http_req_failed, 'value') < 0.01 ? 'success' as const :
                                            getMetricValue(result.metrics?.http_req_failed, 'value') < 0.05 ? 'warning' as const : 'error' as const,
                                        lastRun: new Date()
                                    }))}
                                    loading={latestResultsLoading}
                                    onRowClick={(row) => console.log('Row clicked:', row)}
                                    onExport={(rows) => console.log('Export rows:', rows)}
                                />
                            </div>
                        )}

                        {/* Action Button */}
                        <div className="bg-white rounded-lg shadow-md p-6">
                            <Link
                                to="/test-runner"
                                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                            >
                                <Icon name="play" size="sm" className="mr-2" />
                                Run New Tests
                            </Link>
                        </div>
                    </>
                )}
            </div>
        </MainLayout>
    );
});

Dashboard.displayName = 'Dashboard';
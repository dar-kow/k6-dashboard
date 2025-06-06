import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchTestResult, fetchResultFiles } from '../api/results';
import { TestResult } from '../types/testResults';
import SummaryCard from '../components/SummaryCard';
import StatusCard from '../components/StatusCard';
import BarChart from '../components/charts/BarChart';
import MultiBarChart from '../components/charts/MultiBarChart';
import PieChart from '../components/charts/PieChart';
import AreaChart from '../components/charts/AreaChart';
import MultiLineChart from '../components/charts/MultiLineChart';
import TestRunSelector from '../components/TestRunSelector';
import TestRunComparison from '../components/TestRunComparison';
import EnhancedTestSelector from '../components/EnhancedTestSelector';
import PerformanceSummary from '../components/PerformanceSummary';
import { useTestResults } from '../context/TestResultContext';
import ExportPDFButton from '../context/ExportPDFButton';
import { useNavigate } from 'react-router-dom';

const Dashboard: React.FC = () => {
    const { directories, loading, error } = useTestResults();
    const navigate = useNavigate();
    const [selectedTestRun, setSelectedTestRun] = useState<string | null>(null);
    const [latestResults, setLatestResults] = useState<Record<string, TestResult>>({});
    const [latestResultsLoading, setLatestResultsLoading] = useState<boolean>(true);

    // Helper function to get formatted test name like in TestResults
    const getFormattedTestName = (selectedDirectory: any) => {
        if (selectedDirectory?.testName) {
            return selectedDirectory.testName
                .replace(/-/g, ' ')
                .replace(/_/g, ' ')
                .split(' ')
                .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ');
        }

        if (selectedDirectory?.name?.endsWith('.json')) {
            const fileName = selectedDirectory.name.split('/').pop() || '';
            const extractedTestName = fileName.replace('.json', '').replace(/^\d{8}_\d{6}_/, '');
            return extractedTestName
                .replace(/-/g, ' ')
                .replace(/_/g, ' ')
                .split(' ')
                .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ');
        }

        // For sequential/parallel tests, return just the type (no UUID)
        if (selectedDirectory?.name?.includes('sequential_')) {
            return 'Sequential Test Run';
        }

        if (selectedDirectory?.name?.includes('parallel_')) {
            return 'Parallel Test Run';
        }

        // Fallback for directory names
        let cleanName = selectedDirectory?.name || '';
        cleanName = cleanName.replace(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\//, '');
        cleanName = cleanName.replace(/^\d{8}_\d{6}_/, '');
        cleanName = cleanName.replace(/^(sequential_|parallel_)/, '');

        return cleanName.replace(/_/g, ' ').split(' ')
            .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    };

    // Auto-select latest directory when directories load
    useEffect(() => {
        if (directories.length > 0 && !selectedTestRun) {
            setSelectedTestRun(directories[0].name);
        }
    }, [directories]);

    useEffect(() => {
        const loadLatestResults = async () => {
            if (!directories.length || !selectedTestRun) return;

            setLatestResultsLoading(true);

            try {
                const selectedDir = directories.find(d => d.name === selectedTestRun);
                if (!selectedDir) return;

                console.log('🔍 Loading results for directory:', selectedDir.name);

                const results: Record<string, TestResult> = {};

                if (selectedDir.name.endsWith('.json')) {
                    console.log('📄 Virtual directory detected - loading single file result');

                    try {
                        const pathParts = selectedDir.name.split('/');
                        const fileName = pathParts[pathParts.length - 1];
                        const testKey = fileName.replace('.json', '').replace(/^\d{8}_\d{6}_/, '');

                        console.log('📄 Loading virtual file:', {
                            selectedDirName: selectedDir.name,
                            fileName,
                            testKey
                        });

                        const result = await fetchTestResult(selectedDir.name, fileName);
                        results[testKey] = result;

                        console.log('✅ Loaded virtual directory result:', testKey);
                    } catch (err) {
                        console.error('❌ Error loading virtual directory result:', err);
                    }
                } else {
                    console.log('📁 Real directory detected - loading files list');

                    try {
                        const files = await fetchResultFiles(selectedDir.name);
                        console.log('📁 Files found:', files);

                        if (files.length === 0) {
                            console.log('📭 No files found in directory');
                            setLatestResults({});
                            return;
                        }

                        const filesToProcess = files.slice(0, Math.min(10, files.length));
                        console.log(`📊 Processing ${filesToProcess.length} files out of ${files.length} total`);

                        for (const file of filesToProcess) {
                            try {
                                if (!file || !file.name) {
                                    console.warn('⚠️ Invalid file object:', file);
                                    continue;
                                }

                                console.log('📄 Processing file:', file.name);

                                const result = await fetchTestResult(selectedDir.name, file.name);
                                const testKey = file.name.replace('.json', '');
                                results[testKey] = result;

                                console.log('✅ Loaded result for:', testKey);
                            } catch (err) {
                                console.error(`❌ Error loading result for ${file?.name || 'unknown'}:`, err);
                            }
                        }
                    } catch (err) {
                        console.error('❌ Error loading files from directory:', err);
                    }
                }

                console.log('🎯 Final results loaded:', {
                    testCount: Object.keys(results).length,
                    testNames: Object.keys(results)
                });

                setLatestResults(results);

            } catch (err) {
                console.error('💥 Critical error loading latest results:', err);
            } finally {
                setLatestResultsLoading(false);
            }
        };

        loadLatestResults();
    }, [directories, selectedTestRun]);

    // Safe accessor function for metric values with proper type checking and defaults
    const getMetricValue = (metric: any, property: string, defaultValue: number = 0): number => {
        if (!metric || typeof metric !== 'object' || metric[property] === undefined || metric[property] === null) {
            return defaultValue;
        }
        return typeof metric[property] === 'number' ? metric[property] : defaultValue;
    };

    const getOverallHealthStatus = (): "healthy" | "warning" | "critical" | "unknown" => {
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
    };

    const getTotalRequests = () => {
        try {
            return Object.values(latestResults).reduce((total, result) => {
                const count = result.metrics?.http_reqs?.count || 0;
                return total + (typeof count === 'number' ? count : 0);
            }, 0);
        } catch (error) {
            console.error('❌ Error calculating total requests:', error);
            return 0;
        }
    };

    const getAverageResponseTime = () => {
        try {
            const values = Object.values(latestResults);
            if (values.length === 0) return '0';

            const total = values.reduce((total, result) => {
                const avg = result.metrics?.http_req_duration?.avg || 0;
                return total + (typeof avg === 'number' ? avg : 0);
            }, 0);

            return (total / values.length).toFixed(2);
        } catch (error) {
            console.error('❌ Error calculating average response time:', error);
            return '0';
        }
    };

    const getErrorRate = () => {
        try {
            const values = Object.values(latestResults);
            if (values.length === 0) return '0';

            const total = values.reduce((total, result) => {
                const rate = result.metrics?.http_req_failed?.value || 0;
                return total + (typeof rate === 'number' ? rate : 0);
            }, 0);

            return ((total / values.length) * 100).toFixed(2);
        } catch (error) {
            console.error('❌ Error calculating error rate:', error);
            return '0';
        }
    };

    const getLastRunTime = () => {
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
                console.warn('⚠️ Invalid date format:', selectedDir.date);
                return 'Invalid date format';
            }

            if (isNaN(date.getTime())) {
                console.warn('⚠️ Invalid date value:', selectedDir.date);
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
            console.error('❌ Error formatting date:', error);
            return 'Date format error';
        }
    };

    // Prepare data for Response Time Comparison Chart
    const getResponseTimeComparisonData = () => {
        return Object.entries(latestResults).map(([testName, result]) => ({
            name: testName.replace(/-/g, ' ').replace(/^\w/, c => c.toUpperCase()),
            avg: getMetricValue(result.metrics?.http_req_duration, 'avg'),
            p95: getMetricValue(result.metrics?.http_req_duration, 'p(95)'),
            min: getMetricValue(result.metrics?.http_req_duration, 'min'),
            max: getMetricValue(result.metrics?.http_req_duration, 'max'),
        }));
    };

    // Prepare data for Request Volume Chart
    const getRequestVolumeData = () => {
        return Object.entries(latestResults).map(([testName, result]) => ({
            name: testName.replace(/-/g, ' ').replace(/^\w/, c => c.toUpperCase()),
            requests: getMetricValue(result.metrics?.http_reqs, 'count'),
            rate: getMetricValue(result.metrics?.http_reqs, 'rate'),
        }));
    };

    // Prepare data for Success/Error Rate Pie Chart
    const getSuccessErrorData = () => {
        const totalRequests = Object.values(latestResults).reduce((sum, result) =>
            sum + getMetricValue(result.metrics?.http_reqs, 'count'), 0);

        const totalErrors = Object.values(latestResults).reduce((sum, result) =>
            sum + (getMetricValue(result.metrics?.http_reqs, 'count') * getMetricValue(result.metrics?.http_req_failed, 'value')), 0);

        const successRequests = totalRequests - totalErrors;

        return [
            { name: 'Successful', value: Math.round(successRequests) },
            { name: 'Failed', value: Math.round(totalErrors) },
        ];
    };

    // Prepare data for Performance Metrics Multi-Line Chart
    const getPerformanceMetricsData = () => {
        return Object.entries(latestResults).map(([testName, result]) => ({
            name: testName.replace(/-/g, ' ').substring(0, 8) + '...',
            'Avg Response': getMetricValue(result.metrics?.http_req_duration, 'avg'),
            'P95 Response': getMetricValue(result.metrics?.http_req_duration, 'p(95)'),
            'Error Rate %': getMetricValue(result.metrics?.http_req_failed, 'value') * 100,
        }));
    };

    // Prepare data for Throughput Area Chart
    const getThroughputData = () => {
        return Object.entries(latestResults).map(([testName, result]) => ({
            name: testName.replace(/-/g, ' ').substring(0, 8) + '...',
            'Requests/sec': getMetricValue(result.metrics?.http_reqs, 'rate'),
        }));
    };

    const handleCompareWith = (compareRunId: string) => {
        alert(`Comparison feature coming soon!\n\nWould compare:\n• Current: ${selectedTestRun}\n• With: ${compareRunId}`);
    };

    const getCheckResultsData = () => {
        const checkData: { name: string, passes: number, fails: number }[] = [];

        Object.entries(latestResults).forEach(([testName, result]) => {
            if (result.root_group?.checks) {
                Object.values(result.root_group.checks).forEach((check: any) => {
                    const existingCheck = checkData.find(c => c.name === check.name);
                    if (existingCheck) {
                        existingCheck.passes += check.passes || 0;
                        existingCheck.fails += check.fails || 0;
                    } else {
                        checkData.push({
                            name: check.name.length > 20 ? check.name.substring(0, 20) + '...' : check.name,
                            passes: check.passes || 0,
                            fails: check.fails || 0,
                        });
                    }
                });
            }
        });

        return checkData.slice(0, 6);
    };

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-3xl font-bold">Dashboard</h1>

                {/* Professional PDF Export Button */}
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
                    {/* Enhanced Test Run Selector */}
                    <EnhancedTestSelector
                        directories={directories}
                        selectedDirectory={selectedTestRun}
                        onDirectoryChange={setSelectedTestRun}
                        loading={latestResultsLoading}
                    />

                    {/* Test Run Comparison */}
                    <TestRunComparison
                        directories={directories}
                        currentRun={selectedTestRun}
                        onCompareWith={handleCompareWith}
                    />

                    {/* Status Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        <StatusCard
                            title="Overall Health"
                            value={getOverallHealthStatus() === 'healthy' ? 'Healthy' :
                                getOverallHealthStatus() === 'warning' ? 'Warning' :
                                    getOverallHealthStatus() === 'critical' ? 'Critical' : 'Unknown'}
                            status={getOverallHealthStatus()}
                        />
                        <SummaryCard
                            title="Total Requests"
                            value={getTotalRequests().toLocaleString()}
                            icon="request"
                        />
                        <SummaryCard
                            title="Avg Response Time"
                            value={`${getAverageResponseTime()} ms`}
                            icon="clock"
                        />
                        <SummaryCard
                            title="Error Rate"
                            value={`${getErrorRate()}%`}
                            icon="warning"
                        />
                    </div>

                    {/* Last Run Information */}
                    <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                        <div className="flex justify-between items-start mb-4">
                            <h2 className="text-xl font-semibold">Selected Test Run Analysis</h2>

                            {/* Enhanced Test Type Badge */}
                            {selectedTestRun && (
                                <div className="flex items-center space-x-2">
                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${selectedTestRun.includes('sequential_') ? 'bg-blue-100 text-blue-800' :
                                        selectedTestRun.includes('parallel_') ? 'bg-green-100 text-green-800' :
                                            selectedTestRun.endsWith('.json') ? 'bg-purple-100 text-purple-800' :
                                                'bg-gray-100 text-gray-800'
                                        }`}>
                                        {selectedTestRun.includes('sequential_') ? '📋 Sequential Tests' :
                                            selectedTestRun.includes('parallel_') ? '⚡ Parallel Tests' :
                                                selectedTestRun.endsWith('.json') ? '🎯 Single Test' :
                                                    '📊 Test Suite'}
                                    </span>

                                    {selectedTestRun === directories[0]?.name && (
                                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                                            🆕 Latest
                                        </span>
                                    )}

                                    <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                                        {Object.keys(latestResults).length} test(s)
                                    </span>
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <p className="text-gray-600">
                                    <span className="font-medium">Run Time:</span> {getLastRunTime()}
                                </p>

                                <p className="text-gray-600 mt-2">
                                    <span className="font-medium">Repository:</span> <span className="text-green-600 font-medium">{
                                        selectedTestRun ? (() => {
                                            const selectedDir = directories.find(d => d.name === selectedTestRun);

                                            if (selectedDir?.repositoryName) {
                                                return selectedDir.repositoryName;
                                            }

                                            if (selectedDir?.name.includes('/')) {
                                                const parts = selectedDir.name.split('/');
                                                const repoId = parts[0];
                                                return `Repository ${repoId.substring(0, 8)}...`;
                                            }

                                            return 'MAF K6 Test';
                                        })() : 'None selected'
                                    }</span>
                                </p>

                                <p className="text-gray-600 mt-2">
                                    <span className="font-medium">Test:</span> <span className="text-blue-600">{
                                        selectedTestRun ? (() => {
                                            const selectedDir = directories.find(d => d.name === selectedTestRun);
                                            return getFormattedTestName(selectedDir);
                                        })() : 'None selected'
                                    }</span>
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

                                {/* PDF Quality Info */}
                                <div className="text-sm text-gray-500 bg-gray-50 px-3 py-2 rounded-md">
                                    <span className="font-medium text-green-600">✓ Clean PDF Report</span>
                                    <br />
                                    Professional 2-page analysis
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Detailed Charts Section */}
                    <div className="space-y-8">
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
                            <>
                                {/* Response Time Analysis */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    <div className="bg-white rounded-lg shadow-md p-6">
                                        <div className="h-80">
                                            <MultiBarChart
                                                title="Response Time Comparison"
                                                data={getResponseTimeComparisonData()}
                                                xKey="name"
                                                series={[
                                                    { key: 'avg', name: 'Average', color: '#3b82f6' },
                                                    { key: 'p95', name: '95th Percentile', color: '#ef4444' },
                                                ]}
                                                yLabel="Response Time (ms)"
                                            />
                                        </div>
                                    </div>

                                    <div className="bg-white rounded-lg shadow-md p-6">
                                        <div className="h-80">
                                            <BarChart
                                                title="Request Volume by Test"
                                                data={getRequestVolumeData()}
                                                xKey="name"
                                                yKey="requests"
                                                yLabel="Total Requests"
                                                color="#10b981"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Performance Trends */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    <div className="bg-white rounded-lg shadow-md p-6">
                                        <div className="h-80">
                                            <MultiLineChart
                                                title="Performance Metrics Trend"
                                                data={getPerformanceMetricsData()}
                                                xKey="name"
                                                series={[
                                                    { key: 'Avg Response', name: 'Avg Response (ms)', color: '#3b82f6' },
                                                    { key: 'P95 Response', name: 'P95 Response (ms)', color: '#ef4444' },
                                                ]}
                                                yLabel="Response Time (ms)"
                                            />
                                        </div>
                                    </div>

                                    <div className="bg-white rounded-lg shadow-md p-6">
                                        <div className="h-80">
                                            <PieChart
                                                title="Success vs Error Rate"
                                                data={getSuccessErrorData()}
                                                nameKey="name"
                                                valueKey="value"
                                                colors={['#10b981', '#ef4444']}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Throughput and Checks */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    <div className="bg-white rounded-lg shadow-md p-6">
                                        <div className="h-80">
                                            <AreaChart
                                                title="Request Throughput"
                                                data={getThroughputData()}
                                                xKey="name"
                                                yKey="Requests/sec"
                                                yLabel="Requests per Second"
                                                color="#8b5cf6"
                                            />
                                        </div>
                                    </div>

                                    <div className="bg-white rounded-lg shadow-md p-6">
                                        <div className="h-80">
                                            <MultiBarChart
                                                title="Test Checks Results"
                                                data={getCheckResultsData()}
                                                xKey="name"
                                                series={[
                                                    { key: 'passes', name: 'Passed', color: '#10b981' },
                                                    { key: 'fails', name: 'Failed', color: '#ef4444' },
                                                ]}
                                                yLabel="Check Count"
                                                stacked={true}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Performance Summary Table */}
                                <div className="bg-white rounded-lg shadow-md p-6">
                                    <h2 className="text-xl font-semibold mb-4">Performance Summary</h2>
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Test Name</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Requests</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Response</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">P95 Response</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Error Rate</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Throughput</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {Object.entries(latestResults).map(([testName, result]) => {
                                                    const errorRate = getMetricValue(result.metrics?.http_req_failed, 'value') * 100;
                                                    return (
                                                        <tr key={testName}>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                                {testName.replace(/-/g, ' ').replace(/^\w/, c => c.toUpperCase())}
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                                {getMetricValue(result.metrics?.http_reqs, 'count').toLocaleString()}
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                                {getMetricValue(result.metrics?.http_req_duration, 'avg').toFixed(2)} ms
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                                {getMetricValue(result.metrics?.http_req_duration, 'p(95)').toFixed(2)} ms
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${errorRate < 1 ? 'bg-green-100 text-green-800' :
                                                                    errorRate < 5 ? 'bg-yellow-100 text-yellow-800' :
                                                                        'bg-red-100 text-red-800'
                                                                    }`}>
                                                                    {errorRate.toFixed(2)}%
                                                                </span>
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                                {getMetricValue(result.metrics?.http_reqs, 'rate').toFixed(2)} req/s
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </>
                        )}

                        {/* Enhanced Performance Summary */}
                        <PerformanceSummary
                            results={latestResults}
                            onRunNewTests={() => navigate('/test-runner')}
                        />
                    </div>
                </>
            )}
        </div>
    );
};

export default Dashboard;
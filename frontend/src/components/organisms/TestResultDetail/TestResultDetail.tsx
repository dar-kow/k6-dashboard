import React, { memo, useCallback } from 'react';
import type { TestResult } from '../../../types/testResults';
import { MetricCard } from '../../molecules/MetricCard/MetricCard';

interface TestResultDetailProps {
    testResult: TestResult;
    testName: string;
    repositoryName?: string;
    directoryName?: string;
    selectedDirectory?: any;
}

export const TestResultDetail: React.FC<TestResultDetailProps> = memo(({
    testResult,
    testName,
    repositoryName,
    directoryName,
    selectedDirectory,
}) => {
    const formatTestName = useCallback((name: string) => {
        return name
            .replace(/-/g, ' ')
            .replace(/_/g, ' ')
            .split(' ')
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }, []);

    const getFormattedTestName = useCallback(() => {
        console.log(`🔍 TestResultDetail getFormattedTestName:`, {
            selectedDirectory: selectedDirectory ? {
                name: selectedDirectory.name,
                testName: selectedDirectory.testName,
                isVirtual: selectedDirectory.name?.endsWith('.json')
            } : null,
            fallbackTestName: testName,
            directoryName
        });

        if (selectedDirectory?.testName) {
            const formattedTestName: string = selectedDirectory.testName
                .replace(/-/g, ' ')
                .replace(/_/g, ' ')
                .split(' ')
                .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ');
            console.log(`✅ Using selectedDirectory.testName: ${formattedTestName}`);
            return formattedTestName;
        }

        if (selectedDirectory?.name?.endsWith('.json')) {
            const fileName = selectedDirectory.name.split('/').pop() || '';
            const extractedTestName = fileName.replace('.json', '').replace(/^\d{8}_\d{6}_/, '');

            const formatted: string = extractedTestName
                .replace(/-/g, ' ')
                .replace(/_/g, ' ')
                .split(' ')
                .map((word: string): string => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ');
            console.log(`⚠️ Using fallback from fileName: ${formatted}`);
            return formatted;
        }

        const fallbackFormatted = formatTestName(testName);
        console.log(`❌ Using final fallback testName: ${fallbackFormatted}`);
        return fallbackFormatted;
    }, [selectedDirectory, testName, formatTestName]);

    const getMetricValue = useCallback((metric: any, property: string, defaultValue: number = 0): number => {
        if (!metric || typeof metric !== 'object' || metric[property] === undefined || metric[property] === null) {
            return defaultValue;
        }
        return typeof metric[property] === 'number' ? metric[property] : defaultValue;
    }, []);

    const safeFormat = useCallback((value: any, decimals: number = 2): string => {
        if (value === undefined || value === null || typeof value !== 'number' || isNaN(value)) {
            return '0.00';
        }
        return value.toFixed(decimals);
    }, []);

    const hasMetrics = testResult && testResult.metrics && typeof testResult.metrics === 'object';

    const totalRequests = hasMetrics ? getMetricValue(testResult.metrics.http_reqs, 'count') : 0;
    const requestRate = hasMetrics ? getMetricValue(testResult.metrics.http_reqs, 'rate') : 0;
    const avgResponseTime = hasMetrics ? getMetricValue(testResult.metrics.http_req_duration, 'avg') : 0;
    const errorRate = hasMetrics ? getMetricValue(testResult.metrics.http_req_failed, 'value', 0) * 100 : 0;

    return (
        <div className="bg-white rounded-lg shadow-md p-6">
            {!hasMetrics ? (
                <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
                    <p className="font-bold">Warning: Invalid Test Data</p>
                    <p>This test result doesn't contain the expected metrics. It may be a dummy file or corrupted data.</p>
                </div>
            ) : (
                <>
                    {/* Repository info if available */}
                    {repositoryName && (
                        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <div className="flex items-center space-x-2">
                                <span className="text-blue-600">📦</span>
                                <span className="text-sm font-medium text-blue-900">
                                    Repository: <span className="font-bold">{repositoryName}</span>
                                </span>
                                <span className="text-sm text-blue-700">
                                    Test: <span className="font-semibold">{getFormattedTestName()}</span>
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                        <MetricCard
                            title="Total Requests"
                            value={totalRequests.toLocaleString()}
                            type="number"
                        />
                        <MetricCard
                            title="Request Rate"
                            value={`${safeFormat(requestRate)}/s`}
                            type="rate"
                        />
                        <MetricCard
                            title="Avg Response Time"
                            value={`${safeFormat(avgResponseTime)} ms`}
                            type="time"
                        />
                        <MetricCard
                            title="Error Rate"
                            value={`${safeFormat(errorRate)}%`}
                            type={errorRate > 5 ? 'error' : 'success'}
                        />
                    </div>

                    {/* Detail Tables */}
                    <div className="mb-6">
                        <h3 className="text-lg font-semibold mb-3">HTTP Request Details</h3>
                        <div className="bg-gray-50 p-4 rounded-lg overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead>
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Metric</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Min</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Med</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Max</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">p(90)</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">p(95)</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    <tr>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Total Duration</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{safeFormat(getMetricValue(testResult.metrics.http_req_duration, 'min'))} ms</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{safeFormat(getMetricValue(testResult.metrics.http_req_duration, 'avg'))} ms</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{safeFormat(getMetricValue(testResult.metrics.http_req_duration, 'med'))} ms</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{safeFormat(getMetricValue(testResult.metrics.http_req_duration, 'max'))} ms</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{safeFormat(getMetricValue(testResult.metrics.http_req_duration, 'p90'))} ms</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{safeFormat(getMetricValue(testResult.metrics.http_req_duration, 'p95'))} ms</td>
                                    </tr>
                                    <tr>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Waiting</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{safeFormat(getMetricValue(testResult.metrics.http_req_waiting, 'min'))} ms</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{safeFormat(getMetricValue(testResult.metrics.http_req_waiting, 'avg'))} ms</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{safeFormat(getMetricValue(testResult.metrics.http_req_waiting, 'med'))} ms</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{safeFormat(getMetricValue(testResult.metrics.http_req_waiting, 'max'))} ms</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{safeFormat(getMetricValue(testResult.metrics.http_req_waiting, 'p90'))} ms</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{safeFormat(getMetricValue(testResult.metrics.http_req_waiting, 'p95'))} ms</td>
                                    </tr>
                                    <tr>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Connecting</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{safeFormat(getMetricValue(testResult.metrics.http_req_connecting, 'min'))} ms</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{safeFormat(getMetricValue(testResult.metrics.http_req_connecting, 'avg'))} ms</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{safeFormat(getMetricValue(testResult.metrics.http_req_connecting, 'med'))} ms</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{safeFormat(getMetricValue(testResult.metrics.http_req_connecting, 'max'))} ms</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{safeFormat(getMetricValue(testResult.metrics.http_req_connecting, 'p90'))} ms</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{safeFormat(getMetricValue(testResult.metrics.http_req_connecting, 'p95'))} ms</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Checks */}
                    {testResult.root_group && testResult.root_group.checks && Object.keys(testResult.root_group.checks).length > 0 ? (
                        <div>
                            <h3 className="text-lg font-semibold mb-3">Checks</h3>
                            <div className="bg-gray-50 p-4 rounded-lg overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead>
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Passes</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fails</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pass Rate</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {Object.values(testResult.root_group.checks).map((check: any) => {
                                            const passes = getMetricValue(check, 'passes');
                                            const fails = getMetricValue(check, 'fails');
                                            const total = passes + fails;
                                            const passRate = total > 0 ? (passes / total) * 100 : 0;

                                            return (
                                                <tr key={check.id}>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{check.name}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{passes}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{fails}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{safeFormat(passRate)}%</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${passRate === 100 ? 'bg-green-100 text-green-800' : passRate >= 90 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                                                            }`}>
                                                            {passRate === 100 ? 'PASS' : passRate >= 90 ? 'WARNING' : 'FAIL'}
                                                        </span>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <p className="text-gray-500">No checks data available for this test.</p>
                        </div>
                    )}
                </>
            )}
        </div>
    );
});

TestResultDetail.displayName = 'TestResultDetail';

export default TestResultDetail;
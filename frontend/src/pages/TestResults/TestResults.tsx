import React, { memo, useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { MainLayout } from '@components/templates';
import { Button, Icon } from '@components/atoms';
import { SearchBox } from '@components/molecules';
import { TestResultsTable, ChartContainer } from '@components/organisms';
import { fetchResultFiles, fetchTestResult, fetchResultDirectories } from '../../api/results';
import { TestFile, TestResult, TestDirectory } from '../../types/testResults';

// Test Result Detail Component (atomic design version)
interface TestResultDetailProps {
    testResult: TestResult;
    testName: string;
    repositoryName?: string;
    directoryName?: string;
    selectedDirectory?: any;
}

const TestResultDetail: React.FC<TestResultDetailProps> = memo(({
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
        if (selectedDirectory?.testName) {
            const formattedTestName = selectedDirectory.testName
                .replace(/-/g, ' ')
                .replace(/_/g, ' ')
                .split(' ')
                .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ');
            return formattedTestName;
        }

        if (selectedDirectory?.name?.endsWith('.json')) {
            const fileName = selectedDirectory.name.split('/').pop() || '';
            const extractedTestName = fileName.replace('.json', '').replace(/^\d{8}_\d{6}_/, '');
            const formatted = extractedTestName
                .replace(/-/g, ' ')
                .replace(/_/g, ' ')
                .split(' ')
                .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ');
            return formatted;
        }

        return formatTestName(testName);
    }, [selectedDirectory, testName, formatTestName]);

    const getDisplayTitle = useCallback(() => {
        const formattedTestName = getFormattedTestName();

        if (repositoryName) {
            return `${repositoryName} / ${formattedTestName} Test Results`;
        }

        if (directoryName && directoryName.includes('/')) {
            const parts = directoryName.split('/');
            if (parts.length >= 2) {
                const potentialUuid = parts[0];
                if (potentialUuid.length === 36 && potentialUuid.includes('-')) {
                    return `${formattedTestName} Test Results`;
                }
            }
        }

        return `${formattedTestName} Test Results`;
    }, [getFormattedTestName, repositoryName, directoryName]);

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

    if (!hasMetrics) {
        return (
            <div className="bg-white rounded-lg shadow-md p-6">
                <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
                    <p className="font-bold">Warning: Invalid Test Data</p>
                    <p>This test result doesn't contain the expected metrics. It may be a dummy file or corrupted data.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow-md p-6">
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
                <div className="bg-white border rounded-lg shadow-sm p-4">
                    <div className="flex items-center">
                        <div className="p-2 rounded-md bg-blue-100 text-blue-600 mr-3">
                            <Icon name="activity" size="md" />
                        </div>
                        <div>
                            <p className="text-xs font-medium text-gray-500">Total Requests</p>
                            <p className="text-lg font-semibold">{totalRequests.toLocaleString()}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white border rounded-lg shadow-sm p-4">
                    <div className="flex items-center">
                        <div className="p-2 rounded-md bg-purple-100 text-purple-600 mr-3">
                            <Icon name="trending-up" size="md" />
                        </div>
                        <div>
                            <p className="text-xs font-medium text-gray-500">Request Rate</p>
                            <p className="text-lg font-semibold">{safeFormat(requestRate)}/s</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white border rounded-lg shadow-sm p-4">
                    <div className="flex items-center">
                        <div className="p-2 rounded-md bg-orange-100 text-orange-600 mr-3">
                            <Icon name="clock" size="md" />
                        </div>
                        <div>
                            <p className="text-xs font-medium text-gray-500">Avg Response Time</p>
                            <p className="text-lg font-semibold">{safeFormat(avgResponseTime)} ms</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white border rounded-lg shadow-sm p-4">
                    <div className="flex items-center">
                        <div className={`p-2 rounded-md mr-3 ${errorRate > 5 ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                            <Icon name={errorRate > 5 ? "alert-circle" : "check-circle"} size="md" />
                        </div>
                        <div>
                            <p className="text-xs font-medium text-gray-500">Error Rate</p>
                            <p className="text-lg font-semibold">{safeFormat(errorRate)}%</p>
                        </div>
                    </div>
                </div>
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
        </div>
    );
});

// Test Result Tabs Component
interface TestResultTabsProps {
    files: TestFile[];
    selectedFile: string | null;
    onFileChange: (file: string) => void;
}

const TestResultTabs: React.FC<TestResultTabsProps> = memo(({
    files,
    selectedFile,
    onFileChange,
}) => {
    const formatFileName = (fileName: string) => {
        return fileName
            .replace('.json', '')
            .replace(/-/g, ' ')
            .split(' ')
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    };

    return (
        <div className="bg-white rounded-lg shadow-md mb-6">
            <div className="border-b border-gray-200">
                <nav className="flex space-x-2 overflow-x-auto p-2">
                    {files.length === 0 ? (
                        <div className="px-4 py-2 text-gray-500">No test files available</div>
                    ) : (
                        files.map((file) => (
                            <button
                                key={file.name}
                                className={`px-4 py-2 font-medium rounded-md transition-colors ${selectedFile === file.name
                                    ? 'bg-blue-600 text-white'
                                    : 'text-gray-700 hover:bg-gray-100'
                                    }`}
                                onClick={() => onFileChange(file.name)}
                            >
                                {formatFileName(file.name)}
                            </button>
                        ))
                    )}
                </nav>
            </div>
        </div>
    );
});

// Directory Selector Component
interface DirectorySelectorProps {
    directories: TestDirectory[];
    selectedDirectory: string | null;
    onDirectoryChange: (directory: string) => void;
}

const DirectorySelector: React.FC<DirectorySelectorProps> = memo(({
    directories,
    selectedDirectory,
    onDirectoryChange,
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
        if (directoryName.endsWith('.json')) return '🎯';
        if (directoryName.includes('sequential_')) return '📋';
        if (directoryName.includes('parallel_')) return '⚡';
        return '📊';
    };

    const getTestTypeLabel = (directoryName: string) => {
        if (directoryName.endsWith('.json')) return 'Individual Test';
        if (directoryName.includes('sequential_')) return 'Sequential Run';
        if (directoryName.includes('parallel_')) return 'Parallel Run';
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

    const groupedDirectories = directories.reduce((groups, dir) => {
        const type = dir.name.endsWith('.json') ? 'individual' : 'sequential';
        if (!groups[type]) groups[type] = [];
        groups[type].push(dir);
        return groups;
    }, {} as Record<string, TestDirectory[]>);

    return (
        <div className="bg-white rounded-lg shadow-md p-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
                📊 Select Test Run for Analysis
            </label>
            {directories.length === 0 ? (
                <p className="text-gray-500">No test runs available</p>
            ) : (
                <select
                    className="block w-full p-3 border border-gray-300 rounded-md bg-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={selectedDirectory || ''}
                    onChange={(e) => onDirectoryChange(e.target.value)}
                >
                    <option value="" disabled>
                        Choose a test run to analyze...
                    </option>

                    {/* Sequential/Parallel Runs */}
                    {groupedDirectories.sequential && groupedDirectories.sequential.length > 0 && (
                        <optgroup label="🔄 Sequential & Parallel Test Runs">
                            {groupedDirectories.sequential.map((dir, index) => (
                                <option key={dir.name} value={dir.name}>
                                    {getTestTypeIcon(dir.name)} {getDisplayName(dir)} - {formatDate(dir.date)}
                                    {index === 0 && ' 🆕 (Latest)'}
                                </option>
                            ))}
                        </optgroup>
                    )}

                    {/* Individual Tests */}
                    {groupedDirectories.individual && groupedDirectories.individual.length > 0 && (
                        <optgroup label="🎯 Individual Test Results">
                            {groupedDirectories.individual.map((dir, index) => (
                                <option key={dir.name} value={dir.name}>
                                    {getTestTypeIcon(dir.name)} {getDisplayName(dir)} - {formatDate(dir.date)}
                                    {index === 0 && directories[0].name === dir.name && ' 🆕 (Latest)'}
                                </option>
                            ))}
                        </optgroup>
                    )}
                </select>
            )}

            {/* Selected Run Info */}
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
                                    } else {
                                        const fallback = { name: selectedDirectory } as TestDirectory;
                                        return getDisplayName(fallback);
                                    }
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
                            {selectedDirectory.endsWith('.json')
                                ? '💡 Individual test - detailed single endpoint analysis'
                                : '💡 Multi-test run - compare performance across endpoints'
                            }
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
});

export const TestResults = memo(() => {
    const { directory } = useParams<{ directory?: string }>();
    const navigate = useNavigate();
    const location = useLocation();

    // State management  
    const [directories, setDirectories] = useState<TestDirectory[]>([]);
    const [selectedDirectory, setSelectedDirectory] = useState<string | null>(null);
    const [files, setFiles] = useState<TestFile[]>([]);
    const [selectedFile, setSelectedFile] = useState<string | null>(null);
    const [selectedTestResult, setSelectedTestResult] = useState<TestResult | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [isGeneratingPDF, setIsGeneratingPDF] = useState<boolean>(false);

    // Load directories
    useEffect(() => {
        const loadDirectories = async () => {
            try {
                setLoading(true);
                const dirs = await fetchResultDirectories();
                setDirectories(dirs);
                setError(null);
            } catch (err) {
                console.error('Error loading directories:', err);
                setError('Failed to load test directories');
            } finally {
                setLoading(false);
            }
        };

        loadDirectories();
    }, []);

    // URL handling
    useEffect(() => {
        let targetDirectory: string | null = null;

        if (directory) {
            targetDirectory = directory;
        } else {
            const pathParts = location.pathname.split('/').filter(Boolean);
            if (pathParts.length >= 3 && pathParts[0] === 'results') {
                const repoId = pathParts[1];
                const remainingPath = pathParts.slice(2).join('/');
                targetDirectory = `${repoId}/${remainingPath}`;
            }
        }

        if (targetDirectory && targetDirectory !== selectedDirectory) {
            setSelectedDirectory(targetDirectory);
        } else if (!targetDirectory && selectedDirectory) {
            navigate(`/results/${selectedDirectory}`);
        }
    }, [directory, location.pathname, selectedDirectory, navigate]);

    // Load files when directory changes
    useEffect(() => {
        const loadFiles = async () => {
            if (!selectedDirectory) return;

            setLoading(true);
            setError(null);

            try {
                const files = await fetchResultFiles(selectedDirectory);
                setFiles(files);

                if (selectedDirectory.endsWith('.json')) {
                    const match = selectedDirectory.match(/^\d{8}_\d{6}_(.+)\.json$/);
                    const testFileName = match ? `${match[1]}.json` : selectedDirectory;
                    setSelectedFile(testFileName);
                } else {
                    if (files.length > 0 && !selectedFile) {
                        setSelectedFile(files[0].name);
                    }
                }
            } catch (err) {
                console.error('Error loading test files:', err);
                setError('Failed to load test files');
            } finally {
                setLoading(false);
            }
        };

        loadFiles();
    }, [selectedDirectory]);

    // Load test result when file changes
    useEffect(() => {
        const loadTestResult = async () => {
            if (!selectedDirectory || !selectedFile) return;

            setLoading(true);
            setError(null);

            try {
                const result = await fetchTestResult(selectedDirectory, selectedFile);
                setSelectedTestResult(result);
            } catch (err) {
                console.error('Error loading test result:', err);
                setError('Failed to load test result');
            } finally {
                setLoading(false);
            }
        };

        loadTestResult();
    }, [selectedDirectory, selectedFile]);

    // Event handlers
    const handleDirectoryChange = useCallback((directory: string) => {
        setSelectedDirectory(directory);
        navigate(`/results/${directory}`);
        setSelectedFile(null);
        setSelectedTestResult(null);
    }, [navigate]);

    const handleFileChange = useCallback((file: string) => {
        setSelectedFile(file);
    }, []);

    const handleBackToDashboard = useCallback(() => {
        navigate('/');
    }, [navigate]);

    const handleExportSingleTestPDF = useCallback(async () => {
        if (!selectedTestResult || !selectedFile || !selectedDirectory) return;

        setIsGeneratingPDF(true);
        try {
            // Simulate PDF generation
            await new Promise(resolve => setTimeout(resolve, 2000));
            console.log('PDF exported successfully');
        } catch (error) {
            console.error('Error generating PDF:', error);
        } finally {
            setIsGeneratingPDF(false);
        }
    }, [selectedTestResult, selectedFile, selectedDirectory]);

    // Determine test types
    const isVirtualDirectory = selectedDirectory?.endsWith('.json') || false;
    const getTestTypeLabel = (directoryName: string) => {
        if (directoryName.endsWith('.json')) return 'Individual Test';
        if (directoryName.includes('sequential_')) return 'Sequential Run';
        if (directoryName.includes('parallel_')) return 'Parallel Run';
        return 'Test Run';
    };

    // Header actions
    const headerActions = (
        <div className="test-results__header-actions">
            <Button
                variant="ghost"
                leftIcon={<Icon name="arrow-left" size="sm" />}
                onClick={handleBackToDashboard}
            >
                Back to Dashboard
            </Button>
            {selectedTestResult && selectedFile && (
                <Button
                    onClick={handleExportSingleTestPDF}
                    disabled={isGeneratingPDF}
                    loading={isGeneratingPDF}
                    variant="error"
                    leftIcon={<Icon name="download" size="sm" />}
                >
                    Export Test PDF
                </Button>
            )}
        </div>
    );

    return (
        <MainLayout
            title="Test Results"
            actions={headerActions}
        >
            <div className="test-results">
                <div className="mb-6">
                    <DirectorySelector
                        directories={directories}
                        selectedDirectory={selectedDirectory}
                        onDirectoryChange={handleDirectoryChange}
                    />
                </div>

                {/* Test Type Info */}
                {selectedDirectory && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                        <div className="flex items-center space-x-3">
                            <span className="text-blue-600">
                                {isVirtualDirectory ? '🎯' : selectedDirectory.includes('sequential_') ? '📋' : '⚡'}
                            </span>
                            <div>
                                <h3 className="font-medium text-blue-900">
                                    {getTestTypeLabel(selectedDirectory)}
                                </h3>
                                <p className="text-sm text-blue-700">
                                    {isVirtualDirectory
                                        ? 'Individual test result - single endpoint performance analysis'
                                        : selectedDirectory.includes('sequential_')
                                            ? 'Sequential test run - multiple tests executed one after another'
                                            : 'Test run containing multiple test results'
                                    }
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {loading && !selectedTestResult ? (
                    <div className="text-center py-10">
                        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                        <p className="mt-3 text-gray-600">Loading test results...</p>
                    </div>
                ) : error ? (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                        <p>{error}</p>
                    </div>
                ) : (
                    <div>
                        {/* Only show tabs if it's not a virtual directory or if there are multiple files */}
                        {(!isVirtualDirectory || files.length > 1) && (
                            <TestResultTabs
                                files={files}
                                selectedFile={selectedFile}
                                onFileChange={handleFileChange}
                            />
                        )}

                        {selectedTestResult && selectedFile && (
                            <TestResultDetail
                                testResult={selectedTestResult}
                                testName={selectedFile.replace('.json', '')}
                                repositoryName={(() => {
                                    const selectedDir = directories.find(d => d.name === selectedDirectory);
                                    return selectedDir?.repositoryName;
                                })()}
                                directoryName={selectedDirectory || undefined}
                                selectedDirectory={directories.find(d => d.name === selectedDirectory)}
                            />
                        )}

                        {!selectedTestResult && !loading && (
                            <div className="bg-white rounded-lg shadow-md p-6">
                                <div className="text-center py-8">
                                    <div className="text-4xl mb-4">📊</div>
                                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Test Results Selected</h3>
                                    <p className="text-gray-600">
                                        {files.length > 0
                                            ? 'Select a test file from the tabs above to view detailed results.'
                                            : 'No test results available in the selected directory.'
                                        }
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </MainLayout>
    );
});

TestResults.displayName = 'TestResults';
import React from 'react';
import { TestDirectory } from '../types/testResults';

interface TestRunSelectorProps {
    directories: TestDirectory[];
    selectedDirectory: string | null;
    onDirectoryChange: (directory: string | null) => void;
    loading?: boolean;
}

const TestRunSelector: React.FC<TestRunSelectorProps> = ({
    directories,
    selectedDirectory,
    onDirectoryChange,
    loading = false,
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
        if (directoryName.includes('sequential_')) {
            return '📋'; // Sequential tests
        } else if (directoryName.includes('parallel_')) {
            return '⚡'; // Parallel tests
        } else if (directoryName.endsWith('.json')) {
            return '🎯'; // Individual tests
        } else {
            return '📊'; // Generic test
        }
    };

    const getTestTypeLabel = (directoryName: string) => {
        if (directoryName.includes('sequential_')) {
            return 'Sequential';
        } else if (directoryName.includes('parallel_')) {
            return 'Parallel';
        } else if (directoryName.endsWith('.json')) {
            return 'Individual Test';
        } else {
            return 'Test Run';
        }
    };

    const isLatestRun = (directory: TestDirectory, index: number) => {
        return index === 0; // First item is the latest
    };

    const getDisplayName = (directory: TestDirectory) => {
        console.log(`🔍 TestRunSelector getDisplayName:`, {
            directoryName: directory.name,
            repositoryName: directory.repositoryName,
            repositoryId: directory.repositoryId,
            testName: directory.testName
        });

        if (directory.repositoryName && directory.testName) {
            // "My API Tests / Contractors Test"
            const formattedTestName = directory.testName
                .replace(/-/g, ' ')
                .replace(/_/g, ' ')
                .split(' ')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ');
            const result = `${directory.repositoryName} / ${formattedTestName}`;
            console.log(`✅ Using repository + test name: ${result}`);
            return result;
        }

        if (directory.repositoryName) {
            const result = `${directory.repositoryName} - ${getTestTypeLabel(directory.name)}`;
            console.log(`✅ Using repository name: ${result}`);
            return result;
        }

        if (directory.testName) {
            const formattedTestName = directory.testName
                .replace(/-/g, ' ')
                .replace(/_/g, ' ')
                .split(' ')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ');
            console.log(`⚠️ Using test name only: ${formattedTestName}`);
            return formattedTestName;
        }

        // Fallback - wyciągnij z nazwy
        let fallbackName = directory.name;
        if (directory.name.endsWith('.json')) {
            const fileName = directory.name.split('/').pop() || '';
            fallbackName = fileName.replace('.json', '').replace(/^\d{8}_\d{6}_/, '');
        }

        const formatted = fallbackName
            .replace(/-/g, ' ')
            .replace(/_/g, ' ')
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');

        console.log(`❌ Using fallback name: ${formatted}`);
        return formatted;
    };

    return (
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
            <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-medium text-gray-700">
                    📊 Select Test Run for Analysis
                </label>

                {/* Quick Actions */}
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
                            {isLatestRun(dir, index) && ' 🆕 (Latest)'}
                        </option>
                    ))}
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
                            {/* 🔧 POPRAWKA: Pokazuj czytelną nazwę zamiast UUID */}
                            <p className="text-xs text-gray-600 mt-1">
                                {(() => {
                                    const dir = directories.find(d => d.name === selectedDirectory);
                                    console.log(`🔍 Currently Analyzing lookup:`, {
                                        selectedDirectory,
                                        foundDir: dir ? {
                                            name: dir.name,
                                            repositoryName: dir.repositoryName,
                                            repositoryId: dir.repositoryId,
                                            testName: dir.testName
                                        } : null
                                    });

                                    if (dir) {
                                        const displayName = getDisplayName(dir);
                                        console.log(`✅ Currently Analyzing display name: ${displayName}`);
                                        return displayName;
                                    } else {
                                        console.log(`❌ Directory not found, using selectedDirectory: ${selectedDirectory}`);
                                        // Fallback: wyciągnij z selectedDirectory
                                        if (selectedDirectory.endsWith('.json')) {
                                            const fileName = selectedDirectory.split('/').pop() || '';
                                            const testName = fileName.replace('.json', '').replace(/^\d{8}_\d{6}_/, '');
                                            return testName
                                                .replace(/-/g, ' ')
                                                .replace(/_/g, ' ')
                                                .split(' ')
                                                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                                                .join(' ');
                                        }
                                        return selectedDirectory;
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

                    {/* Repository Info */}
                    {(() => {
                        const selectedDir = directories.find(d => d.name === selectedDirectory);
                        console.log(`🔍 Currently Analyzing repository info:`, {
                            selectedDirectory,
                            hasRepositoryName: !!selectedDir?.repositoryName,
                            repositoryName: selectedDir?.repositoryName
                        });

                        return selectedDir?.repositoryName && (
                            <div className="mt-2 pt-2 border-t border-gray-200">
                                <p className="text-xs text-gray-500">
                                    📦 Repository: <span className="font-medium text-gray-700">{selectedDir.repositoryName}</span>
                                </p>
                            </div>
                        );
                    })()}

                    {/* Comparison Helper */}
                    {directories.length > 1 && (
                        <div className="mt-2 pt-2 border-t border-gray-200">
                            <p className="text-xs text-gray-500">
                                💡 Tip: Switch between different test runs to compare performance over time
                            </p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default TestRunSelector;
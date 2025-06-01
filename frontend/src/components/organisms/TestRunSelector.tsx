import React, { memo, useCallback, useMemo } from 'react';
import { useAppSelector, useAppDispatch } from '../../store';
import {
    selectDirectories,
    selectDirectoriesLoading,
    selectSelectedDirectory,
    setSelectedDirectory
} from '../../store/slices/testResultsSlice';
import { TestDirectory } from '../../types/testResults';

interface TestRunSelectorProps {
    loading?: boolean;
}

const TestRunSelector: React.FC<TestRunSelectorProps> = memo(({ loading = false }) => {
    const directories = useAppSelector(selectDirectories);
    const directoriesLoading = useAppSelector(selectDirectoriesLoading);
    const selectedDirectory = useAppSelector(selectSelectedDirectory);
    const dispatch = useAppDispatch();

    const handleDirectoryChange = useCallback((directory: string | null) => {
        dispatch(setSelectedDirectory(directory));
    }, [dispatch]);

    // Memoized formatters
    const formatDate = useCallback((date: Date) => {
        return new Date(date).toLocaleString('pl-PL', {
            timeZone: 'Europe/Warsaw',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    }, []);

    const getTestTypeIcon = useCallback((directoryName: string) => {
        if (directoryName.includes('sequential_')) return '📋';
        if (directoryName.includes('parallel_')) return '⚡';
        if (directoryName.endsWith('.json')) return '🎯';
        return '📊';
    }, []);

    const getTestTypeLabel = useCallback((directoryName: string) => {
        if (directoryName.includes('sequential_')) return 'Sequential';
        if (directoryName.includes('parallel_')) return 'Parallel';
        if (directoryName.endsWith('.json')) return 'Individual Test';
        return 'Test Run';
    }, []);

    // Memoized display name calculator
    const getDisplayName = useCallback((directory: TestDirectory) => {
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

        if (directory.testName) {
            return directory.testName
                .replace(/-/g, ' ')
                .replace(/_/g, ' ')
                .split(' ')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ');
        }

        // Fallback
        let fallbackName = directory.name;
        if (directory.name.endsWith('.json')) {
            const fileName = directory.name.split('/').pop() || '';
            fallbackName = fileName.replace('.json', '').replace(/^\d{8}_\d{6}_/, '');
        }

        return fallbackName
            .replace(/-/g, ' ')
            .replace(/_/g, ' ')
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }, [getTestTypeLabel]);

    // Memoized selected directory info
    const selectedDirectoryInfo = useMemo(() => {
        if (!selectedDirectory) return null;

        const dir = directories.find(d => d.name === selectedDirectory);
        if (!dir) return null;

        return {
            directory: dir,
            displayName: getDisplayName(dir),
            typeIcon: getTestTypeIcon(dir.name),
            typeLabel: getTestTypeLabel(dir.name),
            formattedDate: formatDate(dir.date),
            isLatest: directories[0]?.name === dir.name,
        };
    }, [selectedDirectory, directories, getDisplayName, getTestTypeIcon, getTestTypeLabel, formatDate]);

    const isLoading = loading || directoriesLoading;

    return (
        <div className="test-selector">
            <div className="flex items-center justify-between mb-3">
                <label className="test-selector__label">
                    📊 Select Test Run for Analysis
                </label>

                <div className="flex items-center space-x-2">
                    <button
                        onClick={() => handleDirectoryChange(directories.length > 0 ? directories[0].name : null)}
                        className="btn btn--small btn--secondary"
                        disabled={isLoading}
                        title="Switch to latest test run"
                    >
                        🔄 Latest
                    </button>

                    <span className="text-xs text-gray-400">
                        {directories.length} runs available
                    </span>
                </div>
            </div>

            {isLoading ? (
                <div className="flex items-center justify-center py-3">
                    <div className="loading-spinner mr-2" />
                    <span className="text-sm text-gray-600">Loading test runs...</span>
                </div>
            ) : directories.length === 0 ? (
                <div className="text-center py-4">
                    <p className="text-gray-500 text-sm">No test runs available</p>
                    <p className="text-gray-400 text-xs mt-1">Run some tests to see results here</p>
                </div>
            ) : (
                <select
                    className="test-selector__select"
                    value={selectedDirectory || ''}
                    onChange={(e) => handleDirectoryChange(e.target.value || null)}
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

            {/* Selected Run Info - memoized component */}
            {selectedDirectoryInfo && (
                <SelectedDirectoryInfo info={selectedDirectoryInfo} />
            )}
        </div>
    );
});

// Memoized selected directory info component
const SelectedDirectoryInfo: React.FC<{
    info: {
        directory: TestDirectory;
        displayName: string;
        typeIcon: string;
        typeLabel: string;
        formattedDate: string;
        isLatest: boolean;
    };
}> = memo(({ info }) => (
    <div className="mt-3 p-3 bg-gray-50 rounded-md">
        <div className="flex items-center justify-between">
            <div>
                <p className="text-sm font-medium text-gray-900">
                    {info.typeIcon} Currently Analyzing
                </p>
                <p className="text-xs text-gray-600 mt-1">
                    {info.displayName}
                </p>
            </div>

            <div className="text-right">
                <p className="text-xs text-gray-500">
                    {info.typeLabel}
                </p>
                <p className="text-xs text-gray-600">
                    {info.formattedDate}
                </p>
            </div>
        </div>

        {info.directory.repositoryName && (
            <div className="mt-2 pt-2 border-t border-gray-200">
                <p className="text-xs text-gray-500">
                    📦 Repository: <span className="font-medium text-gray-700">{info.directory.repositoryName}</span>
                </p>
            </div>
        )}

        <div className="mt-2 pt-2 border-t border-gray-200">
            <p className="text-xs text-gray-500">
                💡 Tip: Switch between different test runs to compare performance over time
            </p>
        </div>
    </div>
));

TestRunSelector.displayName = 'TestRunSelector';
SelectedDirectoryInfo.displayName = 'SelectedDirectoryInfo';

export default TestRunSelector;
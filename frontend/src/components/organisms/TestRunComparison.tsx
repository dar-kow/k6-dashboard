import React, { useState } from 'react';
import { TestDirectory } from '../types/testResults';

interface TestRunComparisonProps {
    directories: TestDirectory[];
    currentRun: string | null;
    onCompareWith: (compareRunId: string) => void;
}

const TestRunComparison: React.FC<TestRunComparisonProps> = ({
    directories,
    currentRun,
    onCompareWith,
}) => {
    const [showComparison, setShowComparison] = useState(false);
    const [compareRun, setCompareRun] = useState<string>('');

    const formatDate = (date: Date) => {
        return new Date(date).toLocaleString('pl-PL', {
            timeZone: 'Europe/Warsaw',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getTestTypeLabel = (directoryName: string) => {
        if (directoryName.includes('sequential_')) return 'Sequential';
        if (directoryName.includes('parallel_')) return 'Parallel';
        if (directoryName.includes('individual_')) return 'Individual';
        return 'Test';
    };

    const availableForComparison = directories.filter(d => d.name !== currentRun);

    if (!currentRun || directories.length < 2) {
        return null;
    }

    return (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                    <span className="text-blue-600">📈</span>
                    <span className="text-sm font-medium text-blue-900">
                        Performance Comparison
                    </span>
                </div>

                <button
                    onClick={() => setShowComparison(!showComparison)}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                    {showComparison ? 'Hide' : 'Compare with other runs'}
                </button>
            </div>

            {showComparison && (
                <div className="mt-4 space-y-3">
                    <p className="text-sm text-blue-700">
                        Compare current run with previous test results to analyze performance trends
                    </p>

                    <div className="flex items-center space-x-3">
                        <select
                            className="flex-1 p-2 border border-blue-300 rounded-md text-sm bg-white"
                            value={compareRun}
                            onChange={(e) => setCompareRun(e.target.value)}
                        >
                            <option value="">Select a test run to compare with...</option>
                            {availableForComparison.map((dir) => (
                                <option key={dir.name} value={dir.name}>
                                    {getTestTypeLabel(dir.name)} - {formatDate(dir.date)}
                                </option>
                            ))}
                        </select>

                        <button
                            onClick={() => {
                                if (compareRun) {
                                    onCompareWith(compareRun);
                                }
                            }}
                            disabled={!compareRun}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 text-sm transition-colors"
                        >
                            Compare
                        </button>
                    </div>

                    {/* Quick comparison suggestions */}
                    <div className="flex flex-wrap gap-2 mt-3">
                        <span className="text-xs text-blue-600">Quick compare:</span>
                        {availableForComparison.slice(0, 3).map((dir) => (
                            <button
                                key={dir.name}
                                onClick={() => onCompareWith(dir.name)}
                                className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                            >
                                vs {getTestTypeLabel(dir.name)} ({formatDate(dir.date)})
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default TestRunComparison;
import React, { useState, useMemo } from 'react';
import { TestDirectory } from '../types/testResults';

interface EnhancedTestSelectorProps {
    directories: TestDirectory[];
    selectedDirectory: string | null;
    onDirectoryChange: (directory: string) => void;
    loading?: boolean;
}

const EnhancedTestSelector: React.FC<EnhancedTestSelectorProps> = ({
    directories,
    selectedDirectory,
    onDirectoryChange,
    loading = false,
}) => {
    const [filterType, setFilterType] = useState<'all' | 'single' | 'sequential'>('all');
    const [dateFilter, setDateFilter] = useState<string>('');

    // Helper function to get formatted test name like in TestResults
    const getFormattedTestName = (dir: TestDirectory) => {
        if (dir.testName) {
            return dir.testName
                .replace(/-/g, ' ')
                .replace(/_/g, ' ')
                .split(' ')
                .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ');
        }

        if (dir.name?.endsWith('.json')) {
            const fileName = dir.name.split('/').pop() || '';
            const extractedTestName = fileName.replace('.json', '').replace(/^\d{8}_\d{6}_/, '');
            return extractedTestName
                .replace(/-/g, ' ')
                .replace(/_/g, ' ')
                .split(' ')
                .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ');
        }

        // For sequential/parallel tests, return just the type (no UUID)
        if (dir.name.includes('sequential_')) {
            return 'Sequential Test Run';
        }

        if (dir.name.includes('parallel_')) {
            return 'Parallel Test Run';
        }

        // Fallback for other directory names
        let cleanName = dir.name || '';
        cleanName = cleanName.replace(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\//, '');
        cleanName = cleanName.replace(/^\d{8}_\d{6}_/, '');
        cleanName = cleanName.replace(/^(sequential_|parallel_)/, '');

        return cleanName.replace(/_/g, ' ').split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    };

    const filteredDirectories = useMemo(() => {
        let filtered = directories;

        // Filter by type
        if (filterType === 'single') {
            filtered = filtered.filter(dir => dir.name.endsWith('.json'));
        } else if (filterType === 'sequential') {
            filtered = filtered.filter(dir => dir.name.includes('sequential_'));
        }

        // Filter by date
        if (dateFilter) {
            filtered = filtered.filter(dir => {
                const dirDate = new Date(dir.date).toISOString().split('T')[0];
                return dirDate === dateFilter;
            });
        }

        return filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [directories, filterType, dateFilter]);

    const getTestTypeIcon = (dirName: string) => {
        if (dirName.endsWith('.json')) return '🎯';
        if (dirName.includes('sequential_')) return '📋';
        if (dirName.includes('parallel_')) return '⚡';
        return '📊';
    };

    const getTestTypeName = (dirName: string) => {
        if (dirName.endsWith('.json')) return 'Single Test';
        if (dirName.includes('sequential_')) return 'Sequential';
        if (dirName.includes('parallel_')) return 'Parallel';
        return 'Test Suite';
    };

    const getRepositoryDisplayName = (dir: TestDirectory) => {
        // Use the actual repositoryName if available
        if (dir.repositoryName) {
            return dir.repositoryName;
        }

        // Fallback: try to extract from path, skip UUID part
        const parts = dir.name.split('/');
        if (parts.length > 1) {
            // Skip the first part if it looks like a UUID
            const firstPart = parts[0];
            if (firstPart.length === 36 && firstPart.includes('-')) {
                // If there's a second part, use it, otherwise use 'Unknown Repository'
                return parts.length > 2 ? parts[1] : 'Unknown Repository';
            }
            return firstPart;
        }
        return 'Unknown Repository';
    };

    const getDisplayText = (dir: TestDirectory) => {
        const testName = getFormattedTestName(dir);

        // For single tests, show the actual test name
        if (dir.name.endsWith('.json')) {
            return testName;
        }

        // For sequential/parallel tests, show the type
        if (dir.name.includes('sequential_')) {
            return 'Sequential Test Run';
        }

        if (dir.name.includes('parallel_')) {
            return 'Parallel Test Run';
        }

        // Fallback
        return testName || getTestTypeName(dir.name);
    };

    return (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">🎯 Test Selection</h2>
                <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">Filter:</span>
                    <select
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value as any)}
                        className="px-3 py-1 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                        disabled={loading}
                    >
                        <option value="all">All Tests</option>
                        <option value="single">🎯 Single Tests</option>
                        <option value="sequential">📋 Sequential Tests</option>
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
                <div className="lg:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Select Test Run
                    </label>
                    <select
                        className="block w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={selectedDirectory || ''}
                        onChange={(e) => onDirectoryChange(e.target.value)}
                        disabled={loading}
                    >
                        <option value="" disabled>
                            {loading ? 'Loading tests...' : 'Select a test run'}
                        </option>

                        {/* Group directories like in TestResults */}
                        {(() => {
                            const groupedDirectories = filteredDirectories.reduce((groups, dir) => {
                                const type = dir.name.endsWith('.json') ? 'individual' : 'sequential';
                                if (!groups[type]) groups[type] = [];
                                groups[type].push(dir);
                                return groups;
                            }, {} as Record<string, typeof filteredDirectories>);

                            return (
                                <>
                                    {/* Sequential/Parallel Runs */}
                                    {groupedDirectories.sequential && groupedDirectories.sequential.length > 0 && (
                                        <optgroup label="🔄 Sequential & Parallel Test Runs">
                                            {groupedDirectories.sequential.map((dir, index) => (
                                                <option key={dir.name} value={dir.name}>
                                                    {getTestTypeIcon(dir.name)} {getDisplayText(dir)} - {new Date(dir.date).toLocaleString('pl-PL', {
                                                        timeZone: 'Europe/Warsaw',
                                                        year: 'numeric',
                                                        month: '2-digit',
                                                        day: '2-digit',
                                                        hour: '2-digit',
                                                        minute: '2-digit',
                                                        second: '2-digit'
                                                    })}{index === 0 && filteredDirectories[0].name === dir.name && ' 🆕 (Latest)'}
                                                </option>
                                            ))}
                                        </optgroup>
                                    )}

                                    {/* Individual Tests */}
                                    {groupedDirectories.individual && groupedDirectories.individual.length > 0 && (
                                        <optgroup label="🎯 Individual Test Results">
                                            {groupedDirectories.individual.map((dir, index) => (
                                                <option key={dir.name} value={dir.name}>
                                                    {getTestTypeIcon(dir.name)} {getDisplayText(dir)} - {new Date(dir.date).toLocaleString('pl-PL', {
                                                        timeZone: 'Europe/Warsaw',
                                                        year: 'numeric',
                                                        month: '2-digit',
                                                        day: '2-digit',
                                                        hour: '2-digit',
                                                        minute: '2-digit',
                                                        second: '2-digit'
                                                    })}{index === 0 && filteredDirectories[0].name === dir.name && ' 🆕 (Latest)'}
                                                </option>
                                            ))}
                                        </optgroup>
                                    )}
                                </>
                            );
                        })()}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Filter by Date
                    </label>
                    <input
                        type="date"
                        className="block w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={dateFilter}
                        onChange={(e) => setDateFilter(e.target.value)}
                        disabled={loading}
                    />
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                        {directories.filter(d => d.name.endsWith('.json')).length}
                    </div>
                    <div className="text-xs text-gray-600">Single Tests</div>
                </div>
                <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                        {directories.filter(d => d.name.includes('sequential_')).length}
                    </div>
                    <div className="text-xs text-gray-600">Sequential</div>
                </div>
                <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                        {directories.filter(d => d.name.includes('parallel_')).length}
                    </div>
                    <div className="text-xs text-gray-600">Parallel</div>
                </div>
                <div className="text-center">
                    <div className="text-2xl font-bold text-gray-600">
                        {filteredDirectories.length}
                    </div>
                    <div className="text-xs text-gray-600">Filtered</div>
                </div>
            </div>

            {selectedDirectory && (
                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                            <span className="text-lg">{getTestTypeIcon(selectedDirectory)}</span>
                            <div>
                                <p className="font-medium text-gray-900">
                                    {(() => {
                                        const selectedDir = directories.find(d => d.name === selectedDirectory);
                                        return selectedDir ? getFormattedTestName(selectedDir) : getTestTypeName(selectedDirectory);
                                    })()}
                                </p>
                                <p className="text-sm text-gray-500">
                                    {getTestTypeName(selectedDirectory)} • {filteredDirectories.length} results
                                </p>
                                <p className="text-xs text-blue-600">
                                    {(() => {
                                        const selectedDir = directories.find(d => d.name === selectedDirectory);
                                        return selectedDir ? getRepositoryDisplayName(selectedDir) : '';
                                    })()}
                                </p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-sm text-gray-600">
                                {(() => {
                                    const selectedDir = directories.find(d => d.name === selectedDirectory);
                                    return selectedDir ? new Date(selectedDir.date).toLocaleDateString('pl-PL', {
                                        year: 'numeric',
                                        month: '2-digit',
                                        day: '2-digit',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    }) : '';
                                })()}
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EnhancedTestSelector;
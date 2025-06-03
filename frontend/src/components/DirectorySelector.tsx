import React from 'react';
import { TestDirectory } from '../types/testResults';

interface DirectorySelectorProps {
    directories: TestDirectory[];
    selectedDirectory: string | null;
    onDirectoryChange: (directory: string) => void;
}

const DirectorySelector: React.FC<DirectorySelectorProps> = ({
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
        if (directoryName.endsWith('.json')) {
            return '🎯'; // Individual test file
        } else if (directoryName.includes('sequential_')) {
            return '📋'; // Sequential tests
        } else if (directoryName.includes('parallel_')) {
            return '⚡'; // Parallel tests
        } else {
            return '📊'; // Generic test
        }
    };

    const getTestTypeLabel = (directoryName: string) => {
        if (directoryName.endsWith('.json')) {
            return 'Individual Test';
        } else if (directoryName.includes('sequential_')) {
            return 'Sequential Run';
        } else if (directoryName.includes('parallel_')) {
            return 'Parallel Run';
        } else {
            return 'Test Run';
        }
    };

    const getTestName = (directory: TestDirectory) => {
        console.log(`🔍 DirectorySelector getTestName:`, {
            directoryName: directory.name,
            testName: directory.testName
        });

        if (directory.testName) {
            const formatted = directory.testName
                .replace(/-/g, ' ')
                .replace(/_/g, ' ')
                .split(' ')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ');
            console.log(`✅ Using testName: ${formatted}`);
            return formatted;
        }

        // Fallback dla starych danych
        if (directory.name.endsWith('.json')) {
            const match = directory.name.match(/^\d{8}_\d{6}_(.+)\.json$/);
            if (match) {
                const result = match[1].replace(/-/g, ' ').replace(/_/g, ' ').replace(/^\w/, c => c.toUpperCase());
                console.log(`⚠️ Using fallback from filename: ${result}`);
                return result;
            }
        }

        console.log(`❌ Using directory name as fallback: ${directory.name}`);
        return directory.name;
    };

    const getDisplayName = (directory: TestDirectory) => {
        console.log(`🔍 DirectorySelector getDisplayName:`, {
            directoryName: directory.name,
            repositoryName: directory.repositoryName,
            repositoryId: directory.repositoryId,
            testName: directory.testName
        });

        if (directory.repositoryName && directory.testName) {
            const result = `${directory.repositoryName} / ${getTestName(directory)}`;
            console.log(`✅ Using repository + test name: ${result}`);
            return result;
        }

        if (directory.repositoryName) {
            const result = `${directory.repositoryName} - ${getTestTypeLabel(directory.name)}`;
            console.log(`✅ Using repository name: ${result}`);
            return result;
        }

        const result = getTestName(directory);
        console.log(`⚠️ Using test name only: ${result}`);
        return result;
    };

    // Group entries by type for better organization
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
                                    {getTestTypeIcon(dir.name)} {getTestTypeLabel(dir.name)} - {formatDate(dir.date)}
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
                                    console.log(`🔍 DirectorySelector Currently Analyzing:`, {
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
                                        console.log(`✅ DirectorySelector display name: ${displayName}`);
                                        return displayName;
                                    } else {
                                        console.log(`❌ Directory not found, using fallback`);
                                        // Fallback
                                        const fallback = { name: selectedDirectory } as TestDirectory;
                                        return getTestName(fallback);
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
                        console.log(`🔍 DirectorySelector repository info:`, {
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

                    {/* Quick stats */}
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
};

export default DirectorySelector;
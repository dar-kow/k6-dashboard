import React, { createContext, useState, useEffect, useContext } from 'react';
import { fetchResultDirectories } from '../api/results';
import { TestDirectory, TestResult } from '../types/testResults';

interface TestResultsContextType {
    directories: TestDirectory[];
    loading: boolean;
    error: string | null;
    selectedDirectory: string | null;
    setSelectedDirectory: (dir: string | null) => void;
    refreshData: () => Promise<void>;
    currentRepository: string | null;
    setCurrentRepository: (repo: string | null) => void;
}

const TestResultsContext = createContext<TestResultsContextType>({
    directories: [],
    loading: false,
    error: null,
    selectedDirectory: null,
    setSelectedDirectory: () => { },
    refreshData: async () => { },
    currentRepository: null,
    setCurrentRepository: () => { },
});

export const useTestResults = () => useContext(TestResultsContext);

export const TestResultsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [directories, setDirectories] = useState<TestDirectory[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedDirectory, setSelectedDirectory] = useState<string | null>(null);
    const [currentRepository, setCurrentRepository] = useState<string | null>(null);

    const loadData = async () => {
        try {
            setLoading(true);
            setError(null);
            const dirs = await fetchResultDirectories();

            // Sort directories by date (newest first) and handle repository-based structure
            const sortedDirs = dirs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            setDirectories(sortedDirs);

            // Auto-select the most recent directory if none is selected
            if (!selectedDirectory && sortedDirs.length > 0) {
                setSelectedDirectory(sortedDirs[0].name);

                // Extract repository from directory name if it contains '/'
                if (sortedDirs[0].name.includes('/')) {
                    const repoName = sortedDirs[0].name.split('/')[0];
                    setCurrentRepository(repoName);
                }
            }
        } catch (err) {
            console.error('Error loading test directories:', err);
            setError('Failed to load test directories');
        } finally {
            setLoading(false);
        }
    };

    // Filter directories by current repository
    const getFilteredDirectories = () => {
        if (!currentRepository) return directories;
        return directories.filter(dir => dir.name.startsWith(`${currentRepository}/`));
    };

    // Initial data load
    useEffect(() => {
        loadData();
    }, []);

    // Update repository when directory changes
    useEffect(() => {
        if (selectedDirectory && selectedDirectory.includes('/')) {
            const repoName = selectedDirectory.split('/')[0];
            if (repoName !== currentRepository) {
                setCurrentRepository(repoName);
            }
        }
    }, [selectedDirectory, currentRepository]);

    return (
        <TestResultsContext.Provider
            value={{
                directories: getFilteredDirectories(),
                loading,
                error,
                selectedDirectory,
                setSelectedDirectory: (dir) => {
                    setSelectedDirectory(dir);
                    if (dir && dir.includes('/')) {
                        const repoName = dir.split('/')[0];
                        setCurrentRepository(repoName);
                    }
                },
                refreshData: loadData,
                currentRepository,
                setCurrentRepository,
            }}
        >
            {children}
        </TestResultsContext.Provider>
    );
};
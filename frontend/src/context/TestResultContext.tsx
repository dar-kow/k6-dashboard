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
}

const TestResultsContext = createContext<TestResultsContextType>({
    directories: [],
    loading: false,
    error: null,
    selectedDirectory: null,
    setSelectedDirectory: () => { },
    refreshData: async () => { },
});

export const useTestResults = () => useContext(TestResultsContext);

export const TestResultsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [directories, setDirectories] = useState<TestDirectory[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedDirectory, setSelectedDirectory] = useState<string | null>(null);

    const loadData = async () => {
        try {
            setLoading(true);
            setError(null);
            const dirs = await fetchResultDirectories();
            setDirectories(dirs);

            // Auto-select the most recent directory if none is selected
            if (!selectedDirectory && dirs.length > 0) {
                setSelectedDirectory(dirs[0].name);
            }
        } catch (err) {
            console.error('Error loading test directories:', err);
            setError('Failed to load test directories');
        } finally {
            setLoading(false);
        }
    };

    // Initial data load
    useEffect(() => {
        loadData();
    }, []);

    return (
        <TestResultsContext.Provider
            value={{
                directories,
                loading,
                error,
                selectedDirectory,
                setSelectedDirectory,
                refreshData: loadData,
            }}
        >
            {children}
        </TestResultsContext.Provider>
    );
};
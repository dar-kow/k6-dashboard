import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { TestDirectory } from '../types/testResults';
import { fetchResultDirectories } from '../api/results';
import { useRepository } from './RepositoryContext';

interface TestResultContextType {
    directories: TestDirectory[];
    loading: boolean;
    error: string | null;
    selectedDirectory: string | null;
    setSelectedDirectory: (directory: string | null) => void;
    refreshData: () => Promise<void>;
}

const TestResultContext = createContext<TestResultContextType | undefined>(undefined);

export const useTestResults = () => {
    const context = useContext(TestResultContext);
    if (!context) {
        throw new Error('useTestResults must be used within a TestResultProvider');
    }
    return context;
};

interface TestResultProviderProps {
    children: ReactNode;
}

export const TestResultProvider: React.FC<TestResultProviderProps> = ({ children }) => {
    const { selectedRepository } = useRepository();
    const [directories, setDirectories] = useState<TestDirectory[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedDirectory, setSelectedDirectory] = useState<string | null>(null);

    const refreshData = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const allDirectories = await fetchResultDirectories();

            const filteredDirectories = selectedRepository
                ? allDirectories.filter(dir => dir.name.startsWith(`repo:${selectedRepository.id}/`))
                : allDirectories.filter(dir => !dir.name.startsWith('repo:'));

            setDirectories(filteredDirectories);
            console.log('Fetched directories:', filteredDirectories.length);
        } catch (err) {
            console.error('Error fetching directories:', err);
            setError('Failed to fetch test results. Please ensure the backend server is running.');
        } finally {
            setLoading(false);
        }
    }, [selectedRepository]);

    useEffect(() => {
        refreshData();
    }, [refreshData]);

    const value: TestResultContextType = {
        directories,
        loading,
        error,
        selectedDirectory,
        setSelectedDirectory,
        refreshData,
    };

    return <TestResultContext.Provider value={value}>{children}</TestResultContext.Provider>;
};
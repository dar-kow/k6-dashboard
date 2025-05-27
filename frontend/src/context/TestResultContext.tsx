import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { fetchResultDirectories } from '../api/results';
import { TestDirectory } from '../types/testResults';

interface TestResultsContextType {
    directories: TestDirectory[];
    loading: boolean;
    error: string | null;
    selectedDirectory: string | null;
    setSelectedDirectory: (directory: string | null) => void;
    refreshData: () => Promise<void>;
    currentRepository: string | null;
    setCurrentRepository: (repository: string | null) => void;
}

const TestResultsContext = createContext<TestResultsContextType | undefined>(undefined);

export const useTestResults = () => {
    const context = useContext(TestResultsContext);
    if (context === undefined) {
        throw new Error('useTestResults must be used within a TestResultsProvider');
    }
    return context;
};

export const TestResultsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [directories, setDirectories] = useState<TestDirectory[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedDirectory, setSelectedDirectory] = useState<string | null>(null);
    const [currentRepository, setCurrentRepository] = useState<string | null>(null);
    const [lastFetch, setLastFetch] = useState<number>(0);

    // Ref dla uniknięcia niepotrzebnych wywołań
    const isRefreshing = useRef<boolean>(false);
    const refreshTimer = useRef<NodeJS.Timeout | null>(null);

    // Debounced refresh function
    const refreshData = useCallback(async () => {
        // Prevent multiple simultaneous refreshes
        if (isRefreshing.current) {
            console.log('⏳ Refresh already in progress, skipping...');
            return;
        }

        // Rate limiting - minimum 2 seconds between requests
        const now = Date.now();
        if (now - lastFetch < 2000) {
            console.log('⏳ Too soon to refresh, waiting...');

            // Clear existing timer
            if (refreshTimer.current) {
                clearTimeout(refreshTimer.current);
            }

            // Schedule refresh for later
            refreshTimer.current = setTimeout(() => {
                refreshData();
            }, 2000 - (now - lastFetch));

            return;
        }

        isRefreshing.current = true;
        setError(null);

        try {
            console.log('🔄 Refreshing test directories...');
            const dirs = await fetchResultDirectories();

            // Convert string dates to Date objects
            const processedDirs = dirs.map(dir => ({
                ...dir,
                date: new Date(dir.date)
            }));

            setDirectories(processedDirs);
            setLastFetch(Date.now());

            console.log(`✅ Loaded ${processedDirs.length} directories`);

            // Auto-select latest directory if none selected and we have data
            if (!selectedDirectory && processedDirs.length > 0) {
                const latest = processedDirs[0]; // Should be sorted by date desc
                setSelectedDirectory(latest.name);
                console.log(`📁 Auto-selected latest directory: ${latest.name}`);
            }

        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to load test results';
            console.error('❌ Error refreshing directories:', errorMessage);
            setError(errorMessage);
        } finally {
            isRefreshing.current = false;
            setLoading(false);
        }
    }, [selectedDirectory, lastFetch]);

    // Initial load on mount
    useEffect(() => {
        console.log('🚀 TestResultsProvider mounting...');
        refreshData();

        // Cleanup timer on unmount
        return () => {
            if (refreshTimer.current) {
                clearTimeout(refreshTimer.current);
            }
        };
    }, []); // Only run on mount

    // Handle repository change
    const handleRepositoryChange = useCallback((repository: string | null) => {
        console.log(`📦 Repository changed: ${repository}`);
        setCurrentRepository(repository);
        setSelectedDirectory(null); // Clear selection when changing repository

        // Debounced refresh after repository change
        setTimeout(() => {
            refreshData();
        }, 500);
    }, [refreshData]);

    // Handle directory selection with validation
    const handleDirectoryChange = useCallback((directory: string | null) => {
        console.log(`📁 Directory changed: ${directory}`);

        // Validate directory exists
        if (directory && !directories.find(d => d.name === directory)) {
            console.warn(`⚠️ Directory ${directory} not found in current list`);
            return;
        }

        setSelectedDirectory(directory);
    }, [directories]);

    const contextValue: TestResultsContextType = {
        directories,
        loading,
        error,
        selectedDirectory,
        setSelectedDirectory: handleDirectoryChange,
        refreshData,
        currentRepository,
        setCurrentRepository: handleRepositoryChange,
    };

    return (
        <TestResultsContext.Provider value={contextValue}>
            {children}
        </TestResultsContext.Provider>
    );
};
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

const parseDirectoryDate = (dateValue: any): Date => {
    try {
        if (dateValue instanceof Date) return dateValue;
        if (typeof dateValue === 'string') {
            if (/^\d{13}$/.test(dateValue)) {
                return new Date(parseInt(dateValue));
            }
            return new Date(dateValue);
        }
        if (typeof dateValue === 'number') {
            return new Date(dateValue);
        }
        return new Date();
    } catch (error) {
        console.error('❌ Error parsing date:', dateValue, error);
        return new Date();
    }
};

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
            console.log('🔄 Refreshing test results data...');

            const repositoryId = selectedRepository?.id;
            const allDirectories = await fetchResultDirectories(repositoryId);

            console.log('📁 Raw directories from API:', allDirectories);

            const processedDirectories = allDirectories.map(dir => {
                try {
                    const parsedDate = parseDirectoryDate(dir.date);

                    console.log(`📂 Processing directory:`, {
                        name: dir.name,
                        date: parsedDate.toISOString(),
                        isValid: !isNaN(parsedDate.getTime())
                    });

                    return {
                        ...dir,
                        date: parsedDate
                    };
                } catch (error) {
                    console.error('❌ Error processing directory:', dir, error);
                    return {
                        ...dir,
                        date: new Date()
                    };
                }
            });
            const filteredDirectories = selectedRepository
                ? processedDirectories.filter(dir => {
                    const belongsToRepo = dir.name.startsWith(`${selectedRepository.id}/`);
                    console.log(`🔍 Directory ${dir.name} belongs to repo ${selectedRepository.id}:`, belongsToRepo);
                    return belongsToRepo;
                })
                : processedDirectories.filter(dir => {
                    const isDefault = dir.name.startsWith('default/');
                    console.log(`🔍 Directory ${dir.name} is default:`, isDefault);
                    return isDefault;
                });

            console.log(`✅ Filtered directories (${filteredDirectories.length}):`,
                filteredDirectories.map(d => ({
                    name: d.name,
                    date: d.date.toISOString(),
                    valid: !isNaN(d.date.getTime())
                }))
            );

            setDirectories(filteredDirectories);

        } catch (err) {
            console.error('💥 Error fetching directories:', err);
            setError(`Failed to fetch test results: ${err instanceof Error ? err.message : 'Unknown error'}`);
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
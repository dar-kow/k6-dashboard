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
                        repositoryName: dir.repositoryName,
                        testName: dir.testName,
                        isValid: !isNaN(parsedDate.getTime())
                    });

                    return {
                        ...dir,
                        date: parsedDate,
                        // 🔧 DODANE: Zachowaj repository info z API
                        repositoryId: dir.repositoryId,
                        repositoryName: dir.repositoryName,
                        testName: dir.testName,
                    } as TestDirectory;
                } catch (error) {
                    console.error('❌ Error processing directory:', dir, error);
                    return {
                        ...dir,
                        date: new Date(),
                        repositoryId: dir.repositoryId,
                        repositoryName: dir.repositoryName,
                        testName: dir.testName,
                    } as TestDirectory;
                }
            });
            const filteredDirectories = selectedRepository
                ? processedDirectories.filter(dir => {
                    const belongsToRepo = dir.name.startsWith(`${selectedRepository.id}/`);
                    console.log(`🔍 Directory filtering:`, {
                        dirName: dir.name,
                        selectedRepoId: selectedRepository.id,
                        belongsToRepo,
                        repositoryName: dir.repositoryName,
                        repositoryId: dir.repositoryId,
                        testName: dir.testName
                    });
                    return belongsToRepo;
                })
                : processedDirectories.filter(dir => {
                    const isDefault = dir.name.startsWith('default/');
                    console.log(`🔍 Default directory filtering:`, {
                        dirName: dir.name,
                        isDefault,
                        repositoryName: dir.repositoryName,
                        repositoryId: dir.repositoryId,
                        testName: dir.testName
                    });
                    return isDefault;
                });

            console.log(`✅ Final filtered directories (${filteredDirectories.length}):`,
                filteredDirectories.map(d => ({
                    name: d.name,
                    date: d.date.toISOString(),
                    repositoryName: d.repositoryName,
                    repositoryId: d.repositoryId,
                    testName: d.testName,
                    valid: !isNaN(d.date.getTime())
                }))
            );

            // 🔧 DODANE: Dodatkowe logowanie dla debugowania  
            if (filteredDirectories.length > 0) {
                console.log(`🎯 First directory detailed info:`, {
                    name: filteredDirectories[0].name,
                    repositoryName: filteredDirectories[0].repositoryName,
                    repositoryId: filteredDirectories[0].repositoryId,
                    testName: filteredDirectories[0].testName,
                    hasRepositoryInfo: !!(filteredDirectories[0].repositoryName && filteredDirectories[0].repositoryId)
                });
            }

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
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Repository, RepositoryConfig, fetchRepositories, fetchRepositoryConfig } from '../api/repositories';

interface RepositoryContextType {
    repositories: Repository[];
    selectedRepository: Repository | null;
    selectedRepositoryConfig: RepositoryConfig | null;
    loading: boolean;
    error: string | null;
    selectRepository: (repository: Repository | null) => void;
    refreshRepositories: () => Promise<void>;
    refreshConfig: () => Promise<void>;
}

const RepositoryContext = createContext<RepositoryContextType | undefined>(undefined);

export const useRepository = () => {
    const context = useContext(RepositoryContext);
    if (!context) {
        throw new Error('useRepository must be used within a RepositoryProvider');
    }
    return context;
};

interface RepositoryProviderProps {
    children: ReactNode;
}

export const RepositoryProvider: React.FC<RepositoryProviderProps> = ({ children }) => {
    const [repositories, setRepositories] = useState<Repository[]>([]);
    const [selectedRepository, setSelectedRepository] = useState<Repository | null>(null);
    const [selectedRepositoryConfig, setSelectedRepositoryConfig] = useState<RepositoryConfig | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const refreshRepositories = async () => {
        setLoading(true);
        setError(null);
        try {
            const repos = await fetchRepositories();
            setRepositories(repos);

            const savedRepoId = localStorage.getItem('selectedRepositoryId');
            if (savedRepoId) {
                const savedRepo = repos.find(r => r.id === savedRepoId);
                if (savedRepo) {
                    await selectRepository(savedRepo);
                }
            }
        } catch (err) {
            console.error('Error fetching repositories:', err);
            setError('Failed to fetch repositories');
        } finally {
            setLoading(false);
        }
    };

    const refreshConfig = async () => {
        if (!selectedRepository) return;

        try {
            const config = await fetchRepositoryConfig(selectedRepository.id);
            setSelectedRepositoryConfig(config);
        } catch (err) {
            console.error('Error fetching repository config:', err);
            setSelectedRepositoryConfig(null);
        }
    };

    const selectRepository = async (repository: Repository | null) => {
        setSelectedRepository(repository);

        if (repository) {
            localStorage.setItem('selectedRepositoryId', repository.id);
            try {
                const config = await fetchRepositoryConfig(repository.id);
                setSelectedRepositoryConfig(config);
            } catch (err) {
                console.error('Error fetching repository config:', err);
                setSelectedRepositoryConfig(null);
            }
        } else {
            localStorage.removeItem('selectedRepositoryId');
            setSelectedRepositoryConfig(null);
        }
    };

    useEffect(() => {
        refreshRepositories();
    }, []);

    const value: RepositoryContextType = {
        repositories,
        selectedRepository,
        selectedRepositoryConfig,
        loading,
        error,
        selectRepository,
        refreshRepositories,
        refreshConfig,
    };

    return <RepositoryContext.Provider value={value}>{children}</RepositoryContext.Provider>;
};
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { fetchRepositories, Repository } from '../api/repositories';

interface RepositorySelectorProps {
    selectedRepository: string | null;
    onRepositoryChange: (repository: string | null) => void;
}

const RepositorySelector: React.FC<RepositorySelectorProps> = ({
    selectedRepository,
    onRepositoryChange,
}) => {
    const [repositories, setRepositories] = useState<Repository[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [lastFetch, setLastFetch] = useState<number>(0);

    // Prevent multiple simultaneous requests
    const isLoading = useRef<boolean>(false);

    const loadRepositories = useCallback(async (force: boolean = false) => {
        // Rate limiting - minimum 1 second between requests
        const now = Date.now();
        if (!force && (now - lastFetch < 1000)) {
            console.log('⏳ Repository request rate limited');
            return;
        }

        // Prevent concurrent requests
        if (isLoading.current) {
            console.log('⏳ Repository loading already in progress');
            return;
        }

        isLoading.current = true;
        setError(null);

        try {
            console.log('🔄 Loading repositories...');
            const repos = await fetchRepositories();

            console.log(`✅ Loaded ${repos.length} repositories:`, repos.map(r => r.name));
            setRepositories(repos);
            setLastFetch(Date.now());

            // If selected repository no longer exists, clear selection
            if (selectedRepository && !repos.find(r => r.name === selectedRepository)) {
                console.log(`⚠️ Selected repository '${selectedRepository}' no longer exists, clearing selection`);
                onRepositoryChange(null);
            }

            // Auto-select first repository if none selected and we have data
            if (!selectedRepository && repos.length > 0) {
                console.log(`📦 Auto-selecting first repository: ${repos[0].name}`);
                onRepositoryChange(repos[0].name);
            }

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to load repositories';
            console.error('❌ Error loading repositories:', errorMessage);
            setError(errorMessage);
        } finally {
            setLoading(false);
            isLoading.current = false;
        }
    }, [selectedRepository, onRepositoryChange, lastFetch]);

    // Initial load
    useEffect(() => {
        console.log('🚀 RepositorySelector mounting...');
        loadRepositories(true); // Force initial load
    }, []); // Only run on mount

    // Refresh function for external use
    const refreshRepositories = useCallback(() => {
        console.log('🔄 Manual repository refresh requested');
        loadRepositories(true);
    }, [loadRepositories]);

    // Expose refresh function globally for other components
    useEffect(() => {
        (window as any).refreshRepositories = refreshRepositories;
        return () => {
            delete (window as any).refreshRepositories;
        };
    }, [refreshRepositories]);

    if (loading && repositories.length === 0) {
        return (
            <div className="bg-white rounded-lg shadow-md p-4 mb-6">
                <div className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                    <div className="h-10 bg-gray-200 rounded"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
            <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                    📦 Select Repository
                </label>

                <div className="flex items-center space-x-2">
                    <button
                        onClick={() => refreshRepositories()}
                        disabled={loading}
                        className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 disabled:opacity-50 transition-colors"
                        title="Refresh repositories list"
                    >
                        {loading ? '⏳' : '🔄'} Refresh
                    </button>

                    <span className="text-xs text-gray-500">
                        {repositories.length} repositories
                    </span>
                </div>
            </div>

            {error && (
                <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                    ❌ {error}
                    <button
                        onClick={() => refreshRepositories()}
                        className="ml-2 underline hover:no-underline"
                    >
                        Retry
                    </button>
                </div>
            )}

            {repositories.length === 0 && !loading ? (
                <div className="text-center py-4">
                    <p className="text-gray-500 text-sm">No repositories available</p>
                    <p className="text-gray-400 text-xs mt-1">Clone a repository in the Test Runner to see results</p>
                </div>
            ) : (
                <select
                    className="block w-full p-3 border border-gray-300 rounded-md bg-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={selectedRepository || ''}
                    onChange={(e) => {
                        const value = e.target.value || null;
                        console.log(`📦 Repository selection changed: ${value}`);
                        onRepositoryChange(value);
                    }}
                    disabled={loading}
                >
                    <option value="">All Repositories</option>
                    {repositories.map((repo) => (
                        <option key={repo.name} value={repo.name}>
                            📦 {repo.name} ({repo.tests?.length || 0} tests)
                        </option>
                    ))}
                </select>
            )}

            {selectedRepository && (
                <div className="mt-3 p-3 bg-gray-50 rounded-md">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-900">
                                📦 Currently Viewing: {selectedRepository}
                            </p>
                            {repositories.find(r => r.name === selectedRepository) && (
                                <p className="text-xs text-gray-600 mt-1">
                                    {repositories.find(r => r.name === selectedRepository)?.tests?.length || 0} available tests
                                </p>
                            )}
                        </div>

                        <div className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
                            ✓ Active
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RepositorySelector;
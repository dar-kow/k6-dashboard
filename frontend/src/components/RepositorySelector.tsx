import React, { useState, useEffect } from 'react';
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

    useEffect(() => {
        const loadRepositories = async () => {
            try {
                const repos = await fetchRepositories();
                setRepositories(repos);

                // Auto-select first repository if none selected
                if (!selectedRepository && repos.length > 0) {
                    onRepositoryChange(repos[0].name);
                }
            } catch (error) {
                console.error('Error loading repositories:', error);
            } finally {
                setLoading(false);
            }
        };

        loadRepositories();
    }, [selectedRepository, onRepositoryChange]);

    if (loading) {
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
            <label className="block text-sm font-medium text-gray-700 mb-2">
                📦 Select Repository
            </label>

            {repositories.length === 0 ? (
                <div className="text-center py-4">
                    <p className="text-gray-500 text-sm">No repositories available</p>
                    <p className="text-gray-400 text-xs mt-1">Clone a repository in the Test Runner to see results</p>
                </div>
            ) : (
                <select
                    className="block w-full p-3 border border-gray-300 rounded-md bg-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={selectedRepository || ''}
                    onChange={(e) => onRepositoryChange(e.target.value || null)}
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
                    </div>
                </div>
            )}
        </div>
    );
};

export default RepositorySelector;
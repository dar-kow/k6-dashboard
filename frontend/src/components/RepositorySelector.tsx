import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000/api';

interface TestRepository {
    id: string;
    name: string;
    url: string;
    branch: string;
    directory: string;
    description?: string;
    lastUpdated?: string;
    isActive: boolean;
}

interface RepositoryConfig {
    hosts: Record<string, string>;
    tokens: Record<string, Record<string, string>>;
    loadProfiles: Record<string, any>;
    environmentInfo: Record<string, any>;
}

interface RepositorySelectorProps {
    onRepositoryChange?: (repo: TestRepository | null) => void;
    disabled?: boolean;
}

// Modal for adding new repository
const AddRepositoryModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onAdd: (repo: any) => void;
}> = ({ isOpen, onClose, onAdd }) => {
    const [formData, setFormData] = useState({
        name: '',
        url: '',
        branch: 'main',
        description: ''
    });

    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            await onAdd(formData);
            setFormData({ name: '', url: '', branch: 'main', description: '' });
            onClose();
        } catch (error) {
            console.error('Error adding repository:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4">
                <h3 className="text-lg font-semibold mb-4">Add New Test Repository</h3>

                <form onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Repository Name *
                            </label>
                            <input
                                type="text"
                                required
                                className="w-full p-2 border border-gray-300 rounded-md"
                                value={formData.name}
                                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                placeholder="e.g., API Tests, Mobile Tests, Payment Service"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Git Repository URL *
                            </label>
                            <input
                                type="url"
                                required
                                className="w-full p-2 border border-gray-300 rounded-md"
                                value={formData.url}
                                onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
                                placeholder="https://github.com/your-org/k6-tests.git"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Branch
                            </label>
                            <input
                                type="text"
                                className="w-full p-2 border border-gray-300 rounded-md"
                                value={formData.branch}
                                onChange={(e) => setFormData(prev => ({ ...prev, branch: e.target.value }))}
                                placeholder="main"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Description
                            </label>
                            <textarea
                                rows={2}
                                className="w-full p-2 border border-gray-300 rounded-md"
                                value={formData.description}
                                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                placeholder="Brief description of this test repository..."
                            />
                        </div>
                    </div>

                    <div className="flex justify-end space-x-3 mt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200"
                            disabled={isSubmitting}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
                        >
                            {isSubmitting ? 'Adding...' : 'Add Repository'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const RepositorySelector: React.FC<RepositorySelectorProps> = ({
    onRepositoryChange,
    disabled = false
}) => {
    const [repositories, setRepositories] = useState<TestRepository[]>([]);
    const [activeRepository, setActiveRepository] = useState<TestRepository | null>(null);
    const [repoConfig, setRepoConfig] = useState<RepositoryConfig | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
    const [syncingRepoId, setSyncingRepoId] = useState<string | null>(null);

    // Load repositories on component mount
    useEffect(() => {
        loadRepositories();
    }, []);

    // Load repository config when active repository changes
    useEffect(() => {
        if (activeRepository) {
            loadRepositoryConfig(activeRepository.id);
            if (onRepositoryChange) {
                onRepositoryChange(activeRepository);
            }
        }
    }, [activeRepository, onRepositoryChange]);

    const loadRepositories = async () => {
        try {
            setLoading(true);

            // Load all repositories
            const reposResponse = await axios.get(`${API_URL}/repositories`);
            setRepositories(reposResponse.data.repositories || []);

            // Load active repository
            try {
                const activeResponse = await axios.get(`${API_URL}/repositories/active`);
                setActiveRepository(activeResponse.data.repository);
            } catch (error) {
                // No active repository set
                console.log('No active repository found');
                setActiveRepository(null);
            }
        } catch (error) {
            console.error('Error loading repositories:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadRepositoryConfig = async (repositoryId: string) => {
        try {
            const response = await axios.get(`${API_URL}/repositories/${repositoryId}/config`);
            setRepoConfig(response.data.config);
        } catch (error) {
            console.error('Error loading repository config:', error);
            setRepoConfig(null);
        }
    };

    const handleRepositoryChange = async (repositoryId: string) => {
        if (disabled) return;

        try {
            // Set active repository
            await axios.put(`${API_URL}/repositories/active/${repositoryId}`);

            // Reload repositories to get updated active status
            await loadRepositories();
        } catch (error) {
            console.error('Error changing active repository:', error);
        }
    };

    const handleAddRepository = async (repoData: any) => {
        try {
            const response = await axios.post(`${API_URL}/repositories`, repoData);

            // Reload repositories
            await loadRepositories();

            // Sync the new repository
            const newRepo = response.data.repository;
            await handleSyncRepository(newRepo.id);
        } catch (error) {
            console.error('Error adding repository:', error);
            throw error;
        }
    };

    const handleSyncRepository = async (repositoryId: string) => {
        try {
            setSyncingRepoId(repositoryId);

            const response = await axios.post(`${API_URL}/repositories/${repositoryId}/sync`);

            if (response.data.success) {
                console.log('Repository synced successfully:', response.data.message);

                // Reload repositories to get updated info
                await loadRepositories();
            } else {
                console.error('Sync failed:', response.data.message);
            }
        } catch (error) {
            console.error('Error syncing repository:', error);
        } finally {
            setSyncingRepoId(null);
        }
    };

    const getRepositoryDisplayInfo = (repo: TestRepository) => {
        const domain = repo.url.replace(/^https?:\/\//, '').replace(/\.git$/, '');
        const shortDomain = domain.length > 30 ? domain.substring(0, 30) + '...' : domain;

        return {
            shortUrl: shortDomain,
            isGitHub: repo.url.includes('github.com'),
            isGitLab: repo.url.includes('gitlab.com')
        };
    };

    const getEnvironmentInfo = () => {
        if (!repoConfig || !repoConfig.environmentInfo) return [];

        return Object.entries(repoConfig.environmentInfo).map(([key, info]: [string, any]) => ({
            name: key,
            displayName: info.name || key,
            color: info.color || 'gray',
            icon: info.icon || '🌐'
        }));
    };

    if (loading) {
        return (
            <div className="bg-white rounded-lg shadow-md p-4 mb-6">
                <div className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                    <div className="h-8 bg-gray-200 rounded w-full"></div>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="bg-white rounded-lg shadow-md p-4 mb-6">
                <div className="flex items-center justify-between mb-3">
                    <label className="block text-sm font-medium text-gray-700">
                        📦 Test Repository
                    </label>

                    <div className="flex items-center space-x-2">
                        <button
                            onClick={() => setIsAddModalOpen(true)}
                            disabled={disabled}
                            className="text-xs px-3 py-1 bg-green-100 text-green-700 rounded-md hover:bg-green-200 disabled:bg-gray-100 disabled:text-gray-400 transition-colors"
                            title="Add new test repository"
                        >
                            ➕ Add Repository
                        </button>

                        {activeRepository && (
                            <button
                                onClick={() => handleSyncRepository(activeRepository.id)}
                                disabled={disabled || syncingRepoId === activeRepository.id}
                                className="text-xs px-3 py-1 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 disabled:bg-gray-100 disabled:text-gray-400 transition-colors"
                                title="Sync repository (git pull)"
                            >
                                {syncingRepoId === activeRepository.id ? '🔄 Syncing...' : '🔄 Sync'}
                            </button>
                        )}
                    </div>
                </div>

                {repositories.length === 0 ? (
                    <div className="text-center py-4 bg-gray-50 rounded-md">
                        <p className="text-gray-600 text-sm mb-2">No test repositories configured</p>
                        <button
                            onClick={() => setIsAddModalOpen(true)}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                            Add your first repository →
                        </button>
                    </div>
                ) : (
                    <select
                        className="block w-full p-3 border border-gray-300 rounded-md bg-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={activeRepository?.id || ''}
                        onChange={(e) => handleRepositoryChange(e.target.value)}
                        disabled={disabled}
                    >
                        <option value="" disabled>
                            Select a test repository...
                        </option>
                        {repositories.map((repo) => {
                            const displayInfo = getRepositoryDisplayInfo(repo);
                            return (
                                <option key={repo.id} value={repo.id}>
                                    {displayInfo.isGitHub ? '🐙' : displayInfo.isGitLab ? '🦊' : '📦'} {repo.name} - {displayInfo.shortUrl}
                                </option>
                            );
                        })}
                    </select>
                )}

                {/* Active Repository Info */}
                {activeRepository && (
                    <div className="mt-3 p-3 bg-blue-50 rounded-md">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-blue-900">
                                    🎯 Active Repository: {activeRepository.name}
                                </p>
                                <p className="text-xs text-blue-700 mt-1">
                                    {getRepositoryDisplayInfo(activeRepository).shortUrl} ({activeRepository.branch})
                                </p>
                                {activeRepository.description && (
                                    <p className="text-xs text-blue-600 mt-1">
                                        {activeRepository.description}
                                    </p>
                                )}
                            </div>

                            <div className="text-right">
                                <p className="text-xs text-blue-600">
                                    {activeRepository.directory}
                                </p>
                                {activeRepository.lastUpdated && (
                                    <p className="text-xs text-blue-500">
                                        Updated: {new Date(activeRepository.lastUpdated).toLocaleDateString()}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Environment Info from Repository Config */}
                        {repoConfig && getEnvironmentInfo().length > 0 && (
                            <div className="mt-3 pt-3 border-t border-blue-200">
                                <p className="text-xs font-medium text-blue-800 mb-2">Available Environments:</p>
                                <div className="flex flex-wrap gap-2">
                                    {getEnvironmentInfo().map((env) => (
                                        <span
                                            key={env.name}
                                            className={`px-2 py-1 rounded text-xs font-medium ${env.color === 'red' ? 'bg-red-100 text-red-700' :
                                                    env.color === 'orange' ? 'bg-orange-100 text-orange-700' :
                                                        env.color === 'blue' ? 'bg-blue-100 text-blue-700' :
                                                            'bg-gray-100 text-gray-700'
                                                }`}
                                        >
                                            {env.icon} {env.displayName}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Add Repository Modal */}
            <AddRepositoryModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onAdd={handleAddRepository}
            />
        </>
    );
};

export default RepositorySelector;
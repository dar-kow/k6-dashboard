import React, { useState } from 'react';
import { useRepository } from '../context/RepositoryContext';
import { createRepository, syncRepository, deleteRepository } from '../api/repositories';

const RepositorySelector: React.FC = () => {
    const { repositories, selectedRepository, selectRepository, refreshRepositories } = useRepository();
    const [showAddModal, setShowAddModal] = useState(false);
    const [newRepoName, setNewRepoName] = useState('');
    const [newRepoUrl, setNewRepoUrl] = useState('');
    const [newRepoBranch, setNewRepoBranch] = useState('main');
    const [isCreating, setIsCreating] = useState(false);

    const handleCreateRepository = async () => {
        if (!newRepoName || !newRepoUrl) return;

        setIsCreating(true);
        try {
            await createRepository({
                name: newRepoName,
                url: newRepoUrl,
                branch: newRepoBranch,
            });
            await refreshRepositories();
            setShowAddModal(false);
            setNewRepoName('');
            setNewRepoUrl('');
            setNewRepoBranch('main');
        } catch (error) {
            console.error('Error creating repository:', error);
            alert('Failed to create repository');
        } finally {
            setIsCreating(false);
        }
    };

    const handleSyncRepository = async (repoId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            await syncRepository(repoId);
            await refreshRepositories();
        } catch (error) {
            console.error('Error syncing repository:', error);
            alert('Failed to sync repository');
        }
    };

    const handleDeleteRepository = async (repoId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!window.confirm('Are you sure you want to delete this repository?')) return;

        try {
            await deleteRepository(repoId);
            if (selectedRepository?.id === repoId) {
                selectRepository(null);
            }
            await refreshRepositories();
        } catch (error) {
            console.error('Error deleting repository:', error);
            alert('Failed to delete repository');
        }
    };

    return (
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
            <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-medium text-gray-700">
                    📦 Test Repository
                </label>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="text-xs px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                    + Add Repository
                </button>
            </div>

            <select
                className="block w-full p-3 border border-gray-300 rounded-md bg-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={selectedRepository?.id || ''}
                onChange={(e) => {
                    const repo = repositories.find(r => r.id === e.target.value);
                    selectRepository(repo || null);
                }}
            >
                <option value="">Default Local Tests</option>
                {repositories.map((repo) => (
                    <option key={repo.id} value={repo.id}>
                        {repo.name} ({repo.branch})
                        {repo.needsSync && ' 🔄'}
                    </option>
                ))}
            </select>

            {selectedRepository && (
                <div className="mt-3 p-3 bg-gray-50 rounded-md">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-900">
                                {selectedRepository.name}
                            </p>
                            <p className="text-xs text-gray-600 mt-1">
                                {selectedRepository.url}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                                Branch: {selectedRepository.branch}
                                {selectedRepository.lastSync && ` • Last sync: ${new Date(selectedRepository.lastSync).toLocaleString()}`}
                            </p>
                        </div>
                        <div className="flex items-center space-x-2">
                            <button
                                onClick={(e) => handleSyncRepository(selectedRepository.id, e)}
                                className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
                                title="Sync repository"
                            >
                                🔄 Sync
                            </button>
                            <button
                                onClick={(e) => handleDeleteRepository(selectedRepository.id, e)}
                                className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                                title="Delete repository"
                            >
                                🗑️ Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showAddModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
                        <h3 className="text-lg font-semibold mb-4">Add Test Repository</h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Repository Name
                                </label>
                                <input
                                    type="text"
                                    className="w-full p-2 border border-gray-300 rounded-md"
                                    value={newRepoName}
                                    onChange={(e) => setNewRepoName(e.target.value)}
                                    placeholder="My K6 Tests"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Repository URL
                                </label>
                                <input
                                    type="text"
                                    className="w-full p-2 border border-gray-300 rounded-md"
                                    value={newRepoUrl}
                                    onChange={(e) => setNewRepoUrl(e.target.value)}
                                    placeholder="https://github.com/username/repo.git"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Branch
                                </label>
                                <input
                                    type="text"
                                    className="w-full p-2 border border-gray-300 rounded-md"
                                    value={newRepoBranch}
                                    onChange={(e) => setNewRepoBranch(e.target.value)}
                                    placeholder="main"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end space-x-3 mt-6">
                            <button
                                onClick={() => {
                                    setShowAddModal(false);
                                    setNewRepoName('');
                                    setNewRepoUrl('');
                                    setNewRepoBranch('main');
                                }}
                                className="px-4 py-2 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCreateRepository}
                                disabled={isCreating || !newRepoName || !newRepoUrl}
                                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
                            >
                                {isCreating ? 'Creating...' : 'Create Repository'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RepositorySelector;
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { io, Socket } from 'socket.io-client';
import TerminalOutput from '../components/TerminalOutput';
import { useTestResults } from '../context/TestResultContext';
import { fetchRepositories, cloneRepository, updateRepository, Repository } from '../api/repositories';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000/api';
const BASE_URL = API_URL.replace('/api', '');

interface EnvironmentConfig {
    environment: 'PROD' | 'DEV';
    customToken: string;
    repository: string;
}

const CloneRepositoryModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onClone: (name: string, url: string) => void;
}> = ({ isOpen, onClose, onClone }) => {
    const [name, setName] = useState('');
    const [url, setUrl] = useState('');

    if (!isOpen) return null;

    const handleClone = () => {
        if (name.trim() && url.trim()) {
            onClone(name.trim(), url.trim());
            setName('');
            setUrl('');
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
                <h3 className="text-lg font-semibold mb-4">Clone Git Repository</h3>

                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Repository Name
                    </label>
                    <input
                        type="text"
                        className="w-full p-3 border border-gray-300 rounded-md"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="my-tests"
                    />
                </div>

                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Git URL
                    </label>
                    <input
                        type="text"
                        className="w-full p-3 border border-gray-300 rounded-md"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        placeholder="https://github.com/user/repo.git"
                    />
                </div>

                <div className="flex justify-end space-x-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleClone}
                        disabled={!name.trim() || !url.trim()}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
                    >
                        Clone Repository
                    </button>
                </div>
            </div>
        </div>
    );
};

const TokenConfigModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (token: string) => void;
    currentToken: string;
}> = ({ isOpen, onClose, onSave, currentToken }) => {
    const [token, setToken] = useState(currentToken);

    useEffect(() => {
        setToken(currentToken);
    }, [currentToken]);

    if (!isOpen) return null;

    const handleSave = () => {
        onSave(token);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4">
                <h3 className="text-lg font-semibold mb-4">Configure API Token</h3>

                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Custom API Token
                    </label>
                    <textarea
                        className="w-full p-3 border border-gray-300 rounded-md text-xs font-mono"
                        rows={4}
                        value={token}
                        onChange={(e) => setToken(e.target.value)}
                        placeholder="Enter your JWT token here..."
                    />
                    <p className="text-xs text-gray-500 mt-1">
                        This token will be used for API authentication. It's stored in your browser's local storage.
                    </p>
                </div>

                <div className="flex justify-end space-x-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                        Save Token
                    </button>
                </div>
            </div>
        </div>
    );
};

const StopConfirmationModal: React.FC<{
    isOpen: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}> = ({ isOpen, onConfirm, onCancel }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
                <h3 className="text-lg font-semibold mb-4 text-red-600">⚠️ Stop Test Execution</h3>

                <p className="text-gray-700 mb-6">
                    Are you sure you want to stop the running test? This action cannot be undone.
                </p>

                <div className="flex justify-end space-x-3">
                    <button
                        onClick={onCancel}
                        className="px-4 py-2 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                    >
                        🛑 Stop Test
                    </button>
                </div>
            </div>
        </div>
    );
};

const TestRunner: React.FC = () => {
    const { refreshData } = useTestResults();
    const [repositories, setRepositories] = useState<Repository[]>([]);
    const [selectedRepository, setSelectedRepository] = useState<string>('');
    const [selectedTest, setSelectedTest] = useState<string>('');
    const [selectedProfile, setSelectedProfile] = useState<string>('LIGHT');
    const [isRunning, setIsRunning] = useState<boolean>(false);
    const [output, setOutput] = useState<string[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [socketConnected, setSocketConnected] = useState<boolean>(false);
    const [autoScroll, setAutoScroll] = useState<boolean>(true);
    const [showStopConfirmation, setShowStopConfirmation] = useState<boolean>(false);
    const [runningTestId, setRunningTestId] = useState<string | null>(null);
    const [showCloneModal, setShowCloneModal] = useState<boolean>(false);

    const [environment, setEnvironment] = useState<'PROD' | 'DEV'>('PROD');
    const [customToken, setCustomToken] = useState<string>('');
    const [isTokenModalOpen, setIsTokenModalOpen] = useState<boolean>(false);

    const socketRef = useRef<Socket | null>(null);

    useEffect(() => {
        const savedConfig = localStorage.getItem('k6-dashboard-config');
        if (savedConfig) {
            try {
                const config: EnvironmentConfig = JSON.parse(savedConfig);
                setEnvironment(config.environment || 'PROD');
                setCustomToken(config.customToken || '');
                setSelectedRepository(config.repository || '');
            } catch (err) {
                console.error('Error parsing saved config:', err);
            }
        }
    }, []);

    const saveConfig = (env: 'PROD' | 'DEV', token: string, repo: string) => {
        const config: EnvironmentConfig = {
            environment: env,
            customToken: token,
            repository: repo
        };
        localStorage.setItem('k6-dashboard-config', JSON.stringify(config));
    };

    const handleEnvironmentChange = (env: 'PROD' | 'DEV') => {
        setEnvironment(env);
        saveConfig(env, customToken, selectedRepository);
        setOutput(prev => [...prev, `🔄 Switched to ${env} environment`]);
    };

    const handleRepositoryChange = (repo: string) => {
        setSelectedRepository(repo);
        saveConfig(environment, customToken, repo);
        setSelectedTest('');
        setOutput(prev => [...prev, `📦 Selected repository: ${repo}`]);
    };

    const handleTokenSave = (token: string) => {
        setCustomToken(token);
        saveConfig(environment, token, selectedRepository);
        setOutput(prev => [...prev, `🔑 Custom token ${token ? 'updated' : 'cleared'}`]);
    };

    useEffect(() => {
        const loadRepositories = async () => {
            try {
                const repos = await fetchRepositories();
                setRepositories(repos);
                if (repos.length > 0 && !selectedRepository) {
                    setSelectedRepository(repos[0].name);
                }
            } catch (err: any) {
                console.error('Error loading repositories:', err);
                setError(`Failed to load repositories: ${err.message}`);
            }
        };

        loadRepositories();
    }, [selectedRepository]);

    useEffect(() => {
        if (socketRef.current) {
            socketRef.current.disconnect();
        }

        const socket = io(BASE_URL, {
            withCredentials: true,
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000
        });

        socketRef.current = socket;

        socket.on('connect', () => {
            setOutput(prev => [...prev, 'WebSocket connection established']);
            setSocketConnected(true);
            setError(null);
        });

        socket.on('connection_established', (data) => {
            setOutput(prev => [...prev, `Server confirmed connection: ${data.message}`]);
        });

        socket.on('testOutput', (message) => {
            if (message.type === 'log') {
                setOutput(prev => [...prev, message.data]);
            } else if (message.type === 'error') {
                setOutput(prev => [...prev, `ERROR: ${message.data}`]);
            } else if (message.type === 'complete') {
                setIsRunning(false);
                setRunningTestId(null);
                setOutput(prev => [...prev, message.data]);

                setTimeout(() => {
                    refreshData();
                }, 2000);
            } else if (message.type === 'stopped') {
                setIsRunning(false);
                setRunningTestId(null);
                setOutput(prev => [...prev, `🛑 ${message.data}`]);
            }
        });

        socket.on('refreshResults', (message) => {
            setOutput(prev => [...prev, `🔄 ${message.message}`]);
            refreshData();
        });

        socket.on('disconnect', () => {
            setSocketConnected(false);
            setOutput(prev => [...prev, 'WebSocket connection closed']);
        });

        socket.on('connect_error', (err) => {
            setError(`WebSocket connection error: ${err.message}. Reconnecting...`);
        });

        return () => {
            socket.disconnect();
        };
    }, [refreshData]);

    const runTest = async () => {
        if (!selectedTest || !selectedRepository) return;

        const testId = `${selectedRepository}-${selectedTest}-${Date.now()}`;
        setRunningTestId(testId);
        setIsRunning(true);
        setOutput([`🚀 Starting test: ${selectedTest} from ${selectedRepository} with profile: ${selectedProfile} on ${environment}`]);
        setError(null);
        setAutoScroll(true);

        try {
            if (socketRef.current && socketConnected) {
                socketRef.current.emit('test_request', {
                    testId: testId,
                    test: selectedTest,
                    repository: selectedRepository,
                    profile: selectedProfile,
                    environment: environment,
                    customToken: customToken
                });
            }

            await axios.post(`${API_URL}/run/test`, {
                testId: testId,
                test: selectedTest,
                repository: selectedRepository,
                profile: selectedProfile,
                environment: environment,
                customToken: customToken
            });
        } catch (err: any) {
            console.error('Error starting test:', err);
            setError(`Failed to start test execution: ${err.message}`);
            setIsRunning(false);
            setRunningTestId(null);
        }
    };

    const runAllTests = async () => {
        if (!selectedRepository) return;

        const testId = `${selectedRepository}-all-tests-${Date.now()}`;
        setRunningTestId(testId);
        setIsRunning(true);
        setOutput([`🚀 Starting all tests from ${selectedRepository} sequentially with profile: ${selectedProfile} on ${environment}`]);
        setError(null);
        setAutoScroll(true);

        try {
            if (socketRef.current && socketConnected) {
                socketRef.current.emit('test_request', {
                    testId: testId,
                    test: 'all',
                    repository: selectedRepository,
                    profile: selectedProfile,
                    environment: environment,
                    customToken: customToken
                });
            }

            await axios.post(`${API_URL}/run/all`, {
                testId: testId,
                repository: selectedRepository,
                profile: selectedProfile,
                environment: environment,
                customToken: customToken
            });
        } catch (err: any) {
            console.error('Error starting tests:', err);
            setError(`Failed to start test execution: ${err.message}`);
            setIsRunning(false);
            setRunningTestId(null);
        }
    };

    const stopTest = async () => {
        if (!runningTestId) return;

        try {
            if (socketRef.current && socketConnected) {
                socketRef.current.emit('stop_test', {
                    testId: runningTestId
                });
            }

            await axios.post(`${API_URL}/run/stop`, {
                testId: runningTestId
            });

            setOutput(prev => [...prev, `🛑 Stopping test: ${runningTestId}...`]);
        } catch (err: any) {
            console.error('Error stopping test:', err);
            setError(`Failed to stop test: ${err.message}`);
        }
    };

    const handleCloneRepository = async (name: string, url: string) => {
        try {
            setOutput(prev => [...prev, `📥 Cloning repository: ${name} from ${url}...`]);
            await cloneRepository({ name, url });
            setOutput(prev => [...prev, `✅ Repository ${name} cloned successfully`]);

            const repos = await fetchRepositories();
            setRepositories(repos);
            setSelectedRepository(name);
        } catch (err: any) {
            console.error('Error cloning repository:', err);
            setError(`Failed to clone repository: ${err.message}`);
        }
    };

    const handleUpdateRepository = async (name: string) => {
        try {
            setOutput(prev => [...prev, `🔄 Updating repository: ${name}...`]);
            await updateRepository(name);
            setOutput(prev => [...prev, `✅ Repository ${name} updated successfully`]);

            const repos = await fetchRepositories();
            setRepositories(repos);
        } catch (err: any) {
            console.error('Error updating repository:', err);
            setError(`Failed to update repository: ${err.message}`);
        }
    };

    const handleStopConfirmation = () => {
        setShowStopConfirmation(false);
        stopTest();
    };

    const clearOutput = () => {
        setOutput([]);
        setAutoScroll(true);
    };

    const clearConnection = () => {
        if (socketRef.current) {
            socketRef.current.disconnect();
        }

        setSocketConnected(false);
        setIsRunning(false);
        setRunningTestId(null);
        setOutput(['🔄 Clearing connection and resetting...']);

        setTimeout(() => {
            window.location.reload();
        }, 1000);
    };

    const toggleAutoScroll = () => {
        setAutoScroll(prev => !prev);
    };

    const selectedRepo = repositories.find(r => r.name === selectedRepository);
    const availableTests = selectedRepo?.tests || [];
    const availableProfiles = selectedRepo?.config?.LOAD_PROFILES ? Object.keys(selectedRepo.config.LOAD_PROFILES) : ['LIGHT', 'MEDIUM', 'HEAVY'];
    const availableEnvironments = selectedRepo?.config?.HOSTS ? Object.keys(selectedRepo.config.HOSTS) : ['PROD', 'DEV'];

    return (
        <div>
            <h1 className="text-3xl font-bold mb-6">Test Runner</h1>

            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
                    <p>{error}</p>
                </div>
            )}

            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold">Repository & Test Configuration</h2>

                    <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium text-gray-700">Environment:</span>
                            <div className="flex bg-gray-100 rounded-md p-1">
                                {availableEnvironments.map(env => (
                                    <button
                                        key={env}
                                        onClick={() => handleEnvironmentChange(env as 'PROD' | 'DEV')}
                                        className={`px-3 py-1 text-xs font-medium rounded transition-colors ${environment === env
                                            ? 'bg-blue-600 text-white'
                                            : 'text-gray-600 hover:text-gray-800'
                                            }`}
                                        disabled={isRunning}
                                    >
                                        {env}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <button
                            onClick={() => setIsTokenModalOpen(true)}
                            className="flex items-center space-x-1 px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                            disabled={isRunning}
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m0 0a2 2 0 012 2v6a2 2 0 01-2 2H9a2 2 0 01-2-2V9a2 2 0 012-2m8 0V7a2 2 0 00-2-2H9a2 2 0 00-2 2v2m8 0H9m0 0v6m0-6h8"></path>
                            </svg>
                            <span>{customToken ? 'Token Set' : 'Set Token'}</span>
                        </button>
                    </div>
                </div>

                <div className="mb-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <div className={`inline-flex items-center px-2 py-1 rounded ${socketConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                <span className={`w-3 h-3 rounded-full mr-2 ${socketConnected ? 'bg-green-600' : 'bg-red-600'}`}></span>
                                {socketConnected ? 'WebSocket Connected' : 'WebSocket Disconnected'}
                            </div>

                            <div className="text-sm text-gray-600">
                                <span className="font-medium">Target:</span> {environment}
                                {customToken && <span className="ml-2 text-green-600">• Custom Token Active</span>}
                                {selectedRepository && <span className="ml-2 text-blue-600">• Repo: {selectedRepository}</span>}
                            </div>
                        </div>

                        <div className="flex items-center space-x-2">
                            {isRunning && (
                                <div className="flex items-center space-x-2 px-3 py-1 bg-orange-100 text-orange-800 rounded-md">
                                    <div className="w-2 h-2 bg-orange-600 rounded-full animate-pulse"></div>
                                    <span className="text-sm font-medium">Test Running</span>
                                </div>
                            )}

                            <button
                                onClick={() => setShowCloneModal(true)}
                                className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors"
                                disabled={isRunning}
                            >
                                📥 Clone Repo
                            </button>

                            <button
                                onClick={clearConnection}
                                className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                            >
                                🔄 Reset Connection
                            </button>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Select Repository</label>
                        <div className="flex space-x-2">
                            <select
                                className="flex-1 p-2 border border-gray-300 rounded-md"
                                value={selectedRepository}
                                onChange={(e) => handleRepositoryChange(e.target.value)}
                                disabled={isRunning}
                            >
                                <option value="" disabled>Select a repository</option>
                                {repositories.map((repo) => (
                                    <option key={repo.name} value={repo.name}>
                                        📦 {repo.name} ({repo.tests?.length || 0} tests)
                                    </option>
                                ))}
                            </select>
                            {selectedRepository && (
                                <button
                                    onClick={() => handleUpdateRepository(selectedRepository)}
                                    className="px-3 py-2 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
                                    disabled={isRunning}
                                    title="Update repository"
                                >
                                    🔄
                                </button>
                            )}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Select Test</label>
                        <select
                            className="block w-full p-2 border border-gray-300 rounded-md"
                            value={selectedTest}
                            onChange={(e) => setSelectedTest(e.target.value)}
                            disabled={isRunning || !selectedRepository}
                        >
                            <option value="" disabled>Select a test</option>
                            {availableTests.map((test) => (
                                <option key={test} value={test}>
                                    🎯 {test}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Select Profile</label>
                        <select
                            className="block w-full p-2 border border-gray-300 rounded-md"
                            value={selectedProfile}
                            onChange={(e) => setSelectedProfile(e.target.value)}
                            disabled={isRunning}
                        >
                            {availableProfiles.map((profile) => (
                                <option key={profile} value={profile}>
                                    ⚡ {profile}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                    <button
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
                        onClick={runTest}
                        disabled={isRunning || !selectedTest || !selectedRepository}
                    >
                        {isRunning ? (
                            <span className="flex items-center">
                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Running...
                            </span>
                        ) : (
                            'Run Selected Test'
                        )}
                    </button>

                    <button
                        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 transition-colors"
                        onClick={runAllTests}
                        disabled={isRunning || !selectedRepository}
                    >
                        {isRunning ? (
                            <span className="flex items-center">
                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Running...
                            </span>
                        ) : (
                            'Run All Tests Sequentially'
                        )}
                    </button>

                    {isRunning && (
                        <button
                            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                            onClick={() => setShowStopConfirmation(true)}
                        >
                            🛑 Stop Test
                        </button>
                    )}

                    <button
                        className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                        onClick={clearOutput}
                    >
                        Clear Output
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold">Test Execution Output</h2>

                    <div className="flex items-center space-x-4">
                        {isRunning && runningTestId && (
                            <div className="text-sm text-orange-600 bg-orange-50 px-3 py-1 rounded-md">
                                Running: {runningTestId.split('-')[1] || runningTestId.split('-')[0]}
                            </div>
                        )}

                        <div className="text-sm text-gray-500">
                            💡 Toggle auto-scroll below to control terminal behavior
                        </div>
                    </div>
                </div>

                <div className="mb-4 text-sm text-gray-600 bg-gray-50 p-3 rounded">
                    <p>📦 <strong>Repository:</strong> <code className="bg-gray-200 px-1 rounded">{selectedRepository || 'None selected'}</code></p>
                    <p>📁 <strong>Results location:</strong> <code className="bg-gray-200 px-1 rounded">k6-tests/repos/{selectedRepository}/results/</code></p>
                    <p>🌐 <strong>Environment:</strong> Running tests against <span className={`font-medium ${environment === 'PROD' ? 'text-blue-600' : 'text-orange-600'}`}>{environment}</span> environment</p>
                    {isRunning && <p>⚠️ <strong>Running:</strong> Use STOP button above to terminate test execution</p>}
                </div>

                <TerminalOutput
                    output={output}
                    autoScroll={autoScroll}
                    onAutoScrollToggle={toggleAutoScroll}
                />
            </div>

            <CloneRepositoryModal
                isOpen={showCloneModal}
                onClose={() => setShowCloneModal(false)}
                onClone={handleCloneRepository}
            />

            <TokenConfigModal
                isOpen={isTokenModalOpen}
                onClose={() => setIsTokenModalOpen(false)}
                onSave={handleTokenSave}
                currentToken={customToken}
            />

            <StopConfirmationModal
                isOpen={showStopConfirmation}
                onConfirm={handleStopConfirmation}
                onCancel={() => setShowStopConfirmation(false)}
            />
        </div>
    );
};

export default TestRunner;
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { io, Socket } from 'socket.io-client';
import TerminalOutput from '../components/TerminalOutput';
import { useTestResults } from '../context/TestResultContext';
import { useRepository } from '../context/RepositoryContext';
import RepositorySelector from '../components/RepositorySelector';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
const BASE_URL = API_URL.replace('/api', '');

interface TestConfig {
    name: string;
    description: string;
    file: string;
}

interface EnvironmentConfig {
    environment: 'PROD' | 'DEV';
    customToken: string;
    customHost: string;
}

const TokenConfigModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (token: string, host: string) => void;
    currentToken: string;
    currentHost: string;
}> = ({ isOpen, onClose, onSave, currentToken, currentHost }) => {
    const [token, setToken] = useState(currentToken);
    const [host, setHost] = useState(currentHost);

    useEffect(() => {
        setToken(currentToken);
        setHost(currentHost);
    }, [currentToken, currentHost]);

    if (!isOpen) return null;

    const handleSave = () => {
        onSave(token, host);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4">
                <h3 className="text-lg font-semibold mb-4">Configure Custom Environment</h3>

                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Custom Host URL
                    </label>
                    <input
                        className="w-full p-3 border border-gray-300 rounded-md text-sm"
                        value={host}
                        onChange={(e) => setHost(e.target.value)}
                        placeholder="https://api.example.com"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                        Leave empty to use the default host from repository config
                    </p>
                </div>

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
                        Leave empty to use the default token from repository config
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
                        Save Configuration
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
    const { selectedRepository, selectedRepositoryConfig } = useRepository();
    const [tests, setTests] = useState<TestConfig[]>([]);
    const [selectedTest, setSelectedTest] = useState<string>('');
    const [selectedProfile, setSelectedProfile] = useState<string>('LIGHT');
    const [isRunning, setIsRunning] = useState<boolean>(false);
    const [output, setOutput] = useState<string[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [socketConnected, setSocketConnected] = useState<boolean>(false);
    const [autoScroll, setAutoScroll] = useState<boolean>(true);
    const [showStopConfirmation, setShowStopConfirmation] = useState<boolean>(false);
    const [runningTestId, setRunningTestId] = useState<string | null>(null);

    const [environment, setEnvironment] = useState<'PROD' | 'DEV'>('PROD');
    const [customToken, setCustomToken] = useState<string>('');
    const [customHost, setCustomHost] = useState<string>('');
    const [isTokenModalOpen, setIsTokenModalOpen] = useState<boolean>(false);

    const socketRef = useRef<Socket | null>(null);

    useEffect(() => {
        const savedConfig = localStorage.getItem('k6-dashboard-config');
        if (savedConfig) {
            try {
                const config: EnvironmentConfig = JSON.parse(savedConfig);
                setEnvironment(config.environment || 'PROD');
                setCustomToken(config.customToken || '');
                setCustomHost(config.customHost || '');
            } catch (err) {
                console.error('Error parsing saved config:', err);
            }
        }
    }, []);

    const saveConfig = (env: 'PROD' | 'DEV', token: string, host: string) => {
        const config: EnvironmentConfig = {
            environment: env,
            customToken: token,
            customHost: host
        };
        localStorage.setItem('k6-dashboard-config', JSON.stringify(config));
    };

    const handleEnvironmentChange = (env: 'PROD' | 'DEV') => {
        setEnvironment(env);
        saveConfig(env, customToken, customHost);
        setOutput(prev => [...prev, `🔄 Switched to ${env} environment`]);
    };

    const handleTokenSave = (token: string, host: string) => {
        setCustomToken(token);
        setCustomHost(host);
        saveConfig(environment, token, host);
        setOutput(prev => [...prev, `🔑 Custom configuration ${token || host ? 'updated' : 'cleared'}`]);
    };

    useEffect(() => {
        const fetchTests = async () => {
            try {
                const url = selectedRepository
                    ? `${API_URL}/tests?repositoryId=${selectedRepository.id}`
                    : `${API_URL}/tests`;

                console.log('Fetching tests from:', url);
                const response = await axios.get(url);
                setTests(response.data);

                if (response.data.length > 0) {
                    setSelectedTest(response.data[0].name);
                }
            } catch (err: any) {
                console.error('Error loading tests:', err);
                setError(`Failed to load available tests: ${err.message}`);
            }
        };

        fetchTests();
    }, [selectedRepository]);

    useEffect(() => {
        if (socketRef.current) {
            socketRef.current.disconnect();
        }

        console.log('Connecting to socket at:', BASE_URL);

        const socket = io(BASE_URL, {
            withCredentials: true,
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000
        });

        socketRef.current = socket;

        socket.on('connect', () => {
            console.log('WebSocket connection established, socket ID:', socket.id);
            setOutput(prev => [...prev, 'WebSocket connection established']);
            setSocketConnected(true);
            setError(null);
        });

        socket.on('connection_established', (data) => {
            console.log('Received connection confirmation:', data);
            setOutput(prev => [...prev, `Server confirmed connection: ${data.message}`]);
        });

        socket.on('testOutput', (message) => {
            console.log('Received test output:', message);

            if (message.type === 'log') {
                setOutput(prev => [...prev, message.data]);
            } else if (message.type === 'error') {
                setOutput(prev => [...prev, `ERROR: ${message.data}`]);
            } else if (message.type === 'complete') {
                setIsRunning(false);
                setRunningTestId(null);
                setOutput(prev => [...prev, message.data]);

                setTimeout(() => {
                    console.log('Auto-refreshing test results after test completion');
                    refreshData();
                }, 2000);
            } else if (message.type === 'stopped') {
                setIsRunning(false);
                setRunningTestId(null);
                setOutput(prev => [...prev, `🛑 ${message.data}`]);
            }
        });

        socket.on('refreshResults', (message) => {
            console.log('Received refresh results request:', message);
            setOutput(prev => [...prev, `🔄 ${message.message}`]);
            refreshData();
        });

        socket.on('disconnect', () => {
            console.log('WebSocket connection closed');
            setSocketConnected(false);
            setOutput(prev => [...prev, 'WebSocket connection closed']);
        });

        socket.on('connect_error', (err) => {
            console.error('WebSocket connection error:', err);
            setError(`WebSocket connection error: ${err.message}. Reconnecting...`);
        });

        return () => {
            console.log('Cleaning up socket connection');
            socket.disconnect();
        };
    }, [refreshData]);

    const runTest = async () => {
        if (!selectedTest) return;

        const testId = `${selectedTest}-${Date.now()}`;
        setRunningTestId(testId);
        setIsRunning(true);
        setOutput([`🚀 Starting test: ${selectedTest} with profile: ${selectedProfile} on ${environment}`]);
        setError(null);

        setAutoScroll(true);

        try {
            if (socketRef.current && socketConnected) {
                socketRef.current.emit('test_request', {
                    testId: testId,
                    test: selectedTest,
                    profile: selectedProfile,
                    environment: environment,
                    customToken: customToken,
                    customHost: customHost,
                    repositoryId: selectedRepository?.id
                });
            }

            await axios.post(`${API_URL}/run/test`, {
                testId: testId,
                test: selectedTest,
                profile: selectedProfile,
                environment: environment,
                customToken: customToken,
                customHost: customHost,
                repositoryId: selectedRepository?.id
            });
        } catch (err: any) {
            console.error('Error starting test:', err);
            setError(`Failed to start test execution: ${err.message}`);
            setIsRunning(false);
            setRunningTestId(null);
        }
    };

    const runAllTests = async () => {
        const testId = `all-tests-${Date.now()}`;
        setRunningTestId(testId);
        setIsRunning(true);
        setOutput([`🚀 Starting all tests sequentially with profile: ${selectedProfile} on ${environment}`]);
        setError(null);

        setAutoScroll(true);

        try {
            if (socketRef.current && socketConnected) {
                socketRef.current.emit('test_request', {
                    testId: testId,
                    test: 'all',
                    profile: selectedProfile,
                    environment: environment,
                    customToken: customToken,
                    customHost: customHost,
                    repositoryId: selectedRepository?.id
                });
            }

            await axios.post(`${API_URL}/run/all`, {
                testId: testId,
                profile: selectedProfile,
                environment: environment,
                customToken: customToken,
                customHost: customHost,
                repositoryId: selectedRepository?.id
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

    const getAvailableProfiles = () => {
        if (selectedRepositoryConfig) {
            return selectedRepositoryConfig.availableProfiles;
        }
        return ['LIGHT', 'MEDIUM', 'HEAVY'];
    };

    const getProfileDetails = (profileName: string) => {
        if (selectedRepositoryConfig && selectedRepositoryConfig.loadProfiles[profileName]) {
            const profile = selectedRepositoryConfig.loadProfiles[profileName];
            return `${profileName} (${profile.vus} VUs, ${profile.duration})`;
        }

        switch (profileName) {
            case 'LIGHT':
                return 'Light (10 VUs, 60s)';
            case 'MEDIUM':
                return 'Medium (30 VUs, 5m)';
            case 'HEAVY':
                return 'Heavy (100 VUs, 10m)';
            default:
                return profileName;
        }
    };

    return (
        <div>
            <h1 className="text-3xl font-bold mb-6">Test Runner</h1>

            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
                    <p>{error}</p>
                </div>
            )}

            <RepositorySelector />

            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold">Run Tests</h2>

                    <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium text-gray-700">Environment:</span>
                            <div className="flex bg-gray-100 rounded-md p-1">
                                <button
                                    onClick={() => handleEnvironmentChange('PROD')}
                                    className={`px-3 py-1 text-xs font-medium rounded transition-colors ${environment === 'PROD'
                                        ? 'bg-blue-600 text-white'
                                        : 'text-gray-600 hover:text-gray-800'
                                        }`}
                                    disabled={isRunning}
                                >
                                    PROD
                                </button>
                                <button
                                    onClick={() => handleEnvironmentChange('DEV')}
                                    className={`px-3 py-1 text-xs font-medium rounded transition-colors ${environment === 'DEV'
                                        ? 'bg-orange-600 text-white'
                                        : 'text-gray-600 hover:text-gray-800'
                                        }`}
                                    disabled={isRunning}
                                >
                                    DEV
                                </button>
                            </div>
                        </div>

                        <button
                            onClick={() => setIsTokenModalOpen(true)}
                            className="flex items-center space-x-1 px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                            title="Configure custom host and token"
                            disabled={isRunning}
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m0 0a2 2 0 012 2v6a2 2 0 01-2 2H9a2 2 0 01-2-2V9a2 2 0 012-2m8 0V7a2 2 0 00-2-2H9a2 2 0 00-2 2v2m8 0H9m0 0v6m0-6h8"></path>
                            </svg>
                            <span>{customToken || customHost ? 'Custom Config Set' : 'Set Custom'}</span>
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
                                {selectedRepositoryConfig && (
                                    <span className="ml-2 text-xs text-gray-500">
                                        ({customHost || selectedRepositoryConfig.hosts[environment]})
                                    </span>
                                )}
                                {(customToken || customHost) && <span className="ml-2 text-green-600">• Custom Config Active</span>}
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
                                onClick={clearConnection}
                                className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                                title="Clear connection and reset"
                            >
                                🔄 Reset Connection
                            </button>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Select Test</label>
                        <select
                            className="block w-full p-2 border border-gray-300 rounded-md"
                            value={selectedTest}
                            onChange={(e) => setSelectedTest(e.target.value)}
                            disabled={isRunning}
                        >
                            <option value="" disabled>Select a test</option>
                            {tests.length > 0 ? (
                                tests.map((test) => (
                                    <option key={test.name} value={test.name}>
                                        {test.description || test.name}
                                    </option>
                                ))
                            ) : (
                                <option value="" disabled>No tests available</option>
                            )}
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
                            {getAvailableProfiles().map((profile) => (
                                <option key={profile} value={profile}>
                                    {getProfileDetails(profile)}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                    <button
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
                        onClick={runTest}
                        disabled={isRunning || !selectedTest}
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
                        disabled={isRunning}
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
                            title="Stop running test"
                        >
                            🛑 Stop Test
                        </button>
                    )}

                    <button
                        className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                        onClick={clearOutput}
                        title="Clear terminal output"
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
                                Running: {runningTestId.split('-')[0]}
                            </div>
                        )}

                        <div className="text-sm text-gray-500">
                            💡 Toggle auto-scroll below to control terminal behavior
                        </div>
                    </div>
                </div>

                <div className="mb-4 text-sm text-gray-600 bg-gray-50 p-3 rounded">
                    <p>📁 <strong>Results location:</strong>
                        <code className="bg-gray-200 px-1 rounded ml-1">
                            {selectedRepository
                                ? `${selectedRepository.name}/results/`
                                : 'k6-tests/results/'
                            }
                        </code>
                    </p>
                    <p>🎛️ <strong>Terminal controls:</strong> Use auto-scroll toggle and manual scroll buttons below</p>
                    <p>🔄 <strong>Auto-scroll:</strong> {autoScroll ? 'Enabled - shows latest output automatically' : 'Disabled - scroll manually to see new output'}</p>
                    <p>🌐 <strong>Environment:</strong> Running tests against <span className={`font-medium ${environment === 'PROD' ? 'text-blue-600' : 'text-orange-600'}`}>{environment}</span> environment</p>
                    {selectedRepository && (
                        <p>📦 <strong>Repository:</strong> <span className="font-medium text-gray-700">{selectedRepository.name}</span> (branch: {selectedRepository.branch})</p>
                    )}
                    {isRunning && <p>⚠️ <strong>Running:</strong> Use STOP button above to terminate test execution</p>}
                </div>

                <TerminalOutput
                    output={output}
                    autoScroll={autoScroll}
                    onAutoScrollToggle={toggleAutoScroll}
                />
            </div>

            <TokenConfigModal
                isOpen={isTokenModalOpen}
                onClose={() => setIsTokenModalOpen(false)}
                onSave={handleTokenSave}
                currentToken={customToken}
                currentHost={customHost}
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
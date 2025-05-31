import React, { memo, useState, useEffect, useRef, useCallback } from 'react';
import { MainLayout } from '@components/templates';
import { Button, Icon, Input } from '@components/atoms';
import { SearchBox } from '@components/molecules';
import axios from 'axios';
import { io, Socket } from 'socket.io-client';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000/api';
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

// Terminal Output Component (atomic design version)
interface TerminalOutputProps {
    output: string[];
    autoScroll?: boolean;
    onAutoScrollToggle?: () => void;
}

const TerminalOutput: React.FC<TerminalOutputProps> = memo(({
    output,
    autoScroll = true,
    onAutoScrollToggle
}) => {
    const terminalRef = useRef<HTMLDivElement>(null);
    const [processedOutput, setProcessedOutput] = useState<string[]>([]);

    useEffect(() => {
        const processOutput = (rawOutput: string[]) => {
            const processed: string[] = [];
            for (let i = 0; i < rawOutput.length; i++) {
                const line = rawOutput[i];
                if (isK6ProgressLine(line)) {
                    const lastIndex = processed.length - 1;
                    if (lastIndex >= 0 && isK6ProgressLine(processed[lastIndex])) {
                        processed[lastIndex] = formatK6ProgressLine(line);
                    } else {
                        processed.push(formatK6ProgressLine(line));
                    }
                } else {
                    processed.push(line);
                }
            }
            return processed;
        };
        setProcessedOutput(processOutput(output));
    }, [output]);

    useEffect(() => {
        if (autoScroll && terminalRef.current) {
            terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
        }
    }, [processedOutput, autoScroll]);

    const isK6ProgressLine = (line: string): boolean => {
        return line.includes('default [') &&
            line.includes('%') &&
            line.includes('VUs') &&
            (line.includes('running') || line.includes('complete'));
    };

    const formatK6ProgressLine = (line: string): string => {
        const percentMatch = line.match(/\[\s*(\d+)%\s*\]/);
        const vusMatch = line.match(/(\d+)\s+VUs/);
        const timeMatch = line.match(/(\d+m\d+\.\d+s\/\d+m\d+s)/);

        if (percentMatch && vusMatch && timeMatch) {
            const percent = parseInt(percentMatch[1]);
            const vus = vusMatch[1];
            const time = timeMatch[1];
            const totalWidth = 40;
            const filledWidth = Math.floor((percent / 100) * totalWidth);
            const emptyWidth = totalWidth - filledWidth;
            const progressBar = '='.repeat(filledWidth) + '>' + '-'.repeat(Math.max(0, emptyWidth - 1));
            return `default   [${progressBar}] ${vus} VUs  ${time}`;
        }
        return line;
    };

    const scrollToBottom = () => {
        if (terminalRef.current) {
            terminalRef.current.scrollTo({
                top: terminalRef.current.scrollHeight,
                behavior: 'smooth'
            });
        }
    };

    const scrollToTop = () => {
        if (terminalRef.current) {
            terminalRef.current.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        }
    };

    return (
        <div className="terminal-output">
            <div
                ref={terminalRef}
                className="bg-gray-900 text-gray-100 font-mono p-4 rounded-md h-80 overflow-y-auto"
                style={{
                    fontSize: '13px',
                    lineHeight: '1.2',
                    fontFamily: 'Consolas, "Courier New", monospace',
                    scrollBehavior: 'smooth'
                }}
            >
                {processedOutput.length === 0 ? (
                    <div className="text-gray-400 italic">
                        No output yet. Run a test to see the k6 progress here.
                        <br />
                        <span className="text-xs">
                            {autoScroll ? 'Auto-scroll is ON - terminal will show latest progress.' : 'Auto-scroll is OFF - scroll manually to see latest progress.'}
                        </span>
                    </div>
                ) : (
                    processedOutput.map((line, index) => {
                        let className = 'whitespace-pre font-mono';
                        if (line.startsWith('ERROR') || line.includes('✗') || line.includes('failed')) {
                            className += ' text-red-400';
                        } else if (line.includes('successful') || line.includes('completed') || line.includes('✓')) {
                            className += ' text-green-400';
                        } else if (line.includes('Starting') || line.includes('Running') || line.includes('🚀')) {
                            className += ' text-blue-400';
                        } else if (line.includes('default   [') && line.includes('VUs')) {
                            className += ' text-cyan-300 font-bold';
                        } else if (line.includes('WARNING') || line.includes('⚠')) {
                            className += ' text-yellow-400';
                        } else if (line.includes('🔄')) {
                            className += ' text-purple-400';
                        }

                        return (
                            <div key={index} className={className}>
                                {line || '\u00A0'}
                            </div>
                        );
                    })
                )}
            </div>

            <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
                <div className="flex items-center space-x-4">
                    <span>{processedOutput.length} lines</span>
                    {onAutoScrollToggle && (
                        <button
                            onClick={onAutoScrollToggle}
                            className={`flex items-center space-x-1 px-2 py-1 rounded transition-colors ${autoScroll
                                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                            title={autoScroll ? 'Disable auto-scroll' : 'Enable auto-scroll'}
                        >
                            <div className={`w-2 h-2 rounded-full ${autoScroll ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                            <span>Auto-scroll: {autoScroll ? 'ON' : 'OFF'}</span>
                        </button>
                    )}
                </div>

                <div className="flex items-center space-x-2">
                    <button
                        onClick={scrollToTop}
                        className="px-2 py-1 bg-gray-100 text-gray-600 rounded hover:bg-gray-200 transition-colors"
                        title="Scroll to top"
                    >
                        ↑ Top
                    </button>
                    <button
                        onClick={scrollToBottom}
                        className="px-2 py-1 bg-gray-100 text-gray-600 rounded hover:bg-gray-200 transition-colors"
                        title="Scroll to bottom"
                    >
                        ↓ Bottom
                    </button>
                    <div className="flex items-center space-x-1">
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">
                            📺 Live Terminal
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
});

// Repository Selector (simplified for atomic design)
const RepositorySelector: React.FC = memo(() => {
    return (
        <div className="repository-selector bg-white rounded-lg shadow-md p-4 mb-6">
            <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-medium text-gray-700">
                    📦 Test Repository
                </label>
                <Button variant="secondary" size="sm">
                    + Add Repository
                </Button>
            </div>
            <select className="block w-full p-3 border border-gray-300 rounded-md bg-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <option value="">Default Local Tests</option>
            </select>
        </div>
    );
});

// Token Config Modal
interface TokenConfigModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (token: string, host: string) => void;
    currentToken: string;
    currentHost: string;
}

const TokenConfigModal: React.FC<TokenConfigModalProps> = memo(({
    isOpen,
    onClose,
    onSave,
    currentToken,
    currentHost
}) => {
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
                    <Input
                        value={host}
                        onChange={(e) => setHost(e.target.value)}
                        placeholder="https://api.example.com"
                        fullWidth
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
                    <Button variant="secondary" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button variant="primary" onClick={handleSave}>
                        Save Configuration
                    </Button>
                </div>
            </div>
        </div>
    );
});

// Stop Confirmation Modal
interface StopConfirmationModalProps {
    isOpen: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}

const StopConfirmationModal: React.FC<StopConfirmationModalProps> = memo(({
    isOpen,
    onConfirm,
    onCancel
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
                <h3 className="text-lg font-semibold mb-4 text-red-600">⚠️ Stop Test Execution</h3>
                <p className="text-gray-700 mb-6">
                    Are you sure you want to stop the running test? This action cannot be undone.
                </p>
                <div className="flex justify-end space-x-3">
                    <Button variant="secondary" onClick={onCancel}>
                        Cancel
                    </Button>
                    <Button variant="error" onClick={onConfirm}>
                        🛑 Stop Test
                    </Button>
                </div>
            </div>
        </div>
    );
});

export const TestRunner = memo(() => {
    // State management
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

    // Environment state
    const [environment, setEnvironment] = useState<'PROD' | 'DEV'>('PROD');
    const [customToken, setCustomToken] = useState<string>('');
    const [customHost, setCustomHost] = useState<string>('');
    const [isTokenModalOpen, setIsTokenModalOpen] = useState<boolean>(false);

    const socketRef = useRef<Socket | null>(null);

    // Load saved config
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

    // Save config
    const saveConfig = useCallback((env: 'PROD' | 'DEV', token: string, host: string) => {
        const config: EnvironmentConfig = {
            environment: env,
            customToken: token,
            customHost: host
        };
        localStorage.setItem('k6-dashboard-config', JSON.stringify(config));
    }, []);

    // Environment change handler
    const handleEnvironmentChange = useCallback((env: 'PROD' | 'DEV') => {
        setEnvironment(env);
        saveConfig(env, customToken, customHost);
        setOutput(prev => [...prev, `🔄 Switched to ${env} environment`]);
    }, [customToken, customHost, saveConfig]);

    // Token save handler
    const handleTokenSave = useCallback((token: string, host: string) => {
        setCustomToken(token);
        setCustomHost(host);
        saveConfig(environment, token, host);
        setOutput(prev => [...prev, `🔑 Custom configuration ${token || host ? 'updated' : 'cleared'}`]);
    }, [environment, saveConfig]);

    // Fetch tests
    useEffect(() => {
        const fetchTests = async () => {
            try {
                const response = await axios.get(`${API_URL}/tests`);
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
    }, []);

    // WebSocket setup
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
            console.log('WebSocket connection established, socket ID:', socket.id);
            setOutput(prev => [...prev, 'WebSocket connection established']);
            setSocketConnected(true);
            setError(null);
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
            } else if (message.type === 'stopped') {
                setIsRunning(false);
                setRunningTestId(null);
                setOutput(prev => [...prev, `🛑 ${message.data}`]);
            }
        });

        socket.on('disconnect', () => {
            setSocketConnected(false);
            setOutput(prev => [...prev, 'WebSocket connection closed']);
        });

        socket.on('connect_error', (err) => {
            console.error('WebSocket connection error:', err);
            setError(`WebSocket connection error: ${err.message}. Reconnecting...`);
        });

        return () => {
            socket.disconnect();
        };
    }, []);

    // Run test
    const runTest = useCallback(async () => {
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
                });
            }

            await axios.post(`${API_URL}/run/test`, {
                testId: testId,
                test: selectedTest,
                profile: selectedProfile,
                environment: environment,
                customToken: customToken,
                customHost: customHost,
            });
        } catch (err: any) {
            console.error('Error starting test:', err);
            setError(`Failed to start test execution: ${err.message}`);
            setIsRunning(false);
            setRunningTestId(null);
        }
    }, [selectedTest, selectedProfile, environment, customToken, customHost, socketConnected]);

    // Run all tests
    const runAllTests = useCallback(async () => {
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
                });
            }

            await axios.post(`${API_URL}/run/all`, {
                testId: testId,
                profile: selectedProfile,
                environment: environment,
                customToken: customToken,
                customHost: customHost,
            });
        } catch (err: any) {
            console.error('Error starting tests:', err);
            setError(`Failed to start test execution: ${err.message}`);
            setIsRunning(false);
            setRunningTestId(null);
        }
    }, [selectedProfile, environment, customToken, customHost, socketConnected]);

    // Stop test
    const stopTest = useCallback(async () => {
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
    }, [runningTestId, socketConnected]);

    // Clear output
    const clearOutput = useCallback(() => {
        setOutput([]);
        setAutoScroll(true);
    }, []);

    // Toggle auto scroll
    const toggleAutoScroll = useCallback(() => {
        setAutoScroll(prev => !prev);
    }, []);

    // Available profiles
    const getAvailableProfiles = () => ['LIGHT', 'MEDIUM', 'HEAVY'];

    const getProfileDetails = (profileName: string) => {
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

    // Header actions
    const headerActions = (
        <div className="test-runner__header-actions">
            <Button
                variant="primary"
                onClick={runTest}
                disabled={isRunning || !selectedTest}
                leftIcon={isRunning ? <Icon name="spinner" size="sm" /> : <Icon name="play" size="sm" />}
            >
                {isRunning ? 'Running...' : 'Run Test'}
            </Button>
        </div>
    );

    return (
        <MainLayout
            title="Test Runner"
            actions={headerActions}
        >
            <div className="test-runner">
                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
                        <p>{error}</p>
                    </div>
                )}

                <RepositorySelector />

                {/* Test Configuration */}
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

                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setIsTokenModalOpen(true)}
                                disabled={isRunning}
                                leftIcon={<Icon name="lock" size="sm" />}
                            >
                                {customToken || customHost ? 'Custom Config Set' : 'Set Custom'}
                            </Button>
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
                                    {(customToken || customHost) && <span className="ml-2 text-green-600">• Custom Config Active</span>}
                                </div>
                            </div>

                            {isRunning && (
                                <div className="flex items-center space-x-2 px-3 py-1 bg-orange-100 text-orange-800 rounded-md">
                                    <div className="w-2 h-2 bg-orange-600 rounded-full animate-pulse"></div>
                                    <span className="text-sm font-medium">Test Running</span>
                                </div>
                            )}
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
                        <Button
                            variant="primary"
                            onClick={runTest}
                            disabled={isRunning || !selectedTest}
                            loading={isRunning}
                        >
                            Run Selected Test
                        </Button>

                        <Button
                            variant="success"
                            onClick={runAllTests}
                            disabled={isRunning}
                            loading={isRunning}
                        >
                            Run All Tests Sequentially
                        </Button>

                        {isRunning && (
                            <Button
                                variant="error"
                                onClick={() => setShowStopConfirmation(true)}
                            >
                                🛑 Stop Test
                            </Button>
                        )}

                        <Button
                            variant="secondary"
                            onClick={clearOutput}
                        >
                            Clear Output
                        </Button>
                    </div>
                </div>

                {/* Terminal Output */}
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
                            <code className="bg-gray-200 px-1 rounded ml-1">k6-tests/results/</code>
                        </p>
                        <p>🎛️ <strong>Terminal controls:</strong> Use auto-scroll toggle and manual scroll buttons below</p>
                        <p>🔄 <strong>Auto-scroll:</strong> {autoScroll ? 'Enabled - shows latest output automatically' : 'Disabled - scroll manually to see new output'}</p>
                        <p>🌐 <strong>Environment:</strong> Running tests against <span className={`font-medium ${environment === 'PROD' ? 'text-blue-600' : 'text-orange-600'}`}>{environment}</span> environment</p>
                        {isRunning && <p>⚠️ <strong>Running:</strong> Use STOP button above to terminate test execution</p>}
                    </div>

                    <TerminalOutput
                        output={output}
                        autoScroll={autoScroll}
                        onAutoScrollToggle={toggleAutoScroll}
                    />
                </div>
            </div>

            {/* Modals */}
            <TokenConfigModal
                isOpen={isTokenModalOpen}
                onClose={() => setIsTokenModalOpen(false)}
                onSave={handleTokenSave}
                currentToken={customToken}
                currentHost={customHost}
            />

            <StopConfirmationModal
                isOpen={showStopConfirmation}
                onConfirm={() => {
                    setShowStopConfirmation(false);
                    stopTest();
                }}
                onCancel={() => setShowStopConfirmation(false)}
            />
        </MainLayout>
    );
});

TestRunner.displayName = 'TestRunner';
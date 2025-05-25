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

interface SystemInfo {
    name: string;
    version: string;
    description: string;
    testConfig: {
        defaultProfile: string;
        maxConcurrentTests: number;
        timeout: number;
    };
}

interface SystemInfoCardProps {
    selectedEnvironment: 'PROD' | 'DEV' | 'STAGING';
    activeRepository?: TestRepository | null;
}

const SystemInfoCard: React.FC<SystemInfoCardProps> = ({
    selectedEnvironment,
    activeRepository
}) => {
    const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
    const [repoConfig, setRepoConfig] = useState<RepositoryConfig | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [expanded, setExpanded] = useState<boolean>(false);

    useEffect(() => {
        const loadSystemInfo = async () => {
            try {
                setLoading(true);

                // Load basic system info
                const sysResponse = await axios.get(`${API_URL}/system/info`);
                setSystemInfo(sysResponse.data.system);

                // Load repository config if active repository exists
                if (activeRepository) {
                    try {
                        const configResponse = await axios.get(`${API_URL}/repositories/${activeRepository.id}/config`);
                        setRepoConfig(configResponse.data.config);
                    } catch (err) {
                        console.log('Repository config not available:', err);
                        setRepoConfig(null);
                    }
                } else {
                    setRepoConfig(null);
                }
            } catch (err) {
                console.error('Error loading system info:', err);
            } finally {
                setLoading(false);
            }
        };

        loadSystemInfo();
    }, [activeRepository]);

    if (loading) {
        return (
            <div className="bg-white rounded-lg shadow-md p-4 mb-6">
                <div className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                    <div className="h-6 bg-gray-200 rounded w-1/2"></div>
                </div>
            </div>
        );
    }

    if (!systemInfo) {
        return (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <p className="text-yellow-800">⚠️ System configuration not available</p>
            </div>
        );
    }

    const getEnvironmentIcon = (env: string) => {
        if (repoConfig?.environmentInfo?.[env]?.icon) {
            return repoConfig.environmentInfo[env].icon;
        }

        switch (env) {
            case 'PROD': return '🚀';
            case 'DEV': return '🔧';
            case 'STAGING': return '🎭';
            default: return '🌐';
        }
    };

    const getEnvironmentColor = (env: string) => {
        if (repoConfig?.environmentInfo?.[env]?.color) {
            const color = repoConfig.environmentInfo[env].color;
            switch (color) {
                case 'red': return 'text-red-600 bg-red-50 border-red-200';
                case 'orange': return 'text-orange-600 bg-orange-50 border-orange-200';
                case 'blue': return 'text-blue-600 bg-blue-50 border-blue-200';
                case 'green': return 'text-green-600 bg-green-50 border-green-200';
                case 'purple': return 'text-purple-600 bg-purple-50 border-purple-200';
                default: return 'text-gray-600 bg-gray-50 border-gray-200';
            }
        }

        switch (env) {
            case 'PROD': return 'text-red-600 bg-red-50 border-red-200';
            case 'DEV': return 'text-orange-600 bg-orange-50 border-orange-200';
            case 'STAGING': return 'text-purple-600 bg-purple-50 border-purple-200';
            default: return 'text-gray-600 bg-gray-50 border-gray-200';
        }
    };

    const getEnvironmentName = (env: string) => {
        if (repoConfig?.environmentInfo?.[env]?.name) {
            return repoConfig.environmentInfo[env].name;
        }
        return env;
    };

    const getEnvironmentDescription = (env: string) => {
        if (repoConfig?.environmentInfo?.[env]?.description) {
            return repoConfig.environmentInfo[env].description;
        }
        return `${env} environment`;
    };

    const getCurrentHost = () => {
        if (repoConfig?.hosts?.[selectedEnvironment]) {
            return repoConfig.hosts[selectedEnvironment];
        }
        return 'Not configured';
    };

    const hasTokensForEnvironment = () => {
        return repoConfig?.tokens?.[selectedEnvironment] &&
            Object.keys(repoConfig.tokens[selectedEnvironment]).length > 0;
    };

    const getAvailableEnvironments = () => {
        if (repoConfig?.hosts) {
            return Object.keys(repoConfig.hosts);
        }
        return ['PROD', 'DEV', 'STAGING'];
    };

    return (
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                    <div className="text-lg">
                        {activeRepository ? '🎯' : '⚙️'}
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-900">
                            {activeRepository ? 'Target System' : 'System Configuration'}
                        </h3>
                        <p className="text-sm text-gray-600">
                            {activeRepository
                                ? `${activeRepository.name} - ${systemInfo.name} ${systemInfo.version}`
                                : `${systemInfo.name} ${systemInfo.version}`
                            }
                        </p>
                    </div>
                </div>

                <button
                    onClick={() => setExpanded(!expanded)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                    title={expanded ? "Collapse details" : "Expand details"}
                >
                    <svg
                        className={`w-5 h-5 transform transition-transform ${expanded ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                </button>
            </div>

            {/* Active Repository & Environment Info */}
            {activeRepository ? (
                <div className="space-y-3">
                    {/* Current Environment */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getEnvironmentColor(selectedEnvironment)}`}>
                                {getEnvironmentIcon(selectedEnvironment)} {getEnvironmentName(selectedEnvironment)}
                            </span>
                            <span className="text-sm text-gray-600">
                                {getCurrentHost()}
                            </span>
                        </div>

                        <div className="flex items-center space-x-2">
                            {hasTokensForEnvironment() ? (
                                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                                    🔑 Tokens Available
                                </span>
                            ) : (
                                <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                                    ⚠️ No Tokens
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Repository Info */}
                    <div className="bg-gray-50 rounded-md p-3">
                        <div className="flex items-center space-x-2 text-sm">
                            <span className="font-medium text-gray-700">Repository:</span>
                            <span className="text-blue-600">{activeRepository.name}</span>
                            <span className="text-gray-500">({activeRepository.directory})</span>
                        </div>
                        <p className="text-xs text-gray-600 mt-1">
                            {getEnvironmentDescription(selectedEnvironment)}
                        </p>
                    </div>
                </div>
            ) : (
                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                    <p className="text-yellow-800 text-sm">
                        ⚠️ No test repository selected. Please select a repository to view environment details.
                    </p>
                </div>
            )}

            {/* Expanded Details */}
            {expanded && (
                <div className="border-t border-gray-200 pt-3 mt-3 space-y-3">
                    {/* Available Environments */}
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">🌐 Available Environments:</span>
                        <div className="flex space-x-1">
                            {getAvailableEnvironments().map(env => (
                                <span
                                    key={env}
                                    className={`px-2 py-1 rounded text-xs ${env === selectedEnvironment
                                        ? getEnvironmentColor(env)
                                        : 'text-gray-500 bg-gray-100'
                                        }`}
                                >
                                    {getEnvironmentIcon(env)} {getEnvironmentName(env)}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Repository Configuration */}
                    {activeRepository && (
                        <>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-500">📦 Repository URL:</span>
                                <span className="font-mono text-xs text-blue-600">
                                    {activeRepository.url.replace('https://github.com/', '').replace('.git', '')}
                                </span>
                            </div>

                            <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-500">🌿 Branch:</span>
                                <span className="font-medium">{activeRepository.branch}</span>
                            </div>

                            {activeRepository.lastUpdated && (
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-500">🕐 Last Updated:</span>
                                    <span className="font-medium">{new Date(activeRepository.lastUpdated).toLocaleString()}</span>
                                </div>
                            )}
                        </>
                    )}

                    {/* System Configuration */}
                    <div className="border-t border-gray-100 pt-2 mt-2">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-500">⚙️ Default Profile:</span>
                            <span className="font-medium">{systemInfo.testConfig.defaultProfile}</span>
                        </div>

                        <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-500">⏱️ Test Timeout:</span>
                            <span className="font-medium">{(systemInfo.testConfig.timeout / 1000).toFixed(0)}s</span>
                        </div>

                        <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-500">🔄 Max Concurrent:</span>
                            <span className="font-medium">{systemInfo.testConfig.maxConcurrentTests}</span>
                        </div>
                    </div>

                    {/* Config Status */}
                    <div className="border-t border-gray-100 pt-2 mt-2">
                        <div className="flex items-center justify-between text-xs text-gray-400">
                            <span>Configuration Status:</span>
                            <span>
                                {activeRepository
                                    ? (repoConfig ? '✅ Repository config loaded' : '⚠️ No config/env.js found')
                                    : '⚠️ No repository selected'
                                }
                            </span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SystemInfoCard;
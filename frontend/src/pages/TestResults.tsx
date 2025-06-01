import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchResultFiles, fetchTestResult } from '../api/results';
import { TestFile, TestResult } from '../types/testResults';
import { useSingleTestPDFGenerator } from '../context/SingleTestPDFReport';
import { useTestResults } from '../context/TestResultContext';
import { DirectorySelector, TestResultDetail, TestResultTabs } from '@/components';

const TestResults: React.FC = () => {
    const { directory } = useParams<{ directory?: string }>();
    const navigate = useNavigate();
    const { directories, selectedDirectory, setSelectedDirectory } = useTestResults();
    const { generateSingleTestPDF } = useSingleTestPDFGenerator();

    const [files, setFiles] = useState<TestFile[]>([]);
    const [selectedFile, setSelectedFile] = useState<string | null>(null);
    const [selectedTestResult, setSelectedTestResult] = useState<TestResult | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [isGeneratingPDF, setIsGeneratingPDF] = useState<boolean>(false);

    useEffect(() => {
        console.log('🔍 URL Analysis:', {
            directory,
            pathname: location.pathname,
            selectedDirectory
        });

        let targetDirectory: string | null = null;

        if (directory) {
            targetDirectory = directory;
            console.log('📁 Directory from params:', targetDirectory);
        } else {
            const pathParts = location.pathname.split('/').filter(Boolean);
            if (pathParts.length >= 3 && pathParts[0] === 'results') {
                const repoId = pathParts[1];
                const remainingPath = pathParts.slice(2).join('/');
                targetDirectory = `${repoId}/${remainingPath}`;
                console.log('📁 Repository path detected:', targetDirectory);
            }
        }

        if (targetDirectory && targetDirectory !== selectedDirectory) {
            console.log('🔄 Setting selected directory:', targetDirectory);
            setSelectedDirectory(targetDirectory);
        } else if (!targetDirectory && selectedDirectory) {
            console.log('🔄 Navigating to selected directory:', selectedDirectory);
            navigate(`/results/${selectedDirectory}`);
        }
    }, [directory, location.pathname, selectedDirectory, setSelectedDirectory, navigate]);

    useEffect(() => {
        const loadFiles = async () => {
            if (!selectedDirectory) return;

            setLoading(true);
            setError(null);

            try {
                const files = await fetchResultFiles(selectedDirectory);
                setFiles(files);

                if (selectedDirectory.endsWith('.json')) {
                    const match = selectedDirectory.match(/^\d{8}_\d{6}_(.+)\.json$/);
                    const testFileName = match ? `${match[1]}.json` : selectedDirectory;
                    setSelectedFile(testFileName);
                } else {
                    if (files.length > 0 && !selectedFile) {
                        setSelectedFile(files[0].name);
                    }
                }
            } catch (err) {
                console.error('Error loading test files:', err);
                setError('Failed to load test files');
            } finally {
                setLoading(false);
            }
        };

        loadFiles();
    }, [selectedDirectory]);

    useEffect(() => {
        const loadTestResult = async () => {
            if (!selectedDirectory || !selectedFile) return;

            setLoading(true);
            setError(null);

            try {
                const result = await fetchTestResult(selectedDirectory, selectedFile);
                setSelectedTestResult(result);
            } catch (err) {
                console.error('Error loading test result:', err);
                setError('Failed to load test result');
            } finally {
                setLoading(false);
            }
        };

        loadTestResult();
    }, [selectedDirectory, selectedFile]);

    const handleDirectoryChange = (directory: string) => {
        setSelectedDirectory(directory);
        navigate(`/results/${directory}`);
        setSelectedFile(null);
        setSelectedTestResult(null);
    };

    const handleFileChange = (file: string) => {
        setSelectedFile(file);
    };

    const handleExportSingleTestPDF = async () => {
        if (!selectedTestResult || !selectedFile || !selectedDirectory) return;

        const testName = selectedFile.replace('.json', '');
        const runTime = directories.find(d => d.name === selectedDirectory)?.date.toLocaleString('pl-PL', {
            timeZone: 'Europe/Warsaw'
        }) || 'Unknown';

        await generateSingleTestPDF(
            selectedTestResult,
            testName,
            selectedDirectory,
            runTime,
            setIsGeneratingPDF
        );
    };

    const isVirtualDirectory = selectedDirectory?.endsWith('.json') || false;
    const getTestTypeLabel = (directoryName: string) => {
        if (directoryName.endsWith('.json')) return 'Individual Test';
        if (directoryName.includes('sequential_')) return 'Sequential Run';
        if (directoryName.includes('parallel_')) return 'Parallel Run';
        return 'Test Run';
    };

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-3xl font-bold">Test Results</h1>

                {/* Export PDF Button for single test */}
                {selectedTestResult && selectedFile && (
                    <button
                        onClick={handleExportSingleTestPDF}
                        disabled={isGeneratingPDF}
                        className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-gray-400 transition-colors shadow-sm"
                        title="Export detailed PDF report for this test"
                    >
                        {isGeneratingPDF ? (
                            <>
                                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                <span>Generating PDF...</span>
                            </>
                        ) : (
                            <>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                                </svg>
                                <span>Export Test PDF</span>
                            </>
                        )}
                    </button>
                )}
            </div>

            <div className="mb-6">
                <DirectorySelector
                    directories={directories}
                    selectedDirectory={selectedDirectory}
                    onDirectoryChange={handleDirectoryChange}
                />
            </div>

            {/* Test Type Info */}
            {selectedDirectory && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                    <div className="flex items-center space-x-3">
                        <span className="text-blue-600">
                            {isVirtualDirectory ? '🎯' : selectedDirectory.includes('sequential_') ? '📋' : '⚡'}
                        </span>
                        <div>
                            <h3 className="font-medium text-blue-900">
                                {getTestTypeLabel(selectedDirectory)}
                            </h3>
                            <p className="text-sm text-blue-700">
                                {isVirtualDirectory
                                    ? 'Individual test result - single endpoint performance analysis'
                                    : selectedDirectory.includes('sequential_')
                                        ? 'Sequential test run - multiple tests executed one after another'
                                        : 'Test run containing multiple test results'
                                }
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {loading && !selectedTestResult ? (
                <div className="text-center py-10">
                    <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                    <p className="mt-3 text-gray-600">Loading test results...</p>
                </div>
            ) : error ? (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                    <p>{error}</p>
                </div>
            ) : (
                <div>
                    {/* Only show tabs if it's not a virtual directory or if there are multiple files */}
                    {(!isVirtualDirectory || files.length > 1) && (
                        <TestResultTabs
                            files={files}
                            selectedFile={selectedFile}
                            onFileChange={handleFileChange}
                        />
                    )}

                    {selectedTestResult && selectedFile && (
                        <TestResultDetail
                            testResult={selectedTestResult}
                            testName={selectedFile.replace('.json', '')}
                            repositoryName={(() => {
                                const selectedDir = directories.find(d => d.name === selectedDirectory);
                                console.log('🔍 TestResults passing repository info:', {
                                    selectedDirectory,
                                    selectedDir: selectedDir ? {
                                        name: selectedDir.name,
                                        repositoryName: selectedDir.repositoryName,
                                        repositoryId: selectedDir.repositoryId,
                                        testName: selectedDir.testName
                                    } : null
                                });
                                return selectedDir?.repositoryName;
                            })()}
                            directoryName={selectedDirectory || undefined}
                            selectedDirectory={directories.find(d => d.name === selectedDirectory)}
                        />
                    )}

                    {!selectedTestResult && !loading && (
                        <div className="bg-white rounded-lg shadow-md p-6">
                            <div className="text-center py-8">
                                <div className="text-4xl mb-4">📊</div>
                                <h3 className="text-lg font-medium text-gray-900 mb-2">No Test Results Selected</h3>
                                <p className="text-gray-600">
                                    {files.length > 0
                                        ? 'Select a test file from the tabs above to view detailed results.'
                                        : 'No test results available in the selected directory.'
                                    }
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default TestResults;
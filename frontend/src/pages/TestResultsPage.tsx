#!/usr/bin/env node
import React, { useState, useEffect, useMemo, useCallback } from "react"; // Added useMemo, useCallback
import { useParams, useNavigate, useLocation } from "react-router-dom"; // Added useLocation
import { fetchResultFiles, fetchTestResult } from "../api/results";
import { TestFile, TestResult } from "../types/testResults";
import DirectorySelector from "../components/organisms/DirectorySelector";
import TabGroup from "../components/molecules/TabGroup"; // Was TestResultTabs
import TestResultDetail from "../components/organisms/TestResultDetail";
import { useSingleTestPDFGenerator } from "../context/SingleTestPDFReport";
import { useTestResults } from "../context/TestResultContext";
import Button from "../components/atoms/Button"; // For PDF export button

const TestResultsPage: React.FC = () => {
    const { directory: directoryParam } = useParams<{ directory?: string }>(); // Renamed to avoid conflict
    const navigate = useNavigate();
    const location = useLocation(); // For pathname analysis
    const { directories, selectedDirectory, setSelectedDirectory, loading: directoriesLoading, error: directoriesError } = useTestResults();
    const { generateSingleTestPDF } = useSingleTestPDFGenerator();

    const [files, setFiles] = useState<TestFile[]>([]);
    const [selectedFile, setSelectedFile] = useState<string | null>(null);
    const [selectedTestResult, setSelectedTestResult] = useState<TestResult | null>(null);
    const [loading, setLoading] = useState<boolean>(false); // For files and test result loading
    const [error, setError] = useState<string | null>(null);
    const [isGeneratingPDF, setIsGeneratingPDF] = useState<boolean>(false);

    useEffect(() => {
        let targetDirectory: string | null = null;
        if (directoryParam) {
            targetDirectory = directoryParam;
        } else {
            const pathParts = location.pathname.split("/").filter(Boolean);
            if (pathParts.length >= 3 && pathParts[0] === "results") {
                const repoId = pathParts[1];
                const remainingPath = pathParts.slice(2).join("/");
                targetDirectory = `${repoId}/${remainingPath}`;
            }
        }

        if (targetDirectory && targetDirectory !== selectedDirectory) {
            setSelectedDirectory(targetDirectory);
        } else if (!targetDirectory && selectedDirectory && !directoriesLoading) { // Ensure not to navigate away if directories are loading
            navigate(`/results/${selectedDirectory}`);
        }
    }, [directoryParam, location.pathname, selectedDirectory, setSelectedDirectory, navigate, directoriesLoading]);

    useEffect(() => {
        const loadFiles = async () => {
            if (!selectedDirectory || directoriesLoading) { // Dont load if parent dir context is loading
                 setFiles([]); // Clear files if no selectedDirectory
                 setSelectedFile(null);
                 setSelectedTestResult(null);
                return;
            }
            setLoading(true);
            setError(null);
            try {
                const fetchedFiles = await fetchResultFiles(selectedDirectory);
                setFiles(fetchedFiles);
                if (selectedDirectory.endsWith(".json")) {
                    const fileName = selectedDirectory.split("/").pop() || "";
                    // const testFileName = fileName.match(/^\d{8}_\d{6}_(.+)\.json$/) ? `${fileName.match(/^\d{8}_\d{6}_(.+)\.json$/)![1]}.json` : fileName;
                    setSelectedFile(fileName); // The full name is the file name here
                } else {
                    if (fetchedFiles.length > 0 && !selectedFile) { // Only set if selectedFile is not already set (e.g. by direct nav)
                        setSelectedFile(fetchedFiles[0].name);
                    } else if (fetchedFiles.length === 0) {
                        setSelectedFile(null); // No files, clear selection
                        setSelectedTestResult(null);
                    }
                }
            } catch (err) {
                console.error("Error loading test files:", err);
                setError("Failed to load test files");
                setFiles([]);
                setSelectedFile(null);
            } finally {
                setLoading(false);
            }
        };
        loadFiles();
    }, [selectedDirectory, directoriesLoading]); // Added selectedFile to deps? No, it would cause loop.

    useEffect(() => {
        const loadTestResult = async () => {
            if (!selectedDirectory || !selectedFile) {
                setSelectedTestResult(null); // Clear result if no file/dir
                return;
            }
            setLoading(true);
            setError(null);
            try {
                const result = await fetchTestResult(selectedDirectory, selectedFile);
                setSelectedTestResult(result);
            } catch (err) {
                console.error("Error loading test result:", err);
                setError("Failed to load test result");
                setSelectedTestResult(null);
            } finally {
                setLoading(false);
            }
        };
        loadTestResult();
    }, [selectedDirectory, selectedFile]);

    const handleDirectoryChange = useCallback((directory: string | null) => {
        if (directory) {
            setSelectedDirectory(directory); // This will trigger navigation via the first useEffect
            // Reset file and result states as new directory is selected
            setSelectedFile(null);
            setSelectedTestResult(null);
            navigate(`/results/${directory}`); // Explicit navigation
        }
    }, [setSelectedDirectory, navigate]);

    const handleFileChange = useCallback((file: string) => {
        setSelectedFile(file);
    }, []);

    const pdfTestName = useMemo(() => selectedFile?.replace(".json", "") || "test", [selectedFile]);

    const pdfRunTime = useMemo(() => {
        return directories.find(d => d.name === selectedDirectory)?.date.toLocaleString("pl-PL", { timeZone: "Europe/Warsaw" }) || "Unknown";
    }, [directories, selectedDirectory]);

    const handleExportSingleTestPDF = useCallback(async () => {
        if (!selectedTestResult || !selectedFile || !selectedDirectory) return;
        await generateSingleTestPDF(selectedTestResult, pdfTestName, selectedDirectory, pdfRunTime, setIsGeneratingPDF);
    }, [selectedTestResult, selectedFile, selectedDirectory, generateSingleTestPDF, pdfTestName, pdfRunTime]);

    const isVirtualDirectory = useMemo(() => selectedDirectory?.endsWith(".json") || false, [selectedDirectory]);

    const getTestTypeLabel = useCallback((directoryName: string | null) => {
        if (!directoryName) return "N/A";
        if (directoryName.endsWith(".json")) return "Individual Test";
        if (directoryName.includes("sequential_")) return "Sequential Run";
        if (directoryName.includes("parallel_")) return "Parallel Run";
        return "Test Run";
    }, []);

    const currentDirectoryDetails = useMemo(() => {
        return directories.find(d => d.name === selectedDirectory);
    }, [directories, selectedDirectory]);

    if (directoriesLoading && !currentDirectoryDetails) { // Show loading if directories are loading and we don''t have details yet
        return <div className="text-center py-10"><div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div><p className="mt-3 text-gray-600">Loading directory info...</p></div>;
    }

    if (directoriesError) {
         return <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded"><p>{directoriesError}</p></div>;
    }

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-3xl font-bold">Test Results</h1>
                {selectedTestResult && selectedFile && (
                    <Button
                        onClick={handleExportSingleTestPDF}
                        disabled={isGeneratingPDF}
                        variant="primary"
                        customClassName="flex items-center space-x-2" // Example custom class
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
                    </Button>
                )}
            </div>

            <div className="mb-6">
                <DirectorySelector directories={directories} selectedDirectory={selectedDirectory} onDirectoryChange={handleDirectoryChange} />
            </div>

            {selectedDirectory && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                    {/* Content based on selectedDirectory */}
                </div>
            )}

            {loading && !selectedTestResult ? ( // Loading for individual test result
                <div className="text-center py-10">
                    <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                    <p className="mt-3 text-gray-600">Loading test files/results...</p>
                </div>
            ) : error ? (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded"><p>{error}</p></div>
            ) : (
                <div>
                    {(!isVirtualDirectory || files.length > 1) && files.length > 0 && ( // Show tabs if not virtual OR many files, AND files exist
                        <TabGroup files={files} selectedFile={selectedFile} onFileChange={handleFileChange} />
                    )}
                    {selectedTestResult && selectedFile && (
                        <TestResultDetail testResult={selectedTestResult} testName={selectedFile.replace(".json", "")} repositoryName={currentDirectoryDetails?.repositoryName} directoryName={selectedDirectory || undefined} selectedDirectory={currentDirectoryDetails} />
                    )}
                    {!selectedTestResult && !loading && selectedDirectory && ( // Show if no result, not loading, and a directory is selected
                        <div className="bg-white rounded-lg shadow-md p-6">
                            <div className="text-center py-8">
                                <div className="text-4xl mb-4">📊</div>
                                <h3 className="text-lg font-medium text-gray-900 mb-2">No Test Results Selected/Available</h3>
                                <p className="text-gray-600">
                                    {files.length > 0 ? "Select a test file from the tabs above to view detailed results." : selectedDirectory ? "No test results available in the selected directory." : "Please select a directory."}
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
export default TestResultsPage;
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { fetchTestResult, fetchResultFiles } from "../api/results";
import { TestResult, TestDirectory } from "../types/testResults"; // Added TestDirectory
import MetricDisplay from "../components/molecules/MetricDisplay";
import BarChart from "../components/charts/BarChart";
import MultiBarChart from "../components/charts/MultiBarChart";
import PieChart from "../components/charts/PieChart";
import AreaChart from "../components/charts/AreaChart";
import MultiLineChart from "../components/charts/MultiLineChart";
// import TestRunSelector from "../components/organisms/TestRunSelector"; // Using EnhancedTestSelector
import TestRunComparison from "../components/organisms/TestRunComparison";
import EnhancedTestSelector from "../components/organisms/EnhancedTestSelector";
import PerformanceSummary from "../components/organisms/PerformanceSummary";
import { useTestResults } from "../context/TestResultContext";
import ExportPDFButton from "../context/ExportPDFButton"; // Assuming this is memoized or light enough

const DashboardPage: React.FC = () => {
    const { directories, loading: directoriesLoading, error: directoriesError } = useTestResults();
    const navigate = useNavigate();
    const [selectedTestRun, setSelectedTestRun] = useState<string | null>(null);
    const [latestResults, setLatestResults] = useState<Record<string, TestResult>>({});
    const [latestResultsLoading, setLatestResultsLoading] = useState<boolean>(true);

    // Auto-select latest directory when directories load
    useEffect(() => {
        if (directories.length > 0 && !selectedTestRun) {
            setSelectedTestRun(directories[0].name);
        }
    }, [directories, selectedTestRun]); // Added selectedTestRun to dependencies

    useEffect(() => {
        const loadLatestResults = async () => {
            if (!directories.length || !selectedTestRun) {
                // If no test run is selected, and we are not loading directories, clear results
                if (!directoriesLoading) {
                    setLatestResults({});
                    setLatestResultsLoading(false);
                }
                return;
            }

            setLatestResultsLoading(true);
            try {
                const selectedDir = directories.find(d => d.name === selectedTestRun);
                if (!selectedDir) {
                    setLatestResults({}); // Clear if selected dir is somehow not found
                    setLatestResultsLoading(false);
                    return;
                }

                const results: Record<string, TestResult> = {};
                if (selectedDir.name.endsWith(".json")) {
                    const pathParts = selectedDir.name.split("/");
                    const fileName = pathParts[pathParts.length - 1];
                    const testKey = fileName.replace(".json", "").replace(/^\d{8}_\d{6}_/, "");
                    const result = await fetchTestResult(selectedDir.name, fileName);
                    results[testKey] = result;
                } else {
                    const files = await fetchResultFiles(selectedDir.name);
                    if (files.length === 0) {
                        setLatestResults({});
                        setLatestResultsLoading(false);
                        return;
                    }
                    const filesToProcess = files.slice(0, Math.min(10, files.length));
                    for (const file of filesToProcess) {
                        if (!file || !file.name) continue;
                        const result = await fetchTestResult(selectedDir.name, file.name);
                        const testKey = file.name.replace(".json", "");
                        results[testKey] = result;
                    }
                }
                setLatestResults(results);
            } catch (err) {
                console.error("Critical error loading latest results:", err);
                setLatestResults({}); // Clear results on error
            } finally {
                setLatestResultsLoading(false);
            }
        };

        loadLatestResults();
    }, [directories, selectedTestRun, directoriesLoading]); // Added directoriesLoading

    const getMetricValue = useCallback((metric: any, property: string, defaultValue: number = 0): number => {
        if (!metric || typeof metric !== "object" || metric[property] === undefined || metric[property] === null) {
            return defaultValue;
        }
        return typeof metric[property] === "number" ? metric[property] : defaultValue;
    }, []);

    const overallHealthStatus = useMemo(() => {
        if (Object.keys(latestResults).length === 0) return "unknown";
        let passCount = 0;
        let totalCount = 0;
        Object.values(latestResults).forEach(result => {
            if (result.metrics && result.metrics.http_req_failed && getMetricValue(result.metrics.http_req_failed, "value") < 0.1) {
                passCount++;
            }
            totalCount++;
        });
        if (totalCount === 0) return "unknown"; // Avoid division by zero if all results lack metrics
        if (passCount === totalCount) return "healthy";
        if (passCount === 0) return "critical";
        return "warning";
    }, [latestResults, getMetricValue]);

    const totalRequests = useMemo(() => {
        return Object.values(latestResults).reduce((total, result) => {
            const count = getMetricValue(result.metrics?.http_reqs, "count");
            return total + count;
        }, 0);
    }, [latestResults, getMetricValue]);

    const averageResponseTime = useMemo(() => {
        const values = Object.values(latestResults);
        if (values.length === 0) return "0";
        const total = values.reduce((total, result) => {
            const avg = getMetricValue(result.metrics?.http_req_duration, "avg");
            return total + avg;
        }, 0);
        return (total / values.length).toFixed(2);
    }, [latestResults, getMetricValue]);

    const errorRate = useMemo(() => {
        const values = Object.values(latestResults);
        if (values.length === 0) return "0";
        const totalFailedValueSum = values.reduce((total, result) => {
            const rate = getMetricValue(result.metrics?.http_req_failed, "value");
            return total + rate;
        }, 0);
        // This is an average of failure rates, not a true overall error rate if request counts vary wildly.
        // For a true overall rate: sum of all failed requests / sum of all requests.
        // However, sticking to the original logic for now.
        return ((totalFailedValueSum / values.length) * 100).toFixed(2);
    }, [latestResults, getMetricValue]);

    const lastRunTime = useMemo(() => {
        if (!selectedTestRun || directories.length === 0) return "No test run selected";
        const selectedDir = directories.find(d => d.name === selectedTestRun);
        if (!selectedDir) return "Selected run not found";
        try {
            let date: Date;
            if (selectedDir.date instanceof Date) date = selectedDir.date;
            else if (typeof selectedDir.date === "string" || typeof selectedDir.date === "number") date = new Date(selectedDir.date);
            else return "Invalid date format";
            if (isNaN(date.getTime())) return "Invalid date";
            return date.toLocaleString("pl-PL", { timeZone: "Europe/Warsaw", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit" });
        } catch (error) { return "Date format error"; }
    }, [selectedTestRun, directories]);

    const responseTimeComparisonData = useMemo(() => {
        return Object.entries(latestResults).map(([testName, result]) => ({
            name: testName.replace(/-/g, " ").replace(/^\w/, c => c.toUpperCase()),
            avg: getMetricValue(result.metrics?.http_req_duration, "avg"),
            p95: getMetricValue(result.metrics?.http_req_duration, "p(95)"),
        }));
    }, [latestResults, getMetricValue]);

    const requestVolumeData = useMemo(() => {
        return Object.entries(latestResults).map(([testName, result]) => ({
            name: testName.replace(/-/g, " ").replace(/^\w/, c => c.toUpperCase()),
            requests: getMetricValue(result.metrics?.http_reqs, "count"),
        }));
    }, [latestResults, getMetricValue]);

    const successErrorData = useMemo(() => {
        const totalReq = totalRequests; // Use memoized totalRequests
        if (totalReq === 0 && Object.keys(latestResults).length > 0) { // Handle if totalRequests is 0 but there are results (e.g. all results have 0 requests)
            let totalErrorsInResults = 0;
            Object.values(latestResults).forEach(result => {
                totalErrorsInResults += getMetricValue(result.metrics?.http_reqs, "count") * getMetricValue(result.metrics?.http_req_failed, "value");
            });
            if (totalErrorsInResults > 0) return [{ name: "Successful", value: 0 }, { name: "Failed", value: Math.round(totalErrorsInResults) }];
            return [{ name: "Successful", value: 0 }, { name: "Failed", value: 0 }];
        }

        const totalErrors = Object.values(latestResults).reduce((sum, result) =>
            sum + (getMetricValue(result.metrics?.http_reqs, "count") * getMetricValue(result.metrics?.http_req_failed, "value")), 0);
        const successRequests = totalReq - totalErrors;
        return [
            { name: "Successful", value: Math.max(0, Math.round(successRequests)) }, // Ensure non-negative
            { name: "Failed", value: Math.max(0, Math.round(totalErrors)) }, // Ensure non-negative
        ];
    }, [latestResults, totalRequests, getMetricValue]);

    const performanceMetricsData = useMemo(() => {
        return Object.entries(latestResults).map(([testName, result]) => ({
            name: testName.replace(/-/g, " ").substring(0, 15) + (testName.length > 15 ? "..." : ""),
            "Avg Response": getMetricValue(result.metrics?.http_req_duration, "avg"),
            "P95 Response": getMetricValue(result.metrics?.http_req_duration, "p(95)"),
        }));
    }, [latestResults, getMetricValue]);

    const throughputData = useMemo(() => {
        return Object.entries(latestResults).map(([testName, result]) => ({
            name: testName.replace(/-/g, " ").substring(0, 15) + (testName.length > 15 ? "..." : ""),
            "Requests/sec": getMetricValue(result.metrics?.http_reqs, "rate"),
        }));
    }, [latestResults, getMetricValue]);

    const checkResultsData = useMemo(() => {
        const checkData: { name: string, passes: number, fails: number }[] = [];
        Object.entries(latestResults).forEach(([/*testName*/, result]) => { // testName not used
            if (result.root_group?.checks) {
                Object.values(result.root_group.checks).forEach((check: any) => {
                    const existingCheck = checkData.find(c => c.name === check.name);
                    if (existingCheck) {
                        existingCheck.passes += check.passes || 0;
                        existingCheck.fails += check.fails || 0;
                    } else {
                        checkData.push({
                            name: check.name.length > 20 ? check.name.substring(0, 20) + "..." : check.name,
                            passes: check.passes || 0,
                            fails: check.fails || 0,
                        });
                    }
                });
            }
        });
        return checkData.slice(0, 6);
    }, [latestResults]);

    const handleCompareWith = useCallback((compareRunId: string) => {
        alert(`Comparison feature coming soon!\n\nWould compare:\n• Current: ${selectedTestRun}\n• With: ${compareRunId}`);
        // TODO: Implement comparison logic
    }, [selectedTestRun]);

    const handleRunNewTests = useCallback(() => navigate("/test-runner"), [navigate]);

    const handleDirectoryChange = useCallback((directory: string | null) => {
        setSelectedTestRun(directory);
    }, []);


    if (directoriesLoading) {
        return (
            <div className="text-center py-10">
                <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="mt-3 text-gray-600">Loading test directory...</p>
            </div>
        );
    }

    if (directoriesError) {
        return (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                <p>{directoriesError}</p>
                <p className="mt-2">Please make sure the backend server is running and accessible.</p>
            </div>
        );
    }

    const selectedTestRunDetails = useMemo(() => {
        return directories.find(d => d.name === selectedTestRun);
    }, [directories, selectedTestRun]);

    const testRunDisplayName = useMemo(() => {
        if (!selectedTestRunDetails) return "None selected";
        if (selectedTestRunDetails.repositoryName && selectedTestRunDetails.testName) {
            return `${selectedTestRunDetails.repositoryName} / ${selectedTestRunDetails.testName.replace(/-/g, " ").replace(/_/g, " ").split(" ").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ")}`;
        }
        if (selectedTestRunDetails.repositoryName) {
            return `${selectedTestRunDetails.repositoryName} - ${selectedTestRunDetails.name.includes("sequential_") ? "Sequential Tests" : selectedTestRunDetails.name.includes("parallel_") ? "Parallel Tests" : selectedTestRunDetails.name.endsWith(".json") ? "Single Test" : "Test Suite"}`;
        }
        if (selectedTestRunDetails.testName) {
            return selectedTestRunDetails.testName.replace(/-/g, " ").replace(/_/g, " ").split(" ").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
        }
        if (selectedTestRunDetails.name.endsWith(".json")) {
            const fileName = selectedTestRunDetails.name.split("/").pop() || "";
            return fileName.replace(".json", "").replace(/^\d{8}_\d{6}_/, "").replace(/-/g, " ").replace(/_/g, " ").split(" ").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
        }
        return selectedTestRunDetails.name.includes("sequential_") ? "Sequential Tests" : selectedTestRunDetails.name.includes("parallel_") ? "Parallel Tests" : "Test Suite";
    }, [selectedTestRunDetails]);


    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-3xl font-bold">Dashboard</h1>
                <ExportPDFButton
                    latestResults={latestResults}
                    totalRequests={totalRequests}
                    averageResponseTime={averageResponseTime}
                    errorRate={errorRate}
                    lastRunTime={lastRunTime}
                    overallHealthStatus={overallHealthStatus}
                    directoryName={selectedTestRun || ""}
                    disabled={latestResultsLoading}
                />
            </div>

            <EnhancedTestSelector
                directories={directories}
                selectedDirectory={selectedTestRun}
                onDirectoryChange={handleDirectoryChange} // Use useCallback version
                loading={latestResultsLoading || directoriesLoading}
            />

            {selectedTestRun && <TestRunComparison
                directories={directories}
                currentRun={selectedTestRun}
                onCompareWith={handleCompareWith} // Use useCallback version
            />}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <MetricDisplay title="Overall Health" value={overallHealthStatus.charAt(0).toUpperCase() + overallHealthStatus.slice(1)} type="health" status={overallHealthStatus} iconName={overallHealthStatus === "healthy" ? "check-circle" : "alert-triangle"} />
                <MetricDisplay title="Total Requests" value={totalRequests.toLocaleString()} type="number" iconName="request" />
                <MetricDisplay title="Avg Response Time" value={averageResponseTime} unit="ms" type="time" iconName="clock" />
                <MetricDisplay title="Error Rate" value={errorRate} unit="%" type="rate" iconName="warning" />
            </div>

            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                <div className="flex justify-between items-start mb-4">
                    <h2 className="text-xl font-semibold">Selected Test Run Analysis</h2>
                    {selectedTestRun && (
                        <div className="flex items-center space-x-2">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${selectedTestRun.includes("sequential_") ? "bg-blue-100 text-blue-800" : selectedTestRun.includes("parallel_") ? "bg-green-100 text-green-800" : selectedTestRun.endsWith(".json") ? "bg-purple-100 text-purple-800" : "bg-gray-100 text-gray-800"}`}>
                                {selectedTestRun.includes("sequential_") ? "Sequential Tests" : selectedTestRun.includes("parallel_") ? "Parallel Tests" : selectedTestRun.endsWith(".json") ? "Single Test" : "Test Suite"}
                            </span>
                            {selectedTestRun === directories[0]?.name && (<span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">Latest</span>)}
                            <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">{Object.keys(latestResults).length} test(s)</span>
                        </div>
                    )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <p className="text-gray-600"><span className="font-medium">Run Time:</span> {lastRunTime}</p>
                        <p className="text-gray-600 mt-2"><span className="font-medium">Repository:</span> <span className="text-green-600 font-medium">{selectedTestRunDetails?.repositoryName || "N/A"}</span></p>
                        <p className="text-gray-600 mt-2"><span className="font-medium">Test:</span> <span className="text-blue-600">{testRunDisplayName}</span></p>
                        <p className="text-gray-600 mt-2"><span className="font-medium">Tests Analyzed:</span> {Object.keys(latestResults).length}</p>
                    </div>
                    <div className="flex justify-between items-center">
                        <Link to={`/results/${selectedTestRun || ""}`} className="text-blue-600 hover:text-blue-800 font-medium">View Detailed Results →</Link>
                        <div className="text-sm text-gray-500 bg-gray-50 px-3 py-2 rounded-md">
                            <span className="font-medium text-green-600">✓ Clean PDF Report</span><br />Professional 2-page analysis
                        </div>
                    </div>
                </div>
            </div>

            <div className="space-y-8">
                {latestResultsLoading ? (
                    <div className="text-center py-10">
                        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                        <p className="mt-2 text-gray-600">Loading detailed analytics...</p>
                    </div>
                ) : Object.keys(latestResults).length === 0 ? (
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <div className="text-center py-8">
                            <div className="text-4xl mb-4">📊</div><h3 className="text-lg font-medium text-gray-900 mb-2">No Test Data Available</h3>
                            <p className="text-gray-600 mb-4">{selectedTestRun ? "The selected test run contains no analyzable data." : "Please select a test run to analyze performance data."}</p>
                            <Link to="/test-runner" className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"><span className="mr-2">🚀</span>Run New Tests</Link>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div className="bg-white rounded-lg shadow-md p-6"><div className="h-80">
                                <MultiBarChart title="Response Time Comparison" data={responseTimeComparisonData} xKey="name" series={[{ key: "avg", name: "Average", color: "#3b82f6" }, { key: "p95", name: "95th Percentile", color: "#ef4444" }]} yLabel="Response Time (ms)" />
                            </div></div>
                            <div className="bg-white rounded-lg shadow-md p-6"><div className="h-80">
                                <BarChart title="Request Volume by Test" data={requestVolumeData} xKey="name" yKey="requests" yLabel="Total Requests" color="#10b981" />
                            </div></div>
                        </div>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div className="bg-white rounded-lg shadow-md p-6"><div className="h-80">
                                <MultiLineChart title="Performance Metrics Trend" data={performanceMetricsData} xKey="name" series={[{ key: "Avg Response", name: "Avg Response (ms)", color: "#3b82f6" }, { key: "P95 Response", name: "P95 Response (ms)", color: "#ef4444" }]} yLabel="Response Time (ms)" />
                            </div></div>
                            <div className="bg-white rounded-lg shadow-md p-6"><div className="h-80">
                                <PieChart title="Success vs Error Rate" data={successErrorData} nameKey="name" valueKey="value" colors={["#10b981", "#ef4444"]} />
                            </div></div>
                        </div>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div className="bg-white rounded-lg shadow-md p-6"><div className="h-80">
                                <AreaChart title="Request Throughput" data={throughputData} xKey="name" yKey="Requests/sec" yLabel="Requests per Second" color="#8b5cf6" />
                            </div></div>
                            <div className="bg-white rounded-lg shadow-md p-6"><div className="h-80">
                                <MultiBarChart title="Test Checks Results" data={checkResultsData} xKey="name" series={[{ key: "passes", name: "Passed", color: "#10b981" }, { key: "fails", name: "Failed", color: "#ef4444" }]} yLabel="Check Count" stacked={true} />
                            </div></div>
                        </div>
                        <PerformanceSummary results={latestResults} onRunNewTests={handleRunNewTests} />
                    </>
                )}
            </div>
        </div>
    );
};

export default DashboardPage;
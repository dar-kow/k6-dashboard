#!/usr/bin/env node
import React, { useState, useEffect, useRef, useCallback, useMemo } from "react"; // Added useCallback, useMemo
import axios from "axios";
import { io, Socket } from "socket.io-client";
import Terminal from "../components/organisms/Terminal"; // Renamed from TerminalOutput
import { useTestResults } from "../context/TestResultContext";
import { useRepository } from "../context/RepositoryContext";
import RepositorySelector from "../components/organisms/RepositorySelector";
import Button from "../components/atoms/Button";
import Select from "../components/atoms/Select"; // Assuming Select atom is available
import Input from "../components/atoms/Input";   // Assuming Input atom is available

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";
const BASE_URL = API_URL.replace('/api', '');

interface TestConfig {
    name: string;
    description: string;
    file: string;
}
interface EnvironmentConfig {
    environment: "PROD" | "DEV";
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
    const handleSave = () => { onSave(token, host); onClose(); };
    return ( <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"> {/* ... Modal content using Input atom ... */} <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4"> <h3 className="text-lg font-semibold mb-4">Configure Custom Environment</h3> <div className="mb-4"> <label className="block text-sm font-medium text-gray-700 mb-2"> Custom Host URL </label> <Input className="w-full p-3 border border-gray-300 rounded-md text-sm" value={host} onChange={(e) => setHost(e.target.value)} placeholder="https://api.example.com" /> </div> <div className="mb-4"> <label className="block text-sm font-medium text-gray-700 mb-2"> Custom API Token </label> <textarea className="w-full p-3 border border-gray-300 rounded-md text-xs font-mono" rows={4} value={token} onChange={(e) => setToken(e.target.value)} placeholder="Enter your JWT token here..." /> </div> <div className="flex justify-end space-x-3"> <Button onClick={onClose} variant="secondary"> Cancel </Button> <Button onClick={handleSave} variant="primary"> Save Configuration </Button> </div> </div> </div> );
};
const StopConfirmationModal: React.FC<{ isOpen: boolean; onConfirm: () => void; onCancel: () => void; }> = ({ isOpen, onConfirm, onCancel }) => {
    if (!isOpen) return null;
    return ( <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"> <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4"> <h3 className="text-lg font-semibold mb-4 text-red-600">⚠️ Stop Test Execution</h3> <p className="text-gray-700 mb-6"> Are you sure you want to stop the running test? This action cannot be undone. </p> <div className="flex justify-end space-x-3"> <Button onClick={onCancel} variant="secondary">Cancel</Button> <Button onClick={onConfirm} variant="danger">🛑 Stop Test</Button> </div> </div> </div> );
};


const TestRunnerPage: React.FC = () => {
    const { refreshData } = useTestResults();
    const { selectedRepository, selectedRepositoryConfig } = useRepository();
    const [tests, setTests] = useState<TestConfig[]>([]);
    const [selectedTest, setSelectedTest] = useState<string>("");
    const [selectedProfile, setSelectedProfile] = useState<string>("LIGHT");
    const [isRunning, setIsRunning] = useState<boolean>(false);
    const [output, setOutput] = useState<string[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [socketConnected, setSocketConnected] = useState<boolean>(false);
    const [autoScroll, setAutoScroll] = useState<boolean>(true);
    const [showStopConfirmation, setShowStopConfirmation] = useState<boolean>(false);
    const [runningTestId, setRunningTestId] = useState<string | null>(null);
    const [environment, setEnvironment] = useState<"PROD" | "DEV">("PROD");
    const [customToken, setCustomToken] = useState<string>("");
    const [customHost, setCustomHost] = useState<string>("");
    const [isTokenModalOpen, setIsTokenModalOpen] = useState<boolean>(false);
    const socketRef = useRef<Socket | null>(null);

    useEffect(() => {
        const savedConfig = localStorage.getItem("k6-dashboard-config");
        if (savedConfig) {
            try {
                const config: EnvironmentConfig = JSON.parse(savedConfig);
                setEnvironment(config.environment || "PROD");
                setCustomToken(config.customToken || "");
                setCustomHost(config.customHost || "");
            } catch (err) { console.error("Error parsing saved config:", err); }
        }
    }, []);

    const saveConfig = useCallback((env: "PROD" | "DEV", token: string, host: string) => {
        const config: EnvironmentConfig = { environment: env, customToken: token, customHost: host };
        localStorage.setItem("k6-dashboard-config", JSON.stringify(config));
    }, []);

    const handleEnvironmentChange = useCallback((env: "PROD" | "DEV") => {
        setEnvironment(env);
        saveConfig(env, customToken, customHost);
        setOutput(prev => [...prev, `🔄 Switched to ${env} environment`]);
    }, [customToken, customHost, saveConfig]);

    const handleTokenSave = useCallback((token: string, host: string) => {
        setCustomToken(token);
        setCustomHost(host);
        saveConfig(environment, token, host);
        setOutput(prev => [...prev, `🔑 Custom configuration ${token || host ? "updated" : "cleared"}`]);
    }, [environment, saveConfig]);

    useEffect(() => {
        const fetchTests = async () => {
            try {
                const url = selectedRepository ? `${API_URL}/tests?repositoryId=${selectedRepository.id}` : `${API_URL}/tests`;
                const response = await axios.get<{ tests: TestConfig[] }>(url); // Assuming API returns { tests: [...] }
                setTests(response.data.tests || response.data as any); // Adjust based on actual API response
                if (response.data.tests && response.data.tests.length > 0) { setSelectedTest(response.data.tests[0].name); }
                else if (Array.isArray(response.data) && response.data.length > 0) { setSelectedTest(response.data[0].name); }

            } catch (err: any) { setError(`Failed to load available tests: ${err.message}`); }
        };
        fetchTests();
    }, [selectedRepository]);

    useEffect(() => {
        if (socketRef.current) { socketRef.current.disconnect(); }
        const socket = io(BASE_URL, { withCredentials: true, reconnection: true, reconnectionAttempts: 5, reconnectionDelay: 1000 });
        socketRef.current = socket;
        socket.on("connect", () => { setOutput(prev => [...prev, "WebSocket connection established"]); setSocketConnected(true); setError(null); });
        socket.on("testOutput", (message: {type: string, data: string}) => {
            if (message.type === "log") { setOutput(prev => [...prev, message.data]); }
            else if (message.type === "error") { setOutput(prev => [...prev, `ERROR: ${message.data}`]); }
            else if (message.type === "complete") { setIsRunning(false); setRunningTestId(null); setOutput(prev => [...prev, message.data]); setTimeout(() => refreshData(), 2000); }
            else if (message.type === "stopped") { setIsRunning(false); setRunningTestId(null); setOutput(prev => [...prev, `🛑 ${message.data}`]); }
        });
        socket.on("disconnect", () => { setSocketConnected(false); setOutput(prev => [...prev, "WebSocket connection closed"]); });
        socket.on("connect_error", (err) => { setError(`WebSocket connection error: ${err.message}. Reconnecting...`); });
        return () => { socket.disconnect(); };
    }, [refreshData]);

    const commonRunLogic = useCallback(async (testType: "single" | "all") => {
        if (testType === "single" && !selectedTest) return;
        const testIdSuffix = testType === "single" ? selectedTest : "all-tests";
        const testId = `${testIdSuffix}-${Date.now()}`;
        setRunningTestId(testId);
        setIsRunning(true);
        const testDescription = testType === "single" ? selectedTest : "all tests sequentially";
        setOutput([`🚀 Starting ${testDescription} with profile: ${selectedProfile} on ${environment}`]);
        setError(null);
        setAutoScroll(true);

        const payload = { testId, profile: selectedProfile, environment, customToken, customHost, repositoryId: selectedRepository?.id, test: testType === "single" ? selectedTest : "all" };
        const endpoint = testType === "single" ? "/run/test" : "/run/all";

        try {
            socketRef.current?.emit("test_request", payload);
            await axios.post(`${API_URL}${endpoint}`, payload);
        } catch (err: any) { setError(`Failed to start test execution: ${err.message}`); setIsRunning(false); setRunningTestId(null); }
    }, [selectedTest, selectedProfile, environment, customToken, customHost, selectedRepository]);

    const runTest = useCallback(() => commonRunLogic("single"), [commonRunLogic]);
    const runAllTests = useCallback(() => commonRunLogic("all"), [commonRunLogic]);

    const stopTest = useCallback(async () => {
        if (!runningTestId) return;
        try {
            socketRef.current?.emit("stop_test", { testId: runningTestId });
            await axios.post(`${API_URL}/run/stop`, { testId: runningTestId });
            setOutput(prev => [...prev, `🛑 Stopping test: ${runningTestId}...`]);
        } catch (err: any) { setError(`Failed to stop test: ${err.message}`); }
    }, [runningTestId]);

    const handleStopConfirmation = useCallback(() => { setShowStopConfirmation(false); stopTest(); }, [stopTest]);
    const clearOutput = useCallback(() => { setOutput([]); setAutoScroll(true); }, []);
    const clearConnection = useCallback(() => { socketRef.current?.disconnect(); setSocketConnected(false); setIsRunning(false); setRunningTestId(null); setOutput(["🔄 Clearing connection and resetting..."]); setTimeout(() => window.location.reload(), 1000); }, []);
    const toggleAutoScroll = useCallback(() => setAutoScroll(prev => !prev), []);

    const availableProfiles = useMemo(() => selectedRepositoryConfig?.availableProfiles || ["LIGHT", "MEDIUM", "HEAVY"], [selectedRepositoryConfig]);
    const getProfileDetails = useCallback((profileName: string) => {
        if (selectedRepositoryConfig?.loadProfiles[profileName]) {
            const profile = selectedRepositoryConfig.loadProfiles[profileName];
            return `${profileName} (${profile.vus} VUs, ${profile.duration})`;
        }
        switch (profileName) { case "LIGHT": return "Light (10 VUs, 60s)"; case "MEDIUM": return "Medium (30 VUs, 5m)"; case "HEAVY": return "Heavy (100 VUs, 10m)"; default: return profileName; }
    }, [selectedRepositoryConfig]);

    const selectedTestConfig = useMemo(() => tests.find(t => t.name === selectedTest), [tests, selectedTest]);


    return ( <div> <h1 className="text-3xl font-bold mb-6">Test Runner</h1> {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6"><p>{error}</p></div>} <RepositorySelector /> {/* ... rest of JSX using Button, Select atoms ... */} <div className="bg-white rounded-lg shadow-md p-6 mb-6"> {/* Header Section */} <div className="flex items-center justify-between mb-4"> <h2 className="text-xl font-semibold">Run Tests</h2> {/* Environment and Token Config Buttons */} <div className="flex items-center space-x-4"> <div className="flex items-center space-x-2"> <span className="text-sm font-medium text-gray-700">Environment:</span> <div className="flex bg-gray-100 rounded-lg p-1"> <Button onClick={() => handleEnvironmentChange("PROD")} variant={environment === "PROD" ? "primary" : "secondary"} disabled={isRunning} customClassName={environment !== "PROD" ? "!bg-gray-200 !text-gray-700" : ""}>🚀 PROD</Button> <Button onClick={() => handleEnvironmentChange("DEV")} variant={environment === "DEV" ? "primary" : "secondary"} customClassName={environment === "DEV" ? "!bg-orange-500" : "!bg-gray-200 !text-gray-700"} disabled={isRunning}>🔧 DEV</Button> </div> </div> <Button onClick={() => setIsTokenModalOpen(true)} variant="secondary" customClassName="!bg-gray-100 !text-gray-700" disabled={isRunning}> {customToken || customHost ? "Custom Config Set" : "Set Custom"} </Button> </div> </div> {/* Connection Status */} <div className="mb-4"> {/* ... WebSocket status ... */} </div> {/* Test and Profile Selectors */} <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6"> <div> <label className="block text-sm font-medium text-gray-700 mb-2">Select Test</label> <Select value={selectedTest} onChange={(e) => setSelectedTest(e.target.value)} disabled={isRunning} > <option value="" disabled>Select a test</option> {tests.length > 0 ? ( tests.map((test) => ( <option key={test.name} value={test.name}> {test.description || test.name} </option> )) ) : ( <option value="" disabled>No tests available for this repository</option> )} </Select> {selectedTestConfig && <p className="text-xs text-gray-500 mt-1">{selectedTestConfig.description}</p>} </div> <div> <label className="block text-sm font-medium text-gray-700 mb-2">Select Profile</label> <Select value={selectedProfile} onChange={(e) => setSelectedProfile(e.target.value)} disabled={isRunning} > {availableProfiles.map((profile) => ( <option key={profile} value={profile}> {getProfileDetails(profile)} </option> ))} </Select> </div> </div> {/* Action Buttons */} <div className="flex flex-wrap items-center gap-4"> <Button onClick={runTest} variant="primary" disabled={isRunning || !selectedTest}> {isRunning ? "Running..." : "Run Selected Test"} </Button> <Button onClick={runAllTests} customClassName="!bg-green-600 hover:!bg-green-700" disabled={isRunning}> {isRunning ? "Running..." : "Run All Tests Sequentially"} </Button> {isRunning && <Button onClick={() => setShowStopConfirmation(true)} variant="danger">🛑 Stop Test</Button>} <Button onClick={clearOutput} variant="secondary" customClassName="!bg-gray-600 hover:!bg-gray-700"> Clear Output </Button> </div> </div> {/* Output Section */} <div className="bg-white rounded-lg shadow-md p-6"> <h2 className="text-xl font-semibold mb-4">Test Execution Output</h2> {/* ... Info text ... */} <Terminal output={output} autoScroll={autoScroll} onAutoScrollToggle={toggleAutoScroll} /> </div> <TokenConfigModal isOpen={isTokenModalOpen} onClose={() => setIsTokenModalOpen(false)} onSave={handleTokenSave} currentToken={customToken} currentHost={customHost} /> <StopConfirmationModal isOpen={showStopConfirmation} onConfirm={handleStopConfirmation} onCancel={() => setShowStopConfirmation(false)} /> </div> ); };
export default TestRunnerPage;
                return profileName;
        }
    }, [selectedRepositoryConfig]);

    const selectedTestConfig = useMemo(() => tests.find(t => t.name === selectedTest), [tests, selectedTest]);


    return ( <div> <h1 className="text-3xl font-bold mb-6">Test Runner</h1> {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6"><p>{error}</p></div>} <RepositorySelector /> {/* ... rest of JSX using Button, Select atoms ... */} <div className="bg-white rounded-lg shadow-md p-6 mb-6"> {/* Header Section */} <div className="flex items-center justify-between mb-4"> <h2 className="text-xl font-semibold">Run Tests</h2> {/* Environment and Token Config Buttons */} <div className="flex items-center space-x-4"> <div className="flex items-center space-x-2"> <span className="text-sm font-medium text-gray-700">Environment:</span> <div className="flex bg-gray-100 rounded-lg p-1"> <Button onClick={() => handleEnvironmentChange("PROD")} variant={environment === "PROD" ? "primary" : "secondary"} disabled={isRunning} customClassName={environment !== "PROD" ? "!bg-gray-200 !text-gray-700" : ""}>🚀 PROD</Button> <Button onClick={() => handleEnvironmentChange("DEV")} variant={environment === "DEV" ? "primary" : "secondary"} customClassName={environment === "DEV" ? "!bg-orange-500" : "!bg-gray-200 !text-gray-700"} disabled={isRunning}>🔧 DEV</Button> </div> </div> <Button onClick={() => setIsTokenModalOpen(true)} variant="secondary" customClassName="!bg-gray-100 !text-gray-700" disabled={isRunning}> {customToken || customHost ? "Custom Config Set" : "Set Custom"} </Button> </div> </div> {/* Connection Status */} <div className="mb-4"> {/* ... WebSocket status ... */} </div> {/* Test and Profile Selectors */} <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6"> <div> <label className="block text-sm font-medium text-gray-700 mb-2">Select Test</label> <Select value={selectedTest} onChange={(e) => setSelectedTest(e.target.value)} disabled={isRunning} > <option value="" disabled>Select a test</option> {tests.length > 0 ? ( tests.map((test) => ( <option key={test.name} value={test.name}> {test.description || test.name} </option> )) ) : ( <option value="" disabled>No tests available for this repository</option> )} </Select> {selectedTestConfig && <p className="text-xs text-gray-500 mt-1">{selectedTestConfig.description}</p>} </div> <div> <label className="block text-sm font-medium text-gray-700 mb-2">Select Profile</label> <Select value={selectedProfile} onChange={(e) => setSelectedProfile(e.target.value)} disabled={isRunning} > {availableProfiles.map((profile) => ( <option key={profile} value={profile}> {getProfileDetails(profile)} </option> ))} </Select> </div> </div> {/* Action Buttons */} <div className="flex flex-wrap items-center gap-4"> <Button onClick={runTest} variant="primary" disabled={isRunning || !selectedTest}> {isRunning ? "Running..." : "Run Selected Test"} </Button> <Button onClick={runAllTests} customClassName="!bg-green-600 hover:!bg-green-700" disabled={isRunning}> {isRunning ? "Running..." : "Run All Tests Sequentially"} </Button> {isRunning && <Button onClick={() => setShowStopConfirmation(true)} variant="danger">🛑 Stop Test</Button>} <Button onClick={clearOutput} variant="secondary" customClassName="!bg-gray-600 hover:!bg-gray-700"> Clear Output </Button> </div> </div> {/* Output Section */} <div className="bg-white rounded-lg shadow-md p-6"> <h2 className="text-xl font-semibold mb-4">Test Execution Output</h2> {/* ... Info text ... */} <Terminal output={output} autoScroll={autoScroll} onAutoScrollToggle={toggleAutoScroll} /> </div> <TokenConfigModal isOpen={isTokenModalOpen} onClose={() => setIsTokenModalOpen(false)} onSave={handleTokenSave} currentToken={customToken} currentHost={customHost} /> <StopConfirmationModal isOpen={showStopConfirmation} onConfirm={handleStopConfirmation} onCancel={() => setShowStopConfirmation(false)} /> </div> ); };
export default TestRunnerPage;
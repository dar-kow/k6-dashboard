import React, { useState, useMemo, useCallback } from "react"; // Added useCallback
import { TestDirectory } from "../../types/testResults"; // Adjusted path
import Select from "../atoms/Select"; // Using Select Atom
import Input from "../atoms/Input";   // Using Input Atom

interface EnhancedTestSelectorProps {
    directories: TestDirectory[];
    selectedDirectory: string | null;
    onDirectoryChange: (directory: string) => void; // Assuming this is stable or memoized by parent
    loading?: boolean;
}

const EnhancedTestSelector: React.FC<EnhancedTestSelectorProps> = ({
    directories,
    selectedDirectory,
    onDirectoryChange, // This prop should be memoized by parent if EnhancedTestSelector is memoized
    loading = false,
}) => {
    const [filterType, setFilterType] = useState<"all" | "single" | "sequential">("all");
    const [dateFilter, setDateFilter] = useState<string>("");

    const filteredDirectories = useMemo(() => {
        let filtered = directories;
        if (filterType === "single") {
            filtered = filtered.filter(dir => dir.name.endsWith(".json"));
        } else if (filterType === "sequential") {
            filtered = filtered.filter(dir => dir.name.includes("sequential_"));
        }
        if (dateFilter) {
            filtered = filtered.filter(dir => new Date(dir.date).toISOString().split("T")[0] === dateFilter);
        }
        return filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [directories, filterType, dateFilter]);

    const getTestTypeIcon = useCallback((dirName: string) => { /* ... */ return "📊"; }, []);
    const getTestTypeName = useCallback((dirName: string) => { /* ... */ return "Test Suite"; }, []);
    const formatTestName = useCallback((dirName: string) => { /* ... */ return dirName; }, []);
    const getRepositoryDisplayName = useCallback((dir: TestDirectory) => { /* ... */ return "Unknown"; }, []);

    const handleFilterTypeChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
        setFilterType(e.target.value as any);
    }, []);

    const handleDateFilterChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setDateFilter(e.target.value);
    }, []);

    const handleDirectoryChangeInternal = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
        onDirectoryChange(e.target.value);
    }, [onDirectoryChange]);


    // Grouped directories also memoized
    const groupedDirectories = useMemo(() => {
        return filteredDirectories.reduce((groups, dir) => {
            const type = dir.name.endsWith(".json") ? "individual" : (dir.name.includes("sequential_") || dir.name.includes("parallel_") ? "sequence_parallel" : "other");
            if (!groups[type]) groups[type] = [];
            groups[type].push(dir);
            return groups;
        }, {} as Record<string, TestDirectory[]>);
    }, [filteredDirectories]);


    return (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6"> {/* Assuming SASS class .o-enhanced-test-selector will be added */}
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">🎯 Test Selection</h2>
                <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">Filter:</span>
                    <Select value={filterType} onChange={handleFilterTypeChange} disabled={loading} customClassName="px-3 py-1 text-sm">
                        <option value="all">All Tests</option>
                        <option value="single">🎯 Single Tests</option>
                        <option value="sequential">📋 Sequential Tests</option>
                    </Select>
                </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
                <div className="lg:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Select Test Run</label>
                    <Select value={selectedDirectory || ""} onChange={handleDirectoryChangeInternal} disabled={loading || filteredDirectories.length === 0} >
                        <option value="" disabled>{loading ? "Loading tests..." : (filteredDirectories.length === 0 ? "No matching tests" : "Select a test run")}</option>
                        {/* Optgroups for better structure if many items */}
                        {Object.entries(groupedDirectories).map(([groupName, dirs]) => (
                            <optgroup label={groupName.replace("_", " / ").toUpperCase()} key={groupName}>
                                {dirs.map((dir, index) => (
                                    <option key={dir.name} value={dir.name}>
                                        {getTestTypeIcon(dir.name)} {getTestTypeName(dir.name)} - {new Date(dir.date).toLocaleString("pl-PL", { timeZone: "Europe/Warsaw", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })}
                                        {/* Logic for "Latest" needs to compare with the absolute latest, not index within filtered group */}
                                        {directories.length > 0 && directories[0].name === dir.name && " 🆕 (Latest Overall)"}
                                    </option>
                                ))}
                            </optgroup>
                        ))}
                    </Select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Date</label>
                    <Input type="date" value={dateFilter} onChange={handleDateFilterChange} disabled={loading} />
                </div>
            </div>
            {/* ... rest of JSX ... */}
        </div>
    );
};
// export default EnhancedTestSelector; // Original
export default React.memo(EnhancedTestSelector); // Memoized
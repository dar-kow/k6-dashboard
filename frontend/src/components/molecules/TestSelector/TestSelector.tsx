import React, { memo } from 'react';

interface Test {
    name: string;
    description: string;
    file: string;
}

interface TestSelectorProps {
    tests: Test[];
    selectedTest: string;
    onTestChange: (test: string) => void;
    disabled?: boolean;
    label?: string;
}

export const TestSelector: React.FC<TestSelectorProps> = memo(({
    tests,
    selectedTest,
    onTestChange,
    disabled = false,
    label = "Select a test"
}) => {
    return (
        <div className="w-full">
            {label && (
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    {label}
                </label>
            )}
            <select
                className="block w-full p-2 border border-gray-300 rounded-md bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                value={selectedTest}
                onChange={(e) => onTestChange(e.target.value)}
                disabled={disabled}
            >
                <option value="" disabled>
                    Select a test
                </option>
                {tests.map((test) => (
                    <option key={test.name} value={test.name}>
                        {test.name} - {test.description}
                    </option>
                ))}
            </select>
        </div>
    );
});

TestSelector.displayName = 'TestSelector';

export default TestSelector;
import React from 'react';

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
}

const TestSelector: React.FC<TestSelectorProps> = ({
    tests,
    selectedTest,
    onTestChange,
    disabled = false,
}) => {
    return (
        <select
            className="block w-full p-2 border border-gray-300 rounded-md"
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
    );
};

export default TestSelector;
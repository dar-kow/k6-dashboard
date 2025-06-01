import React, { memo, useCallback } from 'react';
import { TestFile } from '@/types/testResults';

interface TestResultTabsProps {
    files: TestFile[];
    selectedFile: string | null;
    onFileChange: (file: string) => void;
}

const TestResultTabs: React.FC<TestResultTabsProps> = ({
    files,
    selectedFile,
    onFileChange,
}) => {
    // Memoizowana funkcja formatująca
    const formatFileName = useCallback((fileName: string) => {
        return fileName
            .replace('.json', '')
            .replace(/-/g, ' ')
            .split(' ')
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }, []);

    return (
        <div className="bg-white rounded-lg shadow-md mb-6">
            <div className="border-b border-gray-200">
                <nav className="flex space-x-2 overflow-x-auto p-2">
                    {files.length === 0 ? (
                        <div className="px-4 py-2 text-gray-500">No test files available</div>
                    ) : (
                        files.map((file) => (
                            <button
                                key={file.name}
                                className={`px-4 py-2 font-medium rounded-md transition-colors ${selectedFile === file.name
                                        ? 'bg-blue-600 text-white'
                                        : 'text-gray-700 hover:bg-gray-100'
                                    }`}
                                onClick={() => onFileChange(file.name)}
                            >
                                {formatFileName(file.name)}
                            </button>
                        ))
                    )}
                </nav>
            </div>
        </div>
    );
};

// Wykorzystaj React.memo dla optymalizacji
export default memo(TestResultTabs);
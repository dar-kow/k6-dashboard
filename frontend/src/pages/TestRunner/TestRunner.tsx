import React, { memo, useState, useCallback } from 'react';
import { MainLayout } from '@components/templates';
import { Button, Input, Icon, Spinner } from '@components/atoms';
import { TestSelector } from '@components/molecules';

export const TestRunner = memo(() => {
    const [isRunning, setIsRunning] = useState(false);
    const [selectedTest, setSelectedTest] = useState<string>('');
    const [output, setOutput] = useState<string[]>([]);

    const handleRunTest = useCallback(async () => {
        if (!selectedTest) return;

        setIsRunning(true);
        try {
            // Implementation for running tests
            setOutput(prev => [...prev, `Starting test: ${selectedTest}`]);
        } catch (error) {
            console.error('Test run failed:', error);
        } finally {
            setIsRunning(false);
        }
    }, [selectedTest]);

    const headerActions = (
        <Button
            variant="primary"
            onClick={handleRunTest}
            disabled={isRunning || !selectedTest}
            leftIcon={isRunning ? <Spinner size="sm" /> : <Icon name="play" size="sm" />}
        >
            {isRunning ? 'Running...' : 'Run Test'}
        </Button>
    );

    return (
        <MainLayout
            title="Test Runner"
            actions={headerActions}
        >
            <div className="test-runner">
                {/* Test Configuration */}
                <div className="test-runner__config">
                    <TestSelector
                        options={[]} // Load from API
                        selectedId={selectedTest}
                        onSelect={setSelectedTest}
                    />
                </div>

                {/* Terminal Output */}
                <div className="test-runner__output">
                    <div className="test-runner__terminal">
                        {output.map((line, index) => (
                            <div key={index} className="test-runner__terminal-line">
                                {line}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </MainLayout>
    );
});

TestRunner.displayName = 'TestRunner';
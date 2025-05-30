import React, { memo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MainLayout } from '@components/templates';
import { Button, Icon } from '@components/atoms';
import { SearchBox } from '@components/molecules';
import { TestResultsTable, ChartContainer } from '@components/organisms';
import { useTestResults } from '@hooks/useTestResults';

export const TestResults = memo(() => {
    const { directory } = useParams<{ directory: string }>();
    const navigate = useNavigate();
    const {
        directories,
        files,
        testResult,
        loading,
        error,
        actions: { selectDirectory, selectFile },
    } = useTestResults();

    const handleBackToDashboard = useCallback(() => {
        navigate('/');
    }, [navigate]);

    const headerActions = (
        <div className="test-results__header-actions">
            <Button
                variant="ghost"
                leftIcon={<Icon name="arrow-left" size="sm" />}
                onClick={handleBackToDashboard}
            >
                Back to Dashboard
            </Button>
            <Button
                variant="primary"
                leftIcon={<Icon name="download" size="sm" />}
            >
                Export Results
            </Button>
        </div>
    );

    return (
        <MainLayout
            title="Test Results"
            actions={headerActions}
        >
            <div className="test-results">
                {/* File Browser */}
                <div className="test-results__browser">
                    {/* Implementation for file browser */}
                </div>

                {/* Results Display */}
                <div className="test-results__content">
                    {testResult ? (
                        <>
                            <ChartContainer
                                title="Performance Metrics"
                                loading={loading.result}
                                error={error}
                            >
                                {/* Chart implementation */}
                            </ChartContainer>

                            <TestResultsTable
                                data={[]} // Convert testResult to table format
                                loading={loading.result}
                            />
                        </>
                    ) : (
                        <div className="test-results__empty">
                            <Icon name="file-text" size="lg" />
                            <h3>Select a test result file</h3>
                            <p>Choose a file from the browser to view detailed results.</p>
                        </div>
                    )}
                </div>
            </div>
        </MainLayout>
    );
});

TestResults.displayName = 'TestResults';
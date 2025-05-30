import React, { memo, useMemo } from 'react';
import { Badge, Button, Icon, Spinner } from '../../atoms';
import { usePagination } from '../../../hooks/usePagination';
import './TestResultsTable.scss';

export interface TestResultRow {
    id: string;
    name: string;
    requests: number;
    avgResponse: number;
    p95Response: number;
    errorRate: number;
    throughput: number;
    status: 'success' | 'warning' | 'error';
    lastRun: Date;
}

export interface TestResultsTableProps {
    data: TestResultRow[];
    loading?: boolean;
    onRowClick?: (row: TestResultRow) => void;
    onExport?: (rows: TestResultRow[]) => void;
    itemsPerPage?: number;
}

export const TestResultsTable = memo<TestResultsTableProps>(({
    data,
    loading = false,
    onRowClick,
    onExport,
    itemsPerPage = 10,
}) => {
    const {
        currentPage,
        totalPages,
        startIndex,
        endIndex,
        hasNextPage,
        hasPreviousPage,
        actions: { goToPage, nextPage, previousPage },
    } = usePagination({
        totalItems: data.length,
        itemsPerPage,
    });

    const paginatedData = useMemo(() => {
        return data.slice(startIndex, endIndex);
    }, [data, startIndex, endIndex]);

    const formatNumber = (num: number, decimals = 2) => {
        return num.toLocaleString(undefined, {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals,
        });
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'success': return { variant: 'success' as const, label: 'Healthy' };
            case 'warning': return { variant: 'warning' as const, label: 'Warning' };
            case 'error': return { variant: 'error' as const, label: 'Error' };
            default: return { variant: 'secondary' as const, label: 'Unknown' };
        }
    };

    if (loading) {
        return (
            <div className="test-results-table test-results-table--loading">
                <Spinner size="lg" />
                <p>Loading test results...</p>
            </div>
        );
    }

    return (
        <div className="test-results-table">
            <div className="test-results-table__header">
                <h2 className="test-results-table__title">
                    <Icon name="chart" size="md" />
                    Performance Summary
                </h2>

                {onExport && data.length > 0 && (
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => onExport(data)}
                        leftIcon={<Icon name="download" size="sm" />}
                    >
                        Export
                    </Button>
                )}
            </div>

            {data.length === 0 ? (
                <div className="test-results-table__empty">
                    <Icon name="chart" size="lg" />
                    <h3>No test results available</h3>
                    <p>Run some tests to see performance data here.</p>
                </div>
            ) : (
                <>
                    <div className="test-results-table__container">
                        <table className="test-results-table__table">
                            <thead>
                                <tr>
                                    <th>Test Name</th>
                                    <th>Requests</th>
                                    <th>Avg Response</th>
                                    <th>P95 Response</th>
                                    <th>Error Rate</th>
                                    <th>Throughput</th>
                                    <th>Status</th>
                                    <th>Last Run</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedData.map((row) => {
                                    const statusBadge = getStatusBadge(row.status);

                                    return (
                                        <tr
                                            key={row.id}
                                            className={`test-results-table__row ${onRowClick ? 'test-results-table__row--clickable' : ''}`}
                                            onClick={() => onRowClick?.(row)}
                                        >
                                            <td className="test-results-table__cell--name">
                                                {row.name}
                                            </td>
                                            <td>{formatNumber(row.requests, 0)}</td>
                                            <td>{formatNumber(row.avgResponse)} ms</td>
                                            <td>{formatNumber(row.p95Response)} ms</td>
                                            <td>
                                                <span className={`test-results-table__error-rate ${row.errorRate > 5 ? 'test-results-table__error-rate--high' : ''}`}>
                                                    {formatNumber(row.errorRate)}%
                                                </span>
                                            </td>
                                            <td>{formatNumber(row.throughput)} req/s</td>
                                            <td>
                                                <Badge variant={statusBadge.variant} size="sm">
                                                    {statusBadge.label}
                                                </Badge>
                                            </td>
                                            <td className="test-results-table__cell--date">
                                                {row.lastRun.toLocaleString()}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {totalPages > 1 && (
                        <div className="test-results-table__pagination">
                            <div className="test-results-table__pagination-info">
                                Showing {startIndex + 1}-{endIndex} of {data.length} results
                            </div>

                            <div className="test-results-table__pagination-controls">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={previousPage}
                                    disabled={!hasPreviousPage}
                                    leftIcon={<Icon name="chevron-left" size="sm" />}
                                >
                                    Previous
                                </Button>

                                <span className="test-results-table__pagination-pages">
                                    Page {currentPage} of {totalPages}
                                </span>

                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={nextPage}
                                    disabled={!hasNextPage}
                                    rightIcon={<Icon name="chevron-right" size="sm" />}
                                >
                                    Next
                                </Button>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
});

TestResultsTable.displayName = 'TestResultsTable';
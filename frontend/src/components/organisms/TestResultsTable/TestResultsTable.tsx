import React, { memo, useMemo, useCallback } from 'react';
import { TestResult } from '../../../types/testResults';

interface TestResultsTableProps {
    results: Record<string, TestResult>;
    onTestClick?: (testName: string) => void;
    sortBy?: 'name' | 'requests' | 'avgResponse' | 'errorRate';
    sortDirection?: 'asc' | 'desc';
    onSort?: (column: string) => void;
}

export const TestResultsTable: React.FC<TestResultsTableProps> = memo(({
    results,
    onTestClick,
    sortBy = 'name',
    sortDirection = 'asc',
    onSort,
}) => {
    const getMetricValue = useCallback((metric: any, property: string, defaultValue: number = 0): number => {
        if (!metric || typeof metric !== 'object' || metric[property] === undefined || metric[property] === null) {
            return defaultValue;
        }
        return typeof metric[property] === 'number' ? metric[property] : defaultValue;
    }, []);

    const tableData = useMemo(() => {
        return Object.entries(results).map(([testName, result]) => ({
            testName,
            displayName: testName.replace(/-/g, ' ').replace(/^\w/, c => c.toUpperCase()),
            requests: getMetricValue(result.metrics?.http_reqs, 'count'),
            avgResponse: getMetricValue(result.metrics?.http_req_duration, 'avg'),
            p95Response: getMetricValue(result.metrics?.http_req_duration, 'p(95)'),
            errorRate: getMetricValue(result.metrics?.http_req_failed, 'value') * 100,
            throughput: getMetricValue(result.metrics?.http_reqs, 'rate'),
            result,
        }));
    }, [results, getMetricValue]);

    const sortedData = useMemo(() => {
        const sorted = [...tableData].sort((a, b) => {
            let aVal: any, bVal: any;

            switch (sortBy) {
                case 'name':
                    aVal = a.displayName;
                    bVal = b.displayName;
                    break;
                case 'requests':
                    aVal = a.requests;
                    bVal = b.requests;
                    break;
                case 'avgResponse':
                    aVal = a.avgResponse;
                    bVal = b.avgResponse;
                    break;
                case 'errorRate':
                    aVal = a.errorRate;
                    bVal = b.errorRate;
                    break;
                default:
                    aVal = a.displayName;
                    bVal = b.displayName;
            }

            if (typeof aVal === 'string') {
                return sortDirection === 'asc'
                    ? aVal.localeCompare(bVal)
                    : bVal.localeCompare(aVal);
            }

            return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
        });

        return sorted;
    }, [tableData, sortBy, sortDirection]);

    const handleSort = useCallback((column: string) => {
        if (onSort) {
            onSort(column);
        }
    }, [onSort]);

    const SortIcon: React.FC<{ column: string }> = memo(({ column }) => {
        if (sortBy !== column) {
            return <span className="text-gray-400">↕️</span>;
        }
        return <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>;
    });

    return (
        <div className="overflow-x-auto bg-white rounded-lg shadow">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                            onClick={() => handleSort('name')}
                        >
                            <div className="flex items-center">
                                Test Name
                                <SortIcon column="name" />
                            </div>
                        </th>
                        <th
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                            onClick={() => handleSort('requests')}
                        >
                            <div className="flex items-center">
                                Requests
                                <SortIcon column="requests" />
                            </div>
                        </th>
                        <th
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                            onClick={() => handleSort('avgResponse')}
                        >
                            <div className="flex items-center">
                                Avg Response
                                <SortIcon column="avgResponse" />
                            </div>
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            P95 Response
                        </th>
                        <th
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                            onClick={() => handleSort('errorRate')}
                        >
                            <div className="flex items-center">
                                Error Rate
                                <SortIcon column="errorRate" />
                            </div>
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Throughput
                        </th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {sortedData.map((row) => (
                        <TestResultRow
                            key={row.testName}
                            data={row}
                            onClick={onTestClick}
                        />
                    ))}
                </tbody>
            </table>
        </div>
    );
});

// Memoized row component
const TestResultRow: React.FC<{
    data: any;
    onClick?: (testName: string) => void;
}> = memo(({ data, onClick }) => {
    const handleClick = useCallback(() => {
        if (onClick) {
            onClick(data.testName);
        }
    }, [data.testName, onClick]);

    return (
        <tr
            className={onClick ? 'hover:bg-gray-50 cursor-pointer' : ''}
            onClick={handleClick}
        >
            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {data.displayName}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {data.requests.toLocaleString()}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {data.avgResponse.toFixed(2)} ms
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {data.p95Response.toFixed(2)} ms
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm">
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${data.errorRate < 1
                        ? 'bg-green-100 text-green-800'
                        : data.errorRate < 5
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                    }`}>
                    {data.errorRate.toFixed(2)}%
                </span>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {data.throughput.toFixed(2)} req/s
            </td>
        </tr>
    );
});

TestResultsTable.displayName = 'TestResultsTable';
TestResultRow.displayName = 'TestResultRow';
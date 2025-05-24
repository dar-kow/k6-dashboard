import React from 'react';
import { Document, Page, Text, View, StyleSheet, pdf } from '@react-pdf/renderer';
import { TestResult } from '../types/testResults';

// Style dla PDF - prostsze i czytelniejsze
const styles = StyleSheet.create({
    page: {
        flexDirection: 'column',
        backgroundColor: '#ffffff',
        padding: 30,
        fontFamily: 'Helvetica',
        fontSize: 11,
        lineHeight: 1.4,
    },
    header: {
        marginBottom: 25,
        borderBottom: 2,
        borderBottomColor: '#3B82F6',
        paddingBottom: 15,
    },
    title: {
        fontSize: 22,
        fontFamily: 'Helvetica-Bold',
        color: '#1F2937',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 12,
        color: '#6B7280',
        marginBottom: 4,
    },
    section: {
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 16,
        fontFamily: 'Helvetica-Bold',
        color: '#1F2937',
        marginBottom: 12,
        borderBottom: 1,
        borderBottomColor: '#E5E7EB',
        paddingBottom: 4,
    },
    row: {
        flexDirection: 'row',
        marginBottom: 12,
    },
    column: {
        flex: 1,
        marginRight: 12,
    },
    lastColumn: {
        flex: 1,
        marginRight: 0,
    },
    card: {
        backgroundColor: '#F8FAFC',
        border: 1,
        borderColor: '#E2E8F0',
        borderRadius: 6,
        padding: 12,
        marginBottom: 8,
    },
    cardTitle: {
        fontSize: 11,
        fontFamily: 'Helvetica-Bold',
        color: '#374151',
        marginBottom: 6,
    },
    cardValue: {
        fontSize: 18,
        fontFamily: 'Helvetica-Bold',
        color: '#1F2937',
        marginBottom: 2,
    },
    cardSubValue: {
        fontSize: 9,
        color: '#6B7280',
    },
    table: {
        border: 1,
        borderColor: '#E5E7EB',
        borderRadius: 4,
        marginBottom: 12,
    },
    tableHeader: {
        flexDirection: 'row',
        backgroundColor: '#F3F4F6',
        borderBottom: 1,
        borderBottomColor: '#E5E7EB',
        padding: 8,
    },
    tableRow: {
        flexDirection: 'row',
        borderBottom: 1,
        borderBottomColor: '#F3F4F6',
        padding: 8,
    },
    tableCell: {
        flex: 1,
        fontSize: 10,
        color: '#374151',
    },
    tableCellHeader: {
        flex: 1,
        fontSize: 10,
        fontFamily: 'Helvetica-Bold',
        color: '#1F2937',
    },
    tableCellWide: {
        flex: 2,
        fontSize: 10,
        color: '#374151',
    },
    statusGood: {
        backgroundColor: '#D1FAE5',
        color: '#065F46',
        padding: 4,
        borderRadius: 4,
        textAlign: 'center',
        fontSize: 9,
        fontFamily: 'Helvetica-Bold',
    },
    statusBad: {
        backgroundColor: '#FEE2E2',
        color: '#991B1B',
        padding: 4,
        borderRadius: 4,
        textAlign: 'center',
        fontSize: 9,
        fontFamily: 'Helvetica-Bold',
    },
    footer: {
        position: 'absolute',
        bottom: 30,
        left: 30,
        right: 30,
        textAlign: 'center',
        fontSize: 8,
        color: '#9CA3AF',
        borderTop: 1,
        borderTopColor: '#E5E7EB',
        paddingTop: 8,
    },
    insight: {
        backgroundColor: '#EFF6FF',
        border: 1,
        borderColor: '#BFDBFE',
        borderRadius: 4,
        padding: 10,
        marginBottom: 8,
    },
    insightText: {
        fontSize: 10,
        color: '#1E40AF',
        lineHeight: 1.3,
    },
    metricRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    metricLabel: {
        fontSize: 10,
        color: '#6B7280',
    },
    metricValue: {
        fontSize: 10,
        fontFamily: 'Helvetica-Bold',
        color: '#1F2937',
    },
});

interface PDFReportProps {
    latestResults: Record<string, TestResult>;
    totalRequests: number;
    averageResponseTime: string;
    errorRate: string;
    lastRunTime: string;
    overallHealthStatus: 'healthy' | 'warning' | 'critical' | 'unknown';
    directoryName?: string;
}

const PDFReport: React.FC<PDFReportProps> = ({
    latestResults,
    totalRequests,
    averageResponseTime,
    errorRate,
    lastRunTime,
    overallHealthStatus,
    directoryName = '',
}) => {
    // Helper function to get metric value safely
    const getMetricValue = (metric: any, property: string, defaultValue: number = 0): number => {
        if (!metric || typeof metric !== 'object' || metric[property] === undefined || metric[property] === null) {
            return defaultValue;
        }
        return typeof metric[property] === 'number' ? metric[property] : defaultValue;
    };

    // Get status style
    const getStatusStyle = (errorRate: number) => {
        return errorRate === 0 ? styles.statusGood : styles.statusBad;
    };

    // Determine test type
    const testKeys = Object.keys(latestResults);
    const isSequentialTest = directoryName.includes('sequential_') || testKeys.length > 3;
    const isSingleTest = testKeys.length === 1;

    // Prepare test data
    const testData = Object.entries(latestResults).map(([testName, result]) => ({
        name: testName.replace(/-/g, ' ').replace(/^\w/, c => c.toUpperCase()).substring(0, 30),
        rawName: testName,
        requests: getMetricValue(result.metrics?.http_reqs, 'count'),
        avgResponse: getMetricValue(result.metrics?.http_req_duration, 'avg'),
        minResponse: getMetricValue(result.metrics?.http_req_duration, 'min'),
        maxResponse: getMetricValue(result.metrics?.http_req_duration, 'max'),
        p95Response: getMetricValue(result.metrics?.http_req_duration, 'p(95)'),
        errorRate: getMetricValue(result.metrics?.http_req_failed, 'value') * 100,
        throughput: getMetricValue(result.metrics?.http_reqs, 'rate'),
        dataReceived: getMetricValue(result.metrics?.data_received, 'count'),
        waiting: getMetricValue(result.metrics?.http_req_waiting, 'avg'),
        connecting: getMetricValue(result.metrics?.http_req_connecting, 'avg'),
        result: result,
    }));

    return (
        <Document>
            {/* Page 1 - Executive Summary */}
            <Page size="A4" style={styles.page} wrap={false}>
                <View style={styles.header}>
                    <Text style={styles.title}>K6 Performance Test Report</Text>
                    <Text style={styles.subtitle}>Generated: {new Date().toLocaleString('pl-PL', { timeZone: 'Europe/Warsaw' })}</Text>
                    <Text style={styles.subtitle}>Test Run: {lastRunTime}</Text>
                    <Text style={styles.subtitle}>Type: {isSequentialTest ? 'Multi-Endpoint Sequential' : isSingleTest ? 'Single Endpoint' : 'Test Suite'}</Text>
                    {directoryName && <Text style={styles.subtitle}>Source: {directoryName}</Text>}
                </View>

                {/* Executive Summary */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Executive Summary</Text>

                    <View style={styles.row}>
                        <View style={styles.column}>
                            <View style={styles.card}>
                                <Text style={styles.cardTitle}>Overall Status</Text>
                                <View style={getStatusStyle(parseFloat(errorRate))}>
                                    <Text>{parseFloat(errorRate) === 0 ? 'HEALTHY' : 'NEEDS ATTENTION'}</Text>
                                </View>
                            </View>
                        </View>

                        <View style={styles.column}>
                            <View style={styles.card}>
                                <Text style={styles.cardTitle}>Total Requests</Text>
                                <Text style={styles.cardValue}>{totalRequests.toLocaleString()}</Text>
                                <Text style={styles.cardSubValue}>Across {testKeys.length} endpoint(s)</Text>
                            </View>
                        </View>

                        <View style={styles.lastColumn}>
                            <View style={styles.card}>
                                <Text style={styles.cardTitle}>Performance</Text>
                                <Text style={styles.cardValue}>{averageResponseTime} ms</Text>
                                <Text style={styles.cardSubValue}>{errorRate}% error rate</Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Key Insights */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Key Insights</Text>

                    <View style={styles.insight}>
                        <Text style={styles.insightText}>
                            • {isSequentialTest ? `Sequential test with ${testKeys.length} endpoints` : `Single endpoint performance test`}
                        </Text>
                        <Text style={styles.insightText}>
                            • {parseFloat(errorRate) === 0 ? 'Perfect reliability - no failed requests' : `${errorRate}% error rate requires attention`}
                        </Text>
                        <Text style={styles.insightText}>
                            • Average response time: {averageResponseTime}ms {parseFloat(averageResponseTime) > 1000 ? '(exceeds 1s threshold)' : '(within acceptable range)'}
                        </Text>
                        <Text style={styles.insightText}>
                            • Total throughput: {testData.reduce((sum, test) => sum + test.throughput, 0).toFixed(2)} requests/second
                        </Text>
                    </View>
                </View>

                {/* Performance Summary Table */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Test Results Summary</Text>

                    <View style={styles.table}>
                        <View style={styles.tableHeader}>
                            <Text style={styles.tableCellWide}>Test Name</Text>
                            <Text style={styles.tableCellHeader}>Requests</Text>
                            <Text style={styles.tableCellHeader}>Avg (ms)</Text>
                            <Text style={styles.tableCellHeader}>P95 (ms)</Text>
                            <Text style={styles.tableCellHeader}>Errors</Text>
                            <Text style={styles.tableCellHeader}>RPS</Text>
                        </View>

                        {testData.map((test, index) => (
                            <View key={index} style={styles.tableRow}>
                                <Text style={styles.tableCellWide}>{test.name}</Text>
                                <Text style={styles.tableCell}>{test.requests.toLocaleString()}</Text>
                                <Text style={styles.tableCell}>{test.avgResponse.toFixed(0)}</Text>
                                <Text style={styles.tableCell}>{test.p95Response.toFixed(0)}</Text>
                                <Text style={styles.tableCell}>{test.errorRate.toFixed(1)}%</Text>
                                <Text style={styles.tableCell}>{test.throughput.toFixed(1)}</Text>
                            </View>
                        ))}
                    </View>
                </View>

                <View style={styles.footer}>
                    <Text>K6 Performance Report - Page 1 of 2</Text>
                </View>
            </Page>

            {/* Page 2 - Detailed Analysis */}
            <Page size="A4" style={styles.page} wrap={false}>
                <View style={styles.header}>
                    <Text style={styles.title}>Detailed Analysis</Text>
                </View>

                {/* Individual Test Details */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Detailed Metrics</Text>

                    {testData.map((test, index) => (
                        <View key={index} style={styles.card}>
                            <Text style={styles.cardTitle}>{test.name}</Text>

                            <View style={styles.row}>
                                <View style={styles.column}>
                                    <View style={styles.metricRow}>
                                        <Text style={styles.metricLabel}>Total Requests:</Text>
                                        <Text style={styles.metricValue}>{test.requests.toLocaleString()}</Text>
                                    </View>
                                    <View style={styles.metricRow}>
                                        <Text style={styles.metricLabel}>Throughput:</Text>
                                        <Text style={styles.metricValue}>{test.throughput.toFixed(2)} req/s</Text>
                                    </View>
                                    <View style={styles.metricRow}>
                                        <Text style={styles.metricLabel}>Data Received:</Text>
                                        <Text style={styles.metricValue}>{(test.dataReceived / 1024 / 1024).toFixed(1)} MB</Text>
                                    </View>
                                </View>

                                <View style={styles.column}>
                                    <View style={styles.metricRow}>
                                        <Text style={styles.metricLabel}>Min Response:</Text>
                                        <Text style={styles.metricValue}>{test.minResponse.toFixed(0)} ms</Text>
                                    </View>
                                    <View style={styles.metricRow}>
                                        <Text style={styles.metricLabel}>Max Response:</Text>
                                        <Text style={styles.metricValue}>{test.maxResponse.toFixed(0)} ms</Text>
                                    </View>
                                    <View style={styles.metricRow}>
                                        <Text style={styles.metricLabel}>Server Wait:</Text>
                                        <Text style={styles.metricValue}>{test.waiting.toFixed(0)} ms</Text>
                                    </View>
                                </View>

                                <View style={styles.lastColumn}>
                                    <View style={styles.metricRow}>
                                        <Text style={styles.metricLabel}>Average:</Text>
                                        <Text style={styles.metricValue}>{test.avgResponse.toFixed(0)} ms</Text>
                                    </View>
                                    <View style={styles.metricRow}>
                                        <Text style={styles.metricLabel}>95th Percentile:</Text>
                                        <Text style={styles.metricValue}>{test.p95Response.toFixed(0)} ms</Text>
                                    </View>
                                    <View style={styles.metricRow}>
                                        <Text style={styles.metricLabel}>Error Rate:</Text>
                                        <Text style={styles.metricValue}>{test.errorRate.toFixed(1)}%</Text>
                                    </View>
                                </View>
                            </View>
                        </View>
                    ))}
                </View>

                {/* Performance Recommendations */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Performance Recommendations</Text>

                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>Analysis & Recommendations</Text>

                        {testData.some(test => test.avgResponse > 1000) && (
                            <Text style={styles.insightText}>
                                ⚠ SLOW RESPONSE: Some endpoints exceed 1s response time - consider optimization
                            </Text>
                        )}

                        {testData.some(test => test.p95Response > 2000) && (
                            <Text style={styles.insightText}>
                                ⚠ OUTLIERS DETECTED: High 95th percentile indicates inconsistent performance
                            </Text>
                        )}

                        {testData.some(test => test.errorRate > 0) && (
                            <Text style={styles.insightText}>
                                ❌ ERRORS FOUND: {getMetricValue({ value: parseFloat(errorRate) / 100 }, 'value', 0) * totalRequests} failed requests need investigation
                            </Text>
                        )}

                        {testData.every(test => test.errorRate === 0 && test.avgResponse <= 1000) && (
                            <Text style={styles.insightText}>
                                ✅ EXCELLENT: All endpoints performing within acceptable limits
                            </Text>
                        )}

                        <Text style={styles.insightText}>
                            📊 THROUGHPUT: Combined {testData.reduce((sum, test) => sum + test.throughput, 0).toFixed(1)} req/s across all endpoints
                        </Text>

                        {isSingleTest && (
                            <Text style={styles.insightText}>
                                🎯 SINGLE TEST: Response range {testData[0].minResponse.toFixed(0)}ms - {testData[0].maxResponse.toFixed(0)}ms shows {testData[0].maxResponse / testData[0].minResponse > 10 ? 'high variance' : 'consistent performance'}
                            </Text>
                        )}
                    </View>
                </View>

                {/* Test Environment */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Test Environment</Text>

                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>Configuration</Text>
                        <View style={styles.metricRow}>
                            <Text style={styles.metricLabel}>Report Generated:</Text>
                            <Text style={styles.metricValue}>{new Date().toLocaleString('pl-PL', { timeZone: 'Europe/Warsaw' })}</Text>
                        </View>
                        <View style={styles.metricRow}>
                            <Text style={styles.metricLabel}>Test Execution:</Text>
                            <Text style={styles.metricValue}>{lastRunTime}</Text>
                        </View>
                        <View style={styles.metricRow}>
                            <Text style={styles.metricLabel}>Endpoints Tested:</Text>
                            <Text style={styles.metricValue}>{testKeys.length}</Text>
                        </View>
                        <View style={styles.metricRow}>
                            <Text style={styles.metricLabel}>Test Framework:</Text>
                            <Text style={styles.metricValue}>k6 Performance Testing</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.footer}>
                    <Text>K6 Performance Report - Page 2 of 2 - Generated by K6 Dashboard</Text>
                </View>
            </Page>
        </Document>
    );
};

interface PDFReportGeneratorHookProps {
    latestResults: Record<string, TestResult>;
    totalRequests: number;
    averageResponseTime: string;
    errorRate: string;
    lastRunTime: string;
    overallHealthStatus: 'healthy' | 'warning' | 'critical' | 'unknown';
    directoryName?: string;
    onGenerating?: (isGenerating: boolean) => void;
}

// Custom hook for PDF generation
export const usePDFReportGenerator = ({
    latestResults,
    totalRequests,
    averageResponseTime,
    errorRate,
    lastRunTime,
    overallHealthStatus,
    directoryName,
    onGenerating,
}: PDFReportGeneratorHookProps) => {
    const generatePDF = async () => {
        if (onGenerating) onGenerating(true);

        try {
            const doc = (
                <PDFReport
                    latestResults={latestResults}
                    totalRequests={totalRequests}
                    averageResponseTime={averageResponseTime}
                    errorRate={errorRate}
                    lastRunTime={lastRunTime}
                    overallHealthStatus={overallHealthStatus}
                    directoryName={directoryName}
                />
            );

            const asPdf = pdf(doc);
            const blob = await asPdf.toBlob();

            // Create download link
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `k6-report-${directoryName || 'test'}-${new Date().toISOString().slice(0, 10)}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

        } catch (error) {
            console.error('Error generating PDF:', error);
            alert('Error generating PDF. Please try again.');
        } finally {
            if (onGenerating) onGenerating(false);
        }
    };

    return { generatePDF };
};

export { PDFReport };
export default usePDFReportGenerator;
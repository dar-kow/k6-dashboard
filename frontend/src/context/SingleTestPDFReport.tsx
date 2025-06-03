import React from 'react';
import { Document, Page, Text, View, StyleSheet, pdf } from '@react-pdf/renderer';
import { TestResult } from '../types/testResults';

// Kompaktowe style dla PDF
const styles = StyleSheet.create({
    page: {
        flexDirection: 'column',
        backgroundColor: '#ffffff',
        padding: 20,
        fontFamily: 'Helvetica',
        fontSize: 9,
    },
    header: {
        marginBottom: 15,
        borderBottom: 2,
        borderBottomColor: '#3B82F6',
        paddingBottom: 10,
    },
    title: {
        fontSize: 18,
        fontFamily: 'Helvetica-Bold',
        color: '#1F2937',
        marginBottom: 5,
    },
    subtitle: {
        fontSize: 10,
        color: '#6B7280',
        marginBottom: 3,
    },
    section: {
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 12,
        fontFamily: 'Helvetica-Bold',
        color: '#1F2937',
        marginBottom: 8,
        borderBottom: 1,
        borderBottomColor: '#E5E7EB',
        paddingBottom: 3,
    },
    row: {
        flexDirection: 'row',
        marginBottom: 8,
    },
    column: {
        flex: 1,
        marginRight: 10,
    },
    card: {
        backgroundColor: '#F9FAFB',
        border: 1,
        borderColor: '#E5E7EB',
        borderRadius: 4,
        padding: 8,
        marginBottom: 6,
    },
    cardTitle: {
        fontSize: 9,
        fontFamily: 'Helvetica-Bold',
        color: '#374151',
        marginBottom: 4,
    },
    cardValue: {
        fontSize: 14,
        fontFamily: 'Helvetica-Bold',
        color: '#1F2937',
    },
    cardSubValue: {
        fontSize: 8,
        color: '#6B7280',
        marginTop: 2,
    },
    table: {
        border: 1,
        borderColor: '#E5E7EB',
        borderRadius: 3,
        marginBottom: 8,
    },
    tableHeader: {
        flexDirection: 'row',
        backgroundColor: '#F3F4F6',
        borderBottom: 1,
        borderBottomColor: '#E5E7EB',
        padding: 4,
    },
    tableRow: {
        flexDirection: 'row',
        borderBottom: 1,
        borderBottomColor: '#F3F4F6',
        padding: 4,
    },
    tableCell: {
        flex: 1,
        fontSize: 8,
        color: '#374151',
    },
    tableCellHeader: {
        flex: 1,
        fontSize: 8,
        fontFamily: 'Helvetica-Bold',
        color: '#1F2937',
    },
    visualBar: {
        height: 12,
        backgroundColor: '#3B82F6',
        marginBottom: 3,
        borderRadius: 2,
        alignItems: 'center',
        justifyContent: 'center',
    },
    barLabel: {
        fontSize: 7,
        color: '#FFFFFF',
        fontFamily: 'Helvetica-Bold',
    },
    statusGood: {
        backgroundColor: '#D1FAE5',
        color: '#065F46',
        padding: 3,
        borderRadius: 3,
        textAlign: 'center',
        fontSize: 7,
        fontFamily: 'Helvetica-Bold',
    },
    statusBad: {
        backgroundColor: '#FEE2E2',
        color: '#991B1B',
        padding: 3,
        borderRadius: 3,
        textAlign: 'center',
        fontSize: 7,
        fontFamily: 'Helvetica-Bold',
    },
    footer: {
        position: 'absolute',
        bottom: 15,
        left: 20,
        right: 20,
        textAlign: 'center',
        fontSize: 7,
        color: '#9CA3AF',
        borderTop: 1,
        borderTopColor: '#E5E7EB',
        paddingTop: 5,
    },
    chart: {
        height: 60,
        backgroundColor: '#FFFFFF',
        border: 1,
        borderColor: '#E5E7EB',
        borderRadius: 3,
        padding: 6,
        marginBottom: 8,
    },
    chartTitle: {
        fontSize: 9,
        fontFamily: 'Helvetica-Bold',
        color: '#1F2937',
        marginBottom: 4,
    },
    insight: {
        backgroundColor: '#EFF6FF',
        border: 1,
        borderColor: '#BFDBFE',
        borderRadius: 3,
        padding: 6,
        marginBottom: 6,
    },
    insightText: {
        fontSize: 8,
        color: '#1E40AF',
    },
});

interface SingleTestPDFProps {
    testResult: TestResult;
    testName: string;
    testRunDirectory: string;
    runTime: string;
}

const SingleTestPDFReport: React.FC<SingleTestPDFProps> = ({
    testResult,
    testName,
    testRunDirectory,
    runTime,
}) => {
    // Helper function to get metric value safely
    const getMetricValue = (metric: any, property: string, defaultValue: number = 0): number => {
        if (!metric || typeof metric !== 'object' || metric[property] === undefined || metric[property] === null) {
            return defaultValue;
        }
        return typeof metric[property] === 'number' ? metric[property] : defaultValue;
    };

    // Extract key metrics
    const metrics = testResult.metrics || {};
    const totalRequests = getMetricValue(metrics.http_reqs, 'count');
    const requestRate = getMetricValue(metrics.http_reqs, 'rate');
    const avgResponseTime = getMetricValue(metrics.http_req_duration, 'avg');
    const minResponseTime = getMetricValue(metrics.http_req_duration, 'min');
    const maxResponseTime = getMetricValue(metrics.http_req_duration, 'max');
    const medianResponseTime = getMetricValue(metrics.http_req_duration, 'med');
    const p90ResponseTime = getMetricValue(metrics.http_req_duration, 'p(90)');
    const p95ResponseTime = getMetricValue(metrics.http_req_duration, 'p(95)');
    const errorRate = getMetricValue(metrics.http_req_failed, 'value') * 100;
    const dataReceived = getMetricValue(metrics.data_received, 'count');
    const dataSent = getMetricValue(metrics.data_sent, 'count');

    // Request timing breakdown
    const blocked = getMetricValue(metrics.http_req_blocked, 'avg');
    const connecting = getMetricValue(metrics.http_req_connecting, 'avg');
    const waiting = getMetricValue(metrics.http_req_waiting, 'avg');
    const receiving = getMetricValue(metrics.http_req_receiving, 'avg');
    const sending = getMetricValue(metrics.http_req_sending, 'avg');

    // Format test name
    const formatTestName = (name: string) => {
        return name.replace(/-/g, ' ').split(' ').map(word =>
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
    };

    // Generate insights
    const generateInsights = () => {
        const insights = [];

        if (errorRate === 0) {
            insights.push('✓ Perfect reliability - no failed requests');
        } else if (errorRate < 1) {
            insights.push(`⚠ Low error rate: ${errorRate.toFixed(2)}% - monitor closely`);
        } else {
            insights.push(`❌ High error rate: ${errorRate.toFixed(2)}% - requires attention`);
        }

        if (avgResponseTime < 100) {
            insights.push('✓ Excellent response time - under 100ms average');
        } else if (avgResponseTime < 500) {
            insights.push('✓ Good response time - under 500ms average');
        } else if (avgResponseTime < 1000) {
            insights.push('⚠ Moderate response time - consider optimization');
        } else {
            insights.push('❌ Slow response time - optimization needed');
        }

        if (p95ResponseTime < avgResponseTime * 2) {
            insights.push('✓ Consistent performance - low response time variance');
        } else {
            insights.push('⚠ Some requests are significantly slower than average');
        }

        if (requestRate > 50) {
            insights.push('✓ High throughput - good server capacity');
        } else if (requestRate > 10) {
            insights.push('✓ Moderate throughput - acceptable performance');
        } else {
            insights.push('⚠ Low throughput - may indicate bottlenecks');
        }

        return insights;
    };

    const insights = generateInsights();

    return (
        <Document>
            {/* Single Page Report */}
            <Page size="A4" style={styles.page}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.title}>{formatTestName(testName)} - Performance Report</Text>
                    <Text style={styles.subtitle}>Generated: {new Date().toLocaleString('pl-PL', { timeZone: 'Europe/Warsaw' })}</Text>
                    <Text style={styles.subtitle}>Test Run: {runTime}</Text>
                    <Text style={styles.subtitle}>Directory: {testRunDirectory}</Text>
                </View>

                {/* Key Metrics */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Key Performance Metrics</Text>

                    <View style={styles.row}>
                        <View style={styles.column}>
                            <View style={styles.card}>
                                <Text style={styles.cardTitle}>Total Requests</Text>
                                <Text style={styles.cardValue}>{totalRequests.toLocaleString()}</Text>
                            </View>
                        </View>
                        <View style={styles.column}>
                            <View style={styles.card}>
                                <Text style={styles.cardTitle}>Average Response</Text>
                                <Text style={styles.cardValue}>{avgResponseTime.toFixed(2)} ms</Text>
                            </View>
                        </View>
                        <View style={styles.column}>
                            <View style={styles.card}>
                                <Text style={styles.cardTitle}>Throughput</Text>
                                <Text style={styles.cardValue}>{requestRate.toFixed(2)} req/s</Text>
                            </View>
                        </View>
                        <View style={styles.column}>
                            <View style={styles.card}>
                                <Text style={styles.cardTitle}>Error Rate</Text>
                                <Text style={styles.cardValue}>{errorRate.toFixed(2)}%</Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Response Time Analysis */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Response Time Analysis</Text>

                    <View style={styles.row}>
                        <View style={styles.column}>
                            <View style={styles.chart}>
                                <Text style={styles.chartTitle}>Response Time Distribution</Text>
                                <View style={{ marginTop: 4 }}>
                                    <Text style={[styles.cardSubValue, { marginBottom: 2 }]}>
                                        Min: {minResponseTime.toFixed(2)}ms
                                    </Text>
                                    <View style={[styles.visualBar, {
                                        width: `${Math.min((avgResponseTime / maxResponseTime) * 100, 100)}%`,
                                        backgroundColor: avgResponseTime > 1000 ? '#EF4444' : '#10B981'
                                    }]}>
                                        <Text style={styles.barLabel}>Avg: {avgResponseTime.toFixed(0)}ms</Text>
                                    </View>
                                    <Text style={[styles.cardSubValue, { marginTop: 2 }]}>
                                        Max: {maxResponseTime.toFixed(2)}ms
                                    </Text>
                                </View>
                            </View>
                        </View>

                        <View style={styles.column}>
                            <View style={styles.chart}>
                                <Text style={styles.chartTitle}>Percentile Analysis</Text>
                                <View style={{ marginTop: 4 }}>
                                    <Text style={[styles.cardSubValue, { marginBottom: 1 }]}>
                                        Median (50th): {medianResponseTime.toFixed(2)}ms
                                    </Text>
                                    <Text style={[styles.cardSubValue, { marginBottom: 1 }]}>
                                        90th Percentile: {p90ResponseTime.toFixed(2)}ms
                                    </Text>
                                    <Text style={[styles.cardSubValue, { marginBottom: 1 }]}>
                                        95th Percentile: {p95ResponseTime.toFixed(2)}ms
                                    </Text>
                                    <View style={[styles.visualBar, {
                                        width: `${Math.min((p95ResponseTime / maxResponseTime) * 100, 100)}%`,
                                        backgroundColor: '#F59E0B'
                                    }]}>
                                        <Text style={styles.barLabel}>P95</Text>
                                    </View>
                                </View>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Request Timing Breakdown */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Request Timing Breakdown</Text>

                    <View style={styles.table}>
                        <View style={styles.tableHeader}>
                            <Text style={styles.tableCellHeader}>Phase</Text>
                            <Text style={styles.tableCellHeader}>Time (ms)</Text>
                            <Text style={styles.tableCellHeader}>Percentage</Text>
                            <Text style={styles.tableCellHeader}>Description</Text>
                        </View>

                        <View style={styles.tableRow}>
                            <Text style={styles.tableCell}>Blocked</Text>
                            <Text style={styles.tableCell}>{blocked.toFixed(2)}</Text>
                            <Text style={styles.tableCell}>{((blocked / avgResponseTime) * 100).toFixed(1)}%</Text>
                            <Text style={styles.tableCell}>Waiting for connection</Text>
                        </View>

                        <View style={styles.tableRow}>
                            <Text style={styles.tableCell}>Connecting</Text>
                            <Text style={styles.tableCell}>{connecting.toFixed(2)}</Text>
                            <Text style={styles.tableCell}>{((connecting / avgResponseTime) * 100).toFixed(1)}%</Text>
                            <Text style={styles.tableCell}>TCP connection setup</Text>
                        </View>

                        <View style={styles.tableRow}>
                            <Text style={styles.tableCell}>Sending</Text>
                            <Text style={styles.tableCell}>{sending.toFixed(2)}</Text>
                            <Text style={styles.tableCell}>{((sending / avgResponseTime) * 100).toFixed(1)}%</Text>
                            <Text style={styles.tableCell}>Request data transmission</Text>
                        </View>

                        <View style={styles.tableRow}>
                            <Text style={styles.tableCell}>Waiting</Text>
                            <Text style={styles.tableCell}>{waiting.toFixed(2)}</Text>
                            <Text style={styles.tableCell}>{((waiting / avgResponseTime) * 100).toFixed(1)}%</Text>
                            <Text style={styles.tableCell}>Server processing (TTFB)</Text>
                        </View>

                        <View style={styles.tableRow}>
                            <Text style={styles.tableCell}>Receiving</Text>
                            <Text style={styles.tableCell}>{receiving.toFixed(2)}</Text>
                            <Text style={styles.tableCell}>{((receiving / avgResponseTime) * 100).toFixed(1)}%</Text>
                            <Text style={styles.tableCell}>Response download</Text>
                        </View>
                    </View>
                </View>

                {/* Data Transfer & Performance Status */}
                <View style={styles.section}>
                    <View style={styles.row}>
                        <View style={styles.column}>
                            <Text style={styles.sectionTitle}>Data Transfer</Text>
                            <View style={styles.card}>
                                <Text style={styles.cardTitle}>Data Received</Text>
                                <Text style={styles.cardValue}>{(dataReceived / 1024 / 1024).toFixed(2)} MB</Text>
                                <Text style={styles.cardSubValue}>
                                    {(dataReceived / totalRequests / 1024).toFixed(2)} KB per request
                                </Text>
                            </View>
                            <View style={styles.card}>
                                <Text style={styles.cardTitle}>Data Sent</Text>
                                <Text style={styles.cardValue}>{(dataSent / 1024).toFixed(2)} KB</Text>
                                <Text style={styles.cardSubValue}>
                                    {(dataSent / totalRequests).toFixed(2)} bytes per request
                                </Text>
                            </View>
                        </View>

                        <View style={styles.column}>
                            <Text style={styles.sectionTitle}>Performance Status</Text>
                            <View style={errorRate === 0 ? styles.statusGood : styles.statusBad}>
                                <Text>Reliability: {errorRate === 0 ? 'EXCELLENT' : 'NEEDS ATTENTION'}</Text>
                            </View>
                            <View style={avgResponseTime < 500 ? styles.statusGood : styles.statusBad}>
                                <Text>Response Time: {avgResponseTime < 500 ? 'GOOD' : 'SLOW'}</Text>
                            </View>
                            <View style={requestRate > 10 ? styles.statusGood : styles.statusBad}>
                                <Text>Throughput: {requestRate > 10 ? 'GOOD' : 'LOW'}</Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Insights & Recommendations */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Performance Insights & Recommendations</Text>

                    {insights.map((insight, index) => (
                        <View key={index} style={styles.insight}>
                            <Text style={styles.insightText}>{insight}</Text>
                        </View>
                    ))}

                    <View style={styles.insight}>
                        <Text style={styles.insightText}>
                            💡 Performance Summary: {totalRequests.toLocaleString()} requests processed at {requestRate.toFixed(2)} req/s
                            with {avgResponseTime.toFixed(2)}ms average response time and {errorRate.toFixed(2)}% error rate.
                        </Text>
                    </View>
                </View>

                {/* Footer */}
                <View style={styles.footer}>
                    <Text>K6 Performance Report - {formatTestName(testName)} - Generated by K6 Dashboard</Text>
                </View>
            </Page>
        </Document>
    );
};

// Hook for generating single test PDF
export const useSingleTestPDFGenerator = () => {
    const generateSingleTestPDF = async (
        testResult: TestResult,
        testName: string,
        testRunDirectory: string,
        runTime: string,
        onGenerating?: (isGenerating: boolean) => void
    ) => {
        if (onGenerating) onGenerating(true);

        try {
            const doc = (
                <SingleTestPDFReport
                    testResult={testResult}
                    testName={testName}
                    testRunDirectory={testRunDirectory}
                    runTime={runTime}
                />
            );

            const asPdf = pdf(doc);
            const blob = await asPdf.toBlob();

            // Create download link
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `k6-${testName}-report-${new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-')}.pdf`;
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

    return { generateSingleTestPDF };
};

export default SingleTestPDFReport;
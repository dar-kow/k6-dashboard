
import React from 'react';
import { TestResult } from '../types/testResults';

interface PerformanceSummaryProps {
    results: Record<string, TestResult>;
    onRunNewTests: () => void;
}

const PerformanceSummary: React.FC<PerformanceSummaryProps> = ({ results, onRunNewTests }) => {
    const getMetricValue = (metric: any, property: string, defaultValue: number = 0): number => {
        if (!metric || typeof metric !== 'object' || metric[property] === undefined || metric[property] === null) {
            return defaultValue;
        }
        return typeof metric[property] === 'number' ? metric[property] : defaultValue;
    };

    const calculateOverallScore = () => {
        const tests = Object.values(results);
        if (tests.length === 0) return 0;

        let score = 100;
        tests.forEach(test => {
            const avgResponse = getMetricValue(test.metrics?.http_req_duration, 'avg');
            const errorRate = getMetricValue(test.metrics?.http_req_failed, 'value') * 100;

            // Deduct points for slow responses
            if (avgResponse > 1000) score -= 20;
            else if (avgResponse > 500) score -= 10;
            else if (avgResponse > 200) score -= 5;

            // Deduct points for errors
            if (errorRate > 5) score -= 30;
            else if (errorRate > 1) score -= 15;
            else if (errorRate > 0.1) score -= 5;
        });

        return Math.max(0, score);
    };

    const getScoreColor = (score: number) => {
        if (score >= 90) return 'text-green-600 bg-green-100';
        if (score >= 70) return 'text-yellow-600 bg-yellow-100';
        if (score >= 50) return 'text-orange-600 bg-orange-100';
        return 'text-red-600 bg-red-100';
    };

    const getScoreEmoji = (score: number) => {
        if (score >= 90) return '🚀';
        if (score >= 70) return '✅';
        if (score >= 50) return '⚠️';
        return '🚨';
    };

    const overallScore = calculateOverallScore();
    const totalTests = Object.keys(results).length;
    const totalRequests = Object.values(results).reduce((sum, test) => 
        sum + getMetricValue(test.metrics?.http_reqs, 'count'), 0);
    const avgResponseTime = Object.values(results).reduce((sum, test) => 
        sum + getMetricValue(test.metrics?.http_req_duration, 'avg'), 0) / Math.max(1, totalTests);

    const recommendations = [
        ...(avgResponseTime > 1000 ? ['Consider optimizing response times - some endpoints exceed 1 second'] : []),
        ...(Object.values(results).some(test => getMetricValue(test.metrics?.http_req_failed, 'value') > 0) 
            ? ['Investigate error sources to improve reliability'] : []),
        ...(totalTests < 3 ? ['Consider adding more test scenarios for comprehensive coverage'] : []),
        ...(overallScore >= 90 ? ['Excellent performance! Consider stress testing with higher loads'] : [])
    ];

    return (
        <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">📊 Performance Summary</h2>
                <div className={`px-4 py-2 rounded-lg font-bold text-lg ${getScoreColor(overallScore)}`}>
                    {getScoreEmoji(overallScore)} {overallScore}/100
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                {/* Key Metrics */}
                <div className="space-y-4">
                    <h3 className="font-medium text-gray-900">Key Metrics</h3>
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Tests Executed:</span>
                            <span className="font-medium">{totalTests}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Total Requests:</span>
                            <span className="font-medium">{totalRequests.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Avg Response:</span>
                            <span className="font-medium">{avgResponseTime.toFixed(0)}ms</span>
                        </div>
                    </div>
                </div>

                {/* Performance Insights */}
                <div className="space-y-4">
                    <h3 className="font-medium text-gray-900">Performance Insights</h3>
                    <div className="space-y-2">
                        {Object.values(results).every(test => 
                            getMetricValue(test.metrics?.http_req_failed, 'value') === 0) && (
                            <div className="flex items-center text-sm text-green-600">
                                <span className="mr-2">✅</span>
                                <span>Perfect reliability</span>
                            </div>
                        )}
                        {avgResponseTime <= 200 && (
                            <div className="flex items-center text-sm text-green-600">
                                <span className="mr-2">⚡</span>
                                <span>Excellent response times</span>
                            </div>
                        )}
                        {totalRequests > 10000 && (
                            <div className="flex items-center text-sm text-blue-600">
                                <span className="mr-2">🚀</span>
                                <span>High volume testing</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Recommendations */}
                <div className="space-y-4">
                    <h3 className="font-medium text-gray-900">Recommendations</h3>
                    <div className="space-y-2">
                        {recommendations.length > 0 ? (
                            recommendations.slice(0, 3).map((rec, index) => (
                                <div key={index} className="text-sm text-gray-600 flex items-start">
                                    <span className="mr-2 text-blue-500">•</span>
                                    <span>{rec}</span>
                                </div>
                            ))
                        ) : (
                            <div className="text-sm text-green-600 flex items-center">
                                <span className="mr-2">🎉</span>
                                <span>All systems performing well!</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-between pt-4 border-t border-gray-200">
                <div className="flex items-center space-x-4 mb-4 md:mb-0">
                    <button
                        onClick={onRunNewTests}
                        className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                    >
                        <span className="mr-2">🚀</span>
                        <span>Run New Tests</span>
                    </button>
                    
                    <div className="text-sm text-gray-500">
                        Last updated: {new Date().toLocaleTimeString('pl-PL')}
                    </div>
                </div>

                <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <span>Performance Score:</span>
                    <div className="flex space-x-1">
                        {[1, 2, 3, 4, 5].map(star => (
                            <span key={star} className={overallScore >= star * 20 ? 'text-yellow-400' : 'text-gray-300'}>
                                ⭐
                            </span>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PerformanceSummary;

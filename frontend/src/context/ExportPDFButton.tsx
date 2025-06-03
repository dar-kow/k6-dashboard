import React, { useState } from 'react';
import { usePDFReportGenerator } from './PDFReportGenerator';
import { TestResult } from '../types/testResults';

interface ExportPDFButtonProps {
    latestResults: Record<string, TestResult>;
    totalRequests: number;
    averageResponseTime: string;
    errorRate: string;
    lastRunTime: string;
    overallHealthStatus: 'healthy' | 'warning' | 'critical' | 'unknown';
    directoryName?: string;
    disabled?: boolean;
}

const ExportPDFButton: React.FC<ExportPDFButtonProps> = ({
    latestResults,
    totalRequests,
    averageResponseTime,
    errorRate,
    lastRunTime,
    overallHealthStatus,
    directoryName,
    disabled = false,
}) => {
    const [isGenerating, setIsGenerating] = useState(false);

    const { generatePDF } = usePDFReportGenerator({
        latestResults,
        totalRequests,
        averageResponseTime,
        errorRate,
        lastRunTime,
        overallHealthStatus,
        directoryName,
        onGenerating: setIsGenerating,
    });

    const handleExport = async () => {
        await generatePDF();
    };

    return (
        <button
            onClick={handleExport}
            disabled={disabled || isGenerating || Object.keys(latestResults).length === 0}
            className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-gray-400 transition-colors shadow-sm"
            title="Export professional PDF report"
        >
            {isGenerating ? (
                <>
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Generating PDF...</span>
                </>
            ) : (
                <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                    </svg>
                    <span>Export Detailed PDF Report</span>
                </>
            )}
        </button>
    );
};

export default ExportPDFButton;
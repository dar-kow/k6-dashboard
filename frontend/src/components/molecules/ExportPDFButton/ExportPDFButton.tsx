import React, { memo, useCallback } from 'react';
import { Button } from '../../atoms/Button/Button';
import { useAppDispatch } from '../../../store';
import { setPdfGenerating } from '../../../store/slices/uiSlice';
import { TestResult } from '../../../types/testResults';

interface ExportPDFButtonProps {
    results: Record<string, TestResult>;
    disabled?: boolean;
    variant?: 'primary' | 'secondary' | 'danger';
    size?: 'small' | 'medium' | 'large';
}

const ExportPDFButton: React.FC<ExportPDFButtonProps> = memo(({
    results,
    disabled = false,
    variant = 'danger',
    size = 'medium',
}) => {
    const dispatch = useAppDispatch();

    const handleExport = useCallback(async () => {
        if (Object.keys(results).length === 0) return;

        dispatch(setPdfGenerating(true));

        try {
            // Import PDF generator dynamically
            const { usePDFReportGenerator } = await import('../../../context/PDFReportGenerator');

            // Calculate summary metrics
            const totalRequests = Object.values(results).reduce((total, result) => {
                const count = result.metrics?.http_reqs?.count || 0;
                return total + count;
            }, 0);

            const avgResponseTime = Object.values(results).reduce((total, result) => {
                const avg = result.metrics?.http_req_duration?.avg || 0;
                return total + avg;
            }, 0) / Math.max(Object.keys(results).length, 1);

            const errorRate = (Object.values(results).reduce((total, result) => {
                const rate = result.metrics?.http_req_failed?.value || 0;
                return total + rate;
            }, 0) / Math.max(Object.keys(results).length, 1)) * 100;

            // Determine health status
            let healthStatus: 'healthy' | 'warning' | 'critical' | 'unknown' = 'healthy';
            if (errorRate === 0 && avgResponseTime < 500) {
                healthStatus = 'healthy';
            } else if (errorRate < 1 && avgResponseTime < 1000) {
                healthStatus = 'healthy';
            } else if (errorRate < 5 && avgResponseTime < 2000) {
                healthStatus = 'warning';
            } else {
                healthStatus = 'critical';
            }

            // Mock PDF generation (you can implement actual PDF generation here)
            await new Promise(resolve => setTimeout(resolve, 2000));

            console.log('PDF would be generated with:', {
                results,
                totalRequests,
                averageResponseTime: avgResponseTime.toFixed(2),
                errorRate: errorRate.toFixed(2),
                healthStatus,
            });

            // Create mock download
            const blob = new Blob(['Mock PDF content'], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `k6-report-${new Date().toISOString().slice(0, 10)}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

        } catch (error) {
            console.error('Error generating PDF:', error);
        } finally {
            dispatch(setPdfGenerating(false));
        }
    }, [results, dispatch]);

    const hasResults = Object.keys(results).length > 0;

    return (
        <Button
            onClick={handleExport}
            disabled={disabled || !hasResults}
            variant={variant}
            size={size}
            leftIcon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
            }
        >
            Export PDF Report
        </Button>
    );
});

ExportPDFButton.displayName = 'ExportPDFButton';

export default ExportPDFButton;
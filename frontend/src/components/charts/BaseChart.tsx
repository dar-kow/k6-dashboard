import React, { memo } from 'react';
import { ResponsiveContainer } from 'recharts';
import { Spinner } from '@components/atoms';

export interface BaseChartProps {
    loading?: boolean;
    error?: string;
    children: React.ReactElement;  // Changed from ReactNode to ReactElement
    height?: number | string;
    className?: string;
}

export const BaseChart = memo<BaseChartProps>(({
    loading = false,
    error,
    children,
    height = 300,
    className = '',
}) => {
    if (loading) {
        return (
            <div className={`base-chart base-chart--loading ${className}`} style={{ height }}>
                <Spinner size="lg" />
            </div>
        );
    }

    if (error) {
        return (
            <div className={`base-chart base-chart--error ${className}`} style={{ height }}>
                <div className="base-chart__error-content">
                    <p className="base-chart__error-message">{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className={`base-chart ${className}`} style={{ height }}>
            <ResponsiveContainer width="100%" height="100%">
                {children}
            </ResponsiveContainer>
        </div>
    );
});

BaseChart.displayName = 'BaseChart';
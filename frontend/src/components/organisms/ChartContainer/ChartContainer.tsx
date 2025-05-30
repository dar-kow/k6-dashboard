import React, { memo, Suspense } from 'react';
import { Spinner, Button, Icon } from '../../atoms';
import './ChartContainer.scss';

export interface ChartContainerProps {
    title: string;
    subtitle?: string;
    children: React.ReactNode;
    loading?: boolean;
    error?: string;
    onRefresh?: () => void;
    onExport?: () => void;
    fullscreen?: boolean;
    className?: string;
}

export const ChartContainer = memo<ChartContainerProps>(({
    title,
    subtitle,
    children,
    loading = false,
    error,
    onRefresh,
    onExport,
    fullscreen = false,
    className = '',
}) => {
    const containerClasses = [
        'chart-container',
        fullscreen && 'chart-container--fullscreen',
        className,
    ].filter(Boolean).join(' ');

    return (
        <div className={containerClasses}>
            <div className="chart-container__header">
                <div className="chart-container__title-section">
                    <h3 className="chart-container__title">{title}</h3>
                    {subtitle && (
                        <p className="chart-container__subtitle">{subtitle}</p>
                    )}
                </div>

                <div className="chart-container__actions">
                    {onRefresh && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onRefresh}
                            disabled={loading}
                            leftIcon={<Icon name="refresh" size="sm" />}
                        >
                            Refresh
                        </Button>
                    )}

                    {onExport && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onExport}
                            disabled={loading}
                            leftIcon={<Icon name="download" size="sm" />}
                        >
                            Export
                        </Button>
                    )}
                </div>
            </div>

            <div className="chart-container__content">
                {loading ? (
                    <div className="chart-container__loading">
                        <Spinner size="lg" />
                        <p>Loading chart data...</p>
                    </div>
                ) : error ? (
                    <div className="chart-container__error">
                        <Icon name="alert-circle" size="lg" />
                        <h4>Failed to load chart</h4>
                        <p>{error}</p>
                        {onRefresh && (
                            <Button variant="primary" size="sm" onClick={onRefresh}>
                                Try Again
                            </Button>
                        )}
                    </div>
                ) : (
                    <Suspense fallback={
                        <div className="chart-container__loading">
                            <Spinner size="lg" />
                        </div>
                    }>
                        {children}
                    </Suspense>
                )}
            </div>
        </div>
    );
});

ChartContainer.displayName = 'ChartContainer';
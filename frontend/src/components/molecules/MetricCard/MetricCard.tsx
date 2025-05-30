import React, { memo } from 'react';
import { Badge, Icon } from '../../atoms';
import './MetricCard.scss';

export interface MetricCardProps {
    title: string;
    value: string | number;
    subtitle?: string;
    trend?: {
        direction: 'up' | 'down' | 'neutral';
        value: string;
    };
    icon?: string;
    variant?: 'default' | 'success' | 'warning' | 'error';
    loading?: boolean;
}

export const MetricCard = memo<MetricCardProps>(({
    title,
    value,
    subtitle,
    trend,
    icon,
    variant = 'default',
    loading = false,
}) => {
    const getTrendColor = (direction: string) => {
        switch (direction) {
            case 'up': return 'success';
            case 'down': return 'error';
            default: return 'secondary';
        }
    };

    if (loading) {
        return (
            <div className="metric-card metric-card--loading">
                <div className="metric-card__skeleton" />
            </div>
        );
    }

    return (
        <div className={`metric-card metric-card--${variant}`}>
            <div className="metric-card__header">
                {icon && (
                    <div className="metric-card__icon">
                        <Icon name={icon} size="md" />
                    </div>
                )}
                <h3 className="metric-card__title">{title}</h3>
            </div>

            <div className="metric-card__content">
                <div className="metric-card__value">{value}</div>

                {subtitle && (
                    <div className="metric-card__subtitle">{subtitle}</div>
                )}

                {trend && (
                    <div className="metric-card__trend">
                        <Badge variant={getTrendColor(trend.direction)} size="sm">
                            {trend.direction === 'up' ? '↗' : trend.direction === 'down' ? '↘' : '→'} {trend.value}
                        </Badge>
                    </div>
                )}
            </div>
        </div>
    );
});

MetricCard.displayName = 'MetricCard';
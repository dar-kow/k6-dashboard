import React, { memo } from 'react';
import classNames from 'classnames';

interface MetricCardProps {
    title: string;
    value: string;
    type: 'number' | 'rate' | 'time' | 'size' | 'success' | 'error';
    subtitle?: string;
    trend?: {
        value: number;
        direction: 'up' | 'down';
        isGood?: boolean;
    };
    onClick?: () => void;
}

export const MetricCard: React.FC<MetricCardProps> = memo(({
    title,
    value,
    type,
    subtitle,
    trend,
    onClick,
}) => {
    const getIconAndColor = () => {
        switch (type) {
            case 'number':
                return {
                    icon: '📊',
                    color: 'bg-blue-100 text-blue-600',
                };
            case 'rate':
                return {
                    icon: '⚡',
                    color: 'bg-purple-100 text-purple-600',
                };
            case 'time':
                return {
                    icon: '⏱️',
                    color: 'bg-orange-100 text-orange-600',
                };
            case 'size':
                return {
                    icon: '💾',
                    color: 'bg-indigo-100 text-indigo-600',
                };
            case 'success':
                return {
                    icon: '✅',
                    color: 'bg-green-100 text-green-600',
                };
            case 'error':
                return {
                    icon: '❌',
                    color: 'bg-red-100 text-red-600',
                };
            default:
                return {
                    icon: '📈',
                    color: 'bg-gray-100 text-gray-600',
                };
        }
    };

    const { icon, color } = getIconAndColor();

    const cardClasses = classNames(
        'metric-card',
        'bg-white border rounded-lg shadow-sm p-4',
        {
            'cursor-pointer hover:shadow-lg transition-shadow': onClick,
        }
    );

    return (
        <div className={cardClasses} onClick={onClick}>
            <div className="flex items-center justify-between mb-2">
                <div className={`p-2 rounded-md ${color}`}>
                    <span className="text-xl">{icon}</span>
                </div>

                {trend && (
                    <div className={classNames(
                        'flex items-center text-sm',
                        trend.isGood ? 'text-green-600' : 'text-red-600'
                    )}>
                        <span className="mr-1">
                            {trend.direction === 'up' ? '↗️' : '↘️'}
                        </span>
                        <span>{Math.abs(trend.value)}%</span>
                    </div>
                )}
            </div>

            <div>
                <h3 className="text-xs font-medium text-gray-500 mb-1">{title}</h3>
                <p className="text-2xl font-semibold">{value}</p>
                {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
            </div>
        </div>
    );
});

MetricCard.displayName = 'MetricCard';

// Default export for compatibility
export default MetricCard;
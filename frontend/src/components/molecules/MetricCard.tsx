import React from 'react';
import { Icon, Typography, type IconName } from '@components/atoms';

export interface MetricCardProps {
    title: string;
    value: string;
    type: 'number' | 'rate' | 'time' | 'size' | 'success' | 'error';
    subtitle?: string;
    trend?: {
        value: number;
        isPositive: boolean;
    };
    isLoading?: boolean;
    className?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
    title,
    value,
    type,
    subtitle,
    trend,
    isLoading = false,
    className = '',
}) => {
    const getIconAndColor = (): { icon: IconName; colorClass: string } => {
        switch (type) {
            case 'number':
                return {
                    icon: 'chart',
                    colorClass: 'bg-blue-100 text-blue-600',
                };
            case 'rate':
                return {
                    icon: 'arrow-up',
                    colorClass: 'bg-purple-100 text-purple-600',
                };
            case 'time':
                return {
                    icon: 'clock',
                    colorClass: 'bg-orange-100 text-orange-600',
                };
            case 'size':
                return {
                    icon: 'folder',
                    colorClass: 'bg-indigo-100 text-indigo-600',
                };
            case 'success':
                return {
                    icon: 'check',
                    colorClass: 'bg-green-100 text-green-600',
                };
            case 'error':
                return {
                    icon: 'warning',
                    colorClass: 'bg-red-100 text-red-600',
                };
            default:
                return {
                    icon: 'info',
                    colorClass: 'bg-gray-100 text-gray-600',
                };
        }
    };

    const { icon, colorClass } = getIconAndColor();

    if (isLoading) {
        return (
            <div className={`bg-white border rounded-lg shadow-sm p-4 animate-pulse ${className}`}>
                <div className="flex items-center">
                    <div className={`p-2 rounded-md ${colorClass} mr-3`}>
                        <div className="w-5 h-5 bg-gray-200 rounded" />
                    </div>
                    <div className="flex-1">
                        <div className="h-3 bg-gray-200 rounded w-20 mb-2" />
                        <div className="h-6 bg-gray-200 rounded w-16" />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={`bg-white border rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow ${className}`}>
            <div className="flex items-center">
                {/* Icon */}
                <div className={`p-2 rounded-md ${colorClass} mr-3`}>
                    <Icon name={icon} size="md" />
                </div>

                {/* Content */}
                <div className="flex-1">
                    <Typography variant="caption" color="secondary" className="mb-1">
                        {title}
                    </Typography>

                    <div className="flex items-center space-x-2">
                        <Typography variant="h5" weight="semibold">
                            {value}
                        </Typography>

                        {/* Trend Indicator */}
                        {trend && (
                            <div className={`flex items-center text-xs ${trend.isPositive ? 'text-green-600' : 'text-red-600'
                                }`}>
                                <Icon
                                    name={trend.isPositive ? 'arrow-up' : 'arrow-down'}
                                    size="xs"
                                />
                                <span className="ml-1">{Math.abs(trend.value)}%</span>
                            </div>
                        )}
                    </div>

                    {/* Subtitle */}
                    {subtitle && (
                        <Typography variant="caption" color="gray" className="mt-1">
                            {subtitle}
                        </Typography>
                    )}
                </div>
            </div>
        </div>
    );
};
import React from 'react';
import { Icon, Typography, Badge, type IconName } from '@components/atoms';
import { StatusType } from '@utils/constants';

export interface StatusCardProps {
    title: string;
    value: string;
    status: StatusType;
    subtitle?: string;
    showBadge?: boolean;
    isLoading?: boolean;
    className?: string;
}

export const StatusCard: React.FC<StatusCardProps> = ({
    title,
    value,
    status,
    subtitle,
    showBadge = true,
    isLoading = false,
    className = '',
}) => {
    const getStatusConfig = (): { icon: IconName; colorClass: string; badgeText: string } => {
        switch (status) {
            case 'healthy':
                return {
                    icon: 'check',
                    colorClass: 'bg-green-100 text-green-600',
                    badgeText: 'Healthy',
                };
            case 'warning':
                return {
                    icon: 'warning',
                    colorClass: 'bg-yellow-100 text-yellow-600',
                    badgeText: 'Warning',
                };
            case 'critical':
                return {
                    icon: 'error',
                    colorClass: 'bg-red-100 text-red-600',
                    badgeText: 'Critical',
                };
            case 'unknown':
            default:
                return {
                    icon: 'info',
                    colorClass: 'bg-gray-100 text-gray-600',
                    badgeText: 'Unknown',
                };
        }
    };

    const { icon, colorClass, badgeText } = getStatusConfig();

    if (isLoading) {
        return (
            <div className={`bg-white rounded-lg shadow-md p-6 animate-pulse ${className}`}>
                <div className="flex items-center">
                    <div className={`p-3 rounded-full ${colorClass} mr-4`}>
                        <div className="w-6 h-6 bg-gray-200 rounded" />
                    </div>
                    <div className="flex-1">
                        <div className="h-3 bg-gray-200 rounded w-24 mb-2" />
                        <div className="h-8 bg-gray-200 rounded w-20" />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={`bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow ${className}`}>
            <div className="flex items-center">
                {/* Status Icon */}
                <div className={`p-3 rounded-full ${colorClass} mr-4`}>
                    <Icon name={icon} size="lg" />
                </div>

                {/* Content */}
                <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                        <Typography variant="body2" color="secondary">
                            {title}
                        </Typography>

                        {showBadge && (
                            <Badge variant={status} size="sm">
                                {badgeText}
                            </Badge>
                        )}
                    </div>

                    <Typography variant="h4" weight="semibold" className="mb-1">
                        {value}
                    </Typography>

                    {subtitle && (
                        <Typography variant="caption" color="gray">
                            {subtitle}
                        </Typography>
                    )}
                </div>
            </div>
        </div>
    );
};

// ========================
// SummaryCard Component
// ========================

export interface SummaryCardProps {
    title: string;
    value: string;
    icon: IconName;
    subtitle?: string;
    trend?: {
        value: number;
        isPositive: boolean;
        label?: string;
    };
    color?: 'blue' | 'green' | 'orange' | 'red' | 'purple' | 'gray';
    isLoading?: boolean;
    className?: string;
    onClick?: () => void;
}

export const SummaryCard: React.FC<SummaryCardProps> = ({
    title,
    value,
    icon,
    subtitle,
    trend,
    color = 'blue',
    isLoading = false,
    className = '',
    onClick,
}) => {
    const colorClasses = {
        blue: 'bg-blue-100 text-blue-600',
        green: 'bg-green-100 text-green-600',
        orange: 'bg-orange-100 text-orange-600',
        red: 'bg-red-100 text-red-600',
        purple: 'bg-purple-100 text-purple-600',
        gray: 'bg-gray-100 text-gray-600',
    };

    const isClickable = Boolean(onClick);
    const baseClasses = `bg-white rounded-lg shadow-md p-6 transition-all ${isClickable ? 'cursor-pointer hover:shadow-lg hover:scale-105' : 'hover:shadow-lg'
        }`;

    if (isLoading) {
        return (
            <div className={`${baseClasses} animate-pulse ${className}`}>
                <div className="flex items-center">
                    <div className={`p-3 rounded-full ${colorClasses[color]} mr-4`}>
                        <div className="w-6 h-6 bg-gray-200 rounded" />
                    </div>
                    <div className="flex-1">
                        <div className="h-3 bg-gray-200 rounded w-20 mb-2" />
                        <div className="h-8 bg-gray-200 rounded w-16" />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div
            className={`${baseClasses} ${className}`}
            onClick={onClick}
            role={isClickable ? 'button' : undefined}
            tabIndex={isClickable ? 0 : undefined}
        >
            <div className="flex items-center">
                {/* Icon */}
                <div className={`p-3 rounded-full ${colorClasses[color]} mr-4 flex-shrink-0`}>
                    <Icon name={icon} size="lg" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <Typography variant="body2" color="secondary" className="mb-1">
                        {title}
                    </Typography>

                    <div className="flex items-center space-x-2 mb-1">
                        <Typography variant="h4" weight="semibold">
                            {value}
                        </Typography>

                        {/* Trend */}
                        {trend && (
                            <div className={`flex items-center text-xs ${trend.isPositive ? 'text-green-600' : 'text-red-600'
                                }`}>
                                <Icon
                                    name={trend.isPositive ? 'arrow-up' : 'arrow-down'}
                                    size="xs"
                                />
                                <span className="ml-1">
                                    {Math.abs(trend.value)}%
                                    {trend.label && ` ${trend.label}`}
                                </span>
                            </div>
                        )}
                    </div>

                    {subtitle && (
                        <Typography variant="caption" color="gray">
                            {subtitle}
                        </Typography>
                    )}
                </div>

                {/* Click indicator */}
                {isClickable && (
                    <div className="ml-2 text-gray-400">
                        <Icon name="chevron-right" size="sm" />
                    </div>
                )}
            </div>
        </div>
    );
};
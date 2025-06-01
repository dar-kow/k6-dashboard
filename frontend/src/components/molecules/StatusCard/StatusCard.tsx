import React, { memo } from 'react';
import classNames from 'classnames';

interface StatusCardProps {
    title: string;
    value: string;
    status: 'healthy' | 'warning' | 'critical' | 'unknown';
    description?: string;
    actions?: React.ReactNode;
}

export const StatusCard: React.FC<StatusCardProps> = memo(({
    title,
    value,
    status,
    description,
    actions,
}) => {
    const getStatusConfig = () => {
        switch (status) {
            case 'healthy':
                return {
                    icon: '✅',
                    color: 'bg-green-100 text-green-600',
                    bgColor: 'bg-green-50',
                    borderColor: 'border-green-200',
                };
            case 'warning':
                return {
                    icon: '⚠️',
                    color: 'bg-yellow-100 text-yellow-600',
                    bgColor: 'bg-yellow-50',
                    borderColor: 'border-yellow-200',
                };
            case 'critical':
                return {
                    icon: '🚨',
                    color: 'bg-red-100 text-red-600',
                    bgColor: 'bg-red-50',
                    borderColor: 'border-red-200',
                };
            case 'unknown':
            default:
                return {
                    icon: '❓',
                    color: 'bg-gray-100 text-gray-600',
                    bgColor: 'bg-gray-50',
                    borderColor: 'border-gray-200',
                };
        }
    };

    const config = getStatusConfig();

    return (
        <div className={classNames(
            'p-6 rounded-lg border',
            config.bgColor,
            config.borderColor
        )}>
            <div className="flex items-center justify-between mb-4">
                <div className={classNames(
                    'p-3 rounded-full',
                    config.color
                )}>
                    <span className="text-xl">{config.icon}</span>
                </div>

                {actions && (
                    <div className="flex items-center space-x-2">
                        {actions}
                    </div>
                )}
            </div>

            <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">{title}</h3>
                <p className="text-2xl font-bold text-gray-900 mb-2">{value}</p>
                {description && (
                    <p className="text-sm text-gray-600">{description}</p>
                )}
            </div>
        </div>
    );
});

StatusCard.displayName = 'StatusCard';
import React from 'react';
import { StatusType, Size, getStatusColor } from '@utils/constants';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
    variant?: StatusType | 'primary' | 'secondary' | 'success' | 'warning' | 'error';
    size?: Size;
    children: React.ReactNode;
    dot?: boolean;
    icon?: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({
    variant = 'primary',
    size = 'md',
    children,
    dot = false,
    icon,
    className = '',
    ...props
}) => {
    const sizeClasses = {
        xs: 'px-1.5 py-0.5 text-xs',
        sm: 'px-2 py-1 text-xs',
        md: 'px-2.5 py-1 text-sm',
        lg: 'px-3 py-1.5 text-sm',
        xl: 'px-4 py-2 text-base',
    };

    const variantClasses = {
        primary: 'bg-blue-100 text-blue-800',
        secondary: 'bg-gray-100 text-gray-800',
        success: 'bg-green-100 text-green-800',
        healthy: 'bg-green-100 text-green-800',
        warning: 'bg-yellow-100 text-yellow-800',
        error: 'bg-red-100 text-red-800',
        critical: 'bg-red-100 text-red-800',
        unknown: 'bg-gray-100 text-gray-800',
    };

    const dotClasses = {
        primary: 'bg-blue-500',
        secondary: 'bg-gray-500',
        success: 'bg-green-500',
        healthy: 'bg-green-500',
        warning: 'bg-yellow-500',
        error: 'bg-red-500',
        critical: 'bg-red-500',
        unknown: 'bg-gray-500',
    };

    const baseClasses = 'inline-flex items-center font-medium rounded-full';
    const badgeClasses = `${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`;

    return (
        <span className={badgeClasses} {...props}>
            {/* Dot Indicator */}
            {dot && (
                <span className={`w-2 h-2 rounded-full mr-1.5 ${dotClasses[variant]}`} />
            )}

            {/* Icon */}
            {icon && (
                <span className="mr-1">
                    {icon}
                </span>
            )}

            {children}
        </span>
    );
};

// ========================
// Spinner Component
// ========================

export interface SpinnerProps {
    size?: Size | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
    color?: 'primary' | 'white' | 'gray';
    className?: string;
}

export const Spinner: React.FC<SpinnerProps> = ({
    size = 'md',
    color = 'primary',
    className = '',
}) => {
    const sizeClasses = {
        xs: 'w-3 h-3',
        sm: 'w-4 h-4',
        md: 'w-6 h-6',
        lg: 'w-8 h-8',
        xl: 'w-12 h-12',
    };

    const colorClasses = {
        primary: 'text-blue-600',
        white: 'text-white',
        gray: 'text-gray-600',
    };

    const spinnerClasses = `animate-spin ${sizeClasses[size]} ${colorClasses[color]} ${className}`;

    return (
        <svg className={spinnerClasses} fill="none" viewBox="0 0 24 24">
            <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
            />
            <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
        </svg>
    );
};
import React, { memo } from 'react';
import './Badge.scss';

export interface BadgeProps {
    variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';
    size?: 'sm' | 'md' | 'lg';
    children: React.ReactNode;
    className?: string;
}

export const Badge = memo<BadgeProps>(({
    variant = 'primary',
    size = 'md',
    children,
    className = ''
}) => {
    const classes = [
        'badge',
        `badge--${variant}`,
        `badge--${size}`,
        className
    ].filter(Boolean).join(' ');

    return (
        <span className={classes}>
            {children}
        </span>
    );
});

Badge.displayName = 'Badge';
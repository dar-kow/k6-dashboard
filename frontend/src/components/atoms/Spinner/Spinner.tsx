import React, { memo } from 'react';
import './Spinner.scss';

export interface SpinnerProps {
    size?: 'sm' | 'md' | 'lg';
    color?: 'primary' | 'white' | 'gray';
    className?: string;
}

export const Spinner = memo<SpinnerProps>(({
    size = 'md',
    color = 'primary',
    className = ''
}) => {
    const classes = [
        'spinner',
        `spinner--${size}`,
        `spinner--${color}`,
        className
    ].filter(Boolean).join(' ');

    return <div className={classes} />;
});

Spinner.displayName = 'Spinner';
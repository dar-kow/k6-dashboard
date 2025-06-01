import React, { memo } from 'react';
import classNames from 'classnames';

interface LoadingSpinnerProps {
    size?: 'small' | 'medium' | 'large';
    className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = memo(({
    size = 'medium',
    className,
}) => {
    const sizeClasses = {
        small: 'w-4 h-4',
        medium: 'w-6 h-6',
        large: 'w-8 h-8',
    };

    return (
        <div
            className={classNames(
                'loading-spinner',
                sizeClasses[size],
                className
            )}
        />
    );
});

LoadingSpinner.displayName = 'LoadingSpinner';
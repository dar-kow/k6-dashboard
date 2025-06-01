import React, { memo, forwardRef } from 'react';
import classNames from 'classnames';
import { LoadingSpinner } from '../LoadingSpinner/LoadingSpinner';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
    size?: 'small' | 'medium' | 'large';
    loading?: boolean;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
    fullWidth?: boolean;
}

export const Button = memo(forwardRef<HTMLButtonElement, ButtonProps>(({
    children,
    variant = 'primary',
    size = 'medium',
    loading = false,
    leftIcon,
    rightIcon,
    fullWidth = false,
    className,
    disabled,
    ...props
}, ref) => {
    const baseClasses = 'btn';
    const variantClasses = `btn--${variant}`;
    const sizeClasses = `btn--${size}`;
    const fullWidthClasses = fullWidth ? 'w-full' : '';

    const buttonClasses = classNames(
        baseClasses,
        variantClasses,
        sizeClasses,
        fullWidthClasses,
        {
            'opacity-50 cursor-not-allowed': disabled || loading,
        },
        className
    );

    return (
        <button
            ref={ref}
            className={buttonClasses}
            disabled={disabled || loading}
            {...props}
        >
            {loading && <LoadingSpinner size="small" className="mr-2" />}
            {!loading && leftIcon && <span className="mr-2">{leftIcon}</span>}
            {children}
            {!loading && rightIcon && <span className="ml-2">{rightIcon}</span>}
        </button>
    );
}));

Button.displayName = 'Button';
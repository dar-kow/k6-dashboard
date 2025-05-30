import React, { memo, forwardRef } from 'react';
import { Spinner } from '..';
import './Button.scss';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
    loading?: boolean;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
    fullWidth?: boolean;
}

export const Button = memo(forwardRef<HTMLButtonElement, ButtonProps>(({
    variant = 'primary',
    size = 'md',
    loading = false,
    leftIcon,
    rightIcon,
    fullWidth = false,
    children,
    disabled,
    className = '',
    ...props
}, ref) => {
    const classes = [
        'button',
        `button--${variant}`,
        `button--${size}`,
        fullWidth && 'button--full-width',
        loading && 'button--loading',
        className
    ].filter(Boolean).join(' ');

    return (
        <button
            ref={ref}
            className={classes}
            disabled={disabled || loading}
            {...props}
        >
            {loading && <Spinner size="sm" className="button__spinner" />}
            {!loading && leftIcon && <span className="button__icon button__icon--left">{leftIcon}</span>}
            <span className="button__content">{children}</span>
            {!loading && rightIcon && <span className="button__icon button__icon--right">{rightIcon}</span>}
        </button>
    );
}));

Button.displayName = 'Button';
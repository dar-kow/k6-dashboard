import React, { forwardRef } from 'react';
import { ButtonVariant, Size, getButtonClasses } from '@utils/constants';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant;
    size?: Size;
    isLoading?: boolean;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
    children: React.ReactNode;
    fullWidth?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(({
    variant = 'primary',
    size = 'md',
    isLoading = false,
    leftIcon,
    rightIcon,
    children,
    className = '',
    fullWidth = false,
    disabled,
    ...props
}, ref) => {
    const buttonClasses = getButtonClasses(variant, size);
    const fullWidthClass = fullWidth ? 'w-full' : '';
    const finalClasses = `${buttonClasses} ${fullWidthClass} ${className}`;

    const isDisabled = disabled || isLoading;

    return (
        <button
            ref={ref}
            className={finalClasses}
            disabled={isDisabled}
            {...props}
        >
            {/* Loading Spinner */}
            {isLoading && (
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
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
            )}

            {/* Left Icon */}
            {!isLoading && leftIcon && (
                <span className="mr-2">
                    {leftIcon}
                </span>
            )}

            {/* Button Text */}
            {children}

            {/* Right Icon */}
            {rightIcon && (
                <span className="ml-2">
                    {rightIcon}
                </span>
            )}
        </button>
    );
});

Button.displayName = 'Button';
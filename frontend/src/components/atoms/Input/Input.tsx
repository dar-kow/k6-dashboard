import React, { memo, forwardRef } from 'react';
import './Input.scss';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    helperText?: string;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
    fullWidth?: boolean;
}

export const Input = memo(forwardRef<HTMLInputElement, InputProps>(({
    label,
    error,
    helperText,
    leftIcon,
    rightIcon,
    fullWidth = false,
    className = '',
    ...props
}, ref) => {
    const inputClasses = [
        'input__field',
        leftIcon && 'input__field--has-left-icon',
        rightIcon && 'input__field--has-right-icon',
        error && 'input__field--error'
    ].filter(Boolean).join(' ');

    const containerClasses = [
        'input',
        fullWidth && 'input--full-width',
        className
    ].filter(Boolean).join(' ');

    return (
        <div className={containerClasses}>
            {label && (
                <label className="input__label">
                    {label}
                </label>
            )}

            <div className="input__wrapper">
                {leftIcon && (
                    <div className="input__icon input__icon--left">
                        {leftIcon}
                    </div>
                )}

                <input
                    ref={ref}
                    className={inputClasses}
                    {...props}
                />

                {rightIcon && (
                    <div className="input__icon input__icon--right">
                        {rightIcon}
                    </div>
                )}
            </div>

            {(error || helperText) && (
                <div className={`input__message ${error ? 'input__message--error' : ''}`}>
                    {error || helperText}
                </div>
            )}
        </div>
    );
}));

Input.displayName = 'Input';
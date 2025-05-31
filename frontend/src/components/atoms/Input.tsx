import React, { forwardRef } from 'react';
import { Size } from '@utils/constants';

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
    size?: Size;
    isError?: boolean;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
    label?: string;
    helperText?: string;
    errorText?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({
    size = 'md',
    isError = false,
    leftIcon,
    rightIcon,
    label,
    helperText,
    errorText,
    className = '',
    ...props
}, ref) => {
    const sizeClasses = {
        xs: 'px-2 py-1 text-xs',
        sm: 'px-3 py-1.5 text-sm',
        md: 'px-3 py-2 text-sm',
        lg: 'px-4 py-3 text-base',
        xl: 'px-6 py-4 text-lg',
    };

    const baseClasses = 'block w-full rounded-md border transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2';
    const errorClasses = isError
        ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
        : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500';

    const inputClasses = `${baseClasses} ${sizeClasses[size]} ${errorClasses} ${className}`;

    return (
        <div className="space-y-1">
            {/* Label */}
            {label && (
                <label className="block text-sm font-medium text-gray-700">
                    {label}
                </label>
            )}

            {/* Input Container */}
            <div className="relative">
                {/* Left Icon */}
                {leftIcon && (
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-400 sm:text-sm">
                            {leftIcon}
                        </span>
                    </div>
                )}

                {/* Input */}
                <input
                    ref={ref}
                    className={`${inputClasses} ${leftIcon ? 'pl-10' : ''} ${rightIcon ? 'pr-10' : ''}`}
                    {...props}
                />

                {/* Right Icon */}
                {rightIcon && (
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <span className="text-gray-400 sm:text-sm">
                            {rightIcon}
                        </span>
                    </div>
                )}
            </div>

            {/* Helper/Error Text */}
            {(helperText || errorText) && (
                <p className={`text-xs ${isError ? 'text-red-600' : 'text-gray-500'}`}>
                    {errorText || helperText}
                </p>
            )}
        </div>
    );
});

Input.displayName = 'Input';

// ========================
// Select Component
// ========================

export interface SelectOption {
    value: string | number;
    label: string;
    disabled?: boolean;
}

export interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
    size?: Size;
    isError?: boolean;
    label?: string;
    helperText?: string;
    errorText?: string;
    options?: SelectOption[];
    placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(({
    size = 'md',
    isError = false,
    label,
    helperText,
    errorText,
    options = [],
    placeholder,
    className = '',
    children,
    ...props
}, ref) => {
    const sizeClasses = {
        xs: 'px-2 py-1 text-xs',
        sm: 'px-3 py-1.5 text-sm',
        md: 'px-3 py-2 text-sm',
        lg: 'px-4 py-3 text-base',
        xl: 'px-6 py-4 text-lg',
    };

    const baseClasses = 'block w-full rounded-md border bg-white transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2';
    const errorClasses = isError
        ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
        : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500';

    const selectClasses = `${baseClasses} ${sizeClasses[size]} ${errorClasses} ${className}`;

    return (
        <div className="space-y-1">
            {/* Label */}
            {label && (
                <label className="block text-sm font-medium text-gray-700">
                    {label}
                </label>
            )}

            {/* Select */}
            <select
                ref={ref}
                className={selectClasses}
                {...props}
            >
                {/* Placeholder */}
                {placeholder && (
                    <option value="" disabled>
                        {placeholder}
                    </option>
                )}

                {/* Options from prop */}
                {options.map((option) => (
                    <option
                        key={option.value}
                        value={option.value}
                        disabled={option.disabled}
                    >
                        {option.label}
                    </option>
                ))}

                {/* Children options */}
                {children}
            </select>

            {/* Helper/Error Text */}
            {(helperText || errorText) && (
                <p className={`text-xs ${isError ? 'text-red-600' : 'text-gray-500'}`}>
                    {errorText || helperText}
                </p>
            )}
        </div>
    );
});

Select.displayName = 'Select';
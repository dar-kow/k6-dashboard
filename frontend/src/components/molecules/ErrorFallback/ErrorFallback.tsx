import React, { memo } from 'react';
import { Button, Icon } from '@components/atoms';
import './ErrorFallback.scss';

interface ErrorFallbackProps {
    error?: Error;
    resetError?: () => void;
    title?: string;
    message?: string;
    showDetails?: boolean;
}

export const ErrorFallback = memo<ErrorFallbackProps>(({
    error,
    resetError,
    title = 'Something went wrong',
    message = 'An unexpected error occurred. Please try again.',
    showDetails = process.env.NODE_ENV === 'development',
}) => {
    return (
        <div className="error-fallback">
            <div className="error-fallback__content">
                <div className="error-fallback__icon">
                    <Icon name="alert-circle" size="xl" />
                </div>

                <h2 className="error-fallback__title">{title}</h2>
                <p className="error-fallback__message">{message}</p>

                {showDetails && error && (
                    <details className="error-fallback__details">
                        <summary className="error-fallback__details-summary">
                            Error Details
                        </summary>
                        <pre className="error-fallback__details-content">
                            {error.stack || error.message}
                        </pre>
                    </details>
                )}

                <div className="error-fallback__actions">
                    {resetError && (
                        <Button variant="primary" onClick={resetError}>
                            Try Again
                        </Button>
                    )}
                    <Button
                        variant="secondary"
                        onClick={() => window.location.reload()}
                    >
                        Reload Page
                    </Button>
                </div>
            </div>
        </div>
    );
});

ErrorFallback.displayName = 'ErrorFallback';
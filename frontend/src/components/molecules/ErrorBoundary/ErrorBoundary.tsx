import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button, Icon } from '@components/atoms';

interface ErrorBoundaryState {
    hasError: boolean;
    error?: Error | undefined;
}

interface ErrorBoundaryProps {
    children: ReactNode;
    fallback?: ReactNode;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    handleReload = () => {
        window.location.reload();
    };

    handleReset = () => {
        this.setState({ hasError: false, error: undefined });
    };

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
                    <div className="max-w-md w-full text-center">
                        <div className="text-6xl mb-4">⚠️</div>
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">Something went wrong</h1>
                        <p className="text-gray-600 mb-6">We're sorry, but something unexpected happened.</p>

                        {import.meta.env.DEV && this.state.error && (
                            <details className="mb-6 text-left bg-gray-100 p-4 rounded-md">
                                <summary className="cursor-pointer text-sm font-medium text-gray-700 mb-2">
                                    Error details (development)
                                </summary>
                                <pre className="text-xs text-gray-600 overflow-auto max-h-40">
                                    {this.state.error.stack}
                                </pre>
                            </details>
                        )}

                        <div className="space-y-3">
                            <Button
                                variant="primary"
                                onClick={this.handleReset}
                                className="w-full"
                            >
                                Try Again
                            </Button>
                            <Button
                                variant="secondary"
                                onClick={this.handleReload}
                                className="w-full"
                            >
                                Reload Page
                            </Button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
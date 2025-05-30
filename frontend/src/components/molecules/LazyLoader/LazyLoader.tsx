import React, { memo, Suspense } from 'react';
import { Spinner } from '@components/atoms';
import { ErrorFallback } from '../ErrorFallback/ErrorFallback';
import { ErrorBoundary } from '../ErrorBoundary/ErrorBoundary';

interface LazyLoaderProps {
    children: React.ReactNode;
    fallback?: React.ReactNode;
    errorFallback?: React.ReactNode;
    minLoadingTime?: number;
}

export const LazyLoader = memo<LazyLoaderProps>(({
    children,
    fallback,
    errorFallback,
    minLoadingTime = 300,
}) => {
    const [showLoading, setShowLoading] = React.useState(true);

    React.useEffect(() => {
        const timer = setTimeout(() => {
            setShowLoading(false);
        }, minLoadingTime);

        return () => clearTimeout(timer);
    }, [minLoadingTime]);

    const defaultFallback = (
        <div className="lazy-loader">
            <Spinner size="lg" />
            <p>Loading component...</p>
        </div>
    );

    const defaultErrorFallback = (
        <ErrorFallback
            title="Failed to load component"
            message="There was an error loading this component."
        />
    );

    return (
        <ErrorBoundary fallback={errorFallback || defaultErrorFallback}>
            <Suspense fallback={fallback || defaultFallback}>
                {children}
            </Suspense>
        </ErrorBoundary>
    );
});

LazyLoader.displayName = 'LazyLoader';
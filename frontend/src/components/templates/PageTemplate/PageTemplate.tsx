import React, { memo, Suspense } from 'react';
import { ErrorBoundary } from '../../organisms/ErrorBoundary/ErrorBoundary';
import { LoadingSpinner } from '../../atoms/LoadingSpinner/LoadingSpinner';

interface PageTemplateProps {
    title: string;
    subtitle?: string;
    actions?: React.ReactNode;
    children: React.ReactNode;
    loading?: boolean;
    error?: string | null;
    breadcrumbs?: Array<{ label: string; href?: string }>;
}

export const PageTemplate: React.FC<PageTemplateProps> = memo(({
    title,
    subtitle,
    actions,
    children,
    loading = false,
    error = null,
    breadcrumbs,
}) => {
    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
                    <p className="text-gray-600 mb-4">{error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="btn btn--primary"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Breadcrumbs */}
                {breadcrumbs && breadcrumbs.length > 0 && (
                    <nav className="py-4">
                        <ol className="flex items-center space-x-2 text-sm text-gray-500">
                            {breadcrumbs.map((crumb, index) => (
                                <li key={index} className="flex items-center">
                                    {index > 0 && <span className="mx-2">/</span>}
                                    {crumb.href ? (
                                        <a href={crumb.href} className="hover:text-gray-700">
                                            {crumb.label}
                                        </a>
                                    ) : (
                                        <span className="text-gray-900 font-medium">{crumb.label}</span>
                                    )}
                                </li>
                            ))}
                        </ol>
                    </nav>
                )}

                {/* Header */}
                <div className="py-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
                            {subtitle && (
                                <p className="mt-2 text-gray-600">{subtitle}</p>
                            )}
                        </div>
                        {actions && (
                            <div className="flex items-center space-x-3">
                                {actions}
                            </div>
                        )}
                    </div>
                </div>

                {/* Content */}
                <div className="pb-8">
                    <ErrorBoundary>
                        <Suspense fallback={
                            <div className="flex justify-center py-8">
                                <LoadingSpinner size="large" />
                            </div>
                        }>
                            {loading ? (
                                <div className="flex justify-center py-8">
                                    <LoadingSpinner size="large" />
                                </div>
                            ) : (
                                children
                            )}
                        </Suspense>
                    </ErrorBoundary>
                </div>
            </div>
        </div>
    );
});

PageTemplate.displayName = 'PageTemplate';
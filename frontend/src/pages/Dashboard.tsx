import React, { memo, Suspense } from 'react';
import { PageTemplate } from '@components/templates/PageTemplate/PageTemplate';
import { useTestResults } from '@hooks/useTestResults';
import { useAppSelector } from '@store';
import { selectPdfGenerating } from '@store/slices/uiSlice';

// Lazy loaded components z lepszą organizacją
const DashboardContent = React.lazy(() => import('@components/organisms/DashboardContent/DashboardContent'));
const ExportPDFButton = React.lazy(() => import('@components/molecules/ExportPDFButton/ExportPDFButton'));

const Dashboard: React.FC = memo(() => {
    const {
        directories,
        loading,
        error,
        latestResults,
        latestResultsLoading,
    } = useTestResults();

    const pdfGenerating = useAppSelector(selectPdfGenerating);

    // Actions dla page template
    const actions = (
        <Suspense fallback={<div className="h-10 w-32 bg-gray-200 animate-pulse rounded" />}>
            <ExportPDFButton
                results={latestResults}
                disabled={latestResultsLoading || pdfGenerating}
            />
        </Suspense>
    );

    return (
        <PageTemplate
            title="Performance Dashboard"
            subtitle="Monitor your K6 test results and performance metrics"
            actions={actions}
            loading={loading}
            error={error}
            breadcrumbs={[
                { label: 'Home', href: '/' },
                { label: 'Dashboard' },
            ]}
        >
            <Suspense fallback={<DashboardSkeleton />}>
                <DashboardContent
                    results={latestResults}
                    directories={directories}
                    loading={latestResultsLoading}
                />
            </Suspense>
        </PageTemplate>
    );
});

// Loading skeleton component
const DashboardSkeleton: React.FC = memo(() => (
    <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
                <div key={i} className="h-24 bg-gray-200 animate-pulse rounded-lg" />
            ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[...Array(4)].map((_, i) => (
                <div key={i} className="h-80 bg-gray-200 animate-pulse rounded-lg" />
            ))}
        </div>
    </div>
));

Dashboard.displayName = 'Dashboard';
DashboardSkeleton.displayName = 'DashboardSkeleton';

export default Dashboard;
import React, { Suspense, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { AppProviders } from '@components/providers/AppProviders';
import { NotificationProvider } from '@components/molecules/NotificationProvider/NotificationProvider';
import { Spinner } from '@components/atoms';
import { useAppDispatch } from '@hooks/useAppDispatch';
import { loadPreferences } from '@store/slices/uiSlice';
import { LazyLoader } from '@components/molecules/LazyLoader/LazyLoader';

// Lazy load NEW atomic design pages
const Dashboard = React.lazy(() =>
    import('./pages/Dashboard/Dashboard').then(module => ({ default: module.Dashboard }))
);

const TestResults = React.lazy(() =>
    import('./pages/TestResults/TestResults').then(module => ({ default: module.TestResults }))
);

const TestRunner = React.lazy(() =>
    import('./pages/TestRunner/TestRunner').then(module => ({ default: module.TestRunner }))
);

// Legacy fallback components (temporary - will be removed after full migration)
const DashboardLegacy = React.lazy(() => import('./pages/Dashboard'));
const TestResultsLegacy = React.lazy(() => import('./pages/TestResults'));
const TestRunnerLegacy = React.lazy(() => import('./pages/TestRunner'));

// Enhanced page loader with better UX
const PageLoader = () => (
    <div className="page-loader">
        <Spinner size="lg" />
        <p>Loading page...</p>
    </div>
);

// Improved error fallback
const AppErrorFallback = () => (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md p-6">
            <div className="text-6xl mb-4">⚠️</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Application Error</h1>
            <p className="text-gray-600 mb-6">
                Something went wrong with the K6 Dashboard. Please check the console for more details.
            </p>
            <div className="space-y-3">
                <button
                    onClick={() => window.location.reload()}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                    Refresh Application
                </button>
                <button
                    onClick={() => {
                        localStorage.clear();
                        window.location.reload();
                    }}
                    className="w-full px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                >
                    Reset & Refresh
                </button>
            </div>
        </div>
    </div>
);

// 404 Not Found component
const NotFound = () => (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md p-6">
            <div className="text-6xl mb-4">🔍</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Page Not Found</h1>
            <p className="text-gray-600 mb-6">
                The page you're looking for doesn't exist in the K6 Dashboard.
            </p>
            <div className="space-y-3">
                <a
                    href="/"
                    className="inline-block w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                    Go to Dashboard
                </a>
                <a
                    href="/test-runner"
                    className="inline-block w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                >
                    Run Tests
                </a>
            </div>
        </div>
    </div>
);

function AppContent() {
    const dispatch = useAppDispatch();

    useEffect(() => {
        // Load user preferences on app start
        dispatch(loadPreferences());

        // Log app initialization
        console.log('🚀 K6 Dashboard initialized');
        console.log('📊 Environment:', import.meta.env.MODE);
        console.log('🔗 API URL:', import.meta.env.VITE_API_URL || 'http://localhost:4000/api');
    }, [dispatch]);

    return (
        <div className="app">
            <Suspense fallback={<PageLoader />}>
                <Routes>
                    {/* Main atomic design routes */}
                    <Route
                        path="/"
                        element={
                            <LazyLoader fallback={<PageLoader />} errorFallback={<AppErrorFallback />}>
                                <Dashboard />
                            </LazyLoader>
                        }
                    />

                    <Route
                        path="/results"
                        element={
                            <LazyLoader fallback={<PageLoader />} errorFallback={<AppErrorFallback />}>
                                <TestResults />
                            </LazyLoader>
                        }
                    />

                    <Route
                        path="/results/:directory"
                        element={
                            <LazyLoader fallback={<PageLoader />} errorFallback={<AppErrorFallback />}>
                                <TestResults />
                            </LazyLoader>
                        }
                    />

                    <Route
                        path="/test-runner"
                        element={
                            <LazyLoader fallback={<PageLoader />} errorFallback={<AppErrorFallback />}>
                                <TestRunner />
                            </LazyLoader>
                        }
                    />

                    {/* Legacy routes (temporary fallbacks) */}
                    <Route
                        path="/legacy/dashboard"
                        element={
                            <LazyLoader fallback={<PageLoader />}>
                                <DashboardLegacy />
                            </LazyLoader>
                        }
                    />

                    <Route
                        path="/legacy/results"
                        element={
                            <LazyLoader fallback={<PageLoader />}>
                                <TestResultsLegacy />
                            </LazyLoader>
                        }
                    />

                    <Route
                        path="/legacy/test-runner"
                        element={
                            <LazyLoader fallback={<PageLoader />}>
                                <TestRunnerLegacy />
                            </LazyLoader>
                        }
                    />

                    {/* Catch all route - 404 */}
                    <Route path="*" element={<NotFound />} />
                </Routes>
            </Suspense>

            {/* Global notification system */}
            <NotificationProvider />
        </div>
    );
}

function App() {
    return (
        <AppProviders>
            <AppContent />
        </AppProviders>
    );
}

export default App;
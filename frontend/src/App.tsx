import React, { Suspense, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { AppProviders } from '@components/providers/AppProviders';
import { NotificationProvider } from '@components/molecules/NotificationProvider/NotificationProvider';
import { Spinner } from '@components/atoms';
import { useAppDispatch } from '@hooks/useAppDispatch';
import { loadPreferences } from '@store/slices/uiSlice';
import { LazyLoader } from '@components/molecules/LazyLoader/LazyLoader';

// Lazy load pages - nowa struktura atomic design
const Dashboard = React.lazy(() =>
    import('./pages/Dashboard/Dashboard').then(module => ({ default: module.Dashboard }))
);

const TestResults = React.lazy(() =>
    import('./pages/TestResults/TestResults').then(module => ({ default: module.TestResults }))
);

const TestRunner = React.lazy(() =>
    import('./pages/TestRunner/TestRunner').then(module => ({ default: module.TestRunner }))
);

// Fallback loaders
const PageLoader = () => (
    <div className="page-loader">
        <Spinner size="lg" />
        <p>Loading page...</p>
    </div>
);

const AppErrorFallback = () => (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
            <div className="text-4xl mb-4">⚠️</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Application Error</h1>
            <p className="text-gray-600 mb-4">Something went wrong. Please refresh the page.</p>
            <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
                Refresh Page
            </button>
        </div>
    </div>
);

function AppContent() {
    const dispatch = useAppDispatch();

    useEffect(() => {
        // Load user preferences on app start
        dispatch(loadPreferences());
    }, [dispatch]);

    return (
        <div className="app">
            <Suspense fallback={<PageLoader />}>
                <Routes>
                    <Route
                        path="/"
                        element={
                            <LazyLoader>
                                <Dashboard />
                            </LazyLoader>
                        }
                    />
                    <Route
                        path="/results"
                        element={
                            <LazyLoader>
                                <TestResults />
                            </LazyLoader>
                        }
                    />
                    <Route
                        path="/results/:directory"
                        element={
                            <LazyLoader>
                                <TestResults />
                            </LazyLoader>
                        }
                    />
                    <Route
                        path="/test-runner"
                        element={
                            <LazyLoader>
                                <TestRunner />
                            </LazyLoader>
                        }
                    />
                    {/* Catch all route */}
                    <Route
                        path="*"
                        element={
                            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                                <div className="text-center">
                                    <div className="text-4xl mb-4">🔍</div>
                                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Page Not Found</h1>
                                    <p className="text-gray-600 mb-4">The page you're looking for doesn't exist.</p>
                                    <a
                                        href="/"
                                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                                    >
                                        Go to Dashboard
                                    </a>
                                </div>
                            </div>
                        }
                    />
                </Routes>
            </Suspense>

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
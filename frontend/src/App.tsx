import React, { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store';

// Lazy loaded components
const Layout = lazy(() => import('./components/templates/Layout'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const TestResults = lazy(() => import('./pages/TestResults'));
const TestRunner = lazy(() => import('./pages/TestRunner'));

// Loading component
const LoadingFallback = () => (
    <div className="flex items-center justify-center min-h-screen">
        <div className="flex items-center space-x-2">
            <div className="loading-spinner" />
            <span className="text-gray-600">Loading...</span>
        </div>
    </div>
);

// Error Boundary
class ErrorBoundary extends React.Component<
    { children: React.ReactNode },
    { hasError: boolean; error?: Error }
> {
    constructor(props: { children: React.ReactNode }) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: Error) {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error('App Error Boundary caught an error:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="flex items-center justify-center min-h-screen">
                    <div className="text-center">
                        <h1 className="text-2xl font-bold text-gray-900 mb-4">
                            Oops! Something went wrong
                        </h1>
                        <p className="text-gray-600 mb-4">
                            The application encountered an unexpected error.
                        </p>
                        <button
                            onClick={() => window.location.reload()}
                            className="btn btn--primary"
                        >
                            Reload Page
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

// Theme provider component
const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    useEffect(() => {
        // Load theme from localStorage
        const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const theme = savedTheme || (prefersDark ? 'dark' : 'light');

        document.documentElement.setAttribute('data-theme', theme);
    }, []);

    return <>{children}</>;
};

// Main App component
function App() {
    return (
        <ErrorBoundary>
            <Provider store={store}>
                <ThemeProvider>
                    <Router>
                        <Suspense fallback={<LoadingFallback />}>
                            <Layout>
                                <Routes>
                                    <Route path="/" element={<Dashboard />} />
                                    <Route path="/results" element={<TestResults />} />
                                    <Route path="/results/:directory" element={<TestResults />} />
                                    <Route path="/results/:repositoryId/*" element={<TestResults />} />
                                    <Route path="/test-runner" element={<TestRunner />} />
                                </Routes>
                            </Layout>
                        </Suspense>
                    </Router>
                </ThemeProvider>
            </Provider>
        </ErrorBoundary>
    );
}

export default App;
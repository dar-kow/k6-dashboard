import React, { Suspense, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { AppProviders } from '@components/providers/AppProviders';
import { NotificationProvider } from '@components/molecules/NotificationProvider/NotificationProvider';
import { Dashboard, TestResults, TestRunner } from '@pages/index';
import { Spinner } from '@components/atoms';
import { useAppDispatch } from '@hooks/useAppSelector';
import { loadPreferences } from '@store/slices/uiSlice';
import '@styles/main.scss';

const PageLoader = () => (
    <div className="page-loader">
        <Spinner size="lg" />
        <p>Loading page...</p>
    </div>
);

function AppContent() {
    const dispatch = useAppDispatch();

    useEffect(() => {
        // Load user preferences on app start
        dispatch(loadPreferences());
    }, [dispatch]);

    return (
        <>
            <div className="app">
                <Suspense fallback={<PageLoader />}>
                    <Routes>
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/results" element={<TestResults />} />
                        <Route path="/results/:directory" element={<TestResults />} />
                        <Route path="/test-runner" element={<TestRunner />} />
                    </Routes>
                </Suspense>
            </div>
            <NotificationProvider />
        </>
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
import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store';
import DefaultLayout from "./components/templates/DefaultLayout";
import LoadingSpinner from './components/atoms/LoadingSpinner';
import { TestResultProvider } from './context/TestResultContext';
import { RepositoryProvider } from './context/RepositoryContext';
import './styles/main.scss';

// Lazy-loaded pages
const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const TestResultsPage = lazy(() => import("./pages/TestResultsPage"));
const TestRunnerPage = lazy(() => import("./pages/TestRunnerPage"));

function App() {
    return (
        <Provider store={store}>
            <RepositoryProvider>
                <TestResultProvider>
                    <Router>
                        <DefaultLayout>
                            <Suspense fallback={<LoadingSpinner fullPage />}>
                                <Routes>
                                    <Route path="/" element={<DashboardPage />} />
                                    <Route path="/results" element={<TestResultsPage />} />
                                    <Route path="/results/:directory" element={<TestResultsPage />} />
                                    <Route path="/results/:repositoryId/*" element={<TestResultsPage />} />
                                    <Route path="/test-runner" element={<TestRunnerPage />} />
                                </Routes>
                            </Suspense>
                        </DefaultLayout>
                    </Router>
                </TestResultProvider>
            </RepositoryProvider>
        </Provider>
    );
}

export default App;
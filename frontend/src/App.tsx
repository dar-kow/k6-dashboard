import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store';
import Layout from './components/Layout';
import LoadingSpinner from './components/atoms/LoadingSpinner';
import { TestResultProvider } from './context/TestResultContext';
import { RepositoryProvider } from './context/RepositoryContext';
import './styles/main.scss';

// Lazy-loaded pages
const Dashboard = lazy(() => import('./pages/Dashboard'));
const TestResults = lazy(() => import('./pages/TestResults'));
const TestRunner = lazy(() => import('./pages/TestRunner'));

function App() {
    return (
        <Provider store={store}>
            <RepositoryProvider>
                <TestResultProvider>
                    <Router>
                        <Layout>
                            <Suspense fallback={<LoadingSpinner fullPage />}>
                                <Routes>
                                    <Route path="/" element={<Dashboard />} />
                                    <Route path="/results" element={<TestResults />} />
                                    <Route path="/results/:directory" element={<TestResults />} />
                                    <Route path="/results/:repositoryId/*" element={<TestResults />} />
                                    <Route path="/test-runner" element={<TestRunner />} />
                                </Routes>
                            </Suspense>
                        </Layout>
                    </Router>
                </TestResultProvider>
            </RepositoryProvider>
        </Provider>
    );
}

export default App;
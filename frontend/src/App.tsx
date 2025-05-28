import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import TestResults from './pages/TestResults';
import TestRunner from './pages/TestRunner';
import { TestResultProvider } from './context/TestResultContext';
import { RepositoryProvider } from './context/RepositoryContext';

function App() {
    return (
        <Router>
            <RepositoryProvider>
                <TestResultProvider>
                    <Layout>
                        <Routes>
                            <Route path="/" element={<Dashboard />} />
                            <Route path="/results" element={<TestResults />} />
                            <Route path="/results/:directory" element={<TestResults />} />
                            <Route path="/test-runner" element={<TestRunner />} />
                        </Routes>
                    </Layout>
                </TestResultProvider>
            </RepositoryProvider>
        </Router>
    );
}

export default App;
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import TestResults from './pages/TestResults';
import TestRunner from './pages/TestRunner';
import Layout from './components/Layout';
import { TestResultsProvider } from './context/TestResultContext';

const App: React.FC = () => {
    return (
        <TestResultsProvider>
            <Router>
                <Layout>
                    <Routes>
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/results/:directory?" element={<TestResults />} />
                        <Route path="/test-runner" element={<TestRunner />} />
                    </Routes>
                </Layout>
            </Router>
        </TestResultsProvider>
    );
};

export default App;
import React, { useEffect } from 'react';
import { Provider } from 'react-redux';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { store } from './store';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import TestResults from './pages/TestResults';
import TestRunner from './pages/TestRunner';
import MigrationWrapper from './components/MigrationWrapper';

// Import new styles
import './styles/main.scss';

// 🔄 MIGRATION: Keep legacy context providers for components that haven't been migrated yet
// These will be removed in later phases as we migrate components to Redux
import { TestResultProvider } from './context/TestResultContext';
import { RepositoryProvider } from './context/RepositoryContext';

function App() {
    useEffect(() => {
        // Initialize Redux store on app start
        store.dispatch({ type: 'INIT_APP' });

        console.log('🚀 K6 Dashboard App initialized with Redux!');
        console.log('📊 Store state:', store.getState());
    }, []);

    return (
        <Provider store={store}>
            <MigrationWrapper>
                {/* 
                🔄 MIGRATION STRATEGY:
                - Keep legacy providers for backward compatibility
                - Components will gradually migrate from Context to Redux hooks
                - Once all components are migrated, these providers will be removed
                */}
                <RepositoryProvider>
                    <TestResultProvider>
                        <Router>
                            <Layout>
                                <Routes>
                                    <Route path="/" element={<Dashboard />} />
                                    <Route path="/results" element={<TestResults />} />
                                    <Route path="/results/:directory" element={<TestResults />} />
                                    <Route path="/results/:repositoryId/*" element={<TestResults />} />
                                    <Route path="/test-runner" element={<TestRunner />} />
                                </Routes>
                            </Layout>
                        </Router>
                    </TestResultProvider>
                </RepositoryProvider>
            </MigrationWrapper>
        </Provider>
    );
}

export default App;
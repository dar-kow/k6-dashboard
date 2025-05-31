import React, { useEffect } from 'react';
import { Provider } from 'react-redux';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { store } from './store';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import TestResults from './pages/TestResults';
import TestRunner from './pages/TestRunner';

// Import new styles
import './styles/main.scss';

// Import legacy context providers (będą usunięte w ETAPIE 3)
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
            {/* 
        TODO: W ETAPIE 3 usuniemy te legacy providery 
        i zastąpimy je Redux state management
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
        </Provider>
    );
}

export default App;
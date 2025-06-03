
import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from '@/store';
import Sidebar from '@/components/organisms/Sidebar/Sidebar';
import './App.scss';

// Lazy load pages
const Dashboard = React.lazy(() => import('@/pages/Dashboard/Dashboard'));
const TestResults = React.lazy(() => import('@/pages/TestResults/TestResults'));
const TestRunner = React.lazy(() => import('@/pages/TestRunner/TestRunner'));

const LoadingSpinner = () => (
  <div className="loading-spinner">
    <div className="spinner" />
    <span>Loading...</span>
  </div>
);

function App() {
  return (
    <Provider store={store}>
      <Router>
        <div className="app">
          <Sidebar />
          <main className="app__content">
            <Suspense fallback={<LoadingSpinner />}>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/test-results" element={<TestResults />} />
                <Route path="/test-runner" element={<TestRunner />} />
              </Routes>
            </Suspense>
          </main>
        </div>
      </Router>
    </Provider>
  );
}

export default App;

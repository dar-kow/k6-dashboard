import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';

// import testResultsSlice from '../store/slices/testResultsSlice';
// import repositorySlice from '../store/slices/repositorySlice';
// import uiSlice from '../store/slices/uiSlice';
// import testRunnerSlice from '../store/slices/testRunnerSlice';

const createTestStore = (preloadedState?: any) => {
    return configureStore({
        reducer: {
            // testResults: testResultsSlice,
            // repository: repositorySlice,
            // ui: uiSlice,
            // testRunner: testRunnerSlice,
        },
        preloadedState,
        middleware: (getDefaultMiddleware) =>
            getDefaultMiddleware({
                serializableCheck: false,
                thunk: true,
            }),
        devTools: false,
    });
};

// Test wrapper component
interface AllTheProvidersProps {
    children: React.ReactNode;
    initialState?: any;
    store?: ReturnType<typeof createTestStore>;
}

const AllTheProviders: React.FC<AllTheProvidersProps> = ({
    children,
    initialState,
    store = createTestStore(initialState)
}) => {
    return (
        <Provider store={store}>
            <BrowserRouter>
                {children}
            </BrowserRouter>
        </Provider>
    );
};

// Custom render function
const customRender = (
    ui: ReactElement,
    options?: Omit<RenderOptions, 'wrapper'> & {
        initialState?: any;
        store?: ReturnType<typeof createTestStore>;
    }
) => {
    const { initialState, store, ...renderOptions } = options || {};

    const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
        <AllTheProviders initialState={initialState} store={store}>
            {children}
        </AllTheProviders>
    );

    return render(ui, { wrapper: Wrapper, ...renderOptions });
};

// Mock data factories with proper TypeScript types
export const createMockTestResult = (overrides: any = {}) => {
    const defaultResult = {
        metrics: {
            http_reqs: { count: 1000, rate: 10 },
            http_req_duration: { avg: 150, min: 50, max: 500, p90: 200, p95: 250 },
            http_req_failed: { value: 0.02 },
            data_received: { count: 50000 },
            ...overrides.metrics,
        },
        root_group: {
            checks: {},
            ...overrides.root_group,
        },
        ...overrides,
    };

    return defaultResult;
};

export const createMockRepository = (overrides: any = {}) => ({
    id: '123',
    name: 'Test Repository',
    url: 'https://github.com/test/repo.git',
    branch: 'main',
    createdAt: '2023-01-01T00:00:00Z',
    needsSync: false,
    ...overrides,
});

export const createMockDirectory = (overrides: any = {}) => ({
    name: 'test-directory',
    path: '/path/to/test',
    date: new Date('2023-01-01'),
    ...overrides,
});

// Re-export everything
export * from '@testing-library/react';
export { customRender as render };
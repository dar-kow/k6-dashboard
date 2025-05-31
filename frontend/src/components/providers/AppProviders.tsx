import React, { memo } from 'react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { store } from '@store/index';
import { ErrorBoundary } from '@components/molecules/ErrorBoundary/ErrorBoundary';

interface AppProvidersProps {
    children: React.ReactNode;
}

export const AppProviders = memo<AppProvidersProps>(({ children }) => {
    return (
        <ErrorBoundary>
            <Provider store={store}>
                <BrowserRouter
                    future={{
                        v7_startTransition: true,
                        v7_relativeSplatPath: true
                    }}
                >
                    {children}
                </BrowserRouter>
            </Provider>
        </ErrorBoundary>
    );
});

AppProviders.displayName = 'AppProviders';
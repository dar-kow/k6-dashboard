import { configureStore } from '@reduxjs/toolkit';
import createSagaMiddleware from 'redux-saga';
import { rootSaga } from './sagas';

// Import slices
import testResultsSlice from './slices/testResultsSlice';
import repositorySlice from './slices/repositorySlice';
import uiSlice from './slices/uiSlice';
import testRunnerSlice from './slices/testRunnerSlice';

// Create saga middleware
const sagaMiddleware = createSagaMiddleware();

// Configure store
export const store = configureStore({
  reducer: {
    testResults: testResultsSlice,
    repository: repositorySlice,
    ui: uiSlice,
    testRunner: testRunnerSlice,
  },
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      thunk: false, // wyłączamy thunk, używamy saga
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }).concat(sagaMiddleware),
  devTools: import.meta.env.DEV,
});

// Run saga
sagaMiddleware.run(rootSaga);

// Export types
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Export typed hooks
import { useDispatch, useSelector, TypedUseSelectorHook } from 'react-redux';

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

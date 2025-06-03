
import { configureStore } from '@reduxjs/toolkit';
import createSagaMiddleware from 'redux-saga';
import { testSlice } from './slices/testSlice';
import { dashboardSlice } from './slices/dashboardSlice';
import { terminalSlice } from './slices/terminalSlice';
import { repositorySlice } from './slices/repositorySlice';
import rootSaga from './sagas';

const sagaMiddleware = createSagaMiddleware();

export const store = configureStore({
  reducer: {
    test: testSlice.reducer,
    dashboard: dashboardSlice.reducer,
    terminal: terminalSlice.reducer,
    repository: repositorySlice.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      thunk: false,
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'],
      },
    }).concat(sagaMiddleware),
});

sagaMiddleware.run(rootSaga);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

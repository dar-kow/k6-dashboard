import { configureStore } from "@reduxjs/toolkit";
import createSagaMiddleware from "redux-saga";
import { testResultsSlice } from "./slices/testResultsSlice";
import { repositoriesSlice } from "./slices/repositoriesSlice";
import { uiSlice } from "./slices/uiSlice";
import rootSaga from "./sagas";

const sagaMiddleware = createSagaMiddleware();

export const store = configureStore({
  reducer: {
    testResults: testResultsSlice.reducer,
    repositories: repositoriesSlice.reducer,
    ui: uiSlice.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ["persist/PERSIST"],
      },
    }).concat(sagaMiddleware),
});

sagaMiddleware.run(rootSaga);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

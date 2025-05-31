import { combineReducers } from "@reduxjs/toolkit";

// Import our slice reducers
import testResultsReducer from "./slices/testResults.slice";
import repositoriesReducer from "./slices/repositories.slice";
import uiReducer from "./slices/ui.slice";

export const rootReducer = combineReducers({
  // Main application state
  testResults: testResultsReducer,
  repositories: repositoriesReducer,
  ui: uiReducer,

  // Legacy placeholder (will be removed after full migration)
  app: (state = { initialized: true }, action: any) => {
    switch (action.type) {
      case "INIT_STORE":
        return { ...(state || {}), initialized: true };
      default:
        return state;
    }
  },
});

export type RootState = ReturnType<typeof rootReducer>;

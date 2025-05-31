import { combineReducers } from "@reduxjs/toolkit";

// Import slices (będą dodane w następnych etapach)
// import { testResultsSlice } from './slices/testResults.slice';
// import { repositoriesSlice } from './slices/repositories.slice';
// import { uiSlice } from './slices/ui.slice';

// Temporary placeholder reducer for initial setup
const placeholderReducer = (state = { initialized: true }, action: any) => {
  switch (action.type) {
    case "INIT_STORE":
      return { ...state, initialized: true };
    default:
      return state;
  }
};

export const rootReducer = combineReducers({
  // TODO: Dodamy slice'y w ETAPIE 3
  // testResults: testResultsSlice.reducer,
  // repositories: repositoriesSlice.reducer,
  // ui: uiSlice.reducer,

  // Temporary placeholder
  app: placeholderReducer,
});

export type RootState = ReturnType<typeof rootReducer>;

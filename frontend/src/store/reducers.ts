import { combineReducers } from "@reduxjs/toolkit";
import testResultsReducer from "./slices/testResultsSlice";
import repositoriesReducer from "./slices/repositoriesSlice";

export const rootReducer = combineReducers({
  testResults: testResultsReducer,
  repositories: repositoriesReducer,
});

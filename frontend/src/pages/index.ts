import React from "react";

// Lazy load atomic design pages
export const Dashboard = React.lazy(() =>
  import("./Dashboard/Dashboard").then((module) => ({
    default: module.Dashboard,
  }))
);

export const TestResults = React.lazy(() =>
  import("./TestResults/TestResults").then((module) => ({
    default: module.TestResults,
  }))
);

export const TestRunner = React.lazy(() =>
  import("./TestRunner/TestRunner").then((module) => ({
    default: module.TestRunner,
  }))
);

// Temporary fallback exports for old components (will be removed after migration)
export const DashboardOld = React.lazy(() => import("../pages/Dashboard"));
export const TestResultsOld = React.lazy(() => import("../pages/TestResults"));
export const TestRunnerOld = React.lazy(() => import("../pages/TestRunner"));

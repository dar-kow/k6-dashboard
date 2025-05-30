import React from "react";

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

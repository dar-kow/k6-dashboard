import React from "react";

export { BaseChart, type BaseChartProps } from "./BaseChart";
export { AreaChart, type AreaChartProps } from "./AreaChart";
export { BarChart, type BarChartProps } from "./BarChart";
export { PieChart, type PieChartProps } from "./PieChart";

// Lazy exports for code splitting
export const LineChart = React.lazy(() => import("./LineChart"));
export const MultiLineChart = React.lazy(() => import("./MultiLineChart"));
export const MultiBarChart = React.lazy(() => import("./MultiBarChart"));


import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface DashboardMetrics {
  totalRequests: number;
  avgResponseTime: number;
  errorRate: number;
  throughput: number;
  healthStatus: 'healthy' | 'warning' | 'critical';
}

interface DashboardState {
  metrics: DashboardMetrics;
  chartData: any[];
  loading: boolean;
  error: string | null;
}

const initialState: DashboardState = {
  metrics: {
    totalRequests: 0,
    avgResponseTime: 0,
    errorRate: 0,
    throughput: 0,
    healthStatus: 'healthy',
  },
  chartData: [],
  loading: false,
  error: null,
};

export const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {
    setMetrics: (state, action: PayloadAction<DashboardMetrics>) => {
      state.metrics = action.payload;
    },
    setChartData: (state, action: PayloadAction<any[]>) => {
      state.chartData = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    fetchDashboardData: (state) => {
      state.loading = true;
    },
  },
});

export const {
  setMetrics,
  setChartData,
  setLoading,
  setError,
  fetchDashboardData,
} = dashboardSlice.actions;

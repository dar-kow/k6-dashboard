
import { call, put, takeLatest } from 'redux-saga/effects';
import { dashboardApi } from '@/services/api';
import {
  setMetrics,
  setChartData,
  setLoading,
  setError,
  fetchDashboardData,
} from '../slices/dashboardSlice';

function* fetchDashboardDataSaga() {
  try {
    const [metrics, chartData] = yield Promise.all([
      call(dashboardApi.getMetrics),
      call(dashboardApi.getChartData),
    ]);
    yield put(setMetrics(metrics));
    yield put(setChartData(chartData));
    yield put(setLoading(false));
  } catch (error: any) {
    yield put(setError(error.message));
    yield put(setLoading(false));
  }
}

export default function* dashboardSaga() {
  yield takeLatest(fetchDashboardData.type, fetchDashboardDataSaga);
}

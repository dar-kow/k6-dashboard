
import { call, put, takeEvery, takeLatest } from 'redux-saga/effects';
import { PayloadAction } from '@reduxjs/toolkit';
import { testApi } from '@/services/api';
import {
  setTestDirectories,
  setTestResults,
  setLoading,
  setError,
  fetchTestDirectories,
  fetchTestResult,
  executeTest,
} from '../slices/testSlice';

function* fetchTestDirectoriesSaga() {
  try {
    const directories = yield call(testApi.getTestDirectories);
    yield put(setTestDirectories(directories));
    yield put(setLoading(false));
  } catch (error: any) {
    yield put(setError(error.message));
    yield put(setLoading(false));
  }
}

function* fetchTestResultSaga(action: PayloadAction<string>) {
  try {
    const result = yield call(testApi.getTestResult, action.payload);
    yield put(setTestResults(result));
    yield put(setLoading(false));
  } catch (error: any) {
    yield put(setError(error.message));
    yield put(setLoading(false));
  }
}

function* executeTestSaga(action: PayloadAction<any>) {
  try {
    yield call(testApi.executeTest, action.payload);
    yield put(setLoading(false));
  } catch (error: any) {
    yield put(setError(error.message));
    yield put(setLoading(false));
  }
}

export default function* testSaga() {
  yield takeLatest(fetchTestDirectories.type, fetchTestDirectoriesSaga);
  yield takeLatest(fetchTestResult.type, fetchTestResultSaga);
  yield takeEvery(executeTest.type, executeTestSaga);
}

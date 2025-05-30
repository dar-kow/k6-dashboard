import { call, put, takeEvery, takeLatest } from "redux-saga/effects";
import { PayloadAction } from "@reduxjs/toolkit";
import * as api from "../../services/testResultsApi";
import {
  fetchDirectoriesStart,
  fetchDirectoriesSuccess,
  fetchDirectoriesFailure,
  setSelectedDirectory,
  fetchFilesStart,
  fetchFilesSuccess,
  fetchFilesFailure,
  setSelectedFile,
  fetchTestResultStart,
  fetchTestResultSuccess,
  fetchTestResultFailure,
} from "../slices/testResultsSlice";

function* fetchDirectoriesSaga(action: PayloadAction<string | undefined>) {
  try {
    const directories: api.TestDirectory[] = yield call(
      api.fetchResultDirectories,
      action.payload
    );
    yield put(fetchDirectoriesSuccess(directories));
  } catch (error) {
    yield put(
      fetchDirectoriesFailure(
        error instanceof Error ? error.message : "Unknown error"
      )
    );
  }
}

function* fetchFilesSaga(action: PayloadAction<string>) {
  try {
    yield put(fetchFilesStart());
    const files: api.TestFile[] = yield call(
      api.fetchResultFiles,
      action.payload
    );
    yield put(fetchFilesSuccess(files));
  } catch (error) {
    yield put(
      fetchFilesFailure(
        error instanceof Error ? error.message : "Unknown error"
      )
    );
  }
}

function* fetchTestResultSaga(
  action: PayloadAction<{ directory: string; file: string }>
) {
  try {
    yield put(fetchTestResultStart());
    const result: api.TestResult = yield call(
      api.fetchTestResult,
      action.payload.directory,
      action.payload.file
    );
    yield put(fetchTestResultSuccess(result));
  } catch (error) {
    yield put(
      fetchTestResultFailure(
        error instanceof Error ? error.message : "Unknown error"
      )
    );
  }
}

export default function* testResultsSaga() {
  yield takeLatest("testResults/fetchDirectories", fetchDirectoriesSaga);
  yield takeEvery(setSelectedDirectory.type, fetchFilesSaga);
  yield takeEvery(setSelectedFile.type, fetchTestResultSaga);
}

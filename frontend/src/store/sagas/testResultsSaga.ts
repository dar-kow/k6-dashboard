import { SagaIterator } from "redux-saga";
import { call, put, takeLatest, select } from "redux-saga/effects";
import { PayloadAction } from "@reduxjs/toolkit";
import { RootState } from "../index";
import {
  fetchDirectoriesRequest,
  fetchDirectoriesSuccess,
  fetchDirectoriesFailure,
  fetchFilesRequest,
  fetchFilesSuccess,
  fetchFilesFailure,
  fetchTestResultRequest,
  fetchTestResultSuccess,
  fetchTestResultFailure,
  refreshTestResults,
} from "../slices/testResultsSlice";
import {
  fetchResultDirectories,
  fetchResultFiles,
  fetchTestResult,
} from "@/api/results";

function* fetchDirectoriesSaga(
  action: PayloadAction<string | undefined>
): SagaIterator {
  try {
    const directories = yield call(fetchResultDirectories, action.payload);
    yield put(fetchDirectoriesSuccess(directories));

    const selectedDirectory = yield select(
      (state: RootState) => state.testResults.selectedDirectory
    );
    if (directories.length > 0 && !selectedDirectory) {
      yield put({
        type: "testResults/setSelectedDirectory",
        payload: directories[0].name,
      });
    }
  } catch (error) {
    yield put(
      fetchDirectoriesFailure(
        error instanceof Error ? error.message : "Unknown error"
      )
    );
  }
}

function* fetchFilesSaga(action: PayloadAction<string>): SagaIterator {
  try {
    const files = yield call(fetchResultFiles, action.payload);
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
): SagaIterator {
  try {
    const { directory, file } = action.payload;
    const result = yield call(fetchTestResult, directory, file);
    yield put(fetchTestResultSuccess(result));
  } catch (error) {
    yield put(
      fetchTestResultFailure(
        error instanceof Error ? error.message : "Unknown error"
      )
    );
  }
}

function* refreshTestResultsSaga(): SagaIterator {
  try {
    const repositoryId = yield select(
      (state: RootState) => state.repositories.selectedRepository?.id
    );
    yield put(fetchDirectoriesRequest(repositoryId));
  } catch (error) {
    yield put(
      fetchDirectoriesFailure(
        error instanceof Error ? error.message : "Unknown error"
      )
    );
  }
}

export function* testResultsSaga() {
  yield takeLatest("testResults/fetchDirectoriesRequest", fetchDirectoriesSaga);
  yield takeLatest("testResults/fetchFilesRequest", fetchFilesSaga);
  yield takeLatest("testResults/fetchTestResultRequest", fetchTestResultSaga);
  yield takeLatest("testResults/refreshTestResults", refreshTestResultsSaga);

  yield takeLatest(
    "testResults/setSelectedDirectory",
    function* (action: PayloadAction<string | null>) {
      if (action.payload) {
        yield put(fetchFilesRequest(action.payload));
      }
    }
  );

  yield takeLatest(
    "testResults/setSelectedFile",
    function* (action: PayloadAction<string | null>): SagaIterator {
      const directory = yield select(
        (state: RootState) => state.testResults.selectedDirectory
      );
      const file = action.payload;
      if (directory && file) {
        yield put(fetchTestResultRequest({ directory, file }));
      }
    }
  );
}

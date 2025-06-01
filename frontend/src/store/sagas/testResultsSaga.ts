import { call, put, select, takeEvery, takeLatest, delay, race, fork } from 'redux-saga/effects';
import { PayloadAction } from '@reduxjs/toolkit';
import {
  fetchDirectoriesStart,
  fetchDirectoriesSuccess,
  fetchDirectoriesFailure,
  fetchFilesStart,
  fetchFilesSuccess,
  fetchFilesFailure,
  fetchTestResultStart,
  fetchTestResultSuccess,
  fetchTestResultFailure,
  fetchLatestResultsStart,
  fetchLatestResultsSuccess,
  fetchLatestResultsFailure,
  selectSelectedDirectory,
} from '../slices/testResultsSlice';
import { selectSelectedRepository } from '../slices/repositorySlice';
import { addNotification } from '../slices/uiSlice';
import { fetchResultDirectories, fetchResultFiles, fetchTestResult } from '../../api/results';
import { TestDirectory, TestFile, TestResult } from '../../types/testResults';

// Worker Sagas
function* fetchDirectoriesSaga(): Generator<any, void, any> {
  try {
    // Get selected repository from state
    const selectedRepository: ReturnType<typeof selectSelectedRepository> = yield select(
      selectSelectedRepository
    );

    const repositoryId = selectedRepository?.id;
    const directories: TestDirectory[] = yield call(fetchResultDirectories, repositoryId);

    yield put(fetchDirectoriesSuccess(directories));

    // Show success notification for first-time loads
    yield put(
      addNotification({
        type: 'success',
        title: 'Success',
        message: `Loaded ${directories.length} test runs`,
      })
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    yield put(fetchDirectoriesFailure(errorMessage));

    yield put(
      addNotification({
        type: 'error',
        title: 'Error loading directories',
        message: errorMessage,
      })
    );
  }
}

function* fetchFilesSaga(action: PayloadAction<string>): Generator<any, void, any> {
  try {
    const directory = action.payload;
    const files: TestFile[] = yield call(fetchResultFiles, directory);

    yield put(fetchFilesSuccess({ directory, files }));
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    yield put(fetchFilesFailure(errorMessage));

    yield put(
      addNotification({
        type: 'error',
        title: 'Error loading files',
        message: errorMessage,
      })
    );
  }
}

function* fetchTestResultSaga(
  action: PayloadAction<{ directory: string; file: string }>
): Generator<any, void, any> {
  try {
    const { directory, file } = action.payload;
    const result: TestResult = yield call(fetchTestResult, directory, file);

    yield put(fetchTestResultSuccess({ directory, file, result }));
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    yield put(fetchTestResultFailure({ ...action.payload, error: errorMessage }));

    yield put(
      addNotification({
        type: 'error',
        title: 'Error loading test result',
        message: `Failed to load ${action.payload.file}: ${errorMessage}`,
      })
    );
  }
}

function* fetchLatestResultsSaga(): Generator<any, void, any> {
  try {
    const selectedDirectory: string | null = yield select(selectSelectedDirectory);

    if (!selectedDirectory) {
      yield put(fetchLatestResultsFailure());
      return;
    }

    const results: Record<string, TestResult> = {};

    if (selectedDirectory.endsWith('.json')) {
      // Virtual directory - single file
      const pathParts = selectedDirectory.split('/');
      const fileName = pathParts[pathParts.length - 1];
      const testKey = fileName.replace('.json', '').replace(/^\d{8}_\d{6}_/, '');

      const result: TestResult = yield call(fetchTestResult, selectedDirectory, fileName);
      results[testKey] = result;
    } else {
      // Real directory - multiple files
      const files: TestFile[] = yield call(fetchResultFiles, selectedDirectory);

      if (files.length === 0) {
        yield put(fetchLatestResultsSuccess({}));
        return;
      }

      // Process up to 10 files with timeout
      const filesToProcess = files.slice(0, Math.min(10, files.length));

      for (const file of filesToProcess) {
        try {
          // Add timeout for each file fetch (5 seconds)
          const { response, timeout }: any = yield race({
            response: call(fetchTestResult, selectedDirectory, file.name),
            timeout: delay(5000),
          });

          if (timeout) {
            console.warn(`Timeout loading ${file.name}`);
            continue;
          }

          const testKey = file.name.replace('.json', '');
          results[testKey] = response;
        } catch (error) {
          console.error(`Error loading ${file.name}:`, error);
          // Continue with other files
        }
      }
    }

    yield put(fetchLatestResultsSuccess(results));
  } catch (error) {
    yield put(fetchLatestResultsFailure());

    yield put(
      addNotification({
        type: 'error',
        title: 'Error loading latest results',
        message: error instanceof Error ? error.message : 'Unknown error',
      })
    );
  }
}

// Auto-refresh saga (every 30 seconds when not on focus)
function* autoRefreshSaga(): Generator<any, void, any> {
  while (true) {
    yield delay(30000); // 30 seconds

    // Only refresh if page is not visible (user switched tabs)
    if (document.hidden) {
      yield put(fetchDirectoriesStart());
    }
  }
}

// Watcher Sagas
export default function* testResultsSaga(): Generator<any, void, any> {
  yield takeLatest(fetchDirectoriesStart.type, fetchDirectoriesSaga);
  yield takeEvery(fetchFilesStart.type, fetchFilesSaga);
  yield takeEvery(fetchTestResultStart.type, fetchTestResultSaga);
  yield takeLatest(fetchLatestResultsStart.type, fetchLatestResultsSaga);

  // Auto-refresh
  yield fork(autoRefreshSaga);
}

import {
  call,
  put,
  takeEvery,
  takeLatest,
  select,
  fork,
} from "redux-saga/effects";
import { PayloadAction } from "@reduxjs/toolkit";
import { fetchResultDirectories } from "../../api/results";
import { TestDirectory } from "../../types/testResults";
import {
  fetchDirectoriesRequest,
  fetchDirectoriesSuccess,
  fetchDirectoriesFailure,
  refreshDataRequest,
} from "../slices/testResults.slice";
import {
  setApiRequestLoading,
  showErrorNotification,
  showSuccessNotification,
} from "../slices/ui.slice";
import { selectSelectedRepository } from "../slices/repositories.slice";

// Saga worker functions

// Fetch directories saga
function* fetchDirectoriesSaga(
  action: PayloadAction<{ repositoryId?: string }>
) {
  const requestId = `fetch-directories-${Date.now()}`;

  try {
    // Set loading state
    yield put(setApiRequestLoading({ requestId, loading: true }));

    // Get repository ID from action or selected repository
    let repositoryId = action.payload.repositoryId;

    if (!repositoryId) {
      // Get from selected repository in store
      const selectedRepository = yield select(selectSelectedRepository);
      repositoryId = selectedRepository?.id;
    }

    console.log("🔄 Saga: Fetching directories...", { repositoryId });

    // Call API
    const directories: TestDirectory[] = yield call(
      fetchResultDirectories,
      repositoryId
    );

    console.log("✅ Saga: Directories fetched successfully", {
      count: directories.length,
    });

    // Dispatch success action
    yield put(fetchDirectoriesSuccess(directories));

    // Show success notification (optional - only for manual refreshes)
    if (action.type === refreshDataRequest.type) {
      yield put(
        showSuccessNotification(
          `Data Refreshed - Loaded ${directories.length} test results`
        )
      );
    }
  } catch (error: any) {
    console.error("❌ Saga: Error fetching directories:", error);

    const errorMessage = error.message || "Failed to fetch test directories";

    // Dispatch failure action
    yield put(fetchDirectoriesFailure(errorMessage));

    // Show error notification
    yield put(
      showErrorNotification(`Failed to Load Test Results: ${errorMessage}`)
    );
  } finally {
    // Clear loading state
    yield put(setApiRequestLoading({ requestId, loading: false }));
  }
}

// Refresh data saga (same as fetch but with different UX)
function* refreshDataSaga(action: PayloadAction<{ repositoryId?: string }>) {
  console.log("🔄 Saga: Refreshing test results data...");

  // Use the same logic as fetch directories
  yield call(fetchDirectoriesSaga, {
    ...action,
    type: fetchDirectoriesRequest.type, // Ensure type consistency
  });
}

// Auto-refresh when repository changes
function* handleRepositoryChange() {
  try {
    // Get current selected repository
    const selectedRepository = yield select(selectSelectedRepository);

    console.log(
      "🔄 Saga: Repository changed, auto-refreshing test results...",
      {
        repositoryId: selectedRepository?.id,
      }
    );

    // Automatically fetch directories for new repository
    yield put(
      fetchDirectoriesRequest({
        repositoryId: selectedRepository?.id,
      })
    );
  } catch (error) {
    console.error("❌ Saga: Error handling repository change:", error);
  }
}

// Watchers
function* watchFetchDirectories() {
  yield takeLatest(fetchDirectoriesRequest.type, fetchDirectoriesSaga);
}

function* watchRefreshData() {
  yield takeEvery(refreshDataRequest.type, refreshDataSaga);
}

// Export main saga
export function* testResultsSaga() {
  yield fork(watchFetchDirectories);
  yield fork(watchRefreshData);
}

// Export individual watchers for testing
export {
  watchFetchDirectories,
  watchRefreshData,
  fetchDirectoriesSaga,
  refreshDataSaga,
  handleRepositoryChange,
};

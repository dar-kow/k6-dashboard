import {
  call,
  put,
  takeEvery,
  takeLatest,
  select,
  fork,
} from "redux-saga/effects";
import { PayloadAction } from "@reduxjs/toolkit";
import {
  fetchRepositories,
  createRepository,
  deleteRepository,
  syncRepository,
  fetchRepositoryConfig,
  Repository,
  RepositoryConfig,
  CreateRepositoryRequest,
} from "../../api/repositories";
import {
  fetchRepositoriesRequest,
  fetchRepositoriesSuccess,
  fetchRepositoriesFailure,
  createRepositoryRequest,
  createRepositorySuccess,
  createRepositoryFailure,
  deleteRepositoryRequest,
  deleteRepositorySuccess,
  deleteRepositoryFailure,
  syncRepositoryRequest,
  syncRepositorySuccess,
  syncRepositoryFailure,
  fetchRepositoryConfigRequest,
  fetchRepositoryConfigSuccess,
  fetchRepositoryConfigFailure,
  setSelectedRepository,
} from "../slices/repositories.slice";
import {
  setApiRequestLoading,
  showErrorNotification,
  showSuccessNotification,
} from "../slices/ui.slice";
import { fetchDirectoriesRequest } from "../slices/testResults.slice";

// Saga worker functions

// Fetch repositories saga
function* fetchRepositoriesSaga() {
  const requestId = `fetch-repositories-${Date.now()}`;

  try {
    yield put(setApiRequestLoading({ requestId, loading: true }));

    console.log("🔄 Saga: Fetching repositories...");

    // Call API
    const repositories: Repository[] = yield call(fetchRepositories);

    console.log("✅ Saga: Repositories fetched successfully", {
      count: repositories.length,
    });

    // Dispatch success action
    yield put(fetchRepositoriesSuccess(repositories));

    // Auto-select from localStorage if available
    const savedRepoId = localStorage.getItem("selectedRepositoryId");
    if (savedRepoId) {
      const savedRepo = repositories.find((r) => r.id === savedRepoId);
      if (savedRepo) {
        console.log(
          "🔄 Saga: Auto-selecting saved repository:",
          savedRepo.name
        );
        yield put(setSelectedRepository(savedRepo));
        // Also fetch config for selected repository
        yield put(fetchRepositoryConfigRequest(savedRepo.id));
      }
    }
  } catch (error: any) {
    console.error("❌ Saga: Error fetching repositories:", error);

    const errorMessage = error.message || "Failed to fetch repositories";

    yield put(fetchRepositoriesFailure(errorMessage));
    yield put(
      showErrorNotification("Failed to Load Repositories", errorMessage)
    );
  } finally {
    yield put(setApiRequestLoading({ requestId, loading: false }));
  }
}

// Create repository saga
function* createRepositorySaga(action: PayloadAction<CreateRepositoryRequest>) {
  const requestId = `create-repository-${Date.now()}`;

  try {
    yield put(setApiRequestLoading({ requestId, loading: true }));

    console.log("🔄 Saga: Creating repository...", action.payload);

    // Call API
    const newRepository: Repository = yield call(
      createRepository,
      action.payload
    );

    console.log("✅ Saga: Repository created successfully", newRepository);

    // Dispatch success action
    yield put(createRepositorySuccess(newRepository));

    // Show success notification
    yield put(
      showSuccessNotification(
        "Repository Created",
        `Successfully created repository "${newRepository.name}"`
      )
    );

    // Optionally auto-select the new repository
    yield put(setSelectedRepository(newRepository));
  } catch (error: any) {
    console.error("❌ Saga: Error creating repository:", error);

    const errorMessage = error.message || "Failed to create repository";

    yield put(createRepositoryFailure(errorMessage));
    yield put(
      showErrorNotification("Failed to Create Repository", errorMessage)
    );
  } finally {
    yield put(setApiRequestLoading({ requestId, loading: false }));
  }
}

// Delete repository saga
function* deleteRepositorySaga(action: PayloadAction<string>) {
  const requestId = `delete-repository-${Date.now()}`;
  const repositoryId = action.payload;

  try {
    yield put(setApiRequestLoading({ requestId, loading: true }));

    console.log("🔄 Saga: Deleting repository...", repositoryId);

    // Call API
    yield call(deleteRepository, repositoryId);

    console.log("✅ Saga: Repository deleted successfully");

    // Dispatch success action
    yield put(deleteRepositorySuccess(repositoryId));

    // Show success notification
    yield put(
      showSuccessNotification(
        "Repository Deleted",
        "Repository has been successfully removed"
      )
    );

    // Clear localStorage if this was the selected repository
    const savedRepoId = localStorage.getItem("selectedRepositoryId");
    if (savedRepoId === repositoryId) {
      localStorage.removeItem("selectedRepositoryId");
    }
  } catch (error: any) {
    console.error("❌ Saga: Error deleting repository:", error);

    const errorMessage = error.message || "Failed to delete repository";

    yield put(deleteRepositoryFailure(errorMessage));
    yield put(
      showErrorNotification("Failed to Delete Repository", errorMessage)
    );
  } finally {
    yield put(setApiRequestLoading({ requestId, loading: false }));
  }
}

// Sync repository saga
function* syncRepositorySaga(action: PayloadAction<string>) {
  const requestId = `sync-repository-${Date.now()}`;
  const repositoryId = action.payload;

  try {
    yield put(setApiRequestLoading({ requestId, loading: true }));

    console.log("🔄 Saga: Syncing repository...", repositoryId);

    // Call API
    yield call(syncRepository, repositoryId);

    console.log("✅ Saga: Repository synced successfully");

    // Dispatch success action
    yield put(syncRepositorySuccess(repositoryId));

    // Show success notification
    yield put(
      showSuccessNotification(
        "Repository Synced",
        "Repository has been successfully synchronized"
      )
    );

    // Refresh test results after sync
    yield put(fetchDirectoriesRequest({ repositoryId }));
  } catch (error: any) {
    console.error("❌ Saga: Error syncing repository:", error);

    const errorMessage = error.message || "Failed to sync repository";

    yield put(syncRepositoryFailure(errorMessage));
    yield put(showErrorNotification("Failed to Sync Repository", errorMessage));
  } finally {
    yield put(setApiRequestLoading({ requestId, loading: false }));
  }
}

// Fetch repository config saga
function* fetchRepositoryConfigSaga(action: PayloadAction<string>) {
  const requestId = `fetch-config-${Date.now()}`;
  const repositoryId = action.payload;

  try {
    yield put(setApiRequestLoading({ requestId, loading: true }));

    console.log("🔄 Saga: Fetching repository config...", repositoryId);

    // Call API
    const config: RepositoryConfig = yield call(
      fetchRepositoryConfig,
      repositoryId
    );

    console.log("✅ Saga: Repository config fetched successfully");

    // Dispatch success action
    yield put(fetchRepositoryConfigSuccess(config));
  } catch (error: any) {
    console.error("❌ Saga: Error fetching repository config:", error);

    const errorMessage =
      error.message || "Failed to fetch repository configuration";

    yield put(fetchRepositoryConfigFailure(errorMessage));
    // Note: We don't show error notification for config fetch as it's not critical
  } finally {
    yield put(setApiRequestLoading({ requestId, loading: false }));
  }
}

// Handle repository selection changes
function* handleRepositorySelectionSaga(
  action: PayloadAction<Repository | null>
) {
  const repository = action.payload;

  try {
    if (repository) {
      console.log(
        "🔄 Saga: Repository selected, saving to localStorage...",
        repository.name
      );

      // Save to localStorage
      localStorage.setItem("selectedRepositoryId", repository.id);

      // Fetch config for selected repository
      yield put(fetchRepositoryConfigRequest(repository.id));

      // Refresh test results for this repository
      yield put(fetchDirectoriesRequest({ repositoryId: repository.id }));
    } else {
      console.log("🔄 Saga: Repository deselected, clearing localStorage...");

      // Clear localStorage
      localStorage.removeItem("selectedRepositoryId");

      // Refresh test results for default (no repository)
      yield put(fetchDirectoriesRequest({}));
    }
  } catch (error) {
    console.error("❌ Saga: Error handling repository selection:", error);
  }
}

// Watchers
function* watchFetchRepositories() {
  yield takeLatest(fetchRepositoriesRequest.type, fetchRepositoriesSaga);
}

function* watchCreateRepository() {
  yield takeEvery(createRepositoryRequest.type, createRepositorySaga);
}

function* watchDeleteRepository() {
  yield takeEvery(deleteRepositoryRequest.type, deleteRepositorySaga);
}

function* watchSyncRepository() {
  yield takeEvery(syncRepositoryRequest.type, syncRepositorySaga);
}

function* watchFetchRepositoryConfig() {
  yield takeLatest(
    fetchRepositoryConfigRequest.type,
    fetchRepositoryConfigSaga
  );
}

function* watchRepositorySelection() {
  yield takeEvery(setSelectedRepository.type, handleRepositorySelectionSaga);
}

// Export main saga
export function* repositoriesSaga() {
  yield fork(watchFetchRepositories);
  yield fork(watchCreateRepository);
  yield fork(watchDeleteRepository);
  yield fork(watchSyncRepository);
  yield fork(watchFetchRepositoryConfig);
  yield fork(watchRepositorySelection);
}

// Export individual watchers for testing
export {
  watchFetchRepositories,
  watchCreateRepository,
  watchDeleteRepository,
  watchSyncRepository,
  watchFetchRepositoryConfig,
  watchRepositorySelection,
  fetchRepositoriesSaga,
  createRepositorySaga,
  deleteRepositorySaga,
  syncRepositorySaga,
  fetchRepositoryConfigSaga,
  handleRepositorySelectionSaga,
};

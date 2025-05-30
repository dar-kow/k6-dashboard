import { call, put, takeEvery, takeLatest, select } from "redux-saga/effects";
import { PayloadAction } from "@reduxjs/toolkit";
import {
  repositoriesApi,
  Repository,
  CreateRepositoryRequest,
} from "@services/repositoriesApi";
import {
  fetchRepositoriesStart,
  fetchRepositoriesSuccess,
  fetchRepositoriesFailure,
  createRepositoryStart,
  createRepositorySuccess,
  createRepositoryFailure,
  setSelectedRepository,
  fetchConfigStart,
  fetchConfigSuccess,
  fetchConfigFailure,
  syncRepositoryStart,
  syncRepositorySuccess,
  syncRepositoryFailure,
  deleteRepositoryStart,
  deleteRepositorySuccess,
  deleteRepositoryFailure,
} from "../slices/repositoriesSlice";
import { addNotification } from "../slices/uiSlice";
import { RootState } from "../index";

function* fetchRepositoriesSaga() {
  try {
    const repositories: Repository[] = yield call(
      repositoriesApi.fetchRepositories
    );
    yield put(fetchRepositoriesSuccess(repositories));

    // Auto-select repository from localStorage
    const savedRepoId: string | null = localStorage.getItem(
      "selectedRepositoryId"
    );
    if (savedRepoId) {
      const savedRepo = repositories.find((r) => r.id === savedRepoId);
      if (savedRepo) {
        yield put(setSelectedRepository(savedRepo));
      }
    }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch repositories";
    yield put(fetchRepositoriesFailure(message));
    yield put(
      addNotification({
        type: "error",
        title: "Failed to load repositories",
        message,
      })
    );
  }
}

function* createRepositorySaga(action: PayloadAction<CreateRepositoryRequest>) {
  try {
    const repository: Repository = yield call(
      repositoriesApi.createRepository,
      action.payload
    );
    yield put(createRepositorySuccess(repository));
    yield put(
      addNotification({
        type: "success",
        title: "Repository created",
        message: `${repository.name} has been added successfully`,
      })
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create repository";
    yield put(createRepositoryFailure(message));
    yield put(
      addNotification({
        type: "error",
        title: "Failed to create repository",
        message,
      })
    );
  }
}

function* fetchConfigSaga(action: PayloadAction<Repository>) {
  try {
    yield put(fetchConfigStart());
    const config: any = yield call(
      repositoriesApi.fetchConfig,
      action.payload.id
    );
    yield put(fetchConfigSuccess(config));
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to fetch repository config";
    yield put(fetchConfigFailure(message));
  }
}

function* syncRepositorySaga(action: PayloadAction<string>) {
  try {
    yield call(repositoriesApi.syncRepository, action.payload);

    // Fetch updated repository data
    const repositories: Repository[] = yield call(
      repositoriesApi.fetchRepositories
    );
    const updatedRepo = repositories.find((r) => r.id === action.payload);

    if (updatedRepo) {
      yield put(syncRepositorySuccess(updatedRepo));
      yield put(
        addNotification({
          type: "success",
          title: "Repository synced",
          message: `${updatedRepo.name} has been synchronized`,
        })
      );
    }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to sync repository";
    yield put(syncRepositoryFailure({ id: action.payload, error: message }));
    yield put(
      addNotification({
        type: "error",
        title: "Sync failed",
        message,
      })
    );
  }
}

function* deleteRepositorySaga(action: PayloadAction<string>) {
  try {
    yield call(repositoriesApi.deleteRepository, action.payload);
    yield put(deleteRepositorySuccess(action.payload));
    yield put(
      addNotification({
        type: "success",
        title: "Repository deleted",
        message: "Repository has been removed successfully",
      })
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to delete repository";
    yield put(deleteRepositoryFailure(message));
    yield put(
      addNotification({
        type: "error",
        title: "Delete failed",
        message,
      })
    );
  }
}

export default function* repositoriesSaga() {
  yield takeLatest(fetchRepositoriesStart.type, fetchRepositoriesSaga);
  yield takeEvery(createRepositoryStart.type, createRepositorySaga);
  yield takeEvery(setSelectedRepository.type, fetchConfigSaga);
  yield takeEvery(syncRepositoryStart.type, syncRepositorySaga);
  yield takeEvery(deleteRepositoryStart.type, deleteRepositorySaga);
}

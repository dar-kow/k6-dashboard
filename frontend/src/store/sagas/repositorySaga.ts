import { call, put, takeEvery, takeLatest } from "redux-saga/effects";
import { PayloadAction } from "@reduxjs/toolkit";
import {
  fetchRepositoriesStart,
  fetchRepositoriesSuccess,
  fetchRepositoriesFailure,
  fetchConfigStart,
  fetchConfigSuccess,
  fetchConfigFailure,
  createRepositoryStart,
  createRepositorySuccess,
  createRepositoryFailure,
  syncRepositoryStart,
  syncRepositorySuccess,
  syncRepositoryFailure,
  deleteRepositoryStart,
  deleteRepositorySuccess,
  deleteRepositoryFailure,
} from "../slices/repositorySlice";
import { addNotification } from "../slices/uiSlice";
import {
  fetchRepositories,
  createRepository,
  fetchRepositoryConfig,
  syncRepository,
  deleteRepository,
  Repository,
  RepositoryConfig,
  CreateRepositoryRequest,
} from "../../api/repositories";

function* fetchRepositoriesSaga() {
  try {
    const repositories: Repository[] = yield call(fetchRepositories);
    yield put(fetchRepositoriesSuccess(repositories));
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    yield put(fetchRepositoriesFailure(errorMessage));

    yield put(
      addNotification({
        type: "error",
        title: "Error loading repositories",
        message: errorMessage,
      })
    );
  }
}

function* fetchConfigSaga(action: PayloadAction<string>) {
  try {
    const config: RepositoryConfig = yield call(
      fetchRepositoryConfig,
      action.payload
    );
    yield put(fetchConfigSuccess(config));
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    yield put(fetchConfigFailure(errorMessage));
  }
}

function* createRepositorySaga(action: PayloadAction<CreateRepositoryRequest>) {
  try {
    const repository: Repository = yield call(createRepository, action.payload);
    yield put(createRepositorySuccess(repository));

    yield put(
      addNotification({
        type: "success",
        title: "Repository created",
        message: `${repository.name} was created successfully`,
      })
    );

    // Refresh repositories list
    yield put(fetchRepositoriesStart());
  } catch (error) {
    yield put(createRepositoryFailure());

    yield put(
      addNotification({
        type: "error",
        title: "Error creating repository",
        message: error instanceof Error ? error.message : "Unknown error",
      })
    );
  }
}

function* syncRepositorySaga(action: PayloadAction<string>) {
  try {
    yield call(syncRepository, action.payload);
    yield put(syncRepositorySuccess(action.payload));

    yield put(
      addNotification({
        type: "success",
        title: "Repository synced",
        message: "Repository was synced successfully",
      })
    );
  } catch (error) {
    yield put(syncRepositoryFailure(action.payload));

    yield put(
      addNotification({
        type: "error",
        title: "Error syncing repository",
        message: error instanceof Error ? error.message : "Unknown error",
      })
    );
  }
}

function* deleteRepositorySaga(action: PayloadAction<string>) {
  try {
    yield call(deleteRepository, action.payload);
    yield put(deleteRepositorySuccess(action.payload));

    yield put(
      addNotification({
        type: "success",
        title: "Repository deleted",
        message: "Repository was deleted successfully",
      })
    );
  } catch (error) {
    yield put(deleteRepositoryFailure(action.payload));

    yield put(
      addNotification({
        type: "error",
        title: "Error deleting repository",
        message: error instanceof Error ? error.message : "Unknown error",
      })
    );
  }
}

function* repositorySaga() {
  yield takeLatest(fetchRepositoriesStart.type, fetchRepositoriesSaga);
  yield takeEvery(fetchConfigStart.type, fetchConfigSaga);
  yield takeEvery(createRepositoryStart.type, createRepositorySaga);
  yield takeEvery(syncRepositoryStart.type, syncRepositorySaga);
  yield takeEvery(deleteRepositoryStart.type, deleteRepositorySaga);
}

export default repositorySaga;

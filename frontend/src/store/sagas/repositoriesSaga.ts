import { call, put, takeLatest, select } from "redux-saga/effects";
import { PayloadAction } from "@reduxjs/toolkit";
import { RootState } from "../index";
import {
  fetchRepositoriesRequest,
  fetchRepositoriesSuccess,
  fetchRepositoriesFailure,
  fetchRepositoryConfigRequest,
  fetchRepositoryConfigSuccess,
  fetchRepositoryConfigFailure,
  createRepositoryRequest,
  createRepositorySuccess,
  createRepositoryFailure,
  syncRepositoryRequest,
  syncRepositorySuccess,
  syncRepositoryFailure,
  deleteRepositoryRequest,
  deleteRepositorySuccess,
  deleteRepositoryFailure,
  selectRepository,
} from "../slices/repositoriesSlice";
import {
  fetchRepositories,
  fetchRepositoryConfig,
  createRepository,
  syncRepository,
  deleteRepository,
  Repository,
} from "@/api/repositories";
import { SagaIterator } from "redux-saga";

function* fetchRepositoriesSaga(): SagaIterator {
  try {
    const repositories = yield call(fetchRepositories);
    yield put(fetchRepositoriesSuccess(repositories));

    const savedRepoId = localStorage.getItem("selectedRepositoryId");
    if (savedRepoId) {
      const savedRepo = repositories.find(
        (r: Repository) => r.id === savedRepoId
      );
      if (savedRepo) {
        yield put(selectRepository(savedRepo));
      }
    }
  } catch (error) {
    yield put(
      fetchRepositoriesFailure(
        error instanceof Error ? error.message : "Unknown error"
      )
    );
  }
}

function* fetchRepositoryConfigSaga(
  action: PayloadAction<string>
): SagaIterator {
  try {
    const config = yield call(fetchRepositoryConfig, action.payload);
    yield put(fetchRepositoryConfigSuccess(config));
  } catch (error) {
    yield put(
      fetchRepositoryConfigFailure(
        error instanceof Error ? error.message : "Unknown error"
      )
    );
  }
}

function* createRepositorySaga(action: PayloadAction<any>): SagaIterator {
  try {
    const repository = yield call(createRepository, action.payload);
    yield put(createRepositorySuccess(repository));
    yield put(fetchRepositoriesRequest());
  } catch (error) {
    yield put(
      createRepositoryFailure(
        error instanceof Error ? error.message : "Unknown error"
      )
    );
  }
}

function* syncRepositorySaga(action: PayloadAction<string>) {
  try {
    yield call(syncRepository, action.payload);
    yield put(syncRepositorySuccess());
    yield put(fetchRepositoriesRequest());
  } catch (error) {
    yield put(
      syncRepositoryFailure(
        error instanceof Error ? error.message : "Unknown error"
      )
    );
  }
}

function* deleteRepositorySaga(action: PayloadAction<string>): SagaIterator {
  try {
    yield call(deleteRepository, action.payload);
    yield put(deleteRepositorySuccess(action.payload));

    const selectedRepository = yield select(
      (state: RootState) => state.repositories.selectedRepository
    );
    if (selectedRepository && selectedRepository.id === action.payload) {
      yield put(selectRepository(null));
      localStorage.removeItem("selectedRepositoryId");
    }
  } catch (error) {
    yield put(
      deleteRepositoryFailure(
        error instanceof Error ? error.message : "Unknown error"
      )
    );
  }
}

function* selectRepositorySaga(action: PayloadAction<any>) {
  try {
    const repository = action.payload;

    if (repository) {
      localStorage.setItem("selectedRepositoryId", repository.id);
      yield put(fetchRepositoryConfigRequest(repository.id));
    } else {
      localStorage.removeItem("selectedRepositoryId");
    }
  } catch (error) {
    console.error("Error in selectRepositorySaga:", error);
  }
}

export function* repositoriesSaga() {
  yield takeLatest(
    "repositories/fetchRepositoriesRequest",
    fetchRepositoriesSaga
  );
  yield takeLatest(
    "repositories/fetchRepositoryConfigRequest",
    fetchRepositoryConfigSaga
  );
  yield takeLatest(
    "repositories/createRepositoryRequest",
    createRepositorySaga
  );
  yield takeLatest("repositories/syncRepositoryRequest", syncRepositorySaga);
  yield takeLatest(
    "repositories/deleteRepositoryRequest",
    deleteRepositorySaga
  );
  yield takeLatest("repositories/selectRepository", selectRepositorySaga);
}

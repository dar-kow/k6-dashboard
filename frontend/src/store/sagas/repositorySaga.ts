
import { call, put, takeEvery, takeLatest } from 'redux-saga/effects';
import { PayloadAction } from '@reduxjs/toolkit';
import { repositoryApi } from '@/services/api';
import {
  setRepositories,
  setLoading,
  setError,
  fetchRepositories,
  importRepository,
  syncRepository,
  removeRepository,
} from '../slices/repositorySlice';

function* fetchRepositoriesSaga() {
  try {
    const repositories = yield call(repositoryApi.getRepositories);
    yield put(setRepositories(repositories));
    yield put(setLoading(false));
  } catch (error: any) {
    yield put(setError(error.message));
    yield put(setLoading(false));
  }
}

function* importRepositorySaga(action: PayloadAction<any>) {
  try {
    yield call(repositoryApi.importRepository, action.payload);
    yield put(fetchRepositories());
    yield put(setLoading(false));
  } catch (error: any) {
    yield put(setError(error.message));
    yield put(setLoading(false));
  }
}

function* syncRepositorySaga(action: PayloadAction<string>) {
  try {
    yield call(repositoryApi.syncRepository, action.payload);
    yield put(fetchRepositories());
    yield put(setLoading(false));
  } catch (error: any) {
    yield put(setError(error.message));
    yield put(setLoading(false));
  }
}

function* removeRepositorySaga(action: PayloadAction<string>) {
  try {
    yield call(repositoryApi.removeRepository, action.payload);
    yield put(fetchRepositories());
    yield put(setLoading(false));
  } catch (error: any) {
    yield put(setError(error.message));
    yield put(setLoading(false));
  }
}

export default function* repositorySaga() {
  yield takeLatest(fetchRepositories.type, fetchRepositoriesSaga);
  yield takeEvery(importRepository.type, importRepositorySaga);
  yield takeEvery(syncRepository.type, syncRepositorySaga);
  yield takeEvery(removeRepository.type, removeRepositorySaga);
}

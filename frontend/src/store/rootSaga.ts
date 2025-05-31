import { all, fork, takeEvery, put } from "redux-saga/effects";

// Import saga modules
import { testResultsSaga } from "./sagas/testResults.saga";
import { repositoriesSaga } from "./sagas/repositories.saga";

// Temporary saga for initial setup
function* initSaga() {
  console.log("🚀 Redux-Saga initialized successfully!");
  yield put({ type: "INIT_STORE" });
}

function* watchInitSaga() {
  yield takeEvery("INIT_APP", initSaga);
}

// Root saga - aggregates all saga modules
export function* rootSaga() {
  yield all([
    // Fork watching sagas
    fork(watchInitSaga),

    // Fork our main sagas
    fork(testResultsSaga),
    fork(repositoriesSaga),
  ]);
}

// Export saga types for typing
export type SagaIterator = Generator<any, void, unknown>;

import { all, fork } from "redux-saga/effects";
import testResultsSaga from "./testResultsSaga";
import repositorySaga from "./repositorySaga";
import testRunnerSaga from "./testRunnerSaga";

export function* rootSaga() {
  yield all([
    fork(testResultsSaga),
    fork(repositorySaga),
    fork(testRunnerSaga),
  ]);
}

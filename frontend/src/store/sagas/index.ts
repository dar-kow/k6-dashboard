import { all, fork } from "redux-saga/effects";
import testResultsSaga from "./testResultsSaga";
import repositoriesSaga from "./repositoriesSaga";

export default function* rootSaga() {
  yield all([fork(testResultsSaga), fork(repositoriesSaga)]);
}

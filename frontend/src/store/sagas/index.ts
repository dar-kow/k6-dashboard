import { all } from "redux-saga/effects";
import { testResultsSaga } from "./testResultsSaga";
import { repositoriesSaga } from "./repositoriesSaga";

export default function* rootSaga() {
  yield all([testResultsSaga(), repositoriesSaga()]);
}

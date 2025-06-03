
import { all, fork } from 'redux-saga/effects';
import testSaga from './testSaga';
import dashboardSaga from './dashboardSaga';
import terminalSaga from './terminalSaga';
import repositorySaga from './repositorySaga';

export default function* rootSaga() {
  yield all([
    fork(testSaga),
    fork(dashboardSaga),
    fork(terminalSaga),
    fork(repositorySaga),
  ]);
}

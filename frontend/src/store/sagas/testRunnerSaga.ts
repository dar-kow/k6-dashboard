import { call, put, select, takeEvery, takeLatest, fork, take, delay } from 'redux-saga/effects';
import { PayloadAction } from '@reduxjs/toolkit';
import { eventChannel, EventChannel } from 'redux-saga';
import { io, Socket } from 'socket.io-client';
import axios from 'axios';
import {
  fetchTestsStart,
  fetchTestsSuccess,
  fetchTestsFailure,
  startTestRun,
  stopTestRun,
  addOutput,
  setSocketConnected,
  saveConfig,
  selectSelectedTest,
  selectSelectedProfile,
  selectEnvironment,
  selectCustomToken,
  selectCustomHost,
} from '../slices/testRunnerSlice';
import { selectSelectedRepository } from '../slices/repositorySlice';
import { addNotification } from '../slices/uiSlice';
import { fetchDirectoriesStart } from '../slices/testResultsSlice';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
const BASE_URL = API_URL.replace('/api', '');

interface TestConfig {
  name: string;
  description: string;
  file: string;
}

// WebSocket Event Channel
function createSocketChannel(socket: Socket): EventChannel<any> {
  return eventChannel((emit: any) => {
    socket.on('connect', () => {
      emit({ type: 'SOCKET_CONNECTED' });
    });

    socket.on('disconnect', () => {
      emit({ type: 'SOCKET_DISCONNECTED' });
    });

    socket.on('connect_error', (error: any) => {
      emit({ type: 'SOCKET_ERROR', payload: error.message });
    });

    socket.on('testOutput', (message: any) => {
      emit({ type: 'TEST_OUTPUT', payload: message });
    });

    socket.on('refreshResults', (message: any) => {
      emit({ type: 'REFRESH_RESULTS', payload: message });
    });

    return () => {
      socket.disconnect();
    };
  });
}

// Worker Sagas
function* fetchTestsSaga(): Generator<any, void, any> {
  try {
    const selectedRepository: ReturnType<typeof selectSelectedRepository> = yield select(
      selectSelectedRepository
    );

    const url = selectedRepository
      ? `${API_URL}/tests?repositoryId=${selectedRepository.id}`
      : `${API_URL}/tests`;

    const response: any = yield call(axios.get, url);
    const tests: TestConfig[] = response.data;

    yield put(fetchTestsSuccess(tests));
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    yield put(fetchTestsFailure(errorMessage));

    yield put(
      addNotification({
        type: 'error',
        title: 'Error loading tests',
        message: errorMessage,
      })
    );
  }
}

function* runTestSaga(
  action: PayloadAction<{ testType: 'single' | 'all' }>
): Generator<any, void, any> {
  try {
    // Get current state
    const selectedTest: string = yield select(selectSelectedTest);
    const selectedProfile: string = yield select(selectSelectedProfile);
    const environment: 'PROD' | 'DEV' = yield select(selectEnvironment);
    const customToken: string = yield select(selectCustomToken);
    const customHost: string = yield select(selectCustomHost);
    const selectedRepository: ReturnType<typeof selectSelectedRepository> = yield select(
      selectSelectedRepository
    );

    const testId = `${
      action.payload.testType === 'all' ? 'all-tests' : selectedTest
    }-${Date.now()}`;

    // Start test run
    yield put(startTestRun(testId));

    // Save current config
    yield put(saveConfig());

    // Prepare request data
    const requestData = {
      testId,
      test: action.payload.testType === 'all' ? 'all' : selectedTest,
      profile: selectedProfile,
      environment,
      customToken,
      customHost,
      repositoryId: selectedRepository?.id,
    };

    // Make API call
    const endpoint = action.payload.testType === 'all' ? '/run/all' : '/run/test';
    yield call(axios.post, `${API_URL}${endpoint}`, requestData);
  } catch (error) {
    yield put(stopTestRun());

    yield put(
      addNotification({
        type: 'error',
        title: 'Error starting test',
        message: error instanceof Error ? error.message : 'Unknown error',
      })
    );
  }
}

function* stopTestSaga(action: PayloadAction<string>): Generator<any, void, any> {
  try {
    const testId = action.payload;

    yield call(axios.post, `${API_URL}/run/stop`, { testId });

    yield put(addOutput(`🛑 Stopping test: ${testId}...`));
  } catch (error) {
    yield put(
      addNotification({
        type: 'error',
        title: 'Error stopping test',
        message: error instanceof Error ? error.message : 'Unknown error',
      })
    );
  }
}

// WebSocket Management
function* manageWebSocketSaga(): Generator<any, void, any> {
  let socket: Socket | null = null;
  let socketChannel: EventChannel<any> | null = null;

  try {
    // Create socket connection
    socket = io(BASE_URL, {
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    // Create event channel
    socketChannel = yield call(createSocketChannel, socket);

    // Listen to socket events
    while (true) {
      if (!socketChannel) break;
      const event: any = yield take(socketChannel);

      switch (event.type) {
        case 'SOCKET_CONNECTED':
          yield put(setSocketConnected(true));
          yield put(addOutput('WebSocket connection established'));
          break;

        case 'SOCKET_DISCONNECTED':
          yield put(setSocketConnected(false));
          yield put(addOutput('WebSocket connection closed'));
          break;

        case 'SOCKET_ERROR':
          yield put(
            addNotification({
              type: 'error',
              title: 'WebSocket Error',
              message: `Connection error: ${event.payload}`,
            })
          );
          break;

        case 'TEST_OUTPUT':
          const message = event.payload;

          if (message.type === 'log') {
            yield put(addOutput(message.data));
          } else if (message.type === 'error') {
            yield put(addOutput(`ERROR: ${message.data}`));
          } else if (message.type === 'complete') {
            yield put(stopTestRun());
            yield put(addOutput(message.data));

            // Auto-refresh results after 2 seconds
            yield delay(2000);
            yield put(fetchDirectoriesStart());
          } else if (message.type === 'stopped') {
            yield put(stopTestRun());
            yield put(addOutput(`🛑 ${message.data}`));
          }
          break;

        case 'REFRESH_RESULTS':
          yield put(addOutput(`🔄 ${event.payload.message}`));
          yield put(fetchDirectoriesStart());
          break;
      }
    }
  } catch (error) {
    console.error('WebSocket saga error:', error);

    yield put(
      addNotification({
        type: 'error',
        title: 'WebSocket Error',
        message: 'Failed to establish WebSocket connection',
      })
    );
  } finally {
    if (socketChannel) {
      socketChannel.close();
    }
    if (socket) {
      socket.disconnect();
    }
  }
}

// Watcher Sagas
export default function* testRunnerSaga(): Generator<any, void, any> {
  yield takeLatest(fetchTestsStart.type, fetchTestsSaga);

  // Test execution
  yield takeEvery('testRunner/runSingleTest', runTestSaga);
  yield takeEvery('testRunner/runAllTests', runTestSaga);
  yield takeEvery('testRunner/stopTest', stopTestSaga);

  // WebSocket management
  yield fork(manageWebSocketSaga);
}

// Action creators for saga-specific actions
export const runSingleTest = () => ({
  type: 'testRunner/runSingleTest',
  payload: { testType: 'single' as const },
});
export const runAllTests = () => ({
  type: 'testRunner/runAllTests',
  payload: { testType: 'all' as const },
});
export const stopTest = (testId: string) => ({
  type: 'testRunner/stopTest',
  payload: testId,
});

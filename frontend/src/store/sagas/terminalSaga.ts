
import { eventChannel } from 'redux-saga';
import { call, put, take, takeEvery, fork, cancel } from 'redux-saga/effects';
import { io, Socket } from 'socket.io-client';
import {
  addOutput,
  setConnected,
  setExecuting,
  connectWebSocket,
  disconnectWebSocket,
} from '../slices/terminalSlice';

let socket: Socket | null = null;

function createSocketChannel() {
  return eventChannel((emit) => {
    socket = io('http://localhost:4000');

    socket.on('connect', () => {
      emit({ type: 'SOCKET_CONNECTED' });
    });

    socket.on('disconnect', () => {
      emit({ type: 'SOCKET_DISCONNECTED' });
    });

    socket.on('test-output', (data: string) => {
      emit({ type: 'TEST_OUTPUT', payload: data });
    });

    socket.on('test-started', () => {
      emit({ type: 'TEST_STARTED' });
    });

    socket.on('test-completed', () => {
      emit({ type: 'TEST_COMPLETED' });
    });

    return () => {
      socket?.disconnect();
    };
  });
}

function* watchSocketEvents() {
  const channel = yield call(createSocketChannel);
  
  try {
    while (true) {
      const action = yield take(channel);
      
      switch (action.type) {
        case 'SOCKET_CONNECTED':
          yield put(setConnected(true));
          break;
        case 'SOCKET_DISCONNECTED':
          yield put(setConnected(false));
          break;
        case 'TEST_OUTPUT':
          yield put(addOutput(action.payload));
          break;
        case 'TEST_STARTED':
          yield put(setExecuting(true));
          break;
        case 'TEST_COMPLETED':
          yield put(setExecuting(false));
          break;
      }
    }
  } finally {
    channel.close();
  }
}

function* connectWebSocketSaga() {
  try {
    const task = yield fork(watchSocketEvents);
    yield take(disconnectWebSocket.type);
    yield cancel(task);
  } catch (error) {
    console.error('WebSocket connection error:', error);
  }
}

export default function* terminalSaga() {
  yield takeEvery(connectWebSocket.type, connectWebSocketSaga);
}

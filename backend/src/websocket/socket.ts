import { Server as SocketIOServer } from 'socket.io';
import { stopTest } from '../../src/services/runnerService.js';

let io: SocketIOServer;

export const setupSocketIO = (socketIO: SocketIOServer) => {
  io = socketIO;

  io.on('connection', (socket) => {
    console.log('Client connected', socket.id);

    // Send a welcome message to confirm connection
    socket.emit('connection_established', {
      message: 'WebSocket connection established successfully',
      socketId: socket.id,
    });

    // Handle test output messages from frontend
    socket.on('test_request', (data) => {
      console.log('Test request received:', data);
      // Echo back the message for testing
      socket.emit('testOutput', {
        type: 'log',
        data: `Received test request for: ${
          data.test || 'all tests'
        } with profile: ${data.profile || 'LIGHT'} (ID: ${data.testId || 'unknown'})`,
      });
    });

    // Handle stop test requests
    socket.on('stop_test', async (data) => {
      console.log('Stop test request received:', data);

      const { testId } = data;
      if (!testId) {
        socket.emit('testOutput', {
          type: 'error',
          data: '❌ No test ID provided for stop request',
        });
        return;
      }

      try {
        const stopped = await stopTest(testId);
        if (stopped) {
          socket.emit('testOutput', {
            type: 'log',
            data: `🛑 Stop request sent for test: ${testId}`,
          });
        } else {
          socket.emit('testOutput', {
            type: 'error',
            data: `❌ Test ${testId} not found or already completed`,
          });
        }
      } catch (error) {
        console.error('Error stopping test via socket:', error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        socket.emit('testOutput', {
          type: 'error',
          data: `❌ Error stopping test: ${errorMessage}`,
        });
      }
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected', socket.id);
    });
  });
};

export const getIO = () => {
  if (!io) {
    throw new Error('Socket.IO not initialized');
  }
  return io;
};

// Utility function to broadcast test output
export const broadcastTestOutput = (
  type: 'log' | 'error' | 'complete' | 'stopped',
  data: string
) => {
  if (!io) {
    console.error('Cannot broadcast: Socket.IO not initialized');
    return;
  }

  io.emit('testOutput', { type, data });
};

import { Server as SocketIOServer } from 'socket.io';
import { INotificationService } from '../../core/interfaces/services/INotificationService';
import { ILogger } from '../../core/interfaces/common/ILogger';
import { TestOutput } from '../../core/value-objects/TestOutput';
import { TestExecutionResult, ResultsUpdatedEvent } from '../../core/value-objects/Events';

export class SocketIONotificationService implements INotificationService {
  constructor(
    private readonly io: SocketIOServer,
    private readonly logger: ILogger
  ) {}

  async notifyTestOutput(testId: string, output: TestOutput): Promise<void> {
    try {
      this.io.emit('testOutput', {
        type: output.type,
        data: output.data,
        testId,
        timestamp: output.timestamp,
      });

      this.logger.debug('Test output notified', { testId, type: output.type });
    } catch (error) {
      this.logger.error('Failed to notify test output', error as Error, {
        testId,
      });
    }
  }

  async notifyTestComplete(testId: string, result: TestExecutionResult): Promise<void> {
    try {
      this.io.emit('testOutput', {
        type: result.success ? 'complete' : 'error',
        data: result.success
          ? `✅ Test ${testId} completed successfully!`
          : `❌ Test ${testId} failed with exit code ${result.exitCode}`,
        testId,
      });

      this.logger.info('Test completion notified', {
        testId,
        success: result.success,
      });
    } catch (error) {
      this.logger.error('Failed to notify test completion', error as Error, {
        testId,
      });
    }
  }

  async notifyTestStopped(testId: string): Promise<void> {
    try {
      this.io.emit('testOutput', {
        type: 'stopped',
        data: `🛑 Test ${testId} was stopped by user`,
        testId,
      });

      this.logger.info('Test stop notified', { testId });
    } catch (error) {
      this.logger.error('Failed to notify test stop', error as Error, {
        testId,
      });
    }
  }

  async notifyResultsUpdated(event: ResultsUpdatedEvent): Promise<void> {
    try {
      this.io.emit('resultsUpdated', event);
      this.logger.info('Results update notified', { message: event.message });
    } catch (error) {
      this.logger.error('Failed to notify results update', error as Error);
    }
  }
}

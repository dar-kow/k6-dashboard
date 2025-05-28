import { Environment } from './config/Environment';
import { ConsoleLogger } from './config/Logger';

import { IGitService } from './core/interfaces/services/IGitServices';
import { IRepositoryRepository } from './core/interfaces/repositories/IRepositoryRepository';
import { NodeGitService } from './infrastructure/services/NodeGitService';
import { FileSystemRepositoryRepository } from './infrastructure/repositories/FileSystemRepositoryRepository';
import { MultiRepositoryTestRepository } from './infrastructure/repositories/MultiRepositoryTestRepository';
import { MultiRepositoryTestResultRepository } from './infrastructure/repositories/MultiRepositoryTestResultRepository';
import { RepositoryAwareTestExecutionService } from './application/services/RepositoryAwareTestExecutionService';
import {
  CreateRepositoryUseCase,
  GetRepositoriesUseCase,
  GetRepositoryConfigUseCase,
  SyncRepositoryUseCase,
  DeleteRepositoryUseCase,
} from './core/use-cases/repositories/RepositoryUseCases';
import { RepositoryController } from './presentation/controllers/RepositoryController';
import { RepositoryRoutes } from './presentation/routes/RepositoryRoutes';

// Core interfaces
import { IConfig } from './core/interfaces/common/IConfig';
import { ILogger } from './core/interfaces/common/ILogger';
import { IFileSystem } from './core/interfaces/external/IFileSystem';
import { IProcessExecutor } from './core/interfaces/external/IProcessExecutor';
import { ITestResultRepository } from './core/interfaces/repositories/ITestResultRepository';
import { ITestRepository } from './core/interfaces/repositories/ITestRepository';
import { ITestExecutionService } from './core/interfaces/services/ITestExecutionService';
import { INotificationService } from './core/interfaces/services/INotificationService';

// Infrastructure implementations
import { NodeFileSystem } from './infrastructure/external/NodeFileSystem';
import { NodeProcessExecutor } from './infrastructure/external/NodeProcessExecutor';

// Use cases
import {
  ExecuteTestUseCase,
  ExecuteAllTestsUseCase,
  StopTestUseCase,
  GetRunningTestsUseCase,
  GetTestDirectoriesUseCase,
  GetTestFilesUseCase,
  GetTestResultUseCase,
  GetAvailableTestsUseCase,
} from './core/use-cases';

// Controllers
import { TestResultController } from './presentation/controllers/TestResultController';
import { TestController } from './presentation/controllers/TestController';
import { TestRunnerController } from './presentation/controllers/TestRunnerController';
import { HealthController } from './presentation/controllers/HealthController';

// Middleware
import { ErrorHandler } from './presentation/middleware/ErrorHandler';
import { RequestLogger } from './presentation/middleware/RequestLogger';

// Routes
import { TestResultRoutes } from './presentation/routes/TestResultRoutes';
import { TestRoutes } from './presentation/routes/TestRoutes';
import { TestRunnerRoutes } from './presentation/routes/TestRunnerRoutes';
import { HealthRoutes } from './presentation/routes/HealthRoutes';

export class DIContainer {
  private static instance: DIContainer;
  private readonly services = new Map<string, any>();

  private constructor() {
    this.registerServices();
  }

  static getInstance(): DIContainer {
    if (!DIContainer.instance) {
      DIContainer.instance = new DIContainer();
    }
    return DIContainer.instance;
  }

  get<T>(serviceName: string): T {
    const service = this.services.get(serviceName);
    if (!service) {
      throw new Error(`Service '${serviceName}' not found in container`);
    }
    return service;
  }

  register<T>(serviceName: string, service: T): void {
    this.services.set(serviceName, service);
  }

  private registerServices(): void {
    // Configuration and Logger
    const config = new Environment();
    const logger = new ConsoleLogger(config.getLogLevel());

    this.register<IConfig>('config', config);
    this.register<ILogger>('logger', logger);

    // External services
    this.register<IFileSystem>('fileSystem', new NodeFileSystem());
    this.register<IProcessExecutor>('processExecutor', new NodeProcessExecutor());

    // Git service - DODAJ TUTAJ
    this.register<IGitService>(
      'gitService',
      new NodeGitService(this.get<IFileSystem>('fileSystem'), this.get<ILogger>('logger'))
    );

    // Repositories
    this.register<ITestResultRepository>(
      'testResultRepository',
      new MultiRepositoryTestResultRepository(
        this.get<IFileSystem>('fileSystem'),
        this.get<IConfig>('config'),
        this.get<ILogger>('logger')
      )
    );

    this.register<ITestRepository>(
      'testRepository',
      new MultiRepositoryTestRepository(
        this.get<IFileSystem>('fileSystem'),
        this.get<IConfig>('config'),
        this.get<ILogger>('logger')
      )
    );

    // Repository repository - MUSI BYĆ TUTAJ, PRZED registerUseCases()!
    this.register<IRepositoryRepository>(
      'repositoryRepository',
      new FileSystemRepositoryRepository(
        this.get<IFileSystem>('fileSystem'),
        this.get<IGitService>('gitService'),
        this.get<IConfig>('config'),
        this.get<ILogger>('logger')
      )
    );

    // Application services (will be registered after WebSocket setup)
    // NotificationService will be registered after Socket.IO setup

    // Use cases - TO MUSI BYĆ PO REJESTRACJI WSZYSTKICH REPOSITORIES!
    this.registerUseCases();

    // Controllers
    this.registerControllers();

    // Middleware
    this.registerMiddleware();

    // Routes
    this.registerRoutes();
  }

  registerNotificationService(notificationService: INotificationService): void {
    this.register<INotificationService>('notificationService', notificationService);

    // Now register test execution service that depends on notification service
    this.register<ITestExecutionService>(
      'testExecutionService',
      new RepositoryAwareTestExecutionService(
        this.get<IProcessExecutor>('processExecutor'),
        notificationService,
        this.get<IRepositoryRepository>('repositoryRepository'),
        this.get<IFileSystem>('fileSystem'),
        this.get<IConfig>('config'),
        this.get<ILogger>('logger')
      )
    );

    // Re-register use cases that depend on test execution service
    this.registerExecutionUseCases();
    this.registerExecutionControllers();
  }

  private registerUseCases(): void {
    // Test result use cases
    this.register(
      'getTestDirectoriesUseCase',
      new GetTestDirectoriesUseCase(
        this.get<ITestResultRepository>('testResultRepository'),
        this.get<ILogger>('logger')
      )
    );

    this.register(
      'getTestFilesUseCase',
      new GetTestFilesUseCase(
        this.get<ITestResultRepository>('testResultRepository'),
        this.get<ILogger>('logger')
      )
    );

    this.register(
      'getTestResultUseCase',
      new GetTestResultUseCase(
        this.get<ITestResultRepository>('testResultRepository'),
        this.get<ILogger>('logger')
      )
    );

    // Test use cases
    this.register(
      'getAvailableTestsUseCase',
      new GetAvailableTestsUseCase(
        this.get<ITestRepository>('testRepository'),
        this.get<ILogger>('logger')
      )
    );

    this.register(
      'createRepositoryUseCase',
      new CreateRepositoryUseCase(
        this.get<IRepositoryRepository>('repositoryRepository'),
        this.get<ILogger>('logger')
      )
    );

    this.register(
      'getRepositoriesUseCase',
      new GetRepositoriesUseCase(
        this.get<IRepositoryRepository>('repositoryRepository'),
        this.get<ILogger>('logger')
      )
    );

    this.register(
      'getRepositoryConfigUseCase',
      new GetRepositoryConfigUseCase(
        this.get<IRepositoryRepository>('repositoryRepository'),
        this.get<ILogger>('logger')
      )
    );

    this.register(
      'syncRepositoryUseCase',
      new SyncRepositoryUseCase(
        this.get<IRepositoryRepository>('repositoryRepository'),
        this.get<ILogger>('logger')
      )
    );

    this.register(
      'deleteRepositoryUseCase',
      new DeleteRepositoryUseCase(
        this.get<IRepositoryRepository>('repositoryRepository'),
        this.get<ILogger>('logger')
      )
    );
  }

  private registerExecutionUseCases(): void {
    this.register(
      'executeTestUseCase',
      new ExecuteTestUseCase(
        this.get<ITestRepository>('testRepository'),
        this.get<ITestExecutionService>('testExecutionService'),
        this.get<ILogger>('logger')
      )
    );

    this.register(
      'executeAllTestsUseCase',
      new ExecuteAllTestsUseCase(
        this.get<ITestExecutionService>('testExecutionService'),
        this.get<ILogger>('logger')
      )
    );

    this.register(
      'stopTestUseCase',
      new StopTestUseCase(
        this.get<ITestExecutionService>('testExecutionService'),
        this.get<ILogger>('logger')
      )
    );

    this.register(
      'getRunningTestsUseCase',
      new GetRunningTestsUseCase(
        this.get<ITestExecutionService>('testExecutionService'),
        this.get<ILogger>('logger')
      )
    );
  }

  private registerControllers(): void {
    this.register(
      'testResultController',
      new TestResultController(
        this.get('getTestDirectoriesUseCase'),
        this.get('getTestFilesUseCase'),
        this.get('getTestResultUseCase'),
        this.get<ILogger>('logger')
      )
    );

    this.register(
      'testController',
      new TestController(this.get('getAvailableTestsUseCase'), this.get<ILogger>('logger'))
    );

    this.register('healthController', new HealthController(this.get<ILogger>('logger')));

    this.register(
      'repositoryController',
      new RepositoryController(
        this.get('createRepositoryUseCase'),
        this.get('getRepositoriesUseCase'),
        this.get('getRepositoryConfigUseCase'),
        this.get('syncRepositoryUseCase'),
        this.get('deleteRepositoryUseCase'),
        this.get<ILogger>('logger')
      )
    );
  }

  private registerExecutionControllers(): void {
    this.register(
      'testRunnerController',
      new TestRunnerController(
        this.get('executeTestUseCase'),
        this.get('executeAllTestsUseCase'),
        this.get('stopTestUseCase'),
        this.get('getRunningTestsUseCase'),
        this.get<ILogger>('logger')
      )
    );
  }

  private registerMiddleware(): void {
    this.register('errorHandler', new ErrorHandler(this.get<ILogger>('logger')));

    this.register('requestLogger', new RequestLogger(this.get<ILogger>('logger')));
  }

  private registerRoutes(): void {
    this.register('testResultRoutes', new TestResultRoutes(this.get('testResultController')));

    this.register('testRoutes', new TestRoutes(this.get('testController')));

    this.register('healthRoutes', new HealthRoutes(this.get('healthController')));

    this.register('repositoryRoutes', new RepositoryRoutes(this.get('repositoryController')));
  }

  registerTestRunnerRoutes(): void {
    this.register('testRunnerRoutes', new TestRunnerRoutes(this.get('testRunnerController')));
  }
}

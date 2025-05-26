import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import { DIContainer } from './container';
import { SocketIONotificationService } from './infrastructure/websocket/SocketIONotificationService';
import { WebSocketHandler } from './infrastructure/websocket/WebSocketHandler';
import { IConfig } from './core/interfaces/common/IConfig';
import { ILogger } from './core/interfaces/common/ILogger';
import { ErrorHandler } from './presentation/middleware/ErrorHandler';
import { RequestLogger } from './presentation/middleware/RequestLogger';

export class Application {
  private readonly app: express.Application;
  private readonly server: http.Server;
  private readonly io: SocketIOServer;
  private readonly container: DIContainer;
  private readonly config: IConfig;
  private readonly logger: ILogger;

  constructor() {
    this.container = DIContainer.getInstance();
    this.config = this.container.get<IConfig>('config');
    this.logger = this.container.get<ILogger>('logger');

    this.app = express();
    this.server = http.createServer(this.app);
    this.io = this.setupSocketIO();

    this.setupMiddleware();
    this.setupWebSocket();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  private setupSocketIO(): SocketIOServer {
    const allowedOrigins = [
      this.config.getFrontendUrl(),
      'http://localhost',
      'http://localhost:3000',
      'http://localhost:80',
    ];

    return new SocketIOServer(this.server, {
      cors: {
        origin: allowedOrigins,
        methods: ['GET', 'POST'],
        credentials: true,
      },
      path: '/socket.io',
    });
  }

  private setupMiddleware(): void {
    this.app.use(
      cors({
        origin: (origin, callback) => {
          const allowedOrigins = [
            this.config.getFrontendUrl(),
            'http://localhost',
            'http://localhost:3000',
            'http://localhost:80',
          ];

          if (!origin || allowedOrigins.includes(origin)) {
            return callback(null, true);
          }

          return callback(new Error('Not allowed by CORS'), false);
        },
        credentials: true,
      })
    );

    this.app.use(express.json());

    const requestLogger = this.container.get<RequestLogger>('requestLogger');
    this.app.use(requestLogger.log());
  }

  private setupWebSocket(): void {
    const notificationService = new SocketIONotificationService(this.io, this.logger);
    this.container.registerNotificationService(notificationService);

    const webSocketHandler = new WebSocketHandler(
      this.container.get('stopTestUseCase'),
      this.logger
    );

    webSocketHandler.setupSocketHandlers(this.io);
  }

  private setupRoutes(): void {
    this.app.get('/debug/config', (_req, res) => {
      res.json({
        environment: this.config.get('NODE_ENV'),
        frontendUrl: this.config.getFrontendUrl(),
        port: this.config.getPort(),
        k6TestsDir: this.config.getK6TestsDir(),
        resultsDir: this.config.getResultsDir(),
        repositories: this.config.getRepositories(),
      });
    });

    this.app.get('/debug/paths', async (_req, res) => {
      try {
        const testRepo = this.container.get<any>('testRepository');
        const resultRepo = this.container.get<any>('testResultRepository');
        const repoService = this.container.get<any>('repositoryService');

        const k6TestsDir = this.config.getK6TestsDir();
        const resultsDir = this.config.getResultsDir();
        const testsPath = `${k6TestsDir}/tests`;
        const reposPath = `${k6TestsDir}/repos`;

        const fs = this.container.get<any>('fileSystem');
        const pathsStatus = {
          k6TestsDir: {
            path: k6TestsDir,
            exists: await fs.exists(k6TestsDir),
          },
          resultsDir: {
            path: resultsDir,
            exists: await fs.exists(resultsDir),
          },
          testsPath: {
            path: testsPath,
            exists: await fs.exists(testsPath),
          },
          reposPath: {
            path: reposPath,
            exists: await fs.exists(reposPath),
          },
          currentWorkingDir: process.cwd(),
          nodeEnv: process.env.NODE_ENV,
        };

        let tests = [];
        let directories = [];
        let repositories = [];
        try {
          tests = await testRepo.findAll();
        } catch (error) {
          console.error('Error getting tests:', error);
        }

        try {
          directories = await resultRepo.findAll();
        } catch (error) {
          console.error('Error getting directories:', error);
        }

        try {
          repositories = await repoService.getRepositories();
        } catch (error) {
          console.error('Error getting repositories:', error);
        }

        res.json({
          pathsStatus,
          testsFound: tests.length,
          tests: tests.map((t: any) => ({ name: t.name, file: t.file })),
          directoriesFound: directories.length,
          directories: directories.map((d: any) => ({ name: d.name, type: d.type })),
          repositoriesFound: repositories.length,
          repositories,
        });
      } catch (error) {
        res.status(500).json({
          error: 'Debug paths failed',
          details: error instanceof Error ? error.message : String(error),
        });
      }

      this.app.get('/debug/git-config', async (_req, res) => {
        try {
          const config = this.container.get<any>('config');
          const gitService = this.container.get<any>('repositoryService');
          const fileSystem = this.container.get<any>('fileSystem');

          const k6TestsDir = config.getK6TestsDir();
          const reposDir = `${k6TestsDir}/repos`;
          const repositoriesDir = `${k6TestsDir}/repositories`;

          // Check what directories exist
          const k6TestsDirExists = await fileSystem.exists(k6TestsDir);
          const reposDirExists = await fileSystem.exists(reposDir);
          const repositoriesDirExists = await fileSystem.exists(repositoriesDir);

          // List contents
          let reposDirContents = [];
          let repositoriesDirContents = [];

          if (reposDirExists) {
            const entries = await fileSystem.readDir(reposDir);
            reposDirContents = entries.map((e: any) => ({ name: e.name, isDir: e.isDirectory() }));
          }

          if (repositoriesDirExists) {
            const entries = await fileSystem.readDir(repositoriesDir);
            repositoriesDirContents = entries.map((e: any) => ({
              name: e.name,
              isDir: e.isDirectory(),
            }));
          }

          res.json({
            config: {
              k6TestsDir,
              reposDir,
              repositoriesDir,
              currentWorkingDir: process.cwd(),
              nodeEnv: process.env.NODE_ENV,
            },
            directories: {
              k6TestsDirExists,
              reposDirExists,
              repositoriesDirExists,
              reposDirContents,
              repositoriesDirContents,
            },
            gitServiceType: gitService.constructor.name,
          });
        } catch (error) {
          res.status(500).json({
            error: 'Debug git config failed',
            details: error instanceof Error ? error.message : String(error),
          });
        }
      });
    });

    const healthRoutes = this.container.get<any>('healthRoutes');
    this.app.use('/health', healthRoutes.getRouter());

    const testResultRoutes = this.container.get<any>('testResultRoutes');
    const testRoutes = this.container.get<any>('testRoutes');
    const repositoryRoutes = this.container.get<any>('repositoryRoutes');

    this.app.use('/api/results', testResultRoutes.getRouter());
    this.app.use('/api/tests', testRoutes.getRouter());
    this.app.use('/api/repositories', repositoryRoutes.getRouter());

    this.container.registerTestRunnerRoutes();
    const testRunnerRoutes = this.container.get<any>('testRunnerRoutes');
    this.app.use('/api/run', testRunnerRoutes.getRouter());

    if (this.config.isProduction()) {
      const path = require('path');
      this.app.use(express.static(path.join(__dirname, '../../frontend/build')));

      this.app.get('*', (_req, res) => {
        res.sendFile(path.join(__dirname, '../../frontend/build/index.html'));
      });
    }
  }

  private setupErrorHandling(): void {
    const errorHandler = this.container.get<ErrorHandler>('errorHandler');
    this.app.use(errorHandler.handle());
  }

  start(): void {
    const port = this.config.getPort();

    this.server.listen(port, () => {
      this.logger.info('🚀 Server started successfully', {
        port,
        environment: this.config.get('NODE_ENV'),
        frontendUrl: this.config.getFrontendUrl(),
        repositories: this.config.getRepositories().length,
      });
    });

    process.on('SIGTERM', () => this.shutdown('SIGTERM'));
    process.on('SIGINT', () => this.shutdown('SIGINT'));
  }

  private shutdown(signal: string): void {
    this.logger.info(`Received ${signal}, shutting down gracefully`);

    this.server.close(() => {
      this.logger.info('Server closed successfully');
      process.exit(0);
    });

    setTimeout(() => {
      this.logger.error('Forced shutdown due to timeout');
      process.exit(1);
    }, 10000);
  }
}

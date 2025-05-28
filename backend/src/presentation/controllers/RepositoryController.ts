import { Request, Response, NextFunction } from 'express';
import {
  CreateRepositoryUseCase,
  GetRepositoriesUseCase,
  GetRepositoryConfigUseCase,
  SyncRepositoryUseCase,
  DeleteRepositoryUseCase,
} from '../../core/use-cases/repositories/RepositoryUseCases';
import {
  CreateRepositoryDto,
  RepositoryDto,
  RepositoryConfigDto,
} from '../../application/dto/RepositoryDto';
import { ILogger } from '../../core/interfaces/common/ILogger';

export class RepositoryController {
  constructor(
    private readonly createRepositoryUseCase: CreateRepositoryUseCase,
    private readonly getRepositoriesUseCase: GetRepositoriesUseCase,
    private readonly getRepositoryConfigUseCase: GetRepositoryConfigUseCase,
    private readonly syncRepositoryUseCase: SyncRepositoryUseCase,
    private readonly deleteRepositoryUseCase: DeleteRepositoryUseCase,
    private readonly logger: ILogger
  ) {}

  createRepository = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dto: CreateRepositoryDto = req.body;
      this.logger.info('Creating repository', { name: dto.name, url: dto.url });

      const repository = await this.createRepositoryUseCase.execute(
        dto.name,
        dto.url,
        dto.branch || 'main'
      );

      const responseDto: RepositoryDto = {
        id: repository.id,
        name: repository.name,
        url: repository.url,
        branch: repository.branch,
        createdAt: repository.createdAt.toISOString(),
        lastSync: repository.lastSync?.toISOString(),
        needsSync: repository.needsSync(),
      };

      res.status(201).json(responseDto);
    } catch (error) {
      next(error);
    }
  };

  getRepositories = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      this.logger.debug('Getting repositories');

      const repositories = await this.getRepositoriesUseCase.execute();

      const dtos: RepositoryDto[] = repositories.map((repo) => ({
        id: repo.id,
        name: repo.name,
        url: repo.url,
        branch: repo.branch,
        createdAt: repo.createdAt.toISOString(),
        lastSync: repo.lastSync?.toISOString(),
        needsSync: repo.needsSync(),
      }));

      res.json(dtos);
    } catch (error) {
      next(error);
    }
  };

  getRepositoryConfig = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      this.logger.debug('Getting repository config', { repositoryId: id });

      const config = await this.getRepositoryConfigUseCase.execute(id);

      if (!config) {
        res.status(404).json({ error: 'Repository config not found' });
        return;
      }

      const dto: RepositoryConfigDto = {
        hosts: config.hosts,
        tokens: config.tokens,
        loadProfiles: config.loadProfiles,
        availableProfiles: config.getAvailableProfiles(),
      };

      res.json(dto);
    } catch (error) {
      next(error);
    }
  };

  syncRepository = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      this.logger.info('Syncing repository', { repositoryId: id });

      await this.syncRepositoryUseCase.execute(id);

      res.json({ message: 'Repository synced successfully' });
    } catch (error) {
      next(error);
    }
  };

  deleteRepository = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      this.logger.info('Deleting repository', { repositoryId: id });

      await this.deleteRepositoryUseCase.execute(id);

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  };
}

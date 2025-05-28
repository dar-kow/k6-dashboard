import { IRepositoryRepository } from '../../interfaces/repositories/IRepositoryRepository';
import { ILogger } from '../../interfaces/common/ILogger';
import { Repository } from '../../entities/Repository';
import { RepositoryConfig } from '../../value-objects/RepositoryConfig';
import { v4 as uuidv4 } from 'uuid';

export class CreateRepositoryUseCase {
  constructor(
    private readonly repositoryRepository: IRepositoryRepository,
    private readonly logger: ILogger
  ) {}

  async execute(name: string, url: string, branch: string = 'main'): Promise<Repository> {
    this.logger.info('Creating new repository', { name, url, branch });

    const id = uuidv4();
    const repository = new Repository(id, name, url, branch);

    await this.repositoryRepository.create(repository);

    this.logger.info('Repository created successfully', { repositoryId: id });
    return repository;
  }
}

export class GetRepositoriesUseCase {
  constructor(
    private readonly repositoryRepository: IRepositoryRepository,
    private readonly logger: ILogger
  ) {}

  async execute(): Promise<Repository[]> {
    this.logger.debug('Fetching all repositories');
    const repositories = await this.repositoryRepository.findAll();
    this.logger.info('Fetched repositories', { count: repositories.length });
    return repositories;
  }
}

export class GetRepositoryConfigUseCase {
  constructor(
    private readonly repositoryRepository: IRepositoryRepository,
    private readonly logger: ILogger
  ) {}

  async execute(repositoryId: string): Promise<RepositoryConfig | null> {
    this.logger.debug('Fetching repository config', { repositoryId });
    const config = await this.repositoryRepository.getConfig(repositoryId);

    if (!config) {
      this.logger.warn('Repository config not found', { repositoryId });
    }

    return config;
  }
}

export class SyncRepositoryUseCase {
  constructor(
    private readonly repositoryRepository: IRepositoryRepository,
    private readonly logger: ILogger
  ) {}

  async execute(repositoryId: string): Promise<void> {
    this.logger.info('Syncing repository', { repositoryId });
    await this.repositoryRepository.syncRepository(repositoryId);
    this.logger.info('Repository synced successfully', { repositoryId });
  }
}

export class DeleteRepositoryUseCase {
  constructor(
    private readonly repositoryRepository: IRepositoryRepository,
    private readonly logger: ILogger
  ) {}

  async execute(repositoryId: string): Promise<void> {
    this.logger.info('Deleting repository', { repositoryId });
    await this.repositoryRepository.delete(repositoryId);
    this.logger.info('Repository deleted successfully', { repositoryId });
  }
}

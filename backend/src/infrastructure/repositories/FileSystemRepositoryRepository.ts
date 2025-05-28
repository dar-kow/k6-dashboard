import { IRepositoryRepository } from '../../core/interfaces/repositories/IRepositoryRepository';
import { IFileSystem } from '../../core/interfaces/external/IFileSystem';
import { IConfig } from '../../core/interfaces/common/IConfig';
import { ILogger } from '../../core/interfaces/common/ILogger';
import { IGitService } from '../../core/interfaces/services/IGitServices';
import { Repository } from '../../core/entities/Repository';
import {
  RepositoryConfig,
  HostConfig,
  TokenConfig,
  LoadProfiles,
} from '../../core/value-objects/RepositoryConfig';
import { FileNotFoundError } from '../../core/errors';
import { promises as fs } from 'fs';

export class FileSystemRepositoryRepository implements IRepositoryRepository {
  private readonly repositoriesPath: string;
  private readonly repositories: Map<string, Repository> = new Map();

  constructor(
    private readonly fileSystem: IFileSystem,
    private readonly gitService: IGitService,
    private readonly config: IConfig,
    private readonly logger: ILogger
  ) {
    this.repositoriesPath = `${this.config.getK6TestsDir()}/repositories`;
    this.initializeRepositories();
  }

  private async initializeRepositories(): Promise<void> {
    try {
      await this.ensureDirectoryExists(this.repositoriesPath);
      await this.loadRepositories();
    } catch (error) {
      this.logger.error('Failed to initialize repositories', error as Error);
    }
  }

  private async loadRepositories(): Promise<void> {
    const metadataPath = `${this.repositoriesPath}/repositories.json`;
    if (await this.fileSystem.exists(metadataPath)) {
      try {
        const content = await this.fileSystem.readFile(metadataPath, 'utf-8');
        const data = JSON.parse(content as string);
        data.forEach((repo: any) => {
          this.repositories.set(
            repo.id,
            new Repository(
              repo.id,
              repo.name,
              repo.url,
              repo.branch,
              new Date(repo.createdAt),
              repo.lastSync ? new Date(repo.lastSync) : undefined
            )
          );
        });
      } catch (error) {
        this.logger.error('Failed to load repositories metadata', error as Error);
      }
    }
  }

  private async saveRepositories(): Promise<void> {
    const metadataPath = `${this.repositoriesPath}/repositories.json`;
    const data = Array.from(this.repositories.values()).map((repo) => ({
      id: repo.id,
      name: repo.name,
      url: repo.url,
      branch: repo.branch,
      createdAt: repo.createdAt.toISOString(),
      lastSync: repo.lastSync?.toISOString(),
    }));
    await this.fileSystem.writeFile(metadataPath, JSON.stringify(data, null, 2));
  }

  async findAll(): Promise<Repository[]> {
    return Array.from(this.repositories.values());
  }

  async findById(id: string): Promise<Repository | null> {
    return this.repositories.get(id) || null;
  }

  async create(repository: Repository): Promise<void> {
    const repoPath = `${this.repositoriesPath}/${repository.id}`;
    await this.ensureDirectoryExists(repoPath);

    await this.gitService.clone(repository.url, repoPath, repository.branch);

    const updatedRepo = new Repository(
      repository.id,
      repository.name,
      repository.url,
      repository.branch,
      repository.createdAt,
      new Date()
    );

    this.repositories.set(repository.id, updatedRepo);
    await this.saveRepositories();

    this.logger.info('Repository created', { repositoryId: repository.id });
  }

  async update(repository: Repository): Promise<void> {
    this.repositories.set(repository.id, repository);
    await this.saveRepositories();
  }

  async delete(id: string): Promise<void> {
    const repoPath = `${this.repositoriesPath}/${id}`;
    if (await this.fileSystem.exists(repoPath)) {
      // Używaj ES import zamiast require
      await fs.rm(repoPath, { recursive: true, force: true });
    }

    this.repositories.delete(id);
    await this.saveRepositories();
  }

  async exists(id: string): Promise<boolean> {
    return this.repositories.has(id);
  }

  async getConfig(repositoryId: string): Promise<RepositoryConfig | null> {
    const repository = await this.findById(repositoryId);
    if (!repository) return null;

    const configPath = `${this.repositoriesPath}/${repositoryId}/config/env.js`;
    if (!(await this.fileSystem.exists(configPath))) {
      this.logger.warn('Repository config not found', { repositoryId, configPath });
      return null;
    }

    try {
      const content = (await this.fileSystem.readFile(configPath, 'utf-8')) as string;

      const hosts = this.extractHosts(content);
      const tokens = this.extractTokens(content);
      const loadProfiles = this.extractLoadProfiles(content);
      const defaultProfile = this.extractDefaultProfile(content, loadProfiles);

      return new RepositoryConfig(hosts, tokens, loadProfiles, defaultProfile);
    } catch (error) {
      this.logger.error('Failed to parse repository config', error as Error, { repositoryId });
      return null;
    }
  }

  private extractHosts(content: string): HostConfig {
    const hostsMatch = content.match(/export\s+const\s+HOSTS\s*=\s*{([^}]+)}/s);
    if (!hostsMatch) {
      return { PROD: 'http://localhost:5000/api', DEV: 'http://localhost:5000/api' };
    }

    const hostsContent = hostsMatch[1];
    const prodMatch = hostsContent.match(/PROD:\s*["']([^"']+)["']/);
    const devMatch = hostsContent.match(/DEV:\s*["']([^"']+)["']/);

    return {
      PROD: prodMatch ? prodMatch[1] : 'http://localhost:5000/api',
      DEV: devMatch ? devMatch[1] : 'http://localhost:5000/api',
    };
  }

  private extractTokens(content: string): TokenConfig {
    const tokensMatch = content.match(/export\s+const\s+TOKENS\s*=\s*{([\s\S]+?)};/);
    if (!tokensMatch) {
      return { PROD: {}, DEV: {} };
    }

    const result: TokenConfig = { PROD: {}, DEV: {} };
    const tokensContent = tokensMatch[1];

    const prodMatch = tokensContent.match(/PROD:\s*{([^}]+)}/s);
    if (prodMatch) {
      const userMatch = prodMatch[1].match(/USER:\s*["']([^"']+)["']/);
      const adminMatch = prodMatch[1].match(/ADMIN:\s*["']([^"']+)["']/);
      if (userMatch) result.PROD.USER = userMatch[1];
      if (adminMatch) result.PROD.ADMIN = adminMatch[1];
    }

    const devMatch = tokensContent.match(/DEV:\s*{([^}]+)}/s);
    if (devMatch) {
      const userMatch = devMatch[1].match(/USER:\s*["']([^"']+)["']/);
      const adminMatch = devMatch[1].match(/ADMIN:\s*["']([^"']+)["']/);
      if (userMatch) result.DEV.USER = userMatch[1];
      if (adminMatch) result.DEV.ADMIN = adminMatch[1];
    }

    return result;
  }

  private extractLoadProfiles(content: string): LoadProfiles {
    const profilesMatch = content.match(/export\s+const\s+LOAD_PROFILES\s*=\s*{([\s\S]+?)};/);
    if (!profilesMatch) {
      return {
        LIGHT: { vus: 10, duration: '60s' },
        MEDIUM: { vus: 30, duration: '5m' },
        HEAVY: { vus: 100, duration: '10m' },
      };
    }

    const result: LoadProfiles = {} as LoadProfiles;
    const profilesContent = profilesMatch[1];

    const profileRegex = /(\w+):\s*{([^}]+)}/g;
    let match;

    while ((match = profileRegex.exec(profilesContent)) !== null) {
      const profileName = match[1];
      const profileContent = match[2];

      const vusMatch = profileContent.match(/vus:\s*(\d+)/);
      const durationMatch = profileContent.match(/duration:\s*["']([^"']+)["']/);

      if (vusMatch && durationMatch) {
        result[profileName] = {
          vus: parseInt(vusMatch[1]),
          duration: durationMatch[1],
        };
      }
    }

    if (!result.LIGHT) result.LIGHT = { vus: 10, duration: '60s' };
    if (!result.MEDIUM) result.MEDIUM = { vus: 30, duration: '5m' };
    if (!result.HEAVY) result.HEAVY = { vus: 100, duration: '10m' };

    return result;
  }

  private extractDefaultProfile(content: string, loadProfiles: LoadProfiles): any {
    const defaultMatch = content.match(
      /export\s+const\s+DEFAULT_PROFILE\s*=\s*LOAD_PROFILES\.(\w+)/
    );
    const profileName = defaultMatch ? defaultMatch[1] : 'LIGHT';
    return loadProfiles[profileName] || loadProfiles.LIGHT;
  }

  async syncRepository(repositoryId: string): Promise<void> {
    const repository = await this.findById(repositoryId);
    if (!repository) {
      throw new FileNotFoundError(`Repository ${repositoryId} not found`);
    }

    const repoPath = `${this.repositoriesPath}/${repositoryId}`;
    await this.gitService.pull(repoPath);

    const updatedRepo = new Repository(
      repository.id,
      repository.name,
      repository.url,
      repository.branch,
      repository.createdAt,
      new Date()
    );

    await this.update(updatedRepo);
    this.logger.info('Repository synced', { repositoryId });
  }

  private async ensureDirectoryExists(path: string): Promise<void> {
    if (!(await this.fileSystem.exists(path))) {
      await this.fileSystem.mkdir(path, true);
    }
  }
}

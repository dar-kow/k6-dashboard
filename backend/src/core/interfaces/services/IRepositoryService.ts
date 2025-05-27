export interface IRepositoryService {
  cloneRepository(repoUrl: string, repoName: string): Promise<string>;
  updateRepository(repoName: string): Promise<void>;
  deleteRepository(repoName: string): Promise<void>;
  getRepositories(): Promise<string[]>;
  getRepositoryConfig(repoName: string): Promise<any>;
  ensureResultsDirectory(repoName: string): Promise<void>;
}

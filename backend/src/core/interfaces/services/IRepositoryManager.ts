export interface TestRepository {
  id: string;
  name: string;
  url: string;
  branch: string;
  directory: string;
  description?: string;
  lastUpdated?: Date;
  isActive: boolean;
}

export interface RepositoryConfig {
  hosts: Record<string, string>;
  tokens: Record<string, Record<string, string>>;
  loadProfiles: Record<string, any>;
  environmentInfo: Record<string, any>;
}

export interface IRepositoryManager {
  // Repository management
  getAllRepositories(): Promise<TestRepository[]>;
  getRepository(id: string): Promise<TestRepository | null>;
  addRepository(
    repo: Omit<TestRepository, 'id' | 'lastUpdated' | 'isActive'>
  ): Promise<TestRepository>;
  updateRepository(id: string, updates: Partial<TestRepository>): Promise<TestRepository>;
  removeRepository(id: string): Promise<boolean>;
  setActiveRepository(id: string): Promise<boolean>;
  getActiveRepository(): Promise<TestRepository | null>;

  // Repository operations
  cloneOrUpdateRepository(
    repo: TestRepository
  ): Promise<{ success: boolean; message: string; output?: string; error?: string }>;
  getRepositoryStatus(
    repo: TestRepository
  ): Promise<{ success: boolean; lastCommit?: any; error?: string }>;
  getRepositoryConfig(repo: TestRepository): Promise<RepositoryConfig | null>;

  // File system operations
  getRepositoryTests(
    repo: TestRepository
  ): Promise<Array<{ name: string; description: string; file: string }>>;
  getRepositoryResults(repo: TestRepository): Promise<any[]>;
}

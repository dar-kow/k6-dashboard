import { TestConfig } from '../../entities';

export interface ITestRepository {
  findAll(repositoryId?: string): Promise<TestConfig[]>;
  findByName(name: string, repositoryId?: string): Promise<TestConfig | null>;
  exists(name: string, repositoryId?: string): Promise<boolean>;
}

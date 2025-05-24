import { TestConfig } from '../../entities';

export interface ITestRepository {
  findAll(): Promise<TestConfig[]>;
  findByName(name: string): Promise<TestConfig | null>;
  exists(name: string): Promise<boolean>;
}

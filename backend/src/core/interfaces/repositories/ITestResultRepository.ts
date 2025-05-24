import { TestDirectory, TestFile } from '../../entities';

export interface ITestResultRepository {
  findAll(): Promise<TestDirectory[]>;
  findByDirectory(directory: string): Promise<TestFile[]>;
  findResult(directory: string, file: string): Promise<any>;
  exists(directory: string): Promise<boolean>;
  ensureDirectoryExists(path: string): Promise<void>;
}

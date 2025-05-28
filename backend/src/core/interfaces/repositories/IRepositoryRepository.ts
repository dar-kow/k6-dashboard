import { Repository } from '../../entities/Repository';
import { RepositoryConfig } from '../../value-objects/RepositoryConfig';

export interface IRepositoryRepository {
  findAll(): Promise<Repository[]>;
  findById(id: string): Promise<Repository | null>;
  create(repository: Repository): Promise<void>;
  update(repository: Repository): Promise<void>;
  delete(id: string): Promise<void>;
  exists(id: string): Promise<boolean>;
  getConfig(repositoryId: string): Promise<RepositoryConfig | null>;
  syncRepository(repositoryId: string): Promise<void>;
}

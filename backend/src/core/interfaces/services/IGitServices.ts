export interface IGitService {
  clone(url: string, targetPath: string, branch?: string): Promise<void>;
  pull(repoPath: string): Promise<void>;
  exists(repoPath: string): Promise<boolean>;
}

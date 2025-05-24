export interface DirectoryEntry {
  name: string;
  path: string;
  isDirectory(): boolean;
  isFile(): boolean;
}

export interface FileStats {
  isDirectory(): boolean;
  isFile(): boolean;
  size: number;
  mtime: Date;
  ctime: Date;
}

export interface IFileSystem {
  readFile(path: string, encoding?: string): Promise<string | Buffer>;
  writeFile(path: string, data: string | Buffer): Promise<void>;
  readDir(path: string): Promise<DirectoryEntry[]>;
  exists(path: string): Promise<boolean>;
  mkdir(path: string, recursive?: boolean): Promise<void>;
  stat(path: string): Promise<FileStats>;
}

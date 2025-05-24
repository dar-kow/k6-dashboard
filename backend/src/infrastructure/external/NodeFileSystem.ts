import { promises as fs } from "fs";
import {
  IFileSystem,
  DirectoryEntry,
  FileStats,
} from "../../core/interfaces/external/IFileSystem";

export class NodeFileSystem implements IFileSystem {
  async readFile(path: string, encoding?: string): Promise<string | Buffer> {
    if (encoding) {
      return fs.readFile(path, encoding as BufferEncoding);
    }
    return fs.readFile(path);
  }

  async writeFile(path: string, data: string | Buffer): Promise<void> {
    await fs.writeFile(path, data);
  }

  async readDir(path: string): Promise<DirectoryEntry[]> {
    const entries = await fs.readdir(path, { withFileTypes: true });
    return entries.map((entry) => ({
      name: entry.name,
      path: `${path}/${entry.name}`,
      isDirectory: () => entry.isDirectory(),
      isFile: () => entry.isFile(),
    }));
  }

  async exists(path: string): Promise<boolean> {
    try {
      await fs.access(path);
      return true;
    } catch {
      return false;
    }
  }

  async mkdir(path: string, recursive = false): Promise<void> {
    await fs.mkdir(path, { recursive });
  }

  async stat(path: string): Promise<FileStats> {
    const stats = await fs.stat(path);
    return {
      isDirectory: () => stats.isDirectory(),
      isFile: () => stats.isFile(),
      size: stats.size,
      mtime: stats.mtime,
      ctime: stats.ctime,
    };
  }
}

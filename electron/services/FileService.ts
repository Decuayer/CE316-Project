import fs from 'fs/promises';
import path from 'path';

export class FileService {
  async ensureDir(dirPath: string): Promise<void> {
    await fs.mkdir(dirPath, { recursive: true });
  }

  async readJson<T>(filePath: string): Promise<T> {
    const content = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(content) as T;
  }

  async writeJson(filePath: string, data: unknown): Promise<void> {
    await this.ensureDir(path.dirname(filePath));
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
  }

  async copyFile(src: string, dest: string): Promise<void> {
    await this.ensureDir(path.dirname(dest));
    await fs.copyFile(src, dest);
  }

  async deleteFile(filePath: string): Promise<void> {
    await fs.unlink(filePath);
  }

  async deleteDir(dirPath: string): Promise<void> {
    await fs.rm(dirPath, { recursive: true, force: true });
  }

  async exists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  async listFiles(dirPath: string, extension?: string): Promise<string[]> {
    const exists = await this.exists(dirPath);
    if (!exists) return [];
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    let files = entries.filter(e => e.isFile()).map(e => e.name);
    if (extension) {
      files = files.filter(f => f.endsWith(extension));
    }
    return files;
  }

  async listDirs(dirPath: string): Promise<string[]> {
    const exists = await this.exists(dirPath);
    if (!exists) return [];
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    return entries.filter(e => e.isDirectory()).map(e => e.name);
  }
}

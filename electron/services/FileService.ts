import fs from 'fs/promises';
import path from 'path';

/**
 * FileService
 *
 * Provides utility methods for file system operations such as reading/writing files,
 * managing directories, and handling JSON data.
 */
export class FileService {
  /**
   * Ensures that the specified directory exists. Creates it recursively if necessary.
   */
  async ensureDir(dirPath: string): Promise<void> {
    await fs.mkdir(dirPath, { recursive: true });
  }

  /**
   * Reads a JSON file and parses it into the specified type.
   */
  async readJson<T>(filePath: string): Promise<T> {
    const content = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(content) as T;
  }

  /**
   * Writes data to a JSON file, creating the target directory if it doesn't exist.
   */
  async writeJson(filePath: string, data: unknown): Promise<void> {
    await this.ensureDir(path.dirname(filePath));
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
  }

  /**
   * Copies a file from source to destination, creating the target directory if needed.
   */
  async copyFile(src: string, dest: string): Promise<void> {
    await this.ensureDir(path.dirname(dest));
    await fs.copyFile(src, dest);
  }

  /**
   * Deletes a specific file.
   */
  async deleteFile(filePath: string): Promise<void> {
    await fs.unlink(filePath);
  }

  /**
   * Deletes a directory and its contents recursively.
   */
  async deleteDir(dirPath: string): Promise<void> {
    await fs.rm(dirPath, { recursive: true, force: true });
  }

  /**
   * Checks if a file or directory exists.
   */
  async exists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Lists all files in a directory, optionally filtered by extension.
   */
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

  /**
   * Lists all subdirectories within a given directory.
   */
  async listDirs(dirPath: string): Promise<string[]> {
    const exists = await this.exists(dirPath);
    if (!exists) return [];
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    return entries.filter(e => e.isDirectory()).map(e => e.name);
  }

  // TODO: DEMİR CÜCÜ [FileService + Infra Modülü]
  // readFile(): Dosya içeriğini string olarak oku.
  // ExecutionService.resolveDataSource() metodu bu fonksiyona ihtiyaç duyuyor.
  // fs.readFile(filePath, 'utf-8') kullanarak implement et.
  async readFile(filePath: string): Promise<string> {
    return await fs.readFile(filePath, 'utf-8');
  }
}


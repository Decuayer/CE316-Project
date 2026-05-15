import path from 'path';
import AdmZip from 'adm-zip';
import { FileService } from './FileService';

/**
 * ZipService - Task 6 [R6]
 *
 * Handles batch extraction of student ZIP submissions.
 *
 * Uses adm-zip (pure-JS) so the app does not depend on any system unzip
 * binary - keeps the Windows installer self-contained.
 *
 * Per evaluation-flow-design.md "Step details > 1. Extract ZIP":
 *   - studentId = ZIP filename without the .zip extension
 *   - Each ZIP is extracted into projectSubmissionsDir/<studentId>/
 *
 * MODULE OWNER: GÖRKE GÖYNÜGÜR [ZipService Modülü]
 * IPC: execution.ipc.ts (importZips, getStudents handler'ları)
 */
export class ZipService {
  private fileService = new FileService();

  /**
   * Retrieves absolute paths of all .zip files in the given directory.
   */
  async processDirectory(dirPath: string): Promise<string[]> {
    const files = await this.fileService.listFiles(dirPath);
    return files
      .filter(file => file.toLowerCase().endsWith('.zip'))
      .map(file => path.join(dirPath, file));
  }

  /**
   * Extracts a single ZIP file to the target directory.
   *
   * Flattening logic: if the ZIP contains exactly one top-level directory
   * (the common student submission pattern: `20230001/main.c`), the contents
   * of that directory are extracted directly into `targetDir` so that
   * `targetDir/main.c` is the final path — not `targetDir/20230001/main.c`.
   *
   * Falls back to raw extraction when the ZIP has multiple top-level entries
   * or no common root directory.
   *
   * Throws if extraction fails.
   */
  async extractZip(zipPath: string, targetDir: string): Promise<void> {
    try {
      await this.fileService.ensureDir(targetDir);
      const zip = new AdmZip(zipPath);
      const entries = zip.getEntries();

      // Determine if all entries share a single top-level directory
      const topLevelDirs = new Set<string>();
      for (const entry of entries) {
        const parts = entry.entryName.split('/');
        if (parts[0]) topLevelDirs.add(parts[0]);
      }

      if (topLevelDirs.size === 1) {
        // Flatten: strip the single top-level directory prefix
        const prefix = [...topLevelDirs][0] + '/';
        for (const entry of entries) {
          const relativePath = entry.entryName.startsWith(prefix)
            ? entry.entryName.slice(prefix.length)
            : entry.entryName;

          if (!relativePath) continue; // skip the directory entry itself

          const destPath = path.join(targetDir, relativePath);
          if (entry.isDirectory) {
            await this.fileService.ensureDir(destPath);
          } else {
            await this.fileService.ensureDir(path.dirname(destPath));
            const content = entry.getData();
            const fs = await import('fs/promises');
            await fs.writeFile(destPath, content);
          }
        }
      } else {
        // No single root → extract as-is
        zip.extractAllTo(targetDir, true);
      }
    } catch (error: any) {
      throw new Error(`ZIP extraction failed for ${zipPath}: ${error.message}`);
    }
  }

  /**
   * Extracts all ZIP files from dirPath into projectSubmissionsDir.
   * Skips corrupted ZIPs and continues with the next one.
   * Cleans up the target directory if extraction fails so the student
   * does not appear as a ghost entry in subsequent pipeline runs.
   * Returns an array of successfully extracted student IDs.
   */
  async extractAll(dirPath: string, projectSubmissionsDir: string): Promise<string[]> {
    const zipFiles = await this.processDirectory(dirPath);
    const successfulExtractions: string[] = [];

    for (const zipFile of zipFiles) {
      const ext = path.extname(zipFile);
      const studentId = path.basename(zipFile, ext);
      const targetDir = path.join(projectSubmissionsDir, studentId);

      try {
        await this.extractZip(zipFile, targetDir);
        successfulExtractions.push(studentId);
      } catch (error) {
        console.error(`Skipping ${zipFile} due to error:`, error);
        // Remove the empty directory so it doesn't show up as a ghost student
        try {
          await this.fileService.deleteDir(targetDir);
        } catch {
          // ignore cleanup errors
        }
      }
    }

    return successfulExtractions;
  }

  /**
   * Lists all student directories (student IDs) inside projectSubmissionsDir.
   */ 
  async listStudents(_projectSubmissionsDir: string): Promise<string[]> {
    return await this.fileService.listDirs(_projectSubmissionsDir);
  }
}


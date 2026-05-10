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
   * Throws an error if extraction fails.
   */
  async extractZip(zipPath: string, targetDir: string): Promise<void> {
    try {
      await this.fileService.ensureDir(targetDir);
      const zip = new AdmZip(zipPath);
      zip.extractAllTo(targetDir, true);
    } catch (error: any) {
      throw new Error(`ZIP extraction failed for ${zipPath}: ${error.message}`);
    }
  }

  /**
   * Extracts all ZIP files from dirPath into projectSubmissionsDir.
   * Skips corrupted ZIPs and continues with the next one.
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
        // Hata durumunu atlayıp diğer öğrencilerle devam 
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


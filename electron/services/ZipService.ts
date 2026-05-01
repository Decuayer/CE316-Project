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
   * TODO [R6]: scan dirPath and return the absolute path of every *.zip file.
   * Used by the project detail page when the lecturer picks a directory.
   * Filenames are matched case-insensitively (Windows: .ZIP and .zip both work).
   */
  async processDirectory(_dirPath: string): Promise<string[]> {
    void this.fileService;
    void path;
    throw new Error('Not implemented: ZipService.processDirectory');
  }

  /**
   * TODO [R6]: extract a single ZIP into targetDir.
   *  - mkdir -p targetDir (FileService.ensureDir).
   *  - new AdmZip(zipPath).extractAllTo(targetDir, /* overwrite *\/ true).
   *  - Throw a descriptive error if the archive is corrupt; the caller
   *    converts that into a 'zip_error' StudentResult.
   */
  async extractZip(_zipPath: string, _targetDir: string): Promise<void> {
    void AdmZip;
    throw new Error('Not implemented: ZipService.extractZip');
  }

  /**
   * TODO [R6]: extract every .zip in dirPath into projectSubmissionsDir.
   *  - studentId = path.basename(zipFile, '.zip')
   *  - target    = projectSubmissionsDir/<studentId>/
   *  - Continue on errors per ZIP (record them via the caller; never throw
   *    across students - matches the description's "must continue with the
   *    next student" requirement).
   *  - Return the list of studentId values successfully extracted.
   */
  async extractAll(_dirPath: string, _projectSubmissionsDir: string): Promise<string[]> {
    throw new Error('Not implemented: ZipService.extractAll');
  }

  /**
   * TODO [R6]: list every subdirectory of projectSubmissionsDir.
   * Each name is a studentId. Used by the UI to display a count.
   */
  async listStudents(_projectSubmissionsDir: string): Promise<string[]> {
    throw new Error('Not implemented: ZipService.listStudents');
  }
}

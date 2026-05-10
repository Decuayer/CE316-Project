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

  // DONE: DEMİR CÜCÜ
  // processDirectory(): dirPath altındaki tüm .zip dosyalarının absolute path'lerini döndür.
  // 1. FileService.listFiles(dirPath) ile dosyaları listele
  // 2. .zip uzantısını case-insensitive kontrol et (toLowerCase ile)
  // 3. Her dosya için path.join(dirPath, filename) ile absolute path oluştur
  // 4. string[] olarak döndür
  async processDirectory(dirPath: string): Promise<string[]> {
    const files = await this.fileService.listFiles(dirPath);
    return files
      .filter(file => file.toLowerCase().endsWith('.zip'))
      .map(file => path.join(dirPath, file));
  }

  // DONE: DEMİR CÜCÜ
  // extractZip(): Tek bir ZIP dosyasını targetDir'e çıkart.
  // 1. FileService.ensureDir(targetDir) ile hedef klasörü oluştur
  // 2. new AdmZip(zipPath) ile ZIP'i aç
  // 3. zip.extractAllTo(targetDir, true) ile çıkart (overwrite=true)
  // 4. ZIP bozuksa descriptive bir hata fırlat (caller bunu 'zip_error' olarak kaydeder)
  // 5. try-catch ile AdmZip hatalarını yakala
  async extractZip(zipPath: string, targetDir: string): Promise<void> {
    try {
      await this.fileService.ensureDir(targetDir);
      const zip = new AdmZip(zipPath);
      zip.extractAllTo(targetDir, true);
    } catch (error: any) {
      throw new Error(`ZIP extraction failed for ${zipPath}: ${error.message}`);
    }
  }

  // TODO: DEMİR CÜCÜ
  // extractAll(): dirPath'deki tüm ZIP'leri projectSubmissionsDir altına çıkart.
  // 1. processDirectory(dirPath) ile ZIP listesini al
  // 2. Her ZIP için:
  //    - studentId = path.basename(zipFile, '.zip')
  //    - targetDir = path.join(projectSubmissionsDir, studentId)
  //    - extractZip(zipFile, targetDir) çağır
  // 3. ÖNEMLİ: Bir ZIP hata verirse ATLAMALI, diğer öğrencilere devam etmeli (try-catch)
  //    Proje tanımında "must continue with the next student" diyor.
  // 4. Başarıyla çıkartılan studentId'leri döndür
  async extractAll(_dirPath: string, _projectSubmissionsDir: string): Promise<string[]> {
    throw new Error('Not implemented: ZipService.extractAll');
  }

  // TODO: DEMİR CÜCÜ
  // listStudents(): projectSubmissionsDir altındaki tüm alt klasörleri listele.
  // Her klasör adı bir studentId'dir.
  // FileService.listDirs(projectSubmissionsDir) kullan.
  async listStudents(_projectSubmissionsDir: string): Promise<string[]> {
    throw new Error('Not implemented: ZipService.listStudents');
  }
}


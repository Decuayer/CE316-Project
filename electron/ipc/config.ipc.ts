import { IpcMain } from 'electron';
import path from 'path';
import { ConfigService } from '../services/ConfigService';
import { DatabaseService } from '../services/DatabaseService';

/**
 * Configuration IPC handlers - Task 4 [R3][R4][R5]
 *
 * Wires renderer-facing IPC channels to ConfigService.
 *
 * Channels:
 *   config:getAll   - List all configurations              [R4]
 *   config:getById  - Read a single configuration          [R4]
 *   config:create   - Create a new configuration           [R4]
 *   config:update   - Update an existing configuration     [R4]
 *   config:delete   - Delete a configuration               [R4]
 *   config:import   - Import a .json config file           [R5]
 *   config:export   - Export a config as a .json file      [R5]
 */

// TODO: EGE AYYILDIZ [ConfigService Modülü]
// Tüm IPC handler'lara try-catch error handling ekle.
// Hata durumunda renderer'a anlamlı hata mesajları ilet.
// Örnek pattern:
//   try { return await configService.getAll(); }
//   catch (error) { throw new Error(`Konfigürasyonlar yüklenemedi: ${error.message}`); }
export function registerConfigIpc(ipcMain: IpcMain, dbService: DatabaseService): void {
  const configService = new ConfigService(dbService);

  ipcMain.handle('config:getAll', async () => {
    return configService.getAll();
  });

  ipcMain.handle('config:getById', async (_e, id: string) => {
    return configService.getById(id);
  });

  ipcMain.handle('config:create', async (_e, data) => {
    return configService.create(data);
  });

  ipcMain.handle('config:update', async (_e, id: string, data) => {
    return configService.update(id, data);
  });

  // TODO: EGE AYYILDIZ [ConfigService Modülü]
  // config:delete - Silmeden önce bu config'i kullanan proje var mı kontrol et.
  // Varsa kullanıcıya uyarı mesajı döndür (FOREIGN KEY RESTRICT zaten engelleyecek ama
  // kullanıcıya anlamlı hata mesajı vermek gerekiyor).
  ipcMain.handle('config:delete', async (_e, id: string) => {
    return configService.delete(id);
  });

  ipcMain.handle('config:import', async (_e, filePath: string) => {
    return configService.import(filePath);
  });

  ipcMain.handle('config:export', async (_e, id: string, targetPath: string) => {
    return configService.export(id, targetPath);
  });
}


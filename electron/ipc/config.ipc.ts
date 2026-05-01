import { IpcMain } from 'electron';
import { ConfigService } from '../services/ConfigService';
import type { Database } from '../services/Database';

/**
 * Configuration IPC handlers - Task 4 [R3][R4][R5]
 *
 * (Channel list unchanged - see shared/types.ts IpcChannels.)
 */
export function registerConfigIpc(ipcMain: IpcMain, database: Database): void {
  const configService = new ConfigService(database);

  ipcMain.handle('config:getAll', async () => configService.getAll());
  ipcMain.handle('config:getById', async (_e, id: string) => configService.getById(id));
  ipcMain.handle('config:create', async (_e, data) => configService.create(data));
  ipcMain.handle('config:update', async (_e, id: string, data) => configService.update(id, data));
  ipcMain.handle('config:delete', async (_e, id: string) => configService.delete(id));
  ipcMain.handle('config:import', async (_e, filePath: string) => configService.import(filePath));
  ipcMain.handle('config:export', async (_e, id: string, targetPath: string) =>
    configService.export(id, targetPath),
  );
}

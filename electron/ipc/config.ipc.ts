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
export function registerConfigIpc(ipcMain: IpcMain, dbService: DatabaseService): void {
  const configService = new ConfigService(dbService);

  // TODO [R4]: list every configuration in ~/.iae/configurations/
  ipcMain.handle('config:getAll', async () => {
    return configService.getAll();
  });

  // TODO [R4]: read and return a single config by id; return null if missing
  ipcMain.handle('config:getById', async (_e, id: string) => {
    return configService.getById(id);
  });

  // TODO [R4]: validate inputs, generate uuid + timestamps, persist
  ipcMain.handle('config:create', async (_e, data) => {
    return configService.create(data);
  });

  // TODO [R4]: load existing, merge fields, bump updatedAt, persist
  ipcMain.handle('config:update', async (_e, id: string, data) => {
    return configService.update(id, data);
  });

  // TODO [R4]: delete the config file
  // Snapshotted projects are unaffected (config is copied into project at creation).
  ipcMain.handle('config:delete', async (_e, id: string) => {
    return configService.delete(id);
  });

  // TODO [R5]: copy a .json file from disk into ~/.iae/configurations/
  // Regenerate the id on import to avoid collisions.
  ipcMain.handle('config:import', async (_e, filePath: string) => {
    return configService.import(filePath);
  });

  // TODO [R5]: copy a config file to a user-chosen destination
  ipcMain.handle('config:export', async (_e, id: string, targetPath: string) => {
    return configService.export(id, targetPath);
  });
}

import { IpcMain } from 'electron';
import { ConfigService } from '../services/ConfigService';
import { DatabaseService } from '../services/DatabaseService';

/**
 * Configuration IPC handlers [R3][R4][R5]
 *
 * Wires renderer-facing IPC channels to ConfigService. Every handler is
 * wrapped so that any error (DB constraint violation, FS error, validation
 * failure) crosses the IPC boundary as a renderer-friendly Error with a
 * complete sentence in `.message`.
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

  const wrap = <Args extends unknown[], R>(
    channel: string,
    fn: (...args: Args) => Promise<R>,
  ) => async (_event: unknown, ...args: Args): Promise<R> => {
    try {
      return await fn(...args);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`[${channel}]`, message);
      throw new Error(message);
    }
  };

  ipcMain.handle(
    'config:getAll',
    wrap('config:getAll', () => configService.getAll()),
  );

  ipcMain.handle(
    'config:getById',
    wrap('config:getById', (id: string) => configService.getById(id)),
  );

  ipcMain.handle(
    'config:create',
    wrap('config:create', (data: Parameters<ConfigService['create']>[0]) =>
      configService.create(data),
    ),
  );

  ipcMain.handle(
    'config:update',
    wrap('config:update', (id: string, data: Parameters<ConfigService['update']>[1]) =>
      configService.update(id, data),
    ),
  );

  ipcMain.handle(
    'config:delete',
    wrap('config:delete', (id: string) => configService.delete(id)),
  );

  ipcMain.handle(
    'config:import',
    wrap('config:import', (filePath: string) => configService.import(filePath)),
  );

  ipcMain.handle(
    'config:export',
    wrap('config:export', (id: string, targetPath: string) =>
      configService.export(id, targetPath),
    ),
  );
}

import { IpcMain } from 'electron';
import path from 'path';
import { ProjectService } from '../services/ProjectService';
import { DatabaseService } from '../services/DatabaseService';

/**
 * Project IPC handlers - Task 5 [R3][R9][R10]
 *
 * Wires renderer-facing IPC channels to ProjectService.
 *
 * Channels:
 *   project:getAll        - List all projects                          [R10]
 *   project:getById       - Read a single project                      [R10]
 *   project:create        - Create new project (snapshots its config)  [R3]
 *   project:update        - Update project metadata                    [R10]
 *   project:delete        - Delete a project folder
 *   project:getResults    - Load saved execution results               [R9][R10]
 *   project:getStatistics - Aggregate dashboard stats
 */

// TODO: ALİ EMRE AÇIKKOL [ProjectService Modülü]
// Tüm IPC handler'lara try-catch error handling ekle.
// Hata durumunda renderer'a anlamlı hata mesajları ilet.
// Özellikle project:create'de configurationId geçersizse anlaşılır hata mesajı ver.
// Özellikle project:delete'de dosya sistemi hatalarını yakala.
export function registerProjectIpc(ipcMain: IpcMain, dbService: DatabaseService, appDataDir: string): void {
  const projectsDir = path.join(appDataDir, 'projects');
  const configurationsDir = path.join(appDataDir, 'configurations');
  const projectService = new ProjectService(dbService, projectsDir);

  ipcMain.handle('project:getAll', async () => projectService.getAll());

  ipcMain.handle('project:getById', async (_e, id: string) => projectService.getById(id));

  ipcMain.handle('project:create', async (_e, data) => projectService.create(data));

  // TODO: ALİ EMRE AÇIKKOL [ProjectService Modülü]
  // project:update - configurationId ve id alanlarının güncellenmesini engelle.
  // data objesinden bu alanları filtrele.
  ipcMain.handle('project:update', async (_e, id: string, data) => projectService.update(id, data));

  ipcMain.handle('project:delete', async (_e, id: string) => projectService.delete(id));

  ipcMain.handle('project:getResults', async (_e, id: string) => projectService.getResults(id));

  ipcMain.handle('project:getStatistics', async () => projectService.getStatistics());
}


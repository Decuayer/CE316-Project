import { IpcMain } from 'electron';
import { ProjectService } from '../services/ProjectService';
import type { Database } from '../services/Database';

/**
 * Project IPC handlers - Task 5 [R3][R9][R10]
 */
export function registerProjectIpc(
  ipcMain: IpcMain,
  database: Database,
  projectsRoot: string,
): void {
  const projectService = new ProjectService(database, projectsRoot);

  ipcMain.handle('project:getAll', async () => projectService.getAll());
  ipcMain.handle('project:getById', async (_e, id: string) => projectService.getById(id));
  ipcMain.handle('project:create', async (_e, data) => projectService.create(data));
  ipcMain.handle('project:update', async (_e, id: string, data) => projectService.update(id, data));
  ipcMain.handle('project:delete', async (_e, id: string) => projectService.delete(id));
  ipcMain.handle('project:getResults', async (_e, id: string) => projectService.getResults(id));
  ipcMain.handle('project:getStatistics', async () => projectService.getStatistics());
}

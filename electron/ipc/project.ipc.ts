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
export function registerProjectIpc(ipcMain: IpcMain, dbService: DatabaseService, appDataDir: string): void {
  const projectsDir = path.join(appDataDir, 'projects');
  const projectService = new ProjectService(dbService, projectsDir);

  ipcMain.handle('project:getAll', async () => {
    try {
      return await projectService.getAll();
    } catch (err: any) {
      throw new Error(`Failed to get projects: ${err.message}`);
    }
  });

  ipcMain.handle('project:getById', async (_e, id: string) => {
    try {
      return await projectService.getById(id);
    } catch (err: any) {
      throw new Error(`Failed to get project: ${err.message}`);
    }
  });

  ipcMain.handle('project:create', async (_e, data) => {
    try {
      return await projectService.create(data);
    } catch (err: any) {
      if (err.message.includes('bulunamadı') || err.message.includes('Configuration')) {
        throw new Error(`Geçersiz konfigürasyon: ${err.message}`);
      }
      throw new Error(`Proje oluşturulamadı: ${err.message}`);
    }
  });

  ipcMain.handle('project:update', async (_e, id: string, data) => {
    try {
      // id ve configurationId değiştirilemez
      const { id: _id, configurationId: _cid, ...safeData } = data ?? {};
      return await projectService.update(id, safeData);
    } catch (err: any) {
      throw new Error(`Failed to update project: ${err.message}`);
    }
  });

  ipcMain.handle('project:delete', async (_e, id: string) => {
    try {
      return await projectService.delete(id);
    } catch (err: any) {
      throw new Error(`Proje silinemedi: ${err.message}`);
    }
  });

  ipcMain.handle('project:getResults', async (_e, id: string) => {
    try {
      return await projectService.getResults(id);
    } catch (err: any) {
      throw new Error(`Failed to get results: ${err.message}`);
    }
  });

  ipcMain.handle('project:getStatistics', async () => {
    try {
      return await projectService.getStatistics();
    } catch (err: any) {
      throw new Error(`Failed to get statistics: ${err.message}`);
    }
  });

  // --- Result annotation operations [Results Modülü] ---
  ipcMain.handle('result:update', async (_e, projectId: string, studentId: string, patch: { note?: string; score?: number }) => {
    try {
      return await projectService.updateStudentResult(projectId, studentId, patch);
    } catch (err: any) {
      throw new Error(`Failed to update student result: ${err.message}`);
    }
  });
}

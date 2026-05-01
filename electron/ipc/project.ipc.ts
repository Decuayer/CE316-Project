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
  const configurationsDir = path.join(appDataDir, 'configurations');
  const projectService = new ProjectService(dbService, projectsDir);

  // TODO [R10]: scan ~/.iae/projects/ and return every project manifest
  ipcMain.handle('project:getAll', async () => projectService.getAll());

  // TODO [R10]: read a single project's manifest by id; return null if missing
  ipcMain.handle('project:getById', async (_e, id: string) => projectService.getById(id));

  // TODO [R3]: create folder, snapshot the configuration into the project, write project.json
  // Folder layout produced:
  //   projectsDir/<id>/project.json
  //   projectsDir/<id>/submissions/   (empty until ZIPs are imported)
  //   projectsDir/<id>/results/       (empty until first run)
  ipcMain.handle('project:create', async (_e, data) => projectService.create(data));

  // TODO [R10]: shallow-merge updatable fields (name, input, expectedOutput, submissionsDir)
  // Disallow updates to id, configurationId, or the snapshotted configuration.
  ipcMain.handle('project:update', async (_e, id: string, data) => projectService.update(id, data));

  // TODO: rm -rf the project folder. No-op if it does not exist.
  ipcMain.handle('project:delete', async (_e, id: string) => projectService.delete(id));

  // TODO [R9][R10]: load projectsDir/<id>/results/results.json; return null if no run yet
  ipcMain.handle('project:getResults', async (_e, id: string) => projectService.getResults(id));

  // TODO: aggregate counts and pass-rate across every project for the Dashboard
  ipcMain.handle('project:getStatistics', async () => projectService.getStatistics());
}

import { IpcMain } from 'electron';
import { ProjectService } from '../services/ProjectService';
import { ZipService } from '../services/ZipService';
import { ExecutionService } from '../services/ExecutionService';
import type { Database } from '../services/Database';

/**
 * Execution IPC handlers - Task 8 [R6][R7][R8]
 */
export function registerExecutionIpc(
  ipcMain: IpcMain,
  database: Database,
  projectsRoot: string,
): void {
  const projectService = new ProjectService(database, projectsRoot);
  const zipService = new ZipService();
  const executionService = new ExecutionService(database);

  ipcMain.handle('execution:importZips', async (_e, projectId: string, dirPath: string) => {
    const project = await projectService.getById(projectId);
    if (!project) throw new Error(`Project not found: ${projectId}`);
    return zipService.extractAll(dirPath, project.submissionsDir);
  });

  ipcMain.handle('execution:run', async (_e, projectId: string) => {
    const project = await projectService.getById(projectId);
    if (!project) throw new Error(`Project not found: ${projectId}`);
    return executionService.runAll(project);
  });

  ipcMain.handle('execution:cleanup', async (_e, projectId: string) => {
    const project = await projectService.getById(projectId);
    if (!project) throw new Error(`Project not found: ${projectId}`);
    return executionService.cleanupArtifacts(project);
  });

  ipcMain.handle('execution:getStudents', async (_e, projectId: string) => {
    const project = await projectService.getById(projectId);
    if (!project) throw new Error(`Project not found: ${projectId}`);
    return zipService.listStudents(project.submissionsDir);
  });
}

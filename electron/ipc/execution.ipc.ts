import { IpcMain } from 'electron';
import path from 'path';
import { ProjectService } from '../services/ProjectService';
import { ZipService } from '../services/ZipService';
import { ExecutionService } from '../services/ExecutionService';
import { DatabaseService } from '../services/DatabaseService';

/**
 * Execution IPC handlers - Task 8 [R6][R7][R8]
 *
 * Wires renderer-facing IPC channels to the execution pipeline.
 *
 * Channels:
 *   execution:importZips  - Extract a directory of student ZIPs    [R6]
 *   execution:run         - Run the compile/run/compare pipeline   [R7][R8]
 *   execution:cleanup     - Remove compile artifacts; keep sources
 *   execution:getStudents - List every extracted student folder    [R6]
 *
 * The renderer drives the run-button loading state purely from the
 * lifecycle of the execution:run promise. There is no separate progress
 * channel in v1 (see evaluation-flow-design.md "Run button states").
 */
export function registerExecutionIpc(ipcMain: IpcMain, dbService: DatabaseService, appDataDir: string): void {
  const projectsDir = path.join(appDataDir, 'projects');
  const configurationsDir = path.join(appDataDir, 'configurations');
  const projectService = new ProjectService(dbService, projectsDir);
  const zipService = new ZipService();
  const executionService = new ExecutionService();

  // TODO [R6]: extract every .zip in dirPath into project.submissionsDir/<studentId>/
  // studentId = ZIP filename without the .zip extension.
  ipcMain.handle('execution:importZips', async (_e, projectId: string, dirPath: string) => {
    const project = await projectService.getById(projectId);
    if (!project) throw new Error(`Project not found: ${projectId}`);
    return zipService.extractAll(dirPath, project.submissionsDir);
  });

  // TODO [R7][R8]: run the full per-student pipeline, sequentially.
  // Returns ProjectResults when every student has been processed.
  // The renderer relies on this promise's lifecycle alone for the run button.
  ipcMain.handle('execution:run', async (_e, projectId: string) => {
    const project = await projectService.getById(projectId);
    if (!project) throw new Error(`Project not found: ${projectId}`);
    return executionService.runAll(project);
  });

  // TODO: remove every file under each student folder whose name is NOT
  // configuration.sourceFileExpected. Source files and folder structure stay.
  // The "are you sure?" confirmation lives in the renderer (Project Detail).
  ipcMain.handle('execution:cleanup', async (_e, projectId: string) => {
    const project = await projectService.getById(projectId);
    if (!project) throw new Error(`Project not found: ${projectId}`);
    return executionService.cleanupArtifacts(project);
  });

  // TODO [R6]: list every directory under project.submissionsDir
  ipcMain.handle('execution:getStudents', async (_e, projectId: string) => {
    const project = await projectService.getById(projectId);
    if (!project) throw new Error(`Project not found: ${projectId}`);
    return zipService.listStudents(project.submissionsDir);
  });
}

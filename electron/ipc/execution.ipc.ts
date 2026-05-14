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
  const projectService = new ProjectService(dbService, projectsDir);
  const zipService = new ZipService();
  const executionService = new ExecutionService();

  ipcMain.handle('execution:importZips', async (_e, projectId: string, dirPath: string) => {
    try {
      const project = await projectService.getById(projectId);
      if (!project) throw new Error(`Project not found: ${projectId}`);
      return await zipService.extractAll(dirPath, project.submissionsDir);
    } catch (error: any) {
      throw new Error(error?.message ?? 'ZIP dizini bulunamadı veya bir hata oluştu');
    }
  });

  ipcMain.handle('execution:run', async (_e, projectId: string) => {
    try {
      const project = await projectService.getById(projectId);
      if (!project) throw new Error(`Project not found: ${projectId}`);

      const results = await executionService.runAll(project);

      const db = dbService.getDb();
      const insert = db.prepare(`
        INSERT INTO results (
          projectId, runAt, studentId, zipExtracted, sourceFound,
          compiled, compileOutput, compileError, executed, executionOutput, executionError,
          executionTimedOut, outputMatched, expectedOutput, actualOutput, status, timestamp
        ) VALUES (
          @projectId, @runAt, @studentId, @zipExtracted, @sourceFound,
          @compiled, @compileOutput, @compileError, @executed, @executionOutput, @executionError,
          @executionTimedOut, @outputMatched, @expectedOutput, @actualOutput, @status, @timestamp
        )
      `);

      db.transaction(() => {
        for (const student of results.students) {
          insert.run({
            projectId: results.projectId,
            runAt: results.runAt,
            studentId: student.studentId,
            zipExtracted: student.zipExtracted ? 1 : 0,
            sourceFound: student.sourceFound ? 1 : 0,
            compiled: student.compiled ? 1 : 0,
            compileOutput: student.compileOutput ?? '',
            compileError: student.compileError ?? null,
            executed: student.executed ? 1 : 0,
            executionOutput: student.executionOutput ?? '',
            executionError: student.executionError ?? null,
            executionTimedOut: student.executionTimedOut ? 1 : 0,
            outputMatched: student.outputMatched ? 1 : 0,
            expectedOutput: student.expectedOutput ?? '',
            actualOutput: student.actualOutput ?? '',
            status: student.status,
            timestamp: student.timestamp,
          });
        }
      })();

      return results;
    } catch (error: any) {
      throw new Error(error?.message ?? 'Execution failed');
    }
  });

  ipcMain.handle('execution:cleanup', async (_e, projectId: string) => {
    try {
      const project = await projectService.getById(projectId);
      if (!project) throw new Error(`Project not found: ${projectId}`);
      return executionService.cleanupArtifacts(project);
    } catch (error: any) {
      throw new Error(error?.message ?? 'Cleanup failed');
    }
  });

  ipcMain.handle('execution:getStudents', async (_e, projectId: string) => {
    try {
      const project = await projectService.getById(projectId);
      if (!project) throw new Error(`Project not found: ${projectId}`);
      return await zipService.listStudents(project.submissionsDir);
    } catch (error: any) {
      throw new Error(error?.message ?? 'Öğrenci listesi alınamadı');
    }
  });
}

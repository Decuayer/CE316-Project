import { IpcMain, shell } from 'electron';
import path from 'path';
import fs from 'fs/promises';
import { ProjectService } from '../services/ProjectService';
import { ZipService } from '../services/ZipService';
import { ExecutionService } from '../services/ExecutionService';
import { DatabaseService } from '../services/DatabaseService';
import { FileService } from '../services/FileService';

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
      throw new Error(error?.message ?? 'Failed to process ZIP directory');
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
      throw new Error(error?.message ?? 'Failed to list students');
    }
  });

  // ─── Import individual ZIP files (multi-select) ───────────────────────────
  ipcMain.handle('execution:importZipFiles', async (_e, projectId: string, filePaths: string[]) => {
    try {
      const project = await projectService.getById(projectId);
      if (!project) throw new Error(`Project not found: ${projectId}`);

      const successful: string[] = [];
      for (const filePath of filePaths) {
        const ext = path.extname(filePath);
        const studentId = path.basename(filePath, ext);
        const targetDir = path.join(project.submissionsDir, studentId);
        try {
          await zipService.extractZip(filePath, targetDir);
          successful.push(studentId);
        } catch (err) {
          console.error(`Skipping ${filePath}:`, err);
          // Clean up ghost directory
          try { await new FileService().deleteDir(targetDir); } catch { /* ignore */ }
        }
      }
      return successful;
    } catch (error: any) {
      throw new Error(error?.message ?? 'Failed to import ZIP files');
    }
  });

  // ─── Delete a single student (folder + DB rows) ───────────────────────────
  ipcMain.handle('execution:deleteStudent', async (_e, projectId: string, studentId: string) => {
    try {
      const project = await projectService.getById(projectId);
      if (!project) throw new Error(`Project not found: ${projectId}`);

      // 1. Remove from filesystem
      const studentDir = path.join(project.submissionsDir, studentId);
      const fileService = new FileService();
      if (await fileService.exists(studentDir)) {
        await fileService.deleteDir(studentDir);
      }

      // 2. Remove from database
      const db = dbService.getDb();
      db.prepare('DELETE FROM results WHERE projectId = ? AND studentId = ?').run(projectId, studentId);

      return { studentId, deleted: true };
    } catch (error: any) {
      throw new Error(error?.message ?? 'Failed to delete student');
    }
  });

  // ─── Open student's submission folder in Finder / Explorer ───────────────
  ipcMain.handle('execution:openStudentFolder', async (_e, projectId: string, studentId: string) => {
    try {
      const project = await projectService.getById(projectId);
      if (!project) throw new Error(`Project not found: ${projectId}`);
      const studentDir = path.join(project.submissionsDir, studentId ?? '');
      const target = studentId ? studentDir : project.submissionsDir;
      await shell.openPath(target);
    } catch (error: any) {
      throw new Error(error?.message ?? 'Failed to open folder');
    }
  });

  // ─── Read student source file content ────────────────────────────────────
  ipcMain.handle('execution:getStudentSource', async (_e, projectId: string, studentId: string) => {
    try {
      const project = await projectService.getById(projectId);
      if (!project) throw new Error(`Project not found: ${projectId}`);
      const sourceFile = project.configuration.sourceFileExpected;
      const filePath = path.join(project.submissionsDir, studentId, sourceFile);
      try {
        return await fs.readFile(filePath, 'utf-8');
      } catch {
        return null; // File not found — caller decides how to handle
      }
    } catch (error: any) {
      throw new Error(error?.message ?? 'Failed to read student source');
    }
  });
}

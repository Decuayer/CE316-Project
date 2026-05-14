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

  ipcMain.handle('execution:importZips', async (_e, projectId: string, dirPath: string) => {
    try {
      const project = await projectService.getById(projectId);
      if (!project) throw new Error(`Project not found: ${projectId}`);
      return await zipService.extractAll(dirPath, project.submissionsDir);
    } catch (error: any) {
      throw new Error(error?.message ?? 'ZIP dizini bulunamadı veya bir hata oluştu');
    }
  });

  // TODO: ALİ EMRE AÇIKKOL
  // execution:run handler'ını güncelle:
  // 1. executionService.runAll(project) çağrıldıktan sonra dönen ProjectResults'ı DB'ye kaydet.
  // 2. Her StudentResult'ı results tablosuna INSERT et:
  //    INSERT INTO results (projectId, runAt, studentId, zipExtracted, sourceFound,
  //      compiled, compileOutput, compileError, executed, executionOutput, executionError,
  //      executionTimedOut, outputMatched, expectedOutput, actualOutput, status, timestamp)
  //    VALUES (...)
  // 3. Transaction kullan (db.transaction) - ya hepsi kaydedilsin ya hiçbiri.
  // 4. try-catch ile hataları yakala ve renderer'a anlamlı hata mesajı gönder.
  // BU KRİTİK: Sonuçlar DB'ye kaydedilmezse proje tekrar açıldığında sonuçlar kaybolur.
  ipcMain.handle('execution:run', async (_e, projectId: string) => {
    const project = await projectService.getById(projectId);
    if (!project) throw new Error(`Project not found: ${projectId}`);
    return executionService.runAll(project);
  });

  // TODO: ALİ EMRE AÇIKKOL
  // execution:cleanup handler'ına try-catch ekle.
  // Hata mesajını renderer'a ilet.
  ipcMain.handle('execution:cleanup', async (_e, projectId: string) => {
    const project = await projectService.getById(projectId);
    if (!project) throw new Error(`Project not found: ${projectId}`);
    return executionService.cleanupArtifacts(project);
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


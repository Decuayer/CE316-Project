/**
 * Typed IPC client - Task 11
 *
 * Thin wrapper around `window.api` so renderer code calls strongly-typed
 * helpers instead of stringly-typed channel names. Mirrors the channel
 * surface declared in shared/types.ts (IpcChannels).
 *
 * Usage:
 *   import { ipc } from '@/lib/ipc';
 *   const configs = await ipc.config.getAll();
 *
 * TODO: extend this surface if/when execution:run grows a per-student
 * progress channel (out of scope for v1; see evaluation-flow-design.md
 * "What's intentionally not in v1").
 */

import type {
  Configuration,
  Project,
  ProjectResults,
  DashboardStats,
  DataSource,
} from '@shared/types';

export const ipc = {
  // ------------------------- Configuration [R4][R5] -------------------------
  config: {
    getAll: (): Promise<Configuration[]> => window.api.config.getAll(),
    getById: (id: string): Promise<Configuration | null> => window.api.config.getById(id),
    create: (
      data: Omit<Configuration, 'id' | 'createdAt' | 'updatedAt'>,
    ): Promise<Configuration> => window.api.config.create(data),
    update: (id: string, data: Partial<Configuration>): Promise<Configuration> =>
      window.api.config.update(id, data),
    delete: (id: string): Promise<void> => window.api.config.delete(id),
    import: (filePath: string): Promise<Configuration> => window.api.config.import(filePath),
    export: (id: string, targetPath: string): Promise<void> =>
      window.api.config.export(id, targetPath),
  },

  // --------------------------- Project [R3][R10] ----------------------------
  project: {
    getAll: (): Promise<Project[]> => window.api.project.getAll(),
    getById: (id: string): Promise<Project | null> => window.api.project.getById(id),
    create: (data: {
      name: string;
      configurationId: string;
      input: DataSource;
      expectedOutput: DataSource;
    }): Promise<Project> => window.api.project.create(data),
    update: (id: string, data: Partial<Project>): Promise<Project> =>
      window.api.project.update(id, data),
    delete: (id: string): Promise<void> => window.api.project.delete(id),
    getResults: (id: string): Promise<ProjectResults | null> =>
      window.api.project.getResults(id),
    getStatistics: (): Promise<DashboardStats> => window.api.project.getStatistics(),
  },

  // ------------------------- Execution [R6][R7][R8] -------------------------
  execution: {
    importZips: (projectId: string, dirPath: string): Promise<string[]> =>
      window.api.execution.importZips(projectId, dirPath),
    // The renderer uses this promise's lifecycle alone to drive the run-button
    // loading state (see evaluation-flow-design.md "Run button states").
    run: (projectId: string): Promise<ProjectResults> => window.api.execution.run(projectId),
    cleanup: (projectId: string): Promise<void> => window.api.execution.cleanup(projectId),
    getStudents: (projectId: string): Promise<string[]> =>
      window.api.execution.getStudents(projectId),
  },

  // ------------------------------ Dialog ------------------------------------
  dialog: {
    openDirectory: (): Promise<string | null> => window.api.dialog.openDirectory(),
    openFile: (filters?: { name: string; extensions: string[] }[]): Promise<string | null> =>
      window.api.dialog.openFile(filters),
    saveFile: (
      defaultName: string,
      filters?: { name: string; extensions: string[] }[],
    ): Promise<string | null> => window.api.dialog.saveFile(defaultName, filters),
  },
};

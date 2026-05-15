import { contextBridge, ipcRenderer } from 'electron';

/**
 * Wraps `ipcRenderer.invoke` so any rejection is logged with the channel
 * name before being re-thrown to the renderer. The Error message coming
 * from the main process is preserved verbatim (the IPC handler in
 * `electron/ipc/config.ipc.ts` already wraps raw failures into clean
 * Errors).
 */
// Default T to `any` so existing renderer-side typed wrappers in
// `src/lib/ipc.ts` (which declare the real return type per channel)
// continue to compile without explicit casts here.
async function invoke<T = any>(channel: string, ...args: unknown[]): Promise<T> {
  try {
    return (await ipcRenderer.invoke(channel, ...args)) as T;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[ipc:${channel}]`, message);
    throw err;
  }
}
// Expose typed IPC methods to the renderer process via contextBridge
// This is the secure bridge between main and renderer processes
//

const api = {
  // --- Configuration operations [R4][R5] ---
  config: {
    getAll: () => invoke('config:getAll'),
    getById: (id: string) => invoke('config:getById', id),
    create: (config: unknown) => invoke('config:create', config),
    update: (id: string, config: unknown) => invoke('config:update', id, config),
    delete: (id: string) => invoke('config:delete', id),
    import: (filePath: string) => invoke('config:import', filePath),
    export: (id: string, targetPath: string) => invoke('config:export', id, targetPath),
  },

  // --- Project operations [R3][R10] ---
  project: {
    getAll: async () => {
      try { return await ipcRenderer.invoke('project:getAll'); }
      catch (error) { console.error('IPC Error [project:getAll]:', error); throw error; }
    },
    getById: async (id: string) => {
      try { return await ipcRenderer.invoke('project:getById', id); }
      catch (error) { console.error('IPC Error [project:getById]:', error); throw error; }
    },
    create: async (data: any) => {
      try { return await ipcRenderer.invoke('project:create', data); }
      catch (error) { console.error('IPC Error [project:create]:', error); throw error; }
    },
    update: async (id: string, data: any) => {
      try { return await ipcRenderer.invoke('project:update', id, data); }
      catch (error) { console.error('IPC Error [project:update]:', error); throw error; }
    },
    delete: async (id: string) => {
      try { return await ipcRenderer.invoke('project:delete', id); }
      catch (error) { console.error('IPC Error [project:delete]:', error); throw error; }
    },
    getResults: async (id: string) => {
      try { return await ipcRenderer.invoke('project:getResults', id); }
      catch (error) { console.error('IPC Error [project:getResults]:', error); throw error; }
    },
    getStatistics: async () => {
      try { return await ipcRenderer.invoke('project:getStatistics'); }
      catch (error) { console.error('IPC Error [project:getStatistics]:', error); throw error; }
    },
  },

  // --- Execution operations [R6][R7][R8] ---
  execution: {
    importZips: async (projectId: string, dirPath: string) => {
      try { return await ipcRenderer.invoke('execution:importZips', projectId, dirPath); }
      catch (error) { console.error('IPC Error [execution:importZips]:', error); throw error; }
    },
    run: (projectId: string) => invoke('execution:run', projectId),
    // Removes everything under each student folder that is NOT the source file.
    // See evaluation-flow-design.md "Clean up artifacts button".
    cleanup: (projectId: string) => invoke('execution:cleanup', projectId),
    getStudents: async (projectId: string) => {
      try { return await ipcRenderer.invoke('execution:getStudents', projectId); }
      catch (error) { console.error('IPC Error [execution:getStudents]:', error); throw error; }
    },
  },

  // --- Dialog operations ---
  dialog: {
    openDirectory: () => invoke('dialog:openDirectory'),
    openFile: (filters?: { name: string; extensions: string[] }[]) =>
      invoke('dialog:openFile', filters),
    saveFile: (defaultName: string, filters?: { name: string; extensions: string[] }[]) =>
      invoke('dialog:saveFile', defaultName, filters),
  },

  // --- Result annotation operations [Results module] ---
  result: {
    update: (projectId: string, studentId: string, patch: { note?: string; score?: number }) =>
      invoke('result:update', projectId, studentId, patch),
  },
};

contextBridge.exposeInMainWorld('api', api);

export type ApiType = typeof api;

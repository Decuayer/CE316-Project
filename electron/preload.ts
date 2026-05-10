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
    getAll: () => invoke('project:getAll'),
    getById: (id: string) => invoke('project:getById', id),
    create: (data: unknown) => invoke('project:create', data),
    update: (id: string, data: unknown) => invoke('project:update', id, data),
    delete: (id: string) => invoke('project:delete', id),
    getResults: (id: string) => invoke('project:getResults', id),
    getStatistics: () => invoke('project:getStatistics'),
  },

  // --- Execution operations [R6][R7][R8] ---
  execution: {
    importZips: (projectId: string, dirPath: string) =>
      invoke('execution:importZips', projectId, dirPath),
    run: (projectId: string) => invoke('execution:run', projectId),
    cleanup: (projectId: string) => invoke('execution:cleanup', projectId),
    getStudents: (projectId: string) => invoke('execution:getStudents', projectId),
  },

  // --- Dialog operations ---
  dialog: {
    openDirectory: () => invoke('dialog:openDirectory'),
    openFile: (filters?: { name: string; extensions: string[] }[]) =>
      invoke('dialog:openFile', filters),
    saveFile: (defaultName: string, filters?: { name: string; extensions: string[] }[]) =>
      invoke('dialog:saveFile', defaultName, filters),
  },
};

contextBridge.exposeInMainWorld('api', api);

export type ApiType = typeof api;

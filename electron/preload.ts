import { contextBridge, ipcRenderer } from 'electron';

// Expose typed IPC methods to the renderer process via contextBridge
// This is the secure bridge between main and renderer processes

const api = {
  // --- Configuration operations [R4][R5] ---
  config: {
    getAll: () => ipcRenderer.invoke('config:getAll'),
    getById: (id: string) => ipcRenderer.invoke('config:getById', id),
    create: (config: any) => ipcRenderer.invoke('config:create', config),
    update: (id: string, config: any) => ipcRenderer.invoke('config:update', id, config),
    delete: (id: string) => ipcRenderer.invoke('config:delete', id),
    import: (filePath: string) => ipcRenderer.invoke('config:import', filePath),
    export: (id: string, targetPath: string) => ipcRenderer.invoke('config:export', id, targetPath),
  },

  // --- Project operations [R3][R10] ---
  project: {
    getAll: () => ipcRenderer.invoke('project:getAll'),
    getById: (id: string) => ipcRenderer.invoke('project:getById', id),
    create: (data: any) => ipcRenderer.invoke('project:create', data),
    update: (id: string, data: any) => ipcRenderer.invoke('project:update', id, data),
    delete: (id: string) => ipcRenderer.invoke('project:delete', id),
    getResults: (id: string) => ipcRenderer.invoke('project:getResults', id),
    getStatistics: () => ipcRenderer.invoke('project:getStatistics'),
  },

  // --- Execution operations [R6][R7][R8] ---
  execution: {
    importZips: (projectId: string, dirPath: string) =>
      ipcRenderer.invoke('execution:importZips', projectId, dirPath),
    run: (projectId: string) => ipcRenderer.invoke('execution:run', projectId),
    getStudents: (projectId: string) =>
      ipcRenderer.invoke('execution:getStudents', projectId),
  },

  // --- Dialog operations ---
  dialog: {
    openDirectory: () => ipcRenderer.invoke('dialog:openDirectory'),
    openFile: (filters?: { name: string; extensions: string[] }[]) =>
      ipcRenderer.invoke('dialog:openFile', filters),
    saveFile: (defaultName: string, filters?: { name: string; extensions: string[] }[]) =>
      ipcRenderer.invoke('dialog:saveFile', defaultName, filters),
  },
};

contextBridge.exposeInMainWorld('api', api);

// Type declaration for renderer process
export type ApiType = typeof api;

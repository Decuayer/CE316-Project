import { contextBridge, ipcRenderer } from 'electron';

// Expose typed IPC methods to the renderer process via contextBridge
// This is the secure bridge between main and renderer processes
//
// Error handling sorumlulukları (modül bazlı):
// TODO: EGE AYYILDIZ [ConfigService Modülü] — config.* çağrılarına try-catch ekle
// TODO: ALİ EMRE AÇIKKOL [ProjectService Modülü] — project.* çağrılarına try-catch ekle
// TODO: EGE ÇAĞAN KANTAR [ExecutionService Modülü] — execution.run/cleanup çağrılarına try-catch ekle
// TODO: GÖRKE GÖYNÜGÜR [ZipService Modülü] — execution.importZips/getStudents çağrılarına try-catch ekle
//
// Örnek pattern:
//   getAll: async () => {
//     try { return await ipcRenderer.invoke('config:getAll'); }
//     catch (error) { console.error('IPC Error:', error); throw error; }
//   }

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
    importZips: (projectId: string, dirPath: string) =>
      ipcRenderer.invoke('execution:importZips', projectId, dirPath),
    run: (projectId: string) => ipcRenderer.invoke('execution:run', projectId),
    // Removes everything under each student folder that is NOT the source file.
    // See evaluation-flow-design.md "Clean up artifacts button".
    cleanup: (projectId: string) => ipcRenderer.invoke('execution:cleanup', projectId),
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

import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { registerConfigIpc } from './ipc/config.ipc';
import { registerProjectIpc } from './ipc/project.ipc';
import { registerExecutionIpc } from './ipc/execution.ipc';
import { FileService } from './services/FileService';

const currentDirPath = path.dirname(fileURLToPath(import.meta.url));
const APP_DATA_DIR = path.join(app.getPath('home'), '.iae');

let mainWindow: BrowserWindow | null = null;

async function createWindow() {
  // Ensure app data directories exist
  const fileService = new FileService();
  await fileService.ensureDir(path.join(APP_DATA_DIR, 'configurations'));
  await fileService.ensureDir(path.join(APP_DATA_DIR, 'projects'));

  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    title: 'IAE - Integrated Assignment Environment',
    backgroundColor: '#09090b', // zinc-950
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 16, y: 16 },
    webPreferences: {
      preload: path.join(currentDirPath, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  // Register IPC handlers
  registerConfigIpc(ipcMain, APP_DATA_DIR);
  registerProjectIpc(ipcMain, APP_DATA_DIR);
  registerExecutionIpc(ipcMain, APP_DATA_DIR);

  // Dialog IPC handlers
  ipcMain.handle('dialog:openDirectory', async () => {
    const result = await dialog.showOpenDialog(mainWindow!, {
      properties: ['openDirectory'],
    });
    return result.canceled ? null : result.filePaths[0];
  });

  ipcMain.handle('dialog:openFile', async (_event, filters) => {
    const result = await dialog.showOpenDialog(mainWindow!, {
      properties: ['openFile'],
      filters: filters || [{ name: 'All Files', extensions: ['*'] }],
    });
    return result.canceled ? null : result.filePaths[0];
  });

  ipcMain.handle('dialog:saveFile', async (_event, defaultName, filters) => {
    const result = await dialog.showSaveDialog(mainWindow!, {
      defaultPath: defaultName,
      filters: filters || [{ name: 'All Files', extensions: ['*'] }],
    });
    return result.canceled ? null : result.filePath;
  });

  // Load the app
  if (process.env.VITE_DEV_SERVER_URL) {
    await mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
    mainWindow.webContents.openDevTools();
  } else {
    await mainWindow.loadFile(path.join(currentDirPath, '../dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

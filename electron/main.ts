import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { registerConfigIpc } from './ipc/config.ipc';
import { registerProjectIpc } from './ipc/project.ipc';
import { registerExecutionIpc } from './ipc/execution.ipc';
import { FileService } from './services/FileService';
import { DatabaseService } from './services/DatabaseService';
import { ConfigService } from './services/ConfigService';
import { ProjectService } from './services/ProjectService';

const currentDirPath = path.dirname(fileURLToPath(import.meta.url));
const APP_DATA_DIR = path.join(app.getPath('home'), '.iae');

let mainWindow: BrowserWindow | null = null;

async function createWindow() {
  // Ensure app data directories exist
  const fileService = new FileService();
  await fileService.ensureDir(path.join(APP_DATA_DIR, 'configurations'));
  await fileService.ensureDir(path.join(APP_DATA_DIR, 'projects'));

  // DatabaseService
  const dbPath = path.join(APP_DATA_DIR, 'database.sqlite');
  const dbService = new DatabaseService(dbPath);
  console.log('DB Status: ', dbService.isConnected() ? 'Connected' : 'Error');

  /* ConfigService test 
  setTimeout(async () => {
    try {

      const configService = new ConfigService(dbService);
      
      const newConfig = await configService.create({
        name: "Test Python",
        language: "python",
        runCommand: "python3 {{sourceFile}}",
        sourceFileExpected: "main.py"
      });
      console.log("ConfigService: Created ID:", newConfig.id);
      
      const configs = await configService.getAll();
      console.log("ConfigService: All Configs:", configs);
    } catch (error) {
      console.error("ConfigService: Error occurred while testing:", error);
    }
  }, 2000);
  */

  /* ProjectService test
  setTimeout(async () => {
    try {
      const configService = new ConfigService(dbService);
      const projectsDir = path.join(APP_DATA_DIR, 'projects');
      const projectService = new ProjectService(dbService, projectsDir);

      const testConfig = await configService.create({
        name: "Test Config for Project",
        language: "python",
        runCommand: "python3 {{sourceFile}}",
        sourceFileExpected: "main.py"
      });

      const newProject = await projectService.create({
        name: "Test Project",
        configurationId: testConfig.id,
        input: { type: "text", value: "1 2 3" },
        expectedOutput: { type: "text", value: "6" }
      });
      console.log("ProjectService: Project created with ID:", newProject.id);

      const projects = await projectService.getAll();
      console.log("ProjectService: All Projects:", projects.map(p => p.name));

      const stats = await projectService.getStatistics();
      console.log("ProjectService: Project Statistics:", stats);

    } catch (error) {
      console.error("ProjectService: Error occurred while testing:", error);
    }
  }, 3000);
  */


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
  registerConfigIpc(ipcMain, dbService);
  registerProjectIpc(ipcMain, dbService, APP_DATA_DIR);
  registerExecutionIpc(ipcMain, dbService,APP_DATA_DIR);

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

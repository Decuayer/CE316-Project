# IAE - Integrated Assignment Environment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a desktop Electron application that lets lecturers batch-evaluate student programming assignments through a compile -> run -> compare pipeline.

**Architecture:** Electron app with a React + Vite + Tailwind frontend (renderer process) and a structured TypeScript service layer (main process). Communication via typed IPC channels. Data stored as JSON files on disk - configurations as standalone files, projects as folder structures.

**Tech Stack:** Electron, TypeScript, React 18, Vite, Tailwind CSS, shadcn/ui, adm-zip, react-router-dom, electron-builder (NSIS)

**Design Spec:** `docs/superpowers/specs/2026-04-20-iae-design.md`

---

## File Map

### Main Process (`electron/`)
| File | Responsibility |
|------|---------------|
| `electron/main.ts` | Electron entry point, window creation, IPC registration, dialog handlers |
| `electron/preload.ts` | Secure IPC bridge via contextBridge |
| `electron/ipc/config.ipc.ts` | IPC handlers routing to ConfigService |
| `electron/ipc/project.ipc.ts` | IPC handlers routing to ProjectService |
| `electron/ipc/execution.ipc.ts` | IPC handlers routing to ExecutionService + ZipService |
| `electron/services/FileService.ts` | Low-level file I/O (readJson, writeJson, ensureDir, etc.) |
| `electron/services/ConfigService.ts` | Configuration CRUD + import/export |
| `electron/services/ProjectService.ts` | Project lifecycle + statistics |
| `electron/services/ZipService.ts` | ZIP extraction using adm-zip |
| `electron/services/ExecutionService.ts` | Compile -> run -> compare pipeline |

### Shared (`shared/`)
| File | Responsibility |
|------|---------------|
| `shared/types.ts` | All interfaces: Configuration, Project, StudentResult, ProjectResults, IpcChannels, DashboardStats |

### Renderer (`src/`)
| File | Responsibility |
|------|---------------|
| `src/main.tsx` | React entry point |
| `src/App.tsx` | Router setup with HashRouter |
| `src/index.css` | Tailwind base + shadcn/ui CSS variables |
| `src/lib/utils.ts` | `cn()` helper for Tailwind class merging |
| `src/lib/ipc.ts` | Typed wrapper around `window.api` |
| `src/components/layout/Sidebar.tsx` | Collapsible sidebar with nav items |
| `src/components/layout/AppShell.tsx` | Layout wrapper: sidebar + main content area |
| `src/components/ui/button.tsx` | shadcn/ui Button |
| `src/components/ui/input.tsx` | shadcn/ui Input |
| `src/components/ui/label.tsx` | shadcn/ui Label |
| `src/components/ui/card.tsx` | shadcn/ui Card |
| `src/components/ui/dialog.tsx` | shadcn/ui Dialog |
| `src/components/ui/table.tsx` | shadcn/ui Table |
| `src/components/ui/badge.tsx` | shadcn/ui Badge |
| `src/components/ui/select.tsx` | shadcn/ui Select |
| `src/components/ui/textarea.tsx` | shadcn/ui Textarea |
| `src/components/ui/separator.tsx` | shadcn/ui Separator |
| `src/components/ui/tooltip.tsx` | shadcn/ui Tooltip |
| `src/components/shared/StatCard.tsx` | Reusable stat card (number + label) |
| `src/components/shared/StatusBadge.tsx` | Color-coded status indicator |
| `src/components/shared/EmptyState.tsx` | Empty state placeholder |
| `src/components/shared/PageHeader.tsx` | Page title + action buttons |
| `src/pages/Dashboard.tsx` | System overview with stats + recent projects |
| `src/pages/Projects.tsx` | Project list with create button |
| `src/pages/ProjectDetail.tsx` | Project management: config summary, ZIP import, run button, results |
| `src/pages/Configurations.tsx` | Config list + create/edit/delete + import/export |
| `src/pages/Results.tsx` | Summary table of student results for a project |
| `src/pages/StudentDetail.tsx` | Full execution log + output comparison for one student |
| `src/pages/Help.tsx` | Built-in help manual |

### Root Config
| File | Responsibility |
|------|---------------|
| `package.json` | Dependencies, scripts (dev, build, dist) |
| `vite.config.ts` | Vite + electron plugin + path aliases |
| `tsconfig.json` | TypeScript config for renderer + shared |
| `tsconfig.node.json` | TypeScript config for Vite/Node |
| `tailwind.config.js` | Tailwind theme with shadcn/ui tokens |
| `postcss.config.js` | PostCSS with Tailwind + autoprefixer |
| `electron-builder.yml` | NSIS installer config for Windows |
| `index.html` | HTML entry with fonts + root div |

---

## Task 1: Project Scaffolding & Build Config

**Files:**
- Create: `package.json`, `vite.config.ts`, `tsconfig.json`, `tsconfig.node.json`, `tailwind.config.js`, `postcss.config.js`, `electron-builder.yml`, `index.html`, `src/main.tsx`, `src/index.css`, `src/lib/utils.ts`, `src/vite-env.d.ts`

- [ ] **Step 1: Initialize package.json**

```bash
mkdir ce316-iae && cd ce316-iae
npm init -y
```

Then replace `package.json` contents:

```json
{
  "name": "ce316-iae",
  "version": "1.0.0",
  "description": "Integrated Assignment Environment - Batch programming assignment evaluator",
  "main": "dist-electron/main.js",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "dist": "npm run build && electron-builder"
  },
  "author": "",
  "license": "ISC"
}
```

- [ ] **Step 2: Install dependencies**

```bash
npm install react@18 react-dom@18 react-router-dom adm-zip uuid clsx tailwind-merge class-variance-authority lucide-react

npm install -D typescript @types/react @types/react-dom @types/adm-zip @types/uuid @vitejs/plugin-react vite electron electron-builder vite-plugin-electron vite-plugin-electron-renderer tailwindcss postcss autoprefixer
```

- [ ] **Step 3: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": false,
    "noUnusedParameters": false,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@shared/*": ["shared/*"]
    }
  },
  "include": ["src", "shared"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

- [ ] **Step 4: Create tsconfig.node.json**

```json
{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true,
    "strict": true
  },
  "include": ["vite.config.ts", "electron/**/*.ts"]
}
```

- [ ] **Step 5: Create vite.config.ts**

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import electron from 'vite-plugin-electron';
import renderer from 'vite-plugin-electron-renderer';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
    electron([
      {
        entry: 'electron/main.ts',
        vite: {
          build: {
            outDir: 'dist-electron',
            rollupOptions: {
              external: ['electron', 'adm-zip'],
            },
          },
          resolve: {
            alias: {
              '@shared': path.resolve(__dirname, 'shared'),
            },
          },
        },
      },
      {
        entry: 'electron/preload.ts',
        onstart(args) {
          args.reload();
        },
        vite: {
          build: {
            outDir: 'dist-electron',
            rollupOptions: {
              external: ['electron'],
            },
          },
        },
      },
    ]),
    renderer(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@shared': path.resolve(__dirname, 'shared'),
    },
  },
});
```

- [ ] **Step 6: Create Tailwind config files**

`tailwind.config.js`:

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        success: {
          DEFAULT: 'hsl(var(--success))',
          foreground: 'hsl(var(--success-foreground))',
        },
        warning: {
          DEFAULT: 'hsl(var(--warning))',
          foreground: 'hsl(var(--warning-foreground))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
    },
  },
  plugins: [],
};
```

`postcss.config.js`:

```javascript
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

- [ ] **Step 7: Create index.html**

```html
<!DOCTYPE html>
<html lang="en" class="dark">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>IAE - Integrated Assignment Environment</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
  </head>
  <body class="bg-background text-foreground antialiased">
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 8: Create src/index.css with shadcn/ui CSS variables**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 240 10% 3.9%;
    --card: 0 0% 100%;
    --card-foreground: 240 10% 3.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 240 10% 3.9%;
    --primary: 240 5.9% 10%;
    --primary-foreground: 0 0% 98%;
    --secondary: 240 4.8% 95.9%;
    --secondary-foreground: 240 5.9% 10%;
    --muted: 240 4.8% 95.9%;
    --muted-foreground: 240 3.8% 46.1%;
    --accent: 240 4.8% 95.9%;
    --accent-foreground: 240 5.9% 10%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 0 0% 98%;
    --success: 142 76% 36%;
    --success-foreground: 0 0% 98%;
    --warning: 38 92% 50%;
    --warning-foreground: 0 0% 98%;
    --border: 240 5.9% 90%;
    --input: 240 5.9% 90%;
    --ring: 240 5.9% 10%;
    --radius: 0.625rem;
  }

  .dark {
    --background: 240 10% 3.9%;
    --foreground: 0 0% 98%;
    --card: 240 10% 3.9%;
    --card-foreground: 0 0% 98%;
    --popover: 240 10% 3.9%;
    --popover-foreground: 0 0% 98%;
    --primary: 263 70% 58%;
    --primary-foreground: 0 0% 98%;
    --secondary: 240 3.7% 15.9%;
    --secondary-foreground: 0 0% 98%;
    --muted: 240 3.7% 15.9%;
    --muted-foreground: 240 5% 64.9%;
    --accent: 240 3.7% 15.9%;
    --accent-foreground: 0 0% 98%;
    --destructive: 0 62.8% 50.6%;
    --destructive-foreground: 0 0% 98%;
    --success: 142 71% 45%;
    --success-foreground: 0 0% 98%;
    --warning: 38 92% 50%;
    --warning-foreground: 0 0% 9%;
    --border: 240 3.7% 15.9%;
    --input: 240 3.7% 15.9%;
    --ring: 263 70% 58%;
    --radius: 0.625rem;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
  ::-webkit-scrollbar { width: 8px; height: 8px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: hsl(var(--muted-foreground) / 0.3); border-radius: 4px; }
  ::-webkit-scrollbar-thumb:hover { background: hsl(var(--muted-foreground) / 0.5); }
  .drag-region { -webkit-app-region: drag; }
  .no-drag { -webkit-app-region: no-drag; }
}
```

- [ ] **Step 9: Create src/vite-env.d.ts, src/lib/utils.ts, src/main.tsx**

`src/vite-env.d.ts`:

```typescript
/// <reference types="vite/client" />
```

`src/lib/utils.ts`:

```typescript
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

`src/main.tsx`:

```typescript
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
```

- [ ] **Step 10: Create electron-builder.yml**

```yaml
appId: com.ce316.iae
productName: "Integrated Assignment Environment"
directories:
  buildResources: build
  output: release
files:
  - dist
  - dist-electron
win:
  target:
    - target: nsis
      arch:
        - x64
  icon: build/icon.ico
nsis:
  oneClick: false
  allowToChangeInstallationDirectory: true
  createDesktopShortcut: true
  createStartMenuShortcut: true
  shortcutName: "IAE"
```

- [ ] **Step 11: Create directory structure**

```bash
mkdir -p electron/ipc electron/services src/pages src/components/layout src/components/ui src/components/shared src/lib shared build
```

- [ ] **Step 12: Verify build works**

```bash
npm run dev
```

Expected: Electron window opens with blank white/dark page. No errors in terminal.

- [ ] **Step 13: Commit**

```bash
git add -A
git commit -m "feat: scaffold Electron + React + Vite + Tailwind project"
```

---

## Task 2: Shared Types & IPC Bridge

**Files:**
- Create: `shared/types.ts`, `electron/preload.ts`, `src/lib/ipc.ts`

- [ ] **Step 1: Create shared/types.ts**

```typescript
// --- Configuration [R4][R5][R7] ---

export interface Configuration {
  id: string;
  name: string;
  language: string;
  compileCommand?: string;
  compileArgs?: string;
  runCommand: string;
  runArgs?: string;
  sourceFileExpected: string;
  createdAt: string;
  updatedAt: string;
}

// --- Project [R3][R10] ---

export interface Project {
  id: string;
  name: string;
  configurationId: string;
  configuration: Configuration;
  expectedOutput: string;
  programArgs: string;
  submissionsDir: string;
  createdAt: string;
  updatedAt: string;
}

// --- Student Results [R9] ---

export type StudentStatus =
  | 'pass'
  | 'fail'
  | 'compile_error'
  | 'runtime_error'
  | 'timeout'
  | 'missing_source'
  | 'zip_error';

export interface StudentResult {
  studentId: string;
  zipExtracted: boolean;
  sourceFound: boolean;
  compiled: boolean;
  compileOutput: string;
  compileError?: string;
  executed: boolean;
  executionOutput: string;
  executionError?: string;
  executionTimedOut: boolean;
  outputMatched: boolean;
  expectedOutput: string;
  actualOutput: string;
  status: StudentStatus;
  timestamp: string;
}

export interface ProjectResults {
  projectId: string;
  runAt: string;
  students: StudentResult[];
}

// --- Dashboard ---

export interface DashboardStats {
  totalProjects: number;
  totalStudents: number;
  overallPassRate: number;
  recentProjects: Array<{
    id: string;
    name: string;
    status: 'completed' | 'pending' | 'in-progress';
    studentCount: number;
    passRate: number;
    lastRun: string | null;
  }>;
}
```

- [ ] **Step 2: Create electron/preload.ts**

```typescript
import { contextBridge, ipcRenderer } from 'electron';

const api = {
  config: {
    getAll: () => ipcRenderer.invoke('config:getAll'),
    getById: (id: string) => ipcRenderer.invoke('config:getById', id),
    create: (config: any) => ipcRenderer.invoke('config:create', config),
    update: (id: string, config: any) => ipcRenderer.invoke('config:update', id, config),
    delete: (id: string) => ipcRenderer.invoke('config:delete', id),
    import: (filePath: string) => ipcRenderer.invoke('config:import', filePath),
    export: (id: string, targetPath: string) => ipcRenderer.invoke('config:export', id, targetPath),
  },
  project: {
    getAll: () => ipcRenderer.invoke('project:getAll'),
    getById: (id: string) => ipcRenderer.invoke('project:getById', id),
    create: (data: any) => ipcRenderer.invoke('project:create', data),
    update: (id: string, data: any) => ipcRenderer.invoke('project:update', id, data),
    delete: (id: string) => ipcRenderer.invoke('project:delete', id),
    getResults: (id: string) => ipcRenderer.invoke('project:getResults', id),
    getStatistics: () => ipcRenderer.invoke('project:getStatistics'),
  },
  execution: {
    importZips: (projectId: string, dirPath: string) =>
      ipcRenderer.invoke('execution:importZips', projectId, dirPath),
    run: (projectId: string) => ipcRenderer.invoke('execution:run', projectId),
    getStudents: (projectId: string) =>
      ipcRenderer.invoke('execution:getStudents', projectId),
  },
  dialog: {
    openDirectory: () => ipcRenderer.invoke('dialog:openDirectory'),
    openFile: (filters?: { name: string; extensions: string[] }[]) =>
      ipcRenderer.invoke('dialog:openFile', filters),
    saveFile: (defaultName: string, filters?: { name: string; extensions: string[] }[]) =>
      ipcRenderer.invoke('dialog:saveFile', defaultName, filters),
  },
};

contextBridge.exposeInMainWorld('api', api);

export type ApiType = typeof api;
```

- [ ] **Step 3: Create src/lib/ipc.ts**

```typescript
import type { ApiType } from '../../electron/preload';

declare global {
  interface Window {
    api: ApiType;
  }
}

export const api = window.api;
```

- [ ] **Step 4: Commit**

```bash
git add shared/types.ts electron/preload.ts src/lib/ipc.ts
git commit -m "feat: add shared types and IPC bridge"
```

---

## Task 3: FileService

**Files:**
- Create: `electron/services/FileService.ts`

- [ ] **Step 1: Create electron/services/FileService.ts**

```typescript
import fs from 'fs/promises';
import path from 'path';

export class FileService {
  async ensureDir(dirPath: string): Promise<void> {
    await fs.mkdir(dirPath, { recursive: true });
  }

  async readJson<T>(filePath: string): Promise<T> {
    const content = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(content) as T;
  }

  async writeJson(filePath: string, data: unknown): Promise<void> {
    await this.ensureDir(path.dirname(filePath));
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
  }

  async copyFile(src: string, dest: string): Promise<void> {
    await this.ensureDir(path.dirname(dest));
    await fs.copyFile(src, dest);
  }

  async deleteFile(filePath: string): Promise<void> {
    await fs.unlink(filePath);
  }

  async deleteDir(dirPath: string): Promise<void> {
    await fs.rm(dirPath, { recursive: true, force: true });
  }

  async exists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  async listFiles(dirPath: string, extension?: string): Promise<string[]> {
    const exists = await this.exists(dirPath);
    if (!exists) return [];
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    let files = entries.filter(e => e.isFile()).map(e => e.name);
    if (extension) {
      files = files.filter(f => f.endsWith(extension));
    }
    return files;
  }

  async listDirs(dirPath: string): Promise<string[]> {
    const exists = await this.exists(dirPath);
    if (!exists) return [];
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    return entries.filter(e => e.isDirectory()).map(e => e.name);
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add electron/services/FileService.ts
git commit -m "feat: add FileService for low-level file operations"
```

---

## Task 4: ConfigService + IPC [R4][R5]

**Files:**
- Create: `electron/services/ConfigService.ts`, `electron/ipc/config.ipc.ts`

- [ ] **Step 1: Create electron/services/ConfigService.ts**

```typescript
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { FileService } from './FileService';
import type { Configuration } from '../../shared/types';

export class ConfigService {
  private configDir: string;
  private fileService: FileService;

  constructor(appDataDir: string) {
    this.configDir = path.join(appDataDir, 'configurations');
    this.fileService = new FileService();
  }

  async getAll(): Promise<Configuration[]> {
    const files = await this.fileService.listFiles(this.configDir, '.json');
    const configs: Configuration[] = [];
    for (const file of files) {
      const config = await this.fileService.readJson<Configuration>(
        path.join(this.configDir, file)
      );
      configs.push(config);
    }
    return configs.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  async getById(id: string): Promise<Configuration | null> {
    const filePath = path.join(this.configDir, `${id}.json`);
    const exists = await this.fileService.exists(filePath);
    if (!exists) return null;
    return this.fileService.readJson<Configuration>(filePath);
  }

  async create(data: Omit<Configuration, 'id' | 'createdAt' | 'updatedAt'>): Promise<Configuration> {
    const now = new Date().toISOString();
    const config: Configuration = {
      ...data,
      id: uuidv4(),
      createdAt: now,
      updatedAt: now,
    };
    await this.fileService.writeJson(
      path.join(this.configDir, `${config.id}.json`),
      config
    );
    return config;
  }

  async update(id: string, data: Partial<Configuration>): Promise<Configuration> {
    const existing = await this.getById(id);
    if (!existing) throw new Error(`Configuration ${id} not found`);
    const updated: Configuration = {
      ...existing,
      ...data,
      id,
      updatedAt: new Date().toISOString(),
    };
    await this.fileService.writeJson(
      path.join(this.configDir, `${id}.json`),
      updated
    );
    return updated;
  }

  async delete(id: string): Promise<void> {
    const filePath = path.join(this.configDir, `${id}.json`);
    const exists = await this.fileService.exists(filePath);
    if (!exists) throw new Error(`Configuration ${id} not found`);
    await this.fileService.deleteFile(filePath);
  }

  async importConfig(filePath: string): Promise<Configuration> {
    const imported = await this.fileService.readJson<Configuration>(filePath);
    const now = new Date().toISOString();
    const config: Configuration = {
      ...imported,
      id: uuidv4(),
      createdAt: now,
      updatedAt: now,
    };
    await this.fileService.writeJson(
      path.join(this.configDir, `${config.id}.json`),
      config
    );
    return config;
  }

  async exportConfig(id: string, targetPath: string): Promise<void> {
    const config = await this.getById(id);
    if (!config) throw new Error(`Configuration ${id} not found`);
    await this.fileService.writeJson(targetPath, config);
  }
}
```

- [ ] **Step 2: Create electron/ipc/config.ipc.ts**

```typescript
import type { IpcMain } from 'electron';
import { ConfigService } from '../services/ConfigService';

export function registerConfigIpc(ipcMain: IpcMain, appDataDir: string): void {
  const service = new ConfigService(appDataDir);

  ipcMain.handle('config:getAll', async () => {
    return service.getAll();
  });

  ipcMain.handle('config:getById', async (_event, id: string) => {
    return service.getById(id);
  });

  ipcMain.handle('config:create', async (_event, data) => {
    return service.create(data);
  });

  ipcMain.handle('config:update', async (_event, id: string, data) => {
    return service.update(id, data);
  });

  ipcMain.handle('config:delete', async (_event, id: string) => {
    return service.delete(id);
  });

  ipcMain.handle('config:import', async (_event, filePath: string) => {
    return service.importConfig(filePath);
  });

  ipcMain.handle('config:export', async (_event, id: string, targetPath: string) => {
    return service.exportConfig(id, targetPath);
  });
}
```

- [ ] **Step 3: Commit**

```bash
git add electron/services/ConfigService.ts electron/ipc/config.ipc.ts
git commit -m "feat: add ConfigService with CRUD + import/export [R4][R5]"
```

---

## Task 5: ProjectService + IPC [R3][R10]

**Files:**
- Create: `electron/services/ProjectService.ts`, `electron/ipc/project.ipc.ts`

- [ ] **Step 1: Create electron/services/ProjectService.ts**

```typescript
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { FileService } from './FileService';
import { ConfigService } from './ConfigService';
import type { Project, ProjectResults, DashboardStats } from '../../shared/types';

export class ProjectService {
  private projectsDir: string;
  private fileService: FileService;
  private configService: ConfigService;

  constructor(appDataDir: string) {
    this.projectsDir = path.join(appDataDir, 'projects');
    this.fileService = new FileService();
    this.configService = new ConfigService(appDataDir);
  }

  private projectDir(id: string): string {
    return path.join(this.projectsDir, id);
  }

  private manifestPath(id: string): string {
    return path.join(this.projectDir(id), 'project.json');
  }

  private resultsPath(id: string): string {
    return path.join(this.projectDir(id), 'results', 'results.json');
  }

  async getAll(): Promise<Project[]> {
    const dirs = await this.fileService.listDirs(this.projectsDir);
    const projects: Project[] = [];
    for (const dir of dirs) {
      const manifestPath = path.join(this.projectsDir, dir, 'project.json');
      const exists = await this.fileService.exists(manifestPath);
      if (exists) {
        const project = await this.fileService.readJson<Project>(manifestPath);
        projects.push(project);
      }
    }
    return projects.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  async getById(id: string): Promise<Project | null> {
    const exists = await this.fileService.exists(this.manifestPath(id));
    if (!exists) return null;
    return this.fileService.readJson<Project>(this.manifestPath(id));
  }

  async create(data: {
    name: string;
    configurationId: string;
    expectedOutput: string;
    programArgs: string;
  }): Promise<Project> {
    const config = await this.configService.getById(data.configurationId);
    if (!config) throw new Error(`Configuration ${data.configurationId} not found`);

    const id = uuidv4();
    const now = new Date().toISOString();

    const project: Project = {
      id,
      name: data.name,
      configurationId: data.configurationId,
      configuration: config,
      expectedOutput: data.expectedOutput,
      programArgs: data.programArgs,
      submissionsDir: path.join(this.projectDir(id), 'submissions'),
      createdAt: now,
      updatedAt: now,
    };

    await this.fileService.ensureDir(project.submissionsDir);
    await this.fileService.ensureDir(path.join(this.projectDir(id), 'results'));
    await this.fileService.writeJson(this.manifestPath(id), project);

    return project;
  }

  async update(id: string, data: Partial<Project>): Promise<Project> {
    const existing = await this.getById(id);
    if (!existing) throw new Error(`Project ${id} not found`);
    const updated: Project = {
      ...existing,
      ...data,
      id,
      updatedAt: new Date().toISOString(),
    };
    await this.fileService.writeJson(this.manifestPath(id), updated);
    return updated;
  }

  async delete(id: string): Promise<void> {
    const exists = await this.fileService.exists(this.projectDir(id));
    if (!exists) throw new Error(`Project ${id} not found`);
    await this.fileService.deleteDir(this.projectDir(id));
  }

  async getResults(id: string): Promise<ProjectResults | null> {
    const exists = await this.fileService.exists(this.resultsPath(id));
    if (!exists) return null;
    return this.fileService.readJson<ProjectResults>(this.resultsPath(id));
  }

  async saveResults(id: string, results: ProjectResults): Promise<void> {
    await this.fileService.writeJson(this.resultsPath(id), results);
  }

  async getStatistics(): Promise<DashboardStats> {
    const projects = await this.getAll();
    let totalStudents = 0;
    let totalPassed = 0;
    const recentProjects: DashboardStats['recentProjects'] = [];

    for (const project of projects) {
      const results = await this.getResults(project.id);
      const studentCount = results?.students.length ?? 0;
      const passCount = results?.students.filter(s => s.status === 'pass').length ?? 0;
      totalStudents += studentCount;
      totalPassed += passCount;

      recentProjects.push({
        id: project.id,
        name: project.name,
        status: results ? 'completed' : 'pending',
        studentCount,
        passRate: studentCount > 0 ? (passCount / studentCount) * 100 : 0,
        lastRun: results?.runAt ?? null,
      });
    }

    return {
      totalProjects: projects.length,
      totalStudents,
      overallPassRate: totalStudents > 0 ? (totalPassed / totalStudents) * 100 : 0,
      recentProjects: recentProjects.slice(0, 10),
    };
  }
}
```

- [ ] **Step 2: Create electron/ipc/project.ipc.ts**

```typescript
import type { IpcMain } from 'electron';
import { ProjectService } from '../services/ProjectService';

export function registerProjectIpc(ipcMain: IpcMain, appDataDir: string): void {
  const service = new ProjectService(appDataDir);

  ipcMain.handle('project:getAll', async () => {
    return service.getAll();
  });

  ipcMain.handle('project:getById', async (_event, id: string) => {
    return service.getById(id);
  });

  ipcMain.handle('project:create', async (_event, data) => {
    return service.create(data);
  });

  ipcMain.handle('project:update', async (_event, id: string, data) => {
    return service.update(id, data);
  });

  ipcMain.handle('project:delete', async (_event, id: string) => {
    return service.delete(id);
  });

  ipcMain.handle('project:getResults', async (_event, id: string) => {
    return service.getResults(id);
  });

  ipcMain.handle('project:getStatistics', async () => {
    return service.getStatistics();
  });
}
```

- [ ] **Step 3: Commit**

```bash
git add electron/services/ProjectService.ts electron/ipc/project.ipc.ts
git commit -m "feat: add ProjectService with lifecycle + statistics [R3][R10]"
```

---

## Task 6: ZipService [R6]

**Files:**
- Create: `electron/services/ZipService.ts`

- [ ] **Step 1: Create electron/services/ZipService.ts**

```typescript
import path from 'path';
import AdmZip from 'adm-zip';
import { FileService } from './FileService';

export class ZipService {
  private fileService: FileService;

  constructor() {
    this.fileService = new FileService();
  }

  async processDirectory(dirPath: string): Promise<string[]> {
    const files = await this.fileService.listFiles(dirPath, '.zip');
    return files.map(f => path.join(dirPath, f));
  }

  async extractZip(zipPath: string, targetDir: string): Promise<string> {
    const zipName = path.basename(zipPath, '.zip');
    const studentDir = path.join(targetDir, zipName);
    await this.fileService.ensureDir(studentDir);

    const zip = new AdmZip(zipPath);
    zip.extractAllTo(studentDir, true);

    return zipName;
  }

  async extractAll(
    sourceDir: string,
    targetDir: string
  ): Promise<{ extracted: string[]; errors: Array<{ file: string; error: string }> }> {
    const zipPaths = await this.processDirectory(sourceDir);
    const extracted: string[] = [];
    const errors: Array<{ file: string; error: string }> = [];

    for (const zipPath of zipPaths) {
      try {
        const studentId = await this.extractZip(zipPath, targetDir);
        extracted.push(studentId);
      } catch (err) {
        errors.push({
          file: path.basename(zipPath),
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }

    return { extracted, errors };
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add electron/services/ZipService.ts
git commit -m "feat: add ZipService for batch ZIP extraction [R6]"
```

---

## Task 7: ExecutionService [R7][R8]

**Files:**
- Create: `electron/services/ExecutionService.ts`

- [ ] **Step 1: Create electron/services/ExecutionService.ts**

```typescript
import path from 'path';
import { execFile } from 'child_process';
import { FileService } from './FileService';
import type { Configuration, StudentResult, ProjectResults, StudentStatus } from '../../shared/types';

const EXECUTION_TIMEOUT = 10_000; // 10 seconds

interface ExecResult {
  stdout: string;
  stderr: string;
  exitCode: number | null;
  timedOut: boolean;
}

function runCommand(
  command: string,
  args: string[],
  cwd: string
): Promise<ExecResult> {
  return new Promise((resolve) => {
    const proc = execFile(command, args, {
      cwd,
      timeout: EXECUTION_TIMEOUT,
      maxBuffer: 10 * 1024 * 1024,
      shell: true,
    }, (error, stdout, stderr) => {
      const timedOut = error?.killed === true;
      resolve({
        stdout: stdout ?? '',
        stderr: stderr ?? '',
        exitCode: error ? (error.code ? Number(error.code) : 1) : 0,
        timedOut,
      });
    });
  });
}

function replaceTemplateVars(
  template: string,
  vars: Record<string, string>
): string {
  let result = template;
  for (const [key, value] of Object.entries(vars)) {
    result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
  }
  return result;
}

function parseArgs(argsString: string): string[] {
  // Split on whitespace, respecting quoted strings
  const args: string[] = [];
  let current = '';
  let inQuote = false;
  let quoteChar = '';

  for (const char of argsString) {
    if (inQuote) {
      if (char === quoteChar) {
        inQuote = false;
      } else {
        current += char;
      }
    } else if (char === '"' || char === "'") {
      inQuote = true;
      quoteChar = char;
    } else if (char === ' ' || char === '\t') {
      if (current) {
        args.push(current);
        current = '';
      }
    } else {
      current += char;
    }
  }
  if (current) args.push(current);
  return args;
}

export class ExecutionService {
  private fileService: FileService;

  constructor() {
    this.fileService = new FileService();
  }

  async runAll(
    projectId: string,
    submissionsDir: string,
    config: Configuration,
    programArgs: string,
    expectedOutput: string
  ): Promise<ProjectResults> {
    const studentDirs = await this.fileService.listDirs(submissionsDir);
    const students: StudentResult[] = [];

    for (const studentId of studentDirs) {
      const studentDir = path.join(submissionsDir, studentId);
      const result = await this.runStudent(
        studentId,
        studentDir,
        config,
        programArgs,
        expectedOutput
      );
      students.push(result);
    }

    return {
      projectId,
      runAt: new Date().toISOString(),
      students,
    };
  }

  async runStudent(
    studentId: string,
    studentDir: string,
    config: Configuration,
    programArgs: string,
    expectedOutput: string
  ): Promise<StudentResult> {
    const timestamp = new Date().toISOString();
    const sourceFile = config.sourceFileExpected;
    const outputName = path.parse(sourceFile).name;

    const templateVars: Record<string, string> = {
      sourceFile,
      outputName,
      args: programArgs,
    };

    // Base result - will be filled in as we progress
    const result: StudentResult = {
      studentId,
      zipExtracted: true,
      sourceFound: false,
      compiled: false,
      compileOutput: '',
      compileError: undefined,
      executed: false,
      executionOutput: '',
      executionError: undefined,
      executionTimedOut: false,
      outputMatched: false,
      expectedOutput,
      actualOutput: '',
      status: 'missing_source',
      timestamp,
    };

    // Step 1: Check source file exists
    const sourceExists = await this.fileService.exists(
      path.join(studentDir, sourceFile)
    );
    if (!sourceExists) {
      result.status = 'missing_source';
      return result;
    }
    result.sourceFound = true;

    // Step 2: Compile (if configured)
    if (config.compileCommand) {
      const compileArgsStr = config.compileArgs
        ? replaceTemplateVars(config.compileArgs, templateVars)
        : '';
      const compileArgs = parseArgs(compileArgsStr);

      const compileResult = await runCommand(
        config.compileCommand,
        compileArgs,
        studentDir
      );

      result.compileOutput = compileResult.stdout + compileResult.stderr;

      if (compileResult.timedOut) {
        result.compileError = 'Compilation timed out';
        result.status = 'compile_error';
        return result;
      }

      if (compileResult.exitCode !== 0) {
        result.compileError = compileResult.stderr || 'Compilation failed';
        result.status = 'compile_error';
        return result;
      }

      result.compiled = true;
    } else {
      result.compiled = true; // No compilation needed for interpreted languages
    }

    // Step 3: Run the program
    const runCommand_ = replaceTemplateVars(config.runCommand, templateVars);
    const runArgsStr = config.runArgs
      ? replaceTemplateVars(config.runArgs, templateVars)
      : '';
    const runArgs = parseArgs(runArgsStr);

    const execResult = await runCommand(runCommand_, runArgs, studentDir);

    result.executionOutput = execResult.stdout;
    result.actualOutput = execResult.stdout;

    if (execResult.timedOut) {
      result.executionTimedOut = true;
      result.executionError = 'Execution timed out';
      result.status = 'timeout';
      return result;
    }

    if (execResult.exitCode !== 0) {
      result.executionError = execResult.stderr || 'Runtime error';
      result.executed = true;
      result.status = 'runtime_error';
      return result;
    }

    result.executed = true;

    // Step 4: Compare output (exact match)
    result.outputMatched = execResult.stdout === expectedOutput;
    result.status = result.outputMatched ? 'pass' : 'fail';

    return result;
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add electron/services/ExecutionService.ts
git commit -m "feat: add ExecutionService compile/run/compare pipeline [R7][R8]"
```

---

## Task 8: Execution IPC + Electron Main Entry [R6][R7][R8]

**Files:**
- Create: `electron/ipc/execution.ipc.ts`, `electron/main.ts`

- [ ] **Step 1: Create electron/ipc/execution.ipc.ts**

```typescript
import type { IpcMain } from 'electron';
import { ZipService } from '../services/ZipService';
import { ExecutionService } from '../services/ExecutionService';
import { ProjectService } from '../services/ProjectService';

export function registerExecutionIpc(ipcMain: IpcMain, appDataDir: string): void {
  const zipService = new ZipService();
  const executionService = new ExecutionService();
  const projectService = new ProjectService(appDataDir);

  ipcMain.handle('execution:importZips', async (_event, projectId: string, dirPath: string) => {
    const project = await projectService.getById(projectId);
    if (!project) throw new Error(`Project ${projectId} not found`);

    const { extracted, errors } = await zipService.extractAll(dirPath, project.submissionsDir);

    if (errors.length > 0) {
      console.warn('ZIP extraction errors:', errors);
    }

    return extracted;
  });

  ipcMain.handle('execution:run', async (_event, projectId: string) => {
    const project = await projectService.getById(projectId);
    if (!project) throw new Error(`Project ${projectId} not found`);

    const results = await executionService.runAll(
      projectId,
      project.submissionsDir,
      project.configuration,
      project.programArgs,
      project.expectedOutput
    );

    await projectService.saveResults(projectId, results);

    return results;
  });

  ipcMain.handle('execution:getStudents', async (_event, projectId: string) => {
    const project = await projectService.getById(projectId);
    if (!project) throw new Error(`Project ${projectId} not found`);

    const { listDirs } = await import('../services/FileService').then(m => {
      const fs = new m.FileService();
      return { listDirs: fs.listDirs.bind(fs) };
    });

    return listDirs(project.submissionsDir);
  });
}
```

- [ ] **Step 2: Create electron/main.ts**

```typescript
import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import path from 'path';
import { registerConfigIpc } from './ipc/config.ipc';
import { registerProjectIpc } from './ipc/project.ipc';
import { registerExecutionIpc } from './ipc/execution.ipc';
import { FileService } from './services/FileService';

const APP_DATA_DIR = path.join(app.getPath('home'), '.iae');

let mainWindow: BrowserWindow | null = null;

async function createWindow() {
  const fileService = new FileService();
  await fileService.ensureDir(path.join(APP_DATA_DIR, 'configurations'));
  await fileService.ensureDir(path.join(APP_DATA_DIR, 'projects'));

  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    title: 'IAE - Integrated Assignment Environment',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  registerConfigIpc(ipcMain, APP_DATA_DIR);
  registerProjectIpc(ipcMain, APP_DATA_DIR);
  registerExecutionIpc(ipcMain, APP_DATA_DIR);

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

  if (process.env.VITE_DEV_SERVER_URL) {
    await mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
    mainWindow.webContents.openDevTools();
  } else {
    await mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
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
```

- [ ] **Step 3: Verify the app starts**

```bash
npm run dev
```

Expected: Electron window opens. No errors in terminal. DevTools console shows no IPC errors.

- [ ] **Step 4: Commit**

```bash
git add electron/ipc/execution.ipc.ts electron/main.ts
git commit -m "feat: add execution IPC + Electron main entry [R6][R7][R8]"
```

---

## Task 9: UI Components - shadcn/ui Primitives + Shared Components

**Files:**
- Create: `src/components/ui/button.tsx`, `src/components/ui/input.tsx`, `src/components/ui/label.tsx`, `src/components/ui/card.tsx`, `src/components/ui/dialog.tsx`, `src/components/ui/table.tsx`, `src/components/ui/badge.tsx`, `src/components/ui/select.tsx`, `src/components/ui/textarea.tsx`, `src/components/ui/separator.tsx`, `src/components/ui/tooltip.tsx`, `src/components/shared/StatCard.tsx`, `src/components/shared/StatusBadge.tsx`, `src/components/shared/EmptyState.tsx`, `src/components/shared/PageHeader.tsx`

- [ ] **Step 1: Create shadcn/ui primitives**

Install each shadcn/ui component. These are copy-paste components from the shadcn/ui registry. Use the shadcn CLI or manually copy from the shadcn/ui docs for each:

```bash
npx shadcn@latest init
npx shadcn@latest add button input label card dialog table badge select textarea separator tooltip
```

If the CLI doesn't work with the Electron setup, manually copy each component from the shadcn/ui GitHub repo into `src/components/ui/`. Each component uses `cn()` from `src/lib/utils.ts` and the CSS variables from `src/index.css`.

- [ ] **Step 2: Create src/components/shared/StatCard.tsx**

```tsx
import { cn } from '@/lib/utils';
import { type LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  className?: string;
}

export function StatCard({ title, value, icon: Icon, description, className }: StatCardProps) {
  return (
    <div className={cn('rounded-lg border bg-card p-6', className)}>
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="mt-2">
        <p className="text-2xl font-bold">{value}</p>
        {description && (
          <p className="mt-1 text-xs text-muted-foreground">{description}</p>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create src/components/shared/StatusBadge.tsx**

```tsx
import { cn } from '@/lib/utils';
import type { StudentStatus } from '@shared/types';

const statusConfig: Record<StudentStatus, { label: string; className: string }> = {
  pass: { label: 'Pass', className: 'bg-success/10 text-success border-success/20' },
  fail: { label: 'Fail', className: 'bg-destructive/10 text-destructive border-destructive/20' },
  compile_error: { label: 'Compile Error', className: 'bg-destructive/10 text-destructive border-destructive/20' },
  runtime_error: { label: 'Runtime Error', className: 'bg-warning/10 text-warning border-warning/20' },
  timeout: { label: 'Timeout', className: 'bg-warning/10 text-warning border-warning/20' },
  missing_source: { label: 'Missing Source', className: 'bg-muted text-muted-foreground border-border' },
  zip_error: { label: 'ZIP Error', className: 'bg-muted text-muted-foreground border-border' },
};

interface StatusBadgeProps {
  status: StudentStatus;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status];
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium',
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  );
}
```

- [ ] **Step 4: Create src/components/shared/EmptyState.tsx**

```tsx
import { type LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <Icon className="h-12 w-12 text-muted-foreground/50" />
      <h3 className="mt-4 text-lg font-semibold">{title}</h3>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">{description}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
```

- [ ] **Step 5: Create src/components/shared/PageHeader.tsx**

```tsx
interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}

export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {description && (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
```

- [ ] **Step 6: Commit**

```bash
git add src/components/
git commit -m "feat: add UI primitives and shared components"
```

---

## Task 10: Layout - Sidebar + AppShell

**Files:**
- Create: `src/components/layout/Sidebar.tsx`, `src/components/layout/AppShell.tsx`

- [ ] **Step 1: Create src/components/layout/Sidebar.tsx**

```tsx
import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  FolderOpen,
  Settings2,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/projects', icon: FolderOpen, label: 'Projects' },
  { to: '/configurations', icon: Settings2, label: 'Configurations' },
  { to: '/help', icon: HelpCircle, label: 'Help' },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        'flex h-screen flex-col border-r bg-card transition-all duration-300',
        collapsed ? 'w-16' : 'w-60'
      )}
    >
      {/* Header */}
      <div className="flex h-14 items-center justify-between border-b px-4">
        {!collapsed && (
          <span className="text-sm font-bold tracking-tight">IAE</span>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-2">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground'
              )
            }
          >
            <Icon className="h-4 w-4 shrink-0" />
            {!collapsed && <span>{label}</span>}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
```

- [ ] **Step 2: Create src/components/layout/AppShell.tsx**

```tsx
import { Sidebar } from './Sidebar';

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto p-8">{children}</main>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/layout/
git commit -m "feat: add collapsible sidebar and app shell layout"
```

---

## Task 11: App Router Setup

**Files:**
- Create: `src/App.tsx`
- Create stub pages: `src/pages/Dashboard.tsx`, `src/pages/Projects.tsx`, `src/pages/ProjectDetail.tsx`, `src/pages/Configurations.tsx`, `src/pages/Results.tsx`, `src/pages/StudentDetail.tsx`, `src/pages/Help.tsx`

- [ ] **Step 1: Create src/App.tsx**

```tsx
import { HashRouter, Routes, Route } from 'react-router-dom';
import { AppShell } from './components/layout/AppShell';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import ProjectDetail from './pages/ProjectDetail';
import Configurations from './pages/Configurations';
import Results from './pages/Results';
import StudentDetail from './pages/StudentDetail';
import Help from './pages/Help';

function App() {
  return (
    <HashRouter>
      <AppShell>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/projects/:id" element={<ProjectDetail />} />
          <Route path="/projects/:id/results" element={<Results />} />
          <Route path="/projects/:id/results/:studentId" element={<StudentDetail />} />
          <Route path="/configurations" element={<Configurations />} />
          <Route path="/help" element={<Help />} />
        </Routes>
      </AppShell>
    </HashRouter>
  );
}

export default App;
```

- [ ] **Step 2: Create stub pages**

Each stub is a placeholder that will be fleshed out in subsequent tasks. Example for each:

`src/pages/Dashboard.tsx`:
```tsx
import { PageHeader } from '@/components/shared/PageHeader';

export default function Dashboard() {
  return (
    <div>
      <PageHeader title="Dashboard" description="System overview and statistics" />
    </div>
  );
}
```

`src/pages/Projects.tsx`:
```tsx
import { PageHeader } from '@/components/shared/PageHeader';

export default function Projects() {
  return (
    <div>
      <PageHeader title="Projects" description="Manage your assignment projects" />
    </div>
  );
}
```

`src/pages/ProjectDetail.tsx`:
```tsx
import { PageHeader } from '@/components/shared/PageHeader';

export default function ProjectDetail() {
  return (
    <div>
      <PageHeader title="Project Detail" />
    </div>
  );
}
```

`src/pages/Configurations.tsx`:
```tsx
import { PageHeader } from '@/components/shared/PageHeader';

export default function Configurations() {
  return (
    <div>
      <PageHeader title="Configurations" description="Language configurations" />
    </div>
  );
}
```

`src/pages/Results.tsx`:
```tsx
import { PageHeader } from '@/components/shared/PageHeader';

export default function Results() {
  return (
    <div>
      <PageHeader title="Results" />
    </div>
  );
}
```

`src/pages/StudentDetail.tsx`:
```tsx
import { PageHeader } from '@/components/shared/PageHeader';

export default function StudentDetail() {
  return (
    <div>
      <PageHeader title="Student Detail" />
    </div>
  );
}
```

`src/pages/Help.tsx`:
```tsx
import { PageHeader } from '@/components/shared/PageHeader';

export default function Help() {
  return (
    <div>
      <PageHeader title="Help" description="How to use the IAE" />
    </div>
  );
}
```

- [ ] **Step 3: Verify routing works**

```bash
npm run dev
```

Expected: App opens with sidebar. Clicking each nav item navigates to the corresponding stub page. URL changes in hash format (e.g., `#/projects`).

- [ ] **Step 4: Commit**

```bash
git add src/App.tsx src/pages/
git commit -m "feat: add router setup with stub pages"
```

---

## Task 12: Configurations Page [R4][R5]

**Files:**
- Modify: `src/pages/Configurations.tsx`

- [ ] **Step 1: Implement the full Configurations page**

```tsx
import { useState, useEffect } from 'react';
import { Plus, Upload, Download, Pencil, Trash2, Settings2 } from 'lucide-react';
import { api } from '@/lib/ipc';
import { PageHeader } from '@/components/shared/PageHeader';
import { EmptyState } from '@/components/shared/EmptyState';
import type { Configuration } from '@shared/types';

export default function Configurations() {
  const [configs, setConfigs] = useState<Configuration[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingConfig, setEditingConfig] = useState<Configuration | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [language, setLanguage] = useState('');
  const [compileCommand, setCompileCommand] = useState('');
  const [compileArgs, setCompileArgs] = useState('');
  const [runCommand, setRunCommand] = useState('');
  const [runArgs, setRunArgs] = useState('');
  const [sourceFileExpected, setSourceFileExpected] = useState('');

  useEffect(() => {
    loadConfigs();
  }, []);

  async function loadConfigs() {
    setLoading(true);
    const data = await api.config.getAll();
    setConfigs(data);
    setLoading(false);
  }

  function resetForm() {
    setName('');
    setLanguage('');
    setCompileCommand('');
    setCompileArgs('');
    setRunCommand('');
    setRunArgs('');
    setSourceFileExpected('');
    setEditingConfig(null);
    setShowForm(false);
  }

  function openEdit(config: Configuration) {
    setName(config.name);
    setLanguage(config.language);
    setCompileCommand(config.compileCommand ?? '');
    setCompileArgs(config.compileArgs ?? '');
    setRunCommand(config.runCommand);
    setRunArgs(config.runArgs ?? '');
    setSourceFileExpected(config.sourceFileExpected);
    setEditingConfig(config);
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const data = {
      name,
      language,
      compileCommand: compileCommand || undefined,
      compileArgs: compileArgs || undefined,
      runCommand,
      runArgs: runArgs || undefined,
      sourceFileExpected,
    };

    if (editingConfig) {
      await api.config.update(editingConfig.id, data);
    } else {
      await api.config.create(data);
    }
    resetForm();
    await loadConfigs();
  }

  async function handleDelete(id: string) {
    await api.config.delete(id);
    await loadConfigs();
  }

  async function handleImport() {
    const filePath = await api.dialog.openFile([
      { name: 'JSON', extensions: ['json'] },
    ]);
    if (filePath) {
      await api.config.import(filePath);
      await loadConfigs();
    }
  }

  async function handleExport(id: string) {
    const config = configs.find(c => c.id === id);
    if (!config) return;
    const targetPath = await api.dialog.saveFile(
      `${config.name}.json`,
      [{ name: 'JSON', extensions: ['json'] }]
    );
    if (targetPath) {
      await api.config.export(id, targetPath);
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-muted-foreground">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Configurations"
        description="Manage language configurations for compiling and running student code"
        actions={
          <div className="flex gap-2">
            <button
              onClick={handleImport}
              className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium hover:bg-accent"
            >
              <Upload className="h-4 w-4" /> Import
            </button>
            <button
              onClick={() => { resetForm(); setShowForm(true); }}
              className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" /> New Configuration
            </button>
          </div>
        }
      />

      {/* Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="rounded-lg border bg-card p-6 space-y-4">
          <h3 className="text-lg font-semibold">
            {editingConfig ? 'Edit Configuration' : 'New Configuration'}
          </h3>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Name</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                required
                placeholder="e.g., C Programming Language"
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Language</label>
              <input
                type="text"
                value={language}
                onChange={e => setLanguage(e.target.value)}
                required
                placeholder="e.g., C, Python, Java"
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Compile Command (optional)</label>
              <input
                type="text"
                value={compileCommand}
                onChange={e => setCompileCommand(e.target.value)}
                placeholder="e.g., gcc"
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Compile Args</label>
              <input
                type="text"
                value={compileArgs}
                onChange={e => setCompileArgs(e.target.value)}
                placeholder="e.g., {{sourceFile}} -o {{outputName}}"
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Run Command</label>
              <input
                type="text"
                value={runCommand}
                onChange={e => setRunCommand(e.target.value)}
                required
                placeholder="e.g., ./{{outputName}} or python"
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Run Args</label>
              <input
                type="text"
                value={runArgs}
                onChange={e => setRunArgs(e.target.value)}
                placeholder="e.g., {{sourceFile}} {{args}}"
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Expected Source File</label>
            <input
              type="text"
              value={sourceFileExpected}
              onChange={e => setSourceFileExpected(e.target.value)}
              required
              placeholder="e.g., main.c, main.py"
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            />
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              {editingConfig ? 'Update' : 'Create'}
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-accent"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Config List */}
      {configs.length === 0 ? (
        <EmptyState
          icon={Settings2}
          title="No configurations yet"
          description="Create a language configuration to define how student code is compiled and run."
          action={
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" /> Create Configuration
            </button>
          }
        />
      ) : (
        <div className="rounded-lg border">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Name</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Language</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Compile</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Source File</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {configs.map(config => (
                <tr key={config.id} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="px-4 py-3 text-sm font-medium">{config.name}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{config.language}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground font-mono">
                    {config.compileCommand || '(interpreted)'}
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground font-mono">{config.sourceFileExpected}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => handleExport(config.id)} className="rounded p-1.5 hover:bg-accent" title="Export">
                        <Download className="h-4 w-4 text-muted-foreground" />
                      </button>
                      <button onClick={() => openEdit(config)} className="rounded p-1.5 hover:bg-accent" title="Edit">
                        <Pencil className="h-4 w-4 text-muted-foreground" />
                      </button>
                      <button onClick={() => handleDelete(config.id)} className="rounded p-1.5 hover:bg-accent" title="Delete">
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify configurations CRUD works**

```bash
npm run dev
```

Expected: Navigate to Configurations. Create a new config (e.g., "C" with gcc). See it in the table. Edit it. Export it. Delete it. Import a JSON file.

- [ ] **Step 3: Commit**

```bash
git add src/pages/Configurations.tsx
git commit -m "feat: implement Configurations page with CRUD + import/export [R4][R5]"
```

---

## Task 13: Projects Page + Create Project [R3][R10]

**Files:**
- Modify: `src/pages/Projects.tsx`

- [ ] **Step 1: Implement the full Projects page**

```tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, FolderOpen, Trash2 } from 'lucide-react';
import { api } from '@/lib/ipc';
import { PageHeader } from '@/components/shared/PageHeader';
import { EmptyState } from '@/components/shared/EmptyState';
import type { Project, Configuration } from '@shared/types';

export default function Projects() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [configs, setConfigs] = useState<Configuration[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [configId, setConfigId] = useState('');
  const [expectedOutput, setExpectedOutput] = useState('');
  const [programArgs, setProgramArgs] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    const [projectsData, configsData] = await Promise.all([
      api.project.getAll(),
      api.config.getAll(),
    ]);
    setProjects(projectsData);
    setConfigs(configsData);
    setLoading(false);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    await api.project.create({ name, configurationId: configId, expectedOutput, programArgs });
    setName('');
    setConfigId('');
    setExpectedOutput('');
    setProgramArgs('');
    setShowForm(false);
    await loadData();
  }

  async function handleDelete(id: string) {
    await api.project.delete(id);
    await loadData();
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-muted-foreground">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Projects"
        description="Assignment projects for batch evaluation"
        actions={
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" /> New Project
          </button>
        }
      />

      {/* Create form */}
      {showForm && (
        <form onSubmit={handleCreate} className="rounded-lg border bg-card p-6 space-y-4">
          <h3 className="text-lg font-semibold">New Project</h3>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Project Name</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                required
                placeholder="e.g., HW1 - String Sorting"
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Configuration</label>
              <select
                value={configId}
                onChange={e => setConfigId(e.target.value)}
                required
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              >
                <option value="">Select a configuration...</option>
                {configs.map(c => (
                  <option key={c.id} value={c.id}>{c.name} ({c.language})</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Program Arguments</label>
            <input
              type="text"
              value={programArgs}
              onChange={e => setProgramArgs(e.target.value)}
              placeholder="e.g., apple banana cherry"
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Expected Output</label>
            <textarea
              value={expectedOutput}
              onChange={e => setExpectedOutput(e.target.value)}
              required
              rows={4}
              placeholder="The exact expected output of a correct program"
              className="w-full rounded-md border bg-background px-3 py-2 text-sm font-mono"
            />
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Create Project
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-accent"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Project list */}
      {projects.length === 0 ? (
        <EmptyState
          icon={FolderOpen}
          title="No projects yet"
          description="Create a project to start evaluating student assignments."
          action={
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" /> Create Project
            </button>
          }
        />
      ) : (
        <div className="rounded-lg border">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Name</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Configuration</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Created</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {projects.map(project => (
                <tr
                  key={project.id}
                  className="border-b last:border-0 hover:bg-muted/30 cursor-pointer"
                  onClick={() => navigate(`/projects/${project.id}`)}
                >
                  <td className="px-4 py-3 text-sm font-medium">{project.name}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {project.configuration.name} ({project.configuration.language})
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {new Date(project.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={e => { e.stopPropagation(); handleDelete(project.id); }}
                      className="rounded p-1.5 hover:bg-accent"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify project creation and navigation works**

```bash
npm run dev
```

Expected: Create a config first, then create a project using that config. Project appears in the table. Clicking a project navigates to `/projects/:id`.

- [ ] **Step 3: Commit**

```bash
git add src/pages/Projects.tsx
git commit -m "feat: implement Projects page with create and list [R3][R10]"
```

---

## Task 14: Project Detail Page [R3][R6][R7][R10]

**Files:**
- Modify: `src/pages/ProjectDetail.tsx`

- [ ] **Step 1: Implement the full ProjectDetail page**

```tsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FolderUp, Play, FileText, ArrowLeft } from 'lucide-react';
import { api } from '@/lib/ipc';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatCard } from '@/components/shared/StatCard';
import { StatusBadge } from '@/components/shared/StatusBadge';
import type { Project, ProjectResults } from '@shared/types';

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [results, setResults] = useState<ProjectResults | null>(null);
  const [students, setStudents] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    loadProject();
  }, [id]);

  async function loadProject() {
    if (!id) return;
    setLoading(true);
    const [proj, res, studs] = await Promise.all([
      api.project.getById(id),
      api.project.getResults(id),
      api.execution.getStudents(id),
    ]);
    setProject(proj);
    setResults(res);
    setStudents(studs);
    setLoading(false);
  }

  async function handleImportZips() {
    if (!id) return;
    const dirPath = await api.dialog.openDirectory();
    if (!dirPath) return;
    const extracted = await api.execution.importZips(id, dirPath);
    setStudents(extracted);
  }

  async function handleRun() {
    if (!id) return;
    setRunning(true);
    const res = await api.execution.run(id);
    setResults(res);
    setRunning(false);
  }

  if (loading || !project) {
    return <div className="flex items-center justify-center h-64 text-muted-foreground">Loading...</div>;
  }

  const passCount = results?.students.filter(s => s.status === 'pass').length ?? 0;
  const totalCount = results?.students.length ?? 0;

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate('/projects')}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Projects
      </button>

      <PageHeader
        title={project.name}
        description={`${project.configuration.name} (${project.configuration.language})`}
        actions={
          <div className="flex gap-2">
            <button
              onClick={handleImportZips}
              className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium hover:bg-accent"
            >
              <FolderUp className="h-4 w-4" /> Import ZIPs
            </button>
            <button
              onClick={handleRun}
              disabled={running || students.length === 0}
              className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              <Play className="h-4 w-4" /> {running ? 'Running...' : 'Run All'}
            </button>
          </div>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard title="Students" value={students.length} icon={FileText} />
        <StatCard title="Evaluated" value={totalCount} icon={FileText} />
        <StatCard title="Passed" value={passCount} icon={FileText} />
        <StatCard
          title="Pass Rate"
          value={totalCount > 0 ? `${Math.round((passCount / totalCount) * 100)}%` : '-'}
          icon={FileText}
        />
      </div>

      {/* Config details */}
      <div className="rounded-lg border bg-card p-6 space-y-3">
        <h3 className="text-sm font-semibold text-muted-foreground">Configuration Details</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Compile: </span>
            <span className="font-mono">
              {project.configuration.compileCommand
                ? `${project.configuration.compileCommand} ${project.configuration.compileArgs || ''}`
                : '(interpreted)'}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">Run: </span>
            <span className="font-mono">
              {project.configuration.runCommand} {project.configuration.runArgs || ''}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">Source File: </span>
            <span className="font-mono">{project.configuration.sourceFileExpected}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Args: </span>
            <span className="font-mono">{project.programArgs || '(none)'}</span>
          </div>
        </div>
        <div>
          <span className="text-sm text-muted-foreground">Expected Output:</span>
          <pre className="mt-1 rounded bg-muted p-3 text-sm font-mono whitespace-pre-wrap">
            {project.expectedOutput}
          </pre>
        </div>
      </div>

      {/* Results table */}
      {results && results.students.length > 0 && (
        <div className="rounded-lg border">
          <div className="border-b px-4 py-3">
            <h3 className="text-sm font-semibold">Results</h3>
            <p className="text-xs text-muted-foreground">
              Last run: {new Date(results.runAt).toLocaleString()}
            </p>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Student ID</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Compile</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Execute</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Output Match</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              {results.students.map(student => (
                <tr
                  key={student.studentId}
                  className="border-b last:border-0 hover:bg-muted/30 cursor-pointer"
                  onClick={() => navigate(`/projects/${id}/results/${student.studentId}`)}
                >
                  <td className="px-4 py-3 text-sm font-medium">{student.studentId}</td>
                  <td className="px-4 py-3 text-sm">
                    {student.compiled ? (
                      <span className="text-success">OK</span>
                    ) : (
                      <span className="text-destructive">Failed</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {student.executed ? (
                      <span className="text-success">OK</span>
                    ) : (
                      <span className="text-destructive">Failed</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {student.outputMatched ? (
                      <span className="text-success">Match</span>
                    ) : (
                      <span className="text-destructive">Mismatch</span>
                    )}
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={student.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify full pipeline works end-to-end**

```bash
npm run dev
```

Expected: Open a project. Click "Import ZIPs" and select a directory with ZIP files. Student count updates. Click "Run All". Results table populates with per-student status. Clicking a student row navigates to detail.

- [ ] **Step 3: Commit**

```bash
git add src/pages/ProjectDetail.tsx
git commit -m "feat: implement ProjectDetail with ZIP import + run pipeline [R3][R6][R7][R10]"
```

---

## Task 15: Student Detail Page [R9]

**Files:**
- Modify: `src/pages/StudentDetail.tsx`

- [ ] **Step 1: Implement the full StudentDetail page**

```tsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { api } from '@/lib/ipc';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatusBadge } from '@/components/shared/StatusBadge';
import type { StudentResult, ProjectResults } from '@shared/types';

export default function StudentDetail() {
  const { id, studentId } = useParams<{ id: string; studentId: string }>();
  const navigate = useNavigate();
  const [student, setStudent] = useState<StudentResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStudent();
  }, [id, studentId]);

  async function loadStudent() {
    if (!id || !studentId) return;
    setLoading(true);
    const results = await api.project.getResults(id);
    if (results) {
      const found = results.students.find(s => s.studentId === studentId);
      setStudent(found ?? null);
    }
    setLoading(false);
  }

  if (loading || !student) {
    return <div className="flex items-center justify-center h-64 text-muted-foreground">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate(`/projects/${id}`)}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Project
      </button>

      <div className="flex items-center gap-3">
        <PageHeader title={`Student: ${student.studentId}`} />
        <StatusBadge status={student.status} />
      </div>

      {/* Pipeline Steps */}
      <div className="space-y-4">
        {/* ZIP Extraction */}
        <div className="rounded-lg border bg-card p-4">
          <h3 className="text-sm font-semibold">1. ZIP Extraction</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {student.zipExtracted ? 'Successfully extracted' : 'Failed to extract'}
          </p>
        </div>

        {/* Source File */}
        <div className="rounded-lg border bg-card p-4">
          <h3 className="text-sm font-semibold">2. Source File</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {student.sourceFound ? 'Source file found' : 'Source file not found'}
          </p>
        </div>

        {/* Compilation */}
        <div className="rounded-lg border bg-card p-4">
          <h3 className="text-sm font-semibold">3. Compilation</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {student.compiled ? 'Compiled successfully' : 'Compilation failed'}
          </p>
          {student.compileOutput && (
            <pre className="mt-2 rounded bg-muted p-3 text-xs font-mono whitespace-pre-wrap overflow-auto max-h-64">
              {student.compileOutput}
            </pre>
          )}
          {student.compileError && (
            <pre className="mt-2 rounded bg-destructive/10 p-3 text-xs font-mono text-destructive whitespace-pre-wrap overflow-auto max-h-64">
              {student.compileError}
            </pre>
          )}
        </div>

        {/* Execution */}
        <div className="rounded-lg border bg-card p-4">
          <h3 className="text-sm font-semibold">4. Execution</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {student.executionTimedOut
              ? 'Execution timed out'
              : student.executed
              ? 'Executed successfully'
              : 'Execution failed'}
          </p>
          {student.executionError && (
            <pre className="mt-2 rounded bg-destructive/10 p-3 text-xs font-mono text-destructive whitespace-pre-wrap overflow-auto max-h-64">
              {student.executionError}
            </pre>
          )}
        </div>

        {/* Output Comparison */}
        <div className="rounded-lg border bg-card p-4">
          <h3 className="text-sm font-semibold">5. Output Comparison</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {student.outputMatched ? 'Output matches expected' : 'Output does not match'}
          </p>
          <div className="mt-3 grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Expected Output</p>
              <pre className="rounded bg-muted p-3 text-xs font-mono whitespace-pre-wrap overflow-auto max-h-64">
                {student.expectedOutput || '(empty)'}
              </pre>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Actual Output</p>
              <pre className="rounded bg-muted p-3 text-xs font-mono whitespace-pre-wrap overflow-auto max-h-64">
                {student.actualOutput || '(empty)'}
              </pre>
            </div>
          </div>
        </div>
      </div>

      {/* Timestamp */}
      <p className="text-xs text-muted-foreground">
        Evaluated at: {new Date(student.timestamp).toLocaleString()}
      </p>
    </div>
  );
}
```

- [ ] **Step 2: Verify student detail view works**

```bash
npm run dev
```

Expected: From project detail results table, click a student row. See all 5 pipeline steps with their output. Side-by-side expected vs actual output for comparison.

- [ ] **Step 3: Commit**

```bash
git add src/pages/StudentDetail.tsx
git commit -m "feat: implement StudentDetail with full execution log and output comparison [R9]"
```

---

## Task 16: Results Page [R9]

**Files:**
- Modify: `src/pages/Results.tsx`

- [ ] **Step 1: Implement the Results page**

```tsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText } from 'lucide-react';
import { api } from '@/lib/ipc';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatCard } from '@/components/shared/StatCard';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { EmptyState } from '@/components/shared/EmptyState';
import type { Project, ProjectResults } from '@shared/types';

export default function Results() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [results, setResults] = useState<ProjectResults | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [id]);

  async function loadData() {
    if (!id) return;
    setLoading(true);
    const [proj, res] = await Promise.all([
      api.project.getById(id),
      api.project.getResults(id),
    ]);
    setProject(proj);
    setResults(res);
    setLoading(false);
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-muted-foreground">Loading...</div>;
  }

  const passCount = results?.students.filter(s => s.status === 'pass').length ?? 0;
  const failCount = results?.students.filter(s => s.status === 'fail').length ?? 0;
  const errorCount = results?.students.filter(s =>
    ['compile_error', 'runtime_error', 'timeout', 'missing_source', 'zip_error'].includes(s.status)
  ).length ?? 0;
  const totalCount = results?.students.length ?? 0;

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate(`/projects/${id}`)}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Project
      </button>

      <PageHeader
        title={`Results: ${project?.name ?? ''}`}
        description={results ? `Last run: ${new Date(results.runAt).toLocaleString()}` : 'No results yet'}
      />

      {!results ? (
        <EmptyState
          icon={FileText}
          title="No results yet"
          description="Import student ZIP files and run the evaluation pipeline first."
        />
      ) : (
        <>
          <div className="grid grid-cols-4 gap-4">
            <StatCard title="Total" value={totalCount} icon={FileText} />
            <StatCard title="Passed" value={passCount} icon={FileText} />
            <StatCard title="Failed" value={failCount} icon={FileText} />
            <StatCard title="Errors" value={errorCount} icon={FileText} />
          </div>

          <div className="rounded-lg border">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Student ID</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Source</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Compile</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Execute</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Output</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {results.students.map(student => (
                  <tr
                    key={student.studentId}
                    className="border-b last:border-0 hover:bg-muted/30 cursor-pointer"
                    onClick={() => navigate(`/projects/${id}/results/${student.studentId}`)}
                  >
                    <td className="px-4 py-3 text-sm font-medium">{student.studentId}</td>
                    <td className="px-4 py-3 text-sm">
                      {student.sourceFound ? <span className="text-success">Found</span> : <span className="text-destructive">Missing</span>}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {student.compiled ? <span className="text-success">OK</span> : <span className="text-destructive">Failed</span>}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {student.executed ? <span className="text-success">OK</span> : <span className="text-destructive">Failed</span>}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {student.outputMatched ? <span className="text-success">Match</span> : <span className="text-destructive">Mismatch</span>}
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={student.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/Results.tsx
git commit -m "feat: implement Results page with summary table [R9]"
```

---

## Task 17: Dashboard Page

**Files:**
- Modify: `src/pages/Dashboard.tsx`

- [ ] **Step 1: Implement the Dashboard page**

```tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LayoutDashboard, FolderOpen, Users, TrendingUp } from 'lucide-react';
import { api } from '@/lib/ipc';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatCard } from '@/components/shared/StatCard';
import { EmptyState } from '@/components/shared/EmptyState';
import type { DashboardStats } from '@shared/types';

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    setLoading(true);
    const data = await api.project.getStatistics();
    setStats(data);
    setLoading(false);
  }

  if (loading || !stats) {
    return <div className="flex items-center justify-center h-64 text-muted-foreground">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" description="System overview and statistics" />

      <div className="grid grid-cols-4 gap-4">
        <StatCard title="Total Projects" value={stats.totalProjects} icon={FolderOpen} />
        <StatCard title="Students Evaluated" value={stats.totalStudents} icon={Users} />
        <StatCard
          title="Overall Pass Rate"
          value={stats.totalStudents > 0 ? `${Math.round(stats.overallPassRate)}%` : '-'}
          icon={TrendingUp}
        />
        <StatCard
          title="Recent Activity"
          value={stats.recentProjects.filter(p => p.status === 'completed').length}
          icon={LayoutDashboard}
          description="Completed projects"
        />
      </div>

      {/* Recent Projects */}
      {stats.recentProjects.length === 0 ? (
        <EmptyState
          icon={FolderOpen}
          title="No projects yet"
          description="Create your first project to get started."
        />
      ) : (
        <div className="rounded-lg border">
          <div className="border-b px-4 py-3">
            <h3 className="text-sm font-semibold">Recent Projects</h3>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Name</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Students</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Pass Rate</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Last Run</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentProjects.map(project => (
                <tr
                  key={project.id}
                  className="border-b last:border-0 hover:bg-muted/30 cursor-pointer"
                  onClick={() => navigate(`/projects/${project.id}`)}
                >
                  <td className="px-4 py-3 text-sm font-medium">{project.name}</td>
                  <td className="px-4 py-3 text-sm">
                    <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${
                      project.status === 'completed'
                        ? 'bg-success/10 text-success border-success/20'
                        : 'bg-muted text-muted-foreground border-border'
                    }`}>
                      {project.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{project.studentCount}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {project.studentCount > 0 ? `${Math.round(project.passRate)}%` : '-'}
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {project.lastRun ? new Date(project.lastRun).toLocaleDateString() : 'Never'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/Dashboard.tsx
git commit -m "feat: implement Dashboard with stats and recent projects"
```

---

## Task 18: Help Page [R2]

**Files:**
- Modify: `src/pages/Help.tsx`

- [ ] **Step 1: Implement the Help page**

```tsx
import { PageHeader } from '@/components/shared/PageHeader';

export default function Help() {
  return (
    <div className="space-y-6">
      <PageHeader title="Help" description="How to use the Integrated Assignment Environment" />

      <div className="prose prose-invert max-w-none space-y-8">
        <section className="rounded-lg border bg-card p-6 space-y-3">
          <h2 className="text-lg font-semibold">Getting Started</h2>
          <p className="text-sm text-muted-foreground">
            The IAE helps you batch-evaluate student programming assignments. The workflow is:
          </p>
          <ol className="list-decimal list-inside text-sm text-muted-foreground space-y-1">
            <li>Create a <strong>Configuration</strong> for the programming language</li>
            <li>Create a <strong>Project</strong> using that configuration</li>
            <li>Import student <strong>ZIP submissions</strong> into the project</li>
            <li>Click <strong>Run</strong> to evaluate all students</li>
            <li>Review the <strong>Results</strong></li>
          </ol>
        </section>

        <section className="rounded-lg border bg-card p-6 space-y-3">
          <h2 className="text-lg font-semibold">Configurations</h2>
          <p className="text-sm text-muted-foreground">
            A configuration defines how a programming language is compiled and run. Navigate to
            <strong> Configurations</strong> in the sidebar to manage them.
          </p>
          <h3 className="text-sm font-semibold mt-3">Fields</h3>
          <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
            <li><strong>Name</strong> - Descriptive name (e.g., "C Programming Language")</li>
            <li><strong>Language</strong> - Language identifier (e.g., "C", "Python")</li>
            <li><strong>Compile Command</strong> - Path to compiler (e.g., "gcc"). Leave empty for interpreted languages.</li>
            <li><strong>Compile Args</strong> - Compiler arguments. Use <code>{"{{sourceFile}}"}</code> and <code>{"{{outputName}}"}</code> as placeholders.</li>
            <li><strong>Run Command</strong> - How to run the program (e.g., <code>{"./{{outputName}}"}</code> or <code>python</code>)</li>
            <li><strong>Run Args</strong> - Arguments for running. Use <code>{"{{sourceFile}}"}</code> and <code>{"{{args}}"}</code> as placeholders.</li>
            <li><strong>Source File</strong> - Expected filename (e.g., "main.c")</li>
          </ul>
          <h3 className="text-sm font-semibold mt-3">Import / Export</h3>
          <p className="text-sm text-muted-foreground">
            Configurations can be exported as JSON files and imported on another machine.
            Use the Import and Export buttons on the Configurations page.
          </p>
        </section>

        <section className="rounded-lg border bg-card p-6 space-y-3">
          <h2 className="text-lg font-semibold">Projects</h2>
          <p className="text-sm text-muted-foreground">
            A project represents one assignment. It links a configuration with expected output
            and student submissions.
          </p>
          <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
            <li>Create a project from the <strong>Projects</strong> page</li>
            <li>Select a configuration and provide the expected output</li>
            <li>Projects are saved automatically and can be reopened at any time</li>
          </ul>
        </section>

        <section className="rounded-lg border bg-card p-6 space-y-3">
          <h2 className="text-lg font-semibold">Evaluating Assignments</h2>
          <p className="text-sm text-muted-foreground">
            Once a project is created:
          </p>
          <ol className="list-decimal list-inside text-sm text-muted-foreground space-y-1">
            <li>Click <strong>Import ZIPs</strong> and select the directory containing student ZIP files</li>
            <li>Each ZIP should be named with the student ID (e.g., <code>student001.zip</code>)</li>
            <li>Click <strong>Run All</strong> to compile, run, and compare each student's code</li>
            <li>Results appear in the table. Click any student to see detailed logs.</li>
          </ol>
        </section>

        <section className="rounded-lg border bg-card p-6 space-y-3">
          <h2 className="text-lg font-semibold">Results</h2>
          <p className="text-sm text-muted-foreground">Possible statuses for each student:</p>
          <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
            <li><strong>Pass</strong> - Program compiled, ran, and output matches expected</li>
            <li><strong>Fail</strong> - Program ran but output does not match</li>
            <li><strong>Compile Error</strong> - Compilation failed</li>
            <li><strong>Runtime Error</strong> - Program crashed during execution</li>
            <li><strong>Timeout</strong> - Program exceeded the time limit (10 seconds)</li>
            <li><strong>Missing Source</strong> - Expected source file not found in ZIP</li>
            <li><strong>ZIP Error</strong> - Failed to extract the ZIP file</li>
          </ul>
        </section>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/Help.tsx
git commit -m "feat: implement Help page with user manual [R2]"
```

---

## Task 19: Windows Installer Build [R1]

**Files:**
- Create: `build/icon.ico` (placeholder)

- [ ] **Step 1: Create a placeholder icon**

Create a simple `.ico` file or download one. Place it at `build/icon.ico`. A 256x256 PNG converted to ICO works.

```bash
mkdir -p build
# Use any icon generator or placeholder
# For now, ensure the file exists so the build doesn't fail
```

- [ ] **Step 2: Test the production build**

```bash
npm run build
```

Expected: No errors. `dist/` and `dist-electron/` directories are created.

- [ ] **Step 3: Build the Windows installer (on Windows or CI)**

```bash
npm run dist
```

Expected: `release/` directory contains the NSIS installer `.exe`. The installer creates a desktop shortcut when run.

- [ ] **Step 4: Commit**

```bash
git add build/ electron-builder.yml
git commit -m "feat: add Windows installer config with desktop shortcut [R1]"
```

---

## Task 20: Final Verification

- [ ] **Step 1: Run the full app in dev mode and verify all requirements**

```bash
npm run dev
```

Walk through the complete scenario from the project description:

1. **[R4]** Create a "C Programming Language" configuration (gcc, `{{sourceFile}} -o {{outputName}}`, `./{{outputName}} {{args}}`, main.c)
2. **[R5]** Export it, delete it, import it back
3. **[R3]** Create a project "HW1 - String Sorting" using that config, with expected output and args
4. **[R6]** Import a directory of student ZIP files
5. **[R7]** Click Run - observe compilation
6. **[R8]** Observe output comparison
7. **[R9]** Check results table, click into student detail view, verify side-by-side output
8. **[R10]** Close the app, reopen, verify the project and results are still there
9. **[R2]** Navigate to Help page, read the manual
10. **[R1]** (On Windows) Run `npm run dist` and install via the generated .exe

- [ ] **Step 2: Commit any final fixes**

```bash
git add -A
git commit -m "chore: final verification and fixes"
```

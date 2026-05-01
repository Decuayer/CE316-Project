# Integrated Assignment Environment (IAE) - Design Specification

## Overview

A desktop application for lecturers to manage and batch-evaluate programming assignments. The lecturer creates language configurations, sets up projects with expected inputs/outputs, imports student ZIP submissions, and runs an automated compile -> run -> compare pipeline that reports results per student.

**Course**: CE 316
**Target Platform**: Windows (with installer)

> **Companion spec:** the per-student evaluation pipeline (input passing, execution, comparison) is detailed in [`2026-04-29-evaluation-flow-design.md`](./2026-04-29-evaluation-flow-design.md). The data-model and execution-service sections below have been updated to align with that addendum.

---

## Requirements Reference

These are the 10 requirements from the project description. Every section below tags which requirements it satisfies using `[Rn]` markers.

| Req | Type | Description |
|-----|------|-------------|
| R1  | System | Software must be deployed to Windows with an installer and desktop shortcut |
| R2  | System | Software must have a manual displayed with a "Help" menu item |
| R3  | User | User must be able to create a project using an existing or new configuration |
| R4  | User | User must be able to create, edit, and remove a configuration |
| R5  | User | User must be able to import and export configurations |
| R6  | User | Software must be able to process ZIP files for each student |
| R7  | User | Software must be able to compile or interpret source code using the project's configuration |
| R8  | User | Software must be able to compare student program output with expected output |
| R9  | User | Software must be able to display results of each student file |
| R10 | User | User must be able to open and save projects to operate on them at any time |

---

## Tech Stack

- **Runtime**: Electron
- **Language**: TypeScript (shared across main & renderer)
- **Frontend**: React 18 + Vite + Tailwind CSS + shadcn/ui
- **Backend**: Structured service layer in Electron's main process (no framework)
- **IPC**: Typed IPC channels via Electron's contextBridge/preload
- **ZIP Handling**: `adm-zip` (Node.js library, no system dependency) **[R6]**
- **Installer**: electron-builder targeting Windows (NSIS installer, desktop shortcut) **[R1]**

---

## Architecture

### Approach: Structured Service Layer

No backend framework (NestJS would be overkill for a desktop app). Instead, business logic lives in focused service classes in the main process, communicating with the React renderer via typed IPC channels. The preload bridge stays thin - just exposing typed method signatures.

### Project Structure

```
ce316-iae/
├── electron/                  # Main process (backend)
│   ├── main.ts               # Electron entry point, window management
│   ├── preload.ts            # Secure IPC bridge
│   ├── ipc/                  # IPC channel handlers (thin routing layer)
│   │   ├── config.ipc.ts     # [R3][R4][R5] Config operations
│   │   ├── project.ipc.ts    # [R3][R10] Project operations
│   │   └── execution.ipc.ts  # [R6][R7][R8] Pipeline operations
│   └── services/             # Business logic
│       ├── ConfigService.ts  # [R4][R5] Config CRUD + import/export
│       ├── ProjectService.ts # [R3][R10] Project lifecycle
│       ├── ExecutionService.ts # [R7][R8] Compile/run/compare pipeline
│       ├── ZipService.ts     # [R6] ZIP extraction
│       └── FileService.ts    # Shared file utilities
├── src/                       # Renderer process (frontend)
│   ├── App.tsx
│   ├── pages/
│   │   ├── Dashboard.tsx     # Overview statistics
│   │   ├── Projects.tsx      # [R3][R10] Project list
│   │   ├── ProjectDetail.tsx # [R3][R6][R10] Project management
│   │   ├── Configurations.tsx # [R4][R5] Config management UI
│   │   ├── Results.tsx       # [R9] Summary table of results
│   │   ├── StudentDetail.tsx # [R9] Detailed student execution logs
│   │   └── Help.tsx          # [R2] Built-in help manual
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx
│   │   │   └── AppShell.tsx
│   │   ├── ui/               # shadcn/ui components
│   │   └── shared/           # App-specific reusable components
│   └── lib/
│       ├── ipc.ts            # Typed IPC client
│       └── types.ts          # Shared types
├── shared/                    # Types shared between main & renderer
│   └── types.ts
├── package.json
├── electron-builder.yml       # [R1] Windows installer config
├── vite.config.ts
└── tsconfig.json
```

---

## Data Models

### Configuration **[R4][R5]**

Stored as standalone `.json` files in `~/.iae/configurations/`. This makes import/export trivial (just copy files) and directly satisfies **R5**. Creating, editing, and removing these files satisfies **R4**.

```typescript
interface Configuration {
  id: string;                    // UUID
  name: string;                  // e.g., "C Programming Language"
  language: string;              // e.g., "C", "Python", "Java"

  // Compile step (optional - empty for interpreted languages) [R7]
  compileCommand?: string;       // e.g., "gcc"
  compileArgs?: string;          // e.g., "{{sourceFile}} -o {{outputName}}"

  // Run step (required) [R7]
  runCommand: string;            // e.g., "./{{outputName}}" or "python"
  runArgs?: string;              // e.g., "{{sourceFile}} {{args}}"

  sourceFileExpected: string;    // e.g., "main.c", "main.py"

  createdAt: string;
  updatedAt: string;
}
```

**Template variables** replaced at execution time:
- `{{sourceFile}}` - the student's source file name
- `{{outputName}}` - the compiled output name (derived from source file without extension)
- `{{args}}` - the program arguments defined in the project

**Language model**: Fixed two-phase (optional compile + required run). Covers compiled languages (C, C++, Java) and interpreted (Python) without over-engineering.

### Project **[R3][R10]**

Stored as a folder: `~/.iae/projects/{project-id}/`. Folder-based storage means projects can be opened and saved at any time (**R10**). Creating a project with a configuration satisfies **R3**.

```
project-folder/
├── project.json          # Project manifest [R10]
├── submissions/          # Extracted student ZIPs [R6]
│   ├── student001/
│   │   └── main.c
│   └── student002/
│       └── main.c
└── results/
    └── results.json      # Execution results [R9]
```

```typescript
interface Project {
  id: string;
  name: string;                  // e.g., "HW1 - String Sorting"
  configurationId: string;       // Reference to configuration [R3]
  configuration: Configuration;  // Snapshot of config at project creation [R3]

  expectedOutput: string;        // The correct output to compare against [R8]
  programArgs: string;           // Arguments to pass to student programs [R7]

  submissionsDir: string;        // Path to ZIP files directory [R6]

  createdAt: string;
  updatedAt: string;
}
```

**Key decision**: Configuration is snapshotted into the project at creation time. Changing a config later does not affect existing projects.

### Student Results **[R9]**

```typescript
interface StudentResult {
  studentId: string;             // Extracted from ZIP filename/folder [R6]

  zipExtracted: boolean;         // [R6]
  sourceFound: boolean;

  compiled: boolean;             // [R7]
  compileOutput: string;         // stdout + stderr from compilation [R7]
  compileError?: string;

  executed: boolean;             // [R7]
  executionOutput: string;       // stdout from running the program [R7]
  executionError?: string;
  executionTimedOut: boolean;

  outputMatched: boolean;        // Exact match with expected output [R8]
  expectedOutput: string;        // [R8]
  actualOutput: string;          // [R8]

  status: 'pass' | 'fail' | 'compile_error' | 'runtime_error' | 'timeout' | 'missing_source' | 'zip_error';
  timestamp: string;
}

interface ProjectResults {
  projectId: string;
  runAt: string;
  students: StudentResult[];     // [R9] All student results in one structure
}
```

Each student gets a detailed result object tracking every pipeline step, enabling the detail view to show exactly what happened (**R9**).

---

## Service Layer (Main Process)

### ConfigService **[R4][R5]**
CRUD + import/export for configurations.

- `getAll()` - List all configs from `~/.iae/configurations/` **[R4]**
- `getById(id)` - Read a single config file **[R4]**
- `create(config)` / `update(id, config)` / `delete(id)` **[R4]**
- `import(filePath)` - Copy a `.json` config file into the app's config directory **[R5]**
- `export(id, targetPath)` - Copy a config file to user-chosen location **[R5]**

### ProjectService **[R3][R10]**
Project lifecycle management.

- `getAll()` / `getById(id)` - List and load projects **[R10]**
- `create(project)` - Create project folder structure, snapshot the config **[R3]**
- `delete(id)` - Remove project folder
- `save(project)` / `open(id)` - Persist and restore project state **[R10]**
- `getResults(id)` - Load saved results **[R9][R10]**
- `getStatistics()` - Aggregate stats across all projects for the dashboard

### ZipService **[R6]**
Handles student submissions using `adm-zip` (no system `unzip` dependency).

- `processDirectory(dirPath)` - Scan a directory for all `.zip` files **[R6]**
- `extractZip(zipPath, targetDir)` - Extract a single ZIP **[R6]**
- `extractAll(dirPath, projectSubmissionsDir)` - Extract all ZIPs, creating `studentId/` folders from filenames **[R6]**

### ExecutionService **[R7][R8]**
The core engine: compile -> run -> compare pipeline.

- `runAll(project)` - Process all students sequentially, returns `ProjectResults` **[R7][R8]**
- `runStudent(studentDir, config, args, expectedOutput)` - Single student pipeline:
  1. Check source file exists
  2. Compile (if configured) via `child_process.execFile` with timeout **[R7]**
  3. Run executable with arguments via `child_process.execFile` with timeout **[R7]**
  4. Compare output (exact match) **[R8]**
  5. Return `StudentResult` **[R9]**
- **Robustness**: Each step is isolated. If compilation fails, the error is recorded and execution moves to the next student.
- **Timeout**: Configurable per-execution (default 10 seconds) to prevent infinite loops.

### FileService
Low-level file operations (supports all services above).

- `ensureDir(path)` - Create directory if not exists
- `readJson(path)` / `writeJson(path, data)`
- `copyFile(src, dest)`
- `listFiles(dir, pattern)`

---

## UI Design

### Navigation
Collapsible sidebar navigation with icons and labels. Sidebar items:

- **Dashboard** - System-wide overview
- **Projects** - List and manage projects **[R3][R10]**
- **Configurations** - Manage language configurations **[R4][R5]**
- **Help** - Built-in manual **[R2]**

### Pages

**Dashboard**
- Summary stat cards at the top (total projects, total students evaluated, overall pass rate, recent activity)
- Historical success/failure rate chart
- Recent projects list with quick status

**Projects List [R3][R10]**
- Sortable table: Project Name, Configuration, Status, Students Count, Pass Rate, Created Date
- "Create Project" button **[R3]**
- Filter and search
- Click to open any previously created project **[R10]**

**Project Detail [R3][R6][R10]**
- Project info and configuration summary **[R3]**
- "Select ZIP Directory" button to import student submissions **[R6]**
- "Run" button to execute the pipeline **[R7]**
- Progress indicator during execution
- Results summary table (see below) **[R9]**
- Project state is persisted and can be reopened **[R10]**

**Results (Summary Table) [R9]**
- Table with columns: Student ID, Compile Status, Run Status, Output Match, Overall Status
- Color-coded status indicators (green/red/yellow)
- Click a row to navigate to Student Detail

**Student Detail [R9]**
- Full execution log: ZIP extraction, compilation output, execution output
- Side-by-side view: actual output vs expected output **[R8]**
- Status badge and timestamp

**Configurations [R4][R5]**
- List of all configurations with name, language, created date
- Create / Edit / Delete actions **[R4]**
- Import / Export buttons **[R5]**

**Help [R2]**
- Built-in HTML page rendered inside the app
- Accessible from sidebar and from a top-level Help menu
- Documents how to use the application (create configs, create projects, run evaluations, view results)

### Layout Pattern
Matches the reference design the user provided:
- Collapsible sidebar on the left with icons + labels
- Top bar with search and actions
- Main content area with stat cards at top and data table below
- Clean, modern aesthetic using shadcn/ui components and Tailwind

---

## Output Comparison **[R8]**

**Strategy**: Exact character-for-character match between student program stdout and the expected output defined in the project.

No normalization of whitespace or line endings. The lecturer's expected output is the source of truth.

---

## Error Handling & Robustness

- **ZIP extraction failure**: Record `zip_error` status, continue to next student **[R6]**
- **Missing source file**: Record `missing_source` status, continue to next student **[R7]**
- **Compilation failure**: Capture stderr, record `compile_error` status, continue to next student **[R7]**
- **Runtime error**: Capture stderr, record `runtime_error` status, continue to next student **[R7]**
- **Timeout**: Kill the process after the timeout, record `timeout` status, continue to next student
- **Missing compiler/interpreter**: Show a clear error when the configured command is not found on the system **[R7]**

The pipeline never stops due to a single student's failure.

---

## Installer & Distribution **[R1]**

- **electron-builder** configured to produce an NSIS Windows installer **[R1]**
- Installer creates a desktop shortcut **[R1]**
- All dependencies bundled (React, Node.js modules, etc.) **[R1]**
- No external server dependencies
- Compilers/interpreters are assumed to exist on the lecturer's machine

---

## Requirements Traceability Matrix

Summary of where each requirement is addressed across the system:

| Req | Description | Services | UI Pages | Data Models |
|-----|-------------|----------|----------|-------------|
| R1  | Windows installer + desktop shortcut | - | - | electron-builder.yml |
| R2  | Help manual via Help menu | - | Help.tsx | - |
| R3  | Create project with config | ProjectService.create() | Projects.tsx, ProjectDetail.tsx | Project.configuration (snapshot) |
| R4  | Create/edit/remove configs | ConfigService CRUD | Configurations.tsx | Configuration interface |
| R5  | Import/export configs | ConfigService.import/export() | Configurations.tsx (buttons) | Standalone .json files |
| R6  | Process ZIP files per student | ZipService.extractAll() | ProjectDetail.tsx (dir picker) | submissions/ folder |
| R7  | Compile/interpret using config | ExecutionService.runStudent() | ProjectDetail.tsx (run button) | Configuration compile/run fields |
| R8  | Compare output to expected | ExecutionService (exact match) | StudentDetail.tsx (side-by-side) | StudentResult.outputMatched |
| R9  | Display results per student | ProjectService.getResults() | Results.tsx, StudentDetail.tsx | ProjectResults, StudentResult |
| R10 | Open/save projects | ProjectService.open/save() | Projects.tsx (list + open) | project.json manifest |

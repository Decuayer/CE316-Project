// ============================================================
// Shared Types - Used by both Main and Renderer processes
// ============================================================

// --- Configuration [R4][R5] ---

export interface Configuration {
  id: string;
  name: string;                    // e.g., "C Programming Language"
  language: string;                // e.g., "C", "Python", "Java"

  // Compile step (optional - empty for interpreted languages) [R7]
  compileCommand?: string;         // e.g., "gcc"
  compileArgs?: string;            // e.g., "{{sourceFile}} -o {{outputName}}"

  // Run step (required) [R7]
  runCommand: string;              // e.g., "./{{outputName}}" or "python"
  runArgs?: string;                // e.g., "{{sourceFile}} {{args}}"

  sourceFileExpected: string;      // e.g., "main.c", "main.py"

  createdAt: string;
  updatedAt: string;
}

// --- DataSource [R7][R8] ---
// Discriminated union: project input and expected output may be typed text
// OR sourced from a file on disk.
// See docs/superpowers/specs/2026-04-29-evaluation-flow-design.md
// ("Data model refinements") for the rationale.
export type DataSource =
  | { type: 'text'; value: string }
  | { type: 'file'; path: string };

// --- Project [R3][R10] ---

export interface Project {
  id: string;
  name: string;                    // e.g., "HW1 - String Sorting"
  configurationId: string;         // Reference to configuration [R3]
  configuration: Configuration;    // Snapshot of config at project creation [R3]

  // Per evaluation-flow-design.md: argv source and expected output are both
  // DataSource, supporting typed-text and file-path modes symmetrically.
  input: DataSource;               // [R7] argv source - replaces programArgs
  expectedOutput: DataSource;      // [R8] expected output - replaces string

  submissionsDir: string;          // Path to extracted submissions [R6]

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
  studentId: string;               // Extracted from ZIP filename/folder [R6]

  zipExtracted: boolean;           // [R6]
  sourceFound: boolean;

  compiled: boolean;               // [R7]
  compileOutput: string;           // stdout + stderr from compilation [R7]
  compileError?: string;

  executed: boolean;               // [R7]
  executionOutput: string;         // stdout from running the program [R7]
  executionError?: string;
  executionTimedOut: boolean;

  outputMatched: boolean;          // Exact match with expected output [R8]
  expectedOutput: string;          // [R8]
  actualOutput: string;            // [R8]

  status: StudentStatus;
  timestamp: string;
}

export interface ProjectResults {
  projectId: string;
  runAt: string;
  students: StudentResult[];       // [R9]
}

// --- IPC Channel Types ---

export interface IpcChannels {
  // Config operations [R4][R5]
  'config:getAll': () => Promise<Configuration[]>;
  'config:getById': (id: string) => Promise<Configuration | null>;
  'config:create': (config: Omit<Configuration, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Configuration>;
  'config:update': (id: string, config: Partial<Configuration>) => Promise<Configuration>;
  'config:delete': (id: string) => Promise<void>;
  'config:import': (filePath: string) => Promise<Configuration>;
  'config:export': (id: string, targetPath: string) => Promise<void>;

  // Project operations [R3][R10]
  'project:getAll': () => Promise<Project[]>;
  'project:getById': (id: string) => Promise<Project | null>;
  'project:create': (data: { name: string; configurationId: string; input: DataSource; expectedOutput: DataSource }) => Promise<Project>;
  'project:update': (id: string, data: Partial<Project>) => Promise<Project>;
  'project:delete': (id: string) => Promise<void>;
  'project:getResults': (id: string) => Promise<ProjectResults | null>;
  'project:getStatistics': () => Promise<DashboardStats>;

  // Execution operations [R6][R7][R8]
  'execution:importZips': (projectId: string, dirPath: string) => Promise<string[]>;
  'execution:run': (projectId: string) => Promise<ProjectResults>;
  // execution:cleanup - "Clean up artifacts" button on Project Detail
  // (see evaluation-flow-design.md "Clean up artifacts button")
  'execution:cleanup': (projectId: string) => Promise<void>;
  'execution:getStudents': (projectId: string) => Promise<string[]>;

  // Dialog operations
  'dialog:openDirectory': () => Promise<string | null>;
  'dialog:openFile': (filters?: { name: string; extensions: string[] }[]) => Promise<string | null>;
  'dialog:saveFile': (defaultName: string, filters?: { name: string; extensions: string[] }[]) => Promise<string | null>;
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

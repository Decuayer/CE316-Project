// TODO: DEMİR CÜCÜ [FileService + Infra Modülü]
// Tüm tipleri gözden geçir ve frontend bileşenlerinle uyumlu olduğundan emin ol.
// Özellikle:
// 1. StudentStatus tipindeki tüm değerlerin StatusBadge bileşeninde karşılığı olmalı
// 2. DashboardStats tipinin Dashboard sayfasının ihtiyaçlarını karşıladığını doğrula
// 3. Project tipindeki 'configuration' alanının getAll'da doldurulup doldurulmadığını kontrol et
//    (şu an sadece getById'de dolduruluyor - Ege Çağan ile koordine et)
//
// TODO: GÖRKE GÖYNÜGÜR [Results Modülü]
// 4. StudentResult'a eklenen `note` ve `score` alanlarını DatabaseService'e yansıt:
//    - results tablosuna `note TEXT` ve `score REAL` sütunları ekle (nullable)
//    - Mevcut kayıtlar için varsayılan değer: NULL
// 5. `result:update` IPC kanalını aktive et (aşağıdaki IpcChannels içinde TODO olarak işaretlendi):
//    - ProjectService.updateStudentResult(projectId, studentId, patch) metodunu yaz
//    - project.ipc.ts içinde handler'ı kaydet

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

  // --- Instructor annotations (Results Modülü) ---
  // TODO: GÖRKE GÖYNÜGÜR [Results Modülü]
  // Bu alanlar results tablosuna eklendikten sonra aktive edilecek.
  // DatabaseService'de `note TEXT` ve `score REAL` sütunları oluşturulmalı.
  // ProjectService.updateStudentResult() metodunu yazmadan önce bu TODO'yu kaldırma.
  note?: string;                   // Instructor note (free text)
  score?: number;                  // Instructor score (0–100 range suggested)
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

  // TODO: GÖRKE GÖYNÜGÜR [Results Modülü]
  // Bu kanal henüz implement edilmedi. Aşağıdaki adımları tamamladıktan sonra aktive et:
  // 1. StudentResult tipine `note` ve `score` alanlarını DB'ye yansıt (yukarıdaki TODO)
  // 2. ProjectService'e updateStudentResult(projectId: string, studentId: string, patch: { note?: string; score?: number }) metodu ekle
  // 3. electron/ipc/project.ipc.ts içinde 'result:update' handler'ını kaydet
  // 4. electron/preload.ts içinde 'result:update' kanalını expose et
  // 5. src/lib/ipc.ts içinde result.update() helper'ını ekle
  // 6. ResultsStudentDetail.tsx içindeki TODO'yu kaldırarak save fonksiyonunu aktive et
  // 'result:update': (projectId: string, studentId: string, patch: { note?: string; score?: number }) => Promise<StudentResult>;
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
  statusBreakdown: {
    pass: number;
    fail: number;
    compile_error: number;
    runtime_error: number;
    timeout: number;
    missing_source: number;
    zip_error: number;
  };
}

// --- Database ---

export const DATABASE_SCHEMA = `
  CREATE TABLE IF NOT EXISTS configurations (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    language TEXT NOT NULL,
    compileCommand TEXT,
    compileArgs TEXT,
    runCommand TEXT NOT NULL,
    runArgs TEXT,
    sourceFileExpected TEXT NOT NULL,
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    configurationId TEXT NOT NULL,
    input TEXT NOT NULL,  -- JSON
    expectedOutput TEXT NOT NULL,  -- JSON
    submissionsDir TEXT NOT NULL,
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL,
    FOREIGN KEY (configurationId) REFERENCES configurations(id) ON DELETE RESTRICT
  );

  CREATE TABLE IF NOT EXISTS results (
    projectId TEXT NOT NULL,
    runAt TEXT NOT NULL,
    studentId TEXT NOT NULL,
    zipExtracted BOOLEAN NOT NULL,
    sourceFound BOOLEAN NOT NULL,
    compiled BOOLEAN NOT NULL,
    compileOutput TEXT,
    compileError TEXT,
    executed BOOLEAN NOT NULL,
    executionOutput TEXT,
    executionError TEXT,
    executionTimedOut BOOLEAN NOT NULL,
    outputMatched BOOLEAN NOT NULL,
    expectedOutput TEXT,
    actualOutput TEXT,
    status TEXT NOT NULL,
    timestamp TEXT NOT NULL,
    PRIMARY KEY (projectId, studentId, runAt),
    FOREIGN KEY (projectId) REFERENCES projects(id) ON DELETE CASCADE
  );
`

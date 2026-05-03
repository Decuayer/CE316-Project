export type LangKey = 'c' | 'cpp' | 'python' | 'java' | 'haskell';

export type ResultStatus =
  | 'PASS'
  | 'FAIL'
  | 'COMPILE_ERROR'
  | 'RUNTIME_ERROR'
  | 'TIMEOUT';

export type ProjectStatus = 'evaluated' | 'pending';

export interface MockConfig {
  id: string;
  name: string;
  language: LangKey;
  compileCommand: string | null;
  runCommand: string;
  sourceFileExpected: string;
}

export interface MockProject {
  id: string;
  name: string;
  configId: string;
  configName: string;
  language: LangKey;
  submissionsCount: number;
  createdAt: string;
  status: ProjectStatus;
}

export interface MockResult {
  id: string;
  projectId: string;
  studentId: string;
  status: ResultStatus;
  outputMatched: 0 | 1;
}

export const CONFIGS: MockConfig[] = [
  {
    id: 'c1',
    name: 'C Programming Default',
    language: 'c',
    compileCommand: 'gcc -o main main.c',
    runCommand: './main',
    sourceFileExpected: 'main.c',
  },
  {
    id: 'c2',
    name: 'Python 3 Standard',
    language: 'python',
    compileCommand: null,
    runCommand: 'python main.py',
    sourceFileExpected: 'main.py',
  },
  {
    id: 'c3',
    name: 'Java Default',
    language: 'java',
    compileCommand: 'javac Main.java',
    runCommand: 'java Main',
    sourceFileExpected: 'Main.java',
  },
  {
    id: 'c4',
    name: 'C++ Standard',
    language: 'cpp',
    compileCommand: 'g++ -o main main.cpp',
    runCommand: './main',
    sourceFileExpected: 'main.cpp',
  },
  {
    id: 'c5',
    name: 'Haskell GHC',
    language: 'haskell',
    compileCommand: 'ghc -o main Main.hs',
    runCommand: './main',
    sourceFileExpected: 'Main.hs',
  },
];

export const PROJECTS: MockProject[] = [
  {
    id: 'p1',
    name: 'HW1 — String Sorting',
    configId: 'c1',
    configName: 'C Programming Default',
    language: 'c',
    submissionsCount: 32,
    createdAt: '2026-04-20',
    status: 'evaluated',
  },
  {
    id: 'p2',
    name: 'HW2 — Matrix Multiply',
    configId: 'c4',
    configName: 'C++ Standard',
    language: 'cpp',
    submissionsCount: 28,
    createdAt: '2026-04-22',
    status: 'evaluated',
  },
  {
    id: 'p3',
    name: 'Lab 3 — Fibonacci',
    configId: 'c2',
    configName: 'Python 3 Standard',
    language: 'python',
    submissionsCount: 45,
    createdAt: '2026-04-25',
    status: 'evaluated',
  },
  {
    id: 'p4',
    name: 'HW3 — Linked List',
    configId: 'c1',
    configName: 'C Programming Default',
    language: 'c',
    submissionsCount: 30,
    createdAt: '2026-04-28',
    status: 'pending',
  },
  {
    id: 'p5',
    name: 'Lab 4 — Binary Tree',
    configId: 'c3',
    configName: 'Java Default',
    language: 'java',
    submissionsCount: 38,
    createdAt: '2026-04-30',
    status: 'evaluated',
  },
];

export const RESULTS: MockResult[] = [
  { id: 'r1', projectId: 'p1', studentId: '20200001', status: 'PASS', outputMatched: 1 },
  { id: 'r2', projectId: 'p1', studentId: '20200002', status: 'FAIL', outputMatched: 0 },
  { id: 'r3', projectId: 'p1', studentId: '20200003', status: 'COMPILE_ERROR', outputMatched: 0 },
  { id: 'r4', projectId: 'p1', studentId: '20200004', status: 'PASS', outputMatched: 1 },
  { id: 'r5', projectId: 'p1', studentId: '20200005', status: 'RUNTIME_ERROR', outputMatched: 0 },
  { id: 'r6', projectId: 'p1', studentId: '20200006', status: 'PASS', outputMatched: 1 },
  { id: 'r7', projectId: 'p1', studentId: '20200007', status: 'TIMEOUT', outputMatched: 0 },
  { id: 'r8', projectId: 'p1', studentId: '20200008', status: 'PASS', outputMatched: 1 },
  { id: 'r9', projectId: 'p2', studentId: '20200001', status: 'PASS', outputMatched: 1 },
  { id: 'r10', projectId: 'p2', studentId: '20200002', status: 'PASS', outputMatched: 1 },
  { id: 'r11', projectId: 'p2', studentId: '20200003', status: 'FAIL', outputMatched: 0 },
  { id: 'r12', projectId: 'p2', studentId: '20200004', status: 'COMPILE_ERROR', outputMatched: 0 },
  { id: 'r13', projectId: 'p3', studentId: '20200001', status: 'PASS', outputMatched: 1 },
  { id: 'r14', projectId: 'p3', studentId: '20200002', status: 'PASS', outputMatched: 1 },
  { id: 'r15', projectId: 'p3', studentId: '20200003', status: 'PASS', outputMatched: 1 },
  { id: 'r16', projectId: 'p3', studentId: '20200004', status: 'FAIL', outputMatched: 0 },
  { id: 'r17', projectId: 'p3', studentId: '20200005', status: 'RUNTIME_ERROR', outputMatched: 0 },
  { id: 'r18', projectId: 'p5', studentId: '20200001', status: 'PASS', outputMatched: 1 },
  { id: 'r19', projectId: 'p5', studentId: '20200002', status: 'FAIL', outputMatched: 0 },
  { id: 'r20', projectId: 'p5', studentId: '20200003', status: 'PASS', outputMatched: 1 },
];

export const langColors: Record<LangKey, string> = {
  c: '#555555',
  cpp: '#f34b7d',
  python: '#3572A5',
  java: '#b07219',
  haskell: '#5e5086',
};

export interface StatusVisual {
  color: string;
  bg: string;
  label: string;
}

export const statusConfig: Record<ResultStatus, StatusVisual> = {
  PASS: { color: 'var(--green)', bg: 'var(--green-dim)', label: 'Pass' },
  FAIL: { color: 'var(--red)', bg: 'var(--red-dim)', label: 'Fail' },
  COMPILE_ERROR: { color: 'var(--orange)', bg: 'var(--orange-dim)', label: 'Compile Error' },
  RUNTIME_ERROR: { color: 'var(--red)', bg: 'var(--red-dim)', label: 'Runtime Error' },
  TIMEOUT: { color: 'var(--purple)', bg: 'var(--purple-dim)', label: 'Timeout' },
};

import { execFile } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import type {
  Project,
  ProjectResults,
  StudentResult,
  DataSource,
} from '../../shared/types';
import { FileService } from './FileService';

const execFileAsync = promisify(execFile);

/**
 * ExecutionService - Task 7 + 2026-04-29-evaluation-flow-design.md [R7][R8]
 *
 * The per-student compile -> run -> compare pipeline.
 *
 * Locked design decisions (see evaluation-flow-design.md
 * "Locked design decisions"):
 *   - Sequential execution, one student at a time
 *   - cwd = the student's extracted folder (no copying)
 *   - stdin closed on the child process (programs reading stdin get EOF)
 *   - Spawn via child_process.execFile (NOT exec - no shell, no quoting hazards)
 *   - Per-execution timeout: 10 seconds
 *   - Comparator: strict byte-for-byte string equality (===)
 *   - Each student's pipeline is wrapped in try/catch -> one failure
 *     never blocks the next student.
 */
export class ExecutionService {
  private fileService = new FileService();

  async runAll(project: Project): Promise<ProjectResults> {
    const studentIds = await this.fileService.listDirs(project.submissionsDir);
    const runAt = new Date().toISOString();
    const students: StudentResult[] = [];

    for (const studentId of studentIds) {
      const studentDir = path.join(project.submissionsDir, studentId);
      const result = await this.runStudent(studentDir, project);
      students.push(result);
    }

    return { projectId: project.id, runAt, students };
  }

  async runStudent(studentDir: string, project: Project): Promise<StudentResult> {
    const studentId = path.basename(studentDir);
    const timestamp = new Date().toISOString();
    const { configuration } = project;
    const sourceFile = configuration.sourceFileExpected;
    const outputName = path.basename(sourceFile, path.extname(sourceFile));
    const sourcePath = path.join(studentDir, sourceFile);

    const base = {
      studentId,
      zipExtracted: true,
      sourceFound: false,
      compiled: false,
      compileOutput: '',
      compileError: undefined as string | undefined,
      executed: false,
      executionOutput: '',
      executionError: undefined as string | undefined,
      executionTimedOut: false,
      outputMatched: false,
      expectedOutput: '',
      actualOutput: '',
      timestamp,
    };

    const sourceExists = await this.fileService.exists(sourcePath);
    if (!sourceExists) {
      return { ...base, status: 'missing_source' as const };
    }
    base.sourceFound = true;

    if (configuration.compileCommand) {
      const resolvedCompileCmd = this.resolveCommand(configuration.compileCommand, sourceFile, outputName);
      const compileArgv = this.buildArgv(configuration.compileArgs, sourceFile, outputName, []);
      try {
        const { stdout, stderr } = await execFileAsync(
          resolvedCompileCmd,
          compileArgv,
          { cwd: studentDir, timeout: 10000 },
        );
        base.compileOutput = stdout + stderr;
        base.compiled = true;
      } catch (err: any) {
        base.compileOutput = err.stdout ?? '';
        base.compileError = err.code === 'ENOENT'
          ? `compiler not found: ${resolvedCompileCmd}`
          : (err.stderr ?? err.message ?? String(err));
        return { ...base, status: 'compile_error' as const };
      }
    } else {
      base.compiled = true;
    }

    let argvFromInput: string[] = [];
    try {
      const rawInput = await this.resolveDataSource(project.input);
      argvFromInput = this.parseInputToArgv(rawInput);
    } catch (err: any) {
      base.executionError = `Failed to resolve input: ${err.message ?? String(err)}`;
      return { ...base, status: 'runtime_error' as const };
    }

    const resolvedRunCmd = this.resolveCommand(configuration.runCommand, sourceFile, outputName);
    const runArgv = this.buildArgv(configuration.runArgs, sourceFile, outputName, argvFromInput);
    let actualOutput = '';
    try {
      const { stdout } = await execFileAsync(
        resolvedRunCmd,
        runArgv,
        { cwd: studentDir, timeout: 10000 },
      );
      actualOutput = stdout;
      base.executed = true;
      base.executionOutput = actualOutput;
    } catch (err: any) {
      const timedOut = err.killed === true || err.signal === 'SIGTERM' || err.code === 'ETIMEDOUT';
      base.executionTimedOut = timedOut;
      base.executionOutput = err.stdout ?? '';
      base.executionError = timedOut ? 'killed after 10s' : (err.stderr ?? err.message ?? String(err));
      return { ...base, status: timedOut ? 'timeout' as const : 'runtime_error' as const };
    }

    let expectedOutput = '';
    try {
      expectedOutput = await this.resolveDataSource(project.expectedOutput);
    } catch (err: any) {
      base.executionError = `Failed to resolve expected output: ${err.message ?? String(err)}`;
      return { ...base, status: 'runtime_error' as const };
    }

    base.expectedOutput = expectedOutput;
    base.actualOutput = actualOutput;
    const matched = actualOutput.trim() === expectedOutput.trim();
    base.outputMatched = matched;

    return { ...base, status: matched ? 'pass' as const : 'fail' as const };
  }

  async cleanupArtifacts(project: Project): Promise<void> {
    const studentIds = await this.fileService.listDirs(project.submissionsDir);
    const sourceFile = project.configuration.sourceFileExpected;

    for (const studentId of studentIds) {
      const studentDir = path.join(project.submissionsDir, studentId);
      const files = await this.fileService.listFiles(studentDir);
      for (const file of files) {
        if (file !== sourceFile) {
          await this.fileService.deleteFile(path.join(studentDir, file));
        }
      }
    }
  }

  // -------------- internal helpers --------------

  /**
   * Resolves template tokens ({{sourceFile}}, {{outputName}}) inside a command string.
   * Allows users to write runCommand as `./{{outputName}}` instead of a hardcoded binary name.
   */
  private resolveCommand(cmd: string, sourceFile: string, outputName: string): string {
    return cmd
      .replace(/\{\{sourceFile\}\}/g, sourceFile)
      .replace(/\{\{outputName\}\}/g, outputName)
      .trim();
  }

  private buildArgv(
    template: string | undefined,
    sourceFile: string,
    outputName: string,
    argvFromInput: string[],
  ): string[] {
    if (!template || !template.trim()) return [];

    const tokens = template.trim().split(/\s+/);
    const result: string[] = [];

    for (const token of tokens) {
      if (token === '{{args}}') {
        result.push(...argvFromInput);
      } else {
        result.push(
          token
            .replace(/\{\{sourceFile\}\}/g, sourceFile)
            .replace(/\{\{outputName\}\}/g, outputName),
        );
      }
    }

    return result;
  }

  private async resolveDataSource(source: DataSource): Promise<string> {
    if (source.type === 'text') return source.value;
    return fs.readFile(source.path, 'utf-8');
  }

  private parseInputToArgv(raw: string): string[] {
    const lines = raw.split('\n').map(l => l.replace(/\r$/, ''));
    if (lines.length > 0 && lines[lines.length - 1] === '') {
      lines.pop();
    }
    return lines;
  }
}

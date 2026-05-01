import { execFile } from 'child_process';
import { promisify } from 'util';
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

  /**
   * runAll - process every student, sequentially.
   *
   * TODO [R7][R8]:
   *   1. Iterate every directory in project.submissionsDir (one student per dir).
   *      Use FileService.listDirs to get the studentId list.
   *   2. For each student: const result = await this.runStudent(studentDir, project)
   *      then APPEND result to results/results.json IMMEDIATELY - so a process
   *      crash mid-run does not lose previously-completed students.
   *   3. Return the aggregated ProjectResults when the loop finishes.
   *      Shape:
   *        { projectId: project.id, runAt: ISO timestamp, students: StudentResult[] }
   */
  async runAll(_project: Project): Promise<ProjectResults> {
    void this.fileService;
    void execFileAsync;
    throw new Error('Not implemented: ExecutionService.runAll');
  }

  /**
   * runStudent - the per-student pipeline.
   *
   * IMPORTANT: this method NEVER throws. Any uncaught exception degrades
   * to a recorded status on the returned StudentResult.
   *
   * Steps (see evaluation-flow-design.md "Per-student pipeline"):
   *
   *   1. Verify configuration.sourceFileExpected exists at the folder root
   *      -> not found: status = 'missing_source'; return early.
   *
   *   2. Compile (only if configuration.compileCommand is set) [R7]
   *      - Substitute {{sourceFile}} and {{outputName}} in compileArgs
   *        via this.buildArgv(...).
   *      - execFile(compileCommand, args, {
   *          cwd: studentDir,
   *          stdio: ['ignore','pipe','pipe']
   *        })
   *      - Non-zero exit OR ENOENT -> status = 'compile_error';
   *        record stderr + "compiler not found: <cmd>" if ENOENT.
   *
   *   3. Resolve input via this.resolveDataSource(project.input)
   *      then this.parseInputToArgv(raw) -> argvFromInput: string[]
   *      File missing/unreadable -> status = 'runtime_error'.
   *
   *   4. Run [R7]
   *      - this.buildArgv(configuration.runArgs, sourceFile, outputName, argvFromInput)
   *        -> finalArgv (with {{args}} spread into multiple positions).
   *      - execFile(runCommand, finalArgv, {
   *          cwd: studentDir,
   *          stdio: ['ignore','pipe','pipe'],
   *          timeout: 10000
   *        })
   *      - Killed by timeout -> status = 'timeout';
   *        record partial stdout + "killed after 10s".
   *      - Non-zero exit OR ENOENT -> status = 'runtime_error';
   *        record stderr + "executable not found: <cmd>" if ENOENT.
   *
   *   5. Resolve expected output via this.resolveDataSource(project.expectedOutput).
   *      No splitting - bytes are used verbatim.
   *      File missing/unreadable -> status = 'runtime_error'.
   *
   *   6. Compare [R8]
   *      - actualStdout === expectedString (strict)
   *      - match -> status = 'pass'; else -> status = 'fail'
   *
   *   7. Return a fully-populated StudentResult (every field set).
   *
   * Set studentId from path.basename(studentDir).
   */
  async runStudent(_studentDir: string, _project: Project): Promise<StudentResult> {
    throw new Error('Not implemented: ExecutionService.runStudent');
  }

  /**
   * cleanupArtifacts - "Clean up artifacts" button.
   *
   * TODO: walk every studentId folder under project.submissionsDir and
   * remove every file whose name is NOT configuration.sourceFileExpected.
   * Leaves source files and folder structure intact.
   *
   * Confirmation modal lives in the renderer (Project Detail page).
   */
  async cleanupArtifacts(_project: Project): Promise<void> {
    throw new Error('Not implemented: ExecutionService.cleanupArtifacts');
  }

  // -------------- internal helpers (TODO during implementation) --------------

  /**
   * buildArgv - template variable substitution per
   * evaluation-flow-design.md "Substitution algorithm".
   *
   * TODO:
   *   1. If template is undefined or empty, return [].
   *   2. Split the template on whitespace into tokens.
   *   3. For each token:
   *        - If token === '{{args}}', SPREAD argvFromInput at this position.
   *          (Each input line becomes a distinct argv element.)
   *        - Else replace any {{sourceFile}} / {{outputName}} occurrences
   *          inside the token via plain string substitution.
   *   4. Return the resulting string[] - passed straight to execFile (no shell).
   *
   * v1 limitation: tokens cannot contain whitespace (no quoting). The lecturer
   * can put spaceful paths in compileCommand/runCommand fields, which are
   * passed straight to execFile and not tokenized.
   */
  private buildArgv(
    _template: string | undefined,
    _sourceFile: string,
    _outputName: string,
    _argvFromInput: string[],
  ): string[] {
    throw new Error('Not implemented: ExecutionService.buildArgv');
  }

  /**
   * resolveDataSource - turn a DataSource into its string contents.
   *
   * TODO:
   *   - 'text': return source.value as-is.
   *   - 'file': fs.readFile(source.path, 'utf-8') and return the string.
   *   - Errors propagate to the caller (mapped to status by the pipeline).
   */
  private async resolveDataSource(_source: DataSource): Promise<string> {
    throw new Error('Not implemented: ExecutionService.resolveDataSource');
  }

  /**
   * parseInputToArgv - normalize an input string into argv entries.
   *
   * TODO (per evaluation-flow-design.md step 4):
   *   1. Split the raw string on '\n'.
   *   2. Strip a single trailing '\r' from each resulting line.
   *      (This is INPUT parsing, not output normalization. The output
   *      comparator stays strict.)
   *   3. Drop a single trailing empty line if the source ended with '\n'
   *      (so "a\nb\n" becomes ["a","b"], not ["a","b",""]).
   *   4. Internal spaces within a line are preserved verbatim - each line
   *      becomes ONE argv entry, no further tokenization.
   */
  private parseInputToArgv(_raw: string): string[] {
    throw new Error('Not implemented: ExecutionService.parseInputToArgv');
  }
}

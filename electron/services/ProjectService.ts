import type {
  Project,
  ProjectResults,
  DashboardStats,
  Configuration,
  DataSource,
} from '@shared/types';
import type { Database } from './Database';
import { FileService } from './FileService';

/**
 * ProjectService - Task 5 [R3][R10]
 *
 * Project lifecycle management against the SQLite `projects` table.
 *
 * Schema (see electron/services/schema.ts, migration 1):
 *   id                       TEXT PK
 *   name                     TEXT NOT NULL
 *   configurationId          TEXT NOT NULL
 *   configurationSnapshot    TEXT NOT NULL  -- JSON.stringify of Configuration
 *   inputType                TEXT NOT NULL  -- 'text' | 'file'
 *   inputValue               TEXT NOT NULL  -- text content OR file path
 *   expectedOutputType       TEXT NOT NULL  -- 'text' | 'file'
 *   expectedOutputValue      TEXT NOT NULL  -- text content OR file path
 *   submissionsDir           TEXT NOT NULL  -- on-disk path to extracted submissions
 *   createdAt                TEXT NOT NULL
 *   updatedAt                TEXT NOT NULL
 *
 * `submissionsDir` lives on the filesystem (extracted ZIP contents are
 * source files, NOT row data). Layout:
 *   projectsRoot/<projectId>/submissions/<studentId>/<source files>
 */
export class ProjectService {
  private fileService = new FileService();

  constructor(
    private database: Database,
    private projectsRoot: string,
  ) {}

  /**
   * TODO [R10]: SELECT * FROM projects ORDER BY updatedAt DESC.
   * For each row, JSON.parse(configurationSnapshot) into the configuration field
   * and rebuild input/expectedOutput as DataSource discriminated unions:
   *   { type: row.inputType, value/path: row.inputValue }.
   */
  async getAll(): Promise<Project[]> {
    void this.database;
    void this.fileService;
    throw new Error('Not implemented: ProjectService.getAll');
  }

  /**
   * TODO [R10]: SELECT * FROM projects WHERE id = ?
   * Return null if no row.
   * Same row -> Project mapping as getAll.
   */
  async getById(_id: string): Promise<Project | null> {
    throw new Error('Not implemented: ProjectService.getById');
  }

  /**
   * TODO [R3]:
   *   1. Load the live Configuration via this.loadConfiguration(configurationId).
   *      Throw if not found.
   *   2. Generate uuid -> projectId.
   *   3. Compute submissionsDir = path.join(projectsRoot, projectId, 'submissions').
   *   4. mkdir -p submissionsDir (FileService.ensureDir).
   *   5. INSERT INTO projects (...):
   *      - configurationSnapshot = JSON.stringify(config)
   *      - inputType / inputValue from data.input
   *      - expectedOutputType / expectedOutputValue from data.expectedOutput
   *      - createdAt = updatedAt = now
   *   6. Return the persisted Project (re-construct via getById or build inline).
   */
  async create(_data: {
    name: string;
    configurationId: string;
    input: DataSource;
    expectedOutput: DataSource;
  }): Promise<Project> {
    void this.projectsRoot;
    throw new Error('Not implemented: ProjectService.create');
  }

  /**
   * TODO [R10]: shallow-merge data onto the existing row.
   *   Allowed fields: name, input, expectedOutput, submissionsDir.
   *   Disallow: id, configurationId, configuration (snapshot is immutable).
   *   UPDATE projects SET ... , updatedAt = ? WHERE id = ?.
   */
  async update(_id: string, _data: Partial<Project>): Promise<Project> {
    throw new Error('Not implemented: ProjectService.update');
  }

  /**
   * TODO: DELETE FROM projects WHERE id = ?
   *   ON DELETE CASCADE drops the student_results rows automatically.
   *   Then rm -rf the on-disk submissions folder via FileService.deleteDir.
   */
  async delete(_id: string): Promise<void> {
    throw new Error('Not implemented: ProjectService.delete');
  }

  /**
   * TODO [R9][R10]: load the latest run for the project.
   *   1. SELECT MAX(runAt) AS latest FROM student_results WHERE projectId = ?
   *      Return null if latest IS NULL (no run yet).
   *   2. SELECT * FROM student_results
   *      WHERE projectId = ? AND runAt = ? ORDER BY studentId.
   *   3. Map rows to StudentResult (INTEGER 0/1 -> boolean; NULL -> undefined).
   *   4. Return ProjectResults: { projectId, runAt: latest, students: [...] }.
   */
  async getResults(_id: string): Promise<ProjectResults | null> {
    throw new Error('Not implemented: ProjectService.getResults');
  }

  /**
   * TODO: aggregate stats across every project for the Dashboard.
   *   - totalProjects: SELECT COUNT(*) FROM projects
   *   - totalStudents: SELECT COUNT(DISTINCT projectId || ':' || studentId)
   *                    FROM student_results r WHERE runAt = (latest per project)
   *   - overallPassRate: SUM(status='pass') / COUNT(*) over latest runs
   *   - recentProjects: top 5 by updatedAt with derived status
   *       (completed | in-progress | pending) and pass rate from latest run.
   */
  async getStatistics(): Promise<DashboardStats> {
    throw new Error('Not implemented: ProjectService.getStatistics');
  }

  /**
   * TODO: SELECT * FROM configurations WHERE id = ?.
   *   Throw a clear error if missing - used by create() to snapshot the config.
   */
  private async loadConfiguration(_configurationId: string): Promise<Configuration> {
    throw new Error('Not implemented: ProjectService.loadConfiguration');
  }
}

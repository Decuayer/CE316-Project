import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import type {
  Project,
  ProjectResults,
  DashboardStats,
  Configuration,
  DataSource,
} from '@shared/types';
import { FileService } from './FileService';

/**
 * ProjectService - Task 5 [R3][R10]
 *
 * Project lifecycle management.
 *
 * Each project lives in its own folder so the lecturer can open and save
 * projects at any time (R10). Folder layout:
 *
 *   ~/.iae/projects/<id>/
 *     project.json          - manifest                    [R10]
 *     submissions/<sid>/    - extracted student ZIPs      [R6]
 *     results/results.json  - last execution run output   [R9]
 *
 * Configurations are SNAPSHOTTED into the project at creation time
 * (project.configuration). Editing the source configuration later does
 * not change this project's behavior.
 */
export class ProjectService {
  private fileService = new FileService();

  constructor(
    private projectsDir: string,
    private configurationsDir: string,
  ) {}

  /**
   * TODO [R10]: list every subdirectory of projectsDir that contains
   * project.json, parse each manifest, return Project[] sorted by
   * updatedAt descending.
   *  - Skip subdirectories without project.json (log a warning).
   *  - Ensure projectsDir exists on first call.
   */
  async getAll(): Promise<Project[]> {
    void this.fileService;
    void this.projectsDir;
    throw new Error('Not implemented: ProjectService.getAll');
  }

  /**
   * TODO [R10]: read projectsDir/<id>/project.json and parse to Project.
   * Return null if the manifest is missing.
   */
  async getById(_id: string): Promise<Project | null> {
    throw new Error('Not implemented: ProjectService.getById');
  }

  /**
   * TODO [R3]: create the project skeleton.
   *  1. Resolve configurationId -> read Configuration from configurationsDir.
   *     Throw a clear error if the configuration is missing.
   *  2. Generate a new uuid for the project.
   *  3. Snapshot the configuration into the project (deep copy).
   *  4. mkdir -p projectsDir/<id>/submissions
   *  5. mkdir -p projectsDir/<id>/results
   *  6. Build the manifest:
   *       id, name, configurationId,
   *       configuration: <snapshot>,
   *       input: <DataSource>,
   *       expectedOutput: <DataSource>,
   *       submissionsDir: projectsDir/<id>/submissions,
   *       createdAt, updatedAt
   *  7. Write project.json with 2-space indentation.
   *  8. Return the persisted Project.
   */
  async create(_data: {
    name: string;
    configurationId: string;
    input: DataSource;
    expectedOutput: DataSource;
  }): Promise<Project> {
    void path;
    void uuidv4;
    void this.configurationsDir;
    throw new Error('Not implemented: ProjectService.create');
  }

  /**
   * TODO [R10]: shallow-merge data onto the existing manifest.
   *  - Allowed fields: name, input, expectedOutput, submissionsDir.
   *  - Disallow: id, configurationId, configuration (snapshot is immutable).
   *  - Bump updatedAt to now.
   *  - Persist and return the updated Project.
   */
  async update(_id: string, _data: Partial<Project>): Promise<Project> {
    throw new Error('Not implemented: ProjectService.update');
  }

  /**
   * TODO: rm -rf projectsDir/<id>/. No-op if missing.
   * Removes the manifest, submissions, and results in one shot.
   */
  async delete(_id: string): Promise<void> {
    throw new Error('Not implemented: ProjectService.delete');
  }

  /**
   * TODO [R9][R10]: read projectsDir/<id>/results/results.json.
   * Return null if no run has happened yet.
   */
  async getResults(_id: string): Promise<ProjectResults | null> {
    throw new Error('Not implemented: ProjectService.getResults');
  }

  /**
   * TODO: aggregate stats across every project for the Dashboard:
   *   - totalProjects: count of projects
   *   - totalStudents: sum of student counts across all results
   *   - overallPassRate: weighted average pass rate
   *   - recentProjects: 5 most recently updated, with status, counts,
   *     pass rate, and lastRun timestamp
   *
   * "Status" is derived:
   *   - completed: results.json exists and every student is processed
   *   - in-progress: a partial results.json exists
   *   - pending: no results.json yet
   */
  async getStatistics(): Promise<DashboardStats> {
    throw new Error('Not implemented: ProjectService.getStatistics');
  }

  /**
   * TODO: internal helper - load the live Configuration referenced by
   * configurationId from configurationsDir. Used at create() time.
   */
  private async loadConfiguration(_configurationId: string): Promise<Configuration> {
    throw new Error('Not implemented: ProjectService.loadConfiguration');
  }
}

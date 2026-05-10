import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import type {
  Project,
  ProjectResults,
  DashboardStats,
  Configuration,
  DataSource,
} from '../../shared/types';
import { FileService } from './FileService';
import { DatabaseService } from './DatabaseService';

export class ProjectService {
  private fileService = new FileService();

  constructor(
    private dbService: DatabaseService,
    private projectsDir: string
  ) {}

  private mapProject(row: any): Project {
    return {
      ...row,
      input: JSON.parse(row.input),
      expectedOutput: JSON.parse(row.expectedOutput),
    };
  }
  
  async getAll(): Promise<Project[]> {
    const db = this.dbService.getDb();
    const rows = db.prepare('SELECT * FROM projects ORDER BY updatedAt DESC').all();
    return rows.map((row) => this.mapProject(row));
  }

  async getById(id: string): Promise<Project | null> {
    const db = this.dbService.getDb();
    const row = db.prepare('SELECT * FROM projects WHERE id = ?').get(id);
    if (!row) return null;

    const project = this.mapProject(row);
    const config = db.prepare('SELECT * FROM configurations WHERE id = ?').get(project.configurationId);
    project.configuration = config as Configuration;
    
    return project;
  }


  async create(data: {
    name: string;
    configurationId: string;
    input: DataSource;
    expectedOutput: DataSource;
  }): Promise<Project> {
    const db = this.dbService.getDb();
    const config = db.prepare('SELECT id FROM configurations WHERE id = ?').get(data.configurationId);
    if (!config) throw new Error(`Configuration bulunamadı: ${data.configurationId}`);

    const id = uuidv4();
    const now = new Date().toISOString();
    const submissionsDir = path.join(this.projectsDir, id, 'submissions');

    await this.fileService.ensureDir(submissionsDir);

    const stmt = db.prepare(`
      INSERT INTO projects (id, name, configurationId, input, expectedOutput, submissionsDir, createdAt, updatedAt)
      VALUES (@id, @name, @configurationId, @input, @expectedOutput, @submissionsDir, @createdAt, @updatedAt)
    `);

    stmt.run({
      id,
      name: data.name,
      configurationId: data.configurationId,
      input: JSON.stringify(data.input),
      expectedOutput: JSON.stringify(data.expectedOutput),
      submissionsDir,
      createdAt: now,
      updatedAt: now,
    });

    return (await this.getById(id))!;
  }


  async update(id: string, data: Partial<Project>): Promise<Project> {
    const existing = await this.getById(id);
    if (!existing) throw new Error(`Project not found: ${id}`);

    const db = this.dbService.getDb();
    const now = new Date().toISOString();
    const updated = { ...existing, ...data, updatedAt: now };

    const stmt = db.prepare(`
      UPDATE projects 
      SET name = @name, input = @input, expectedOutput = @expectedOutput, 
          submissionsDir = @submissionsDir, updatedAt = @updatedAt
      WHERE id = @id
    `);

    stmt.run({
      id,
      name: updated.name,
      input: JSON.stringify(updated.input),
      expectedOutput: JSON.stringify(updated.expectedOutput),
      submissionsDir: updated.submissionsDir,
      updatedAt: updated.updatedAt,
    });

    return (await this.getById(id))!;
  }

  async delete(id: string): Promise<void> {
    const db = this.dbService.getDb();
    
    db.transaction(() => {
      db.prepare('DELETE FROM results WHERE projectId = ?').run(id);
      db.prepare('DELETE FROM projects WHERE id = ?').run(id);
    })();

    const projectDir = path.join(this.projectsDir, id);
    await this.fileService.deleteDir(projectDir);
  }


  async getResults(id: string): Promise<ProjectResults | null> {
    const db = this.dbService.getDb();
    const latestRun = db.prepare('SELECT runAt FROM results WHERE projectId = ? ORDER BY runAt DESC LIMIT 1').get(id) as { runAt: string } | undefined;
    if (!latestRun) return null;

    const rows = db.prepare('SELECT * FROM results WHERE projectId = ? AND runAt = ?').all(id, latestRun.runAt) as any[];

    return {
      projectId: id,
      runAt: latestRun.runAt,
      students: rows.map(r => ({
        ...r,
        zipExtracted: !!r.zipExtracted,
        sourceFound: !!r.sourceFound,
        compiled: !!r.compiled,
        executed: !!r.executed,
        executionTimedOut: !!r.executionTimedOut,
        outputMatched: !!r.outputMatched
      }))
    };
  }

  // DONE: DEMİR CÜCÜ
  // getStatistics(): recentProjects dizisini doldur.
  // Son 5 projeyi çek, her biri için:
  //   - results tablosundan studentCount (DISTINCT studentId) hesapla
  //   - passRate hesapla (status='pass' olan / toplam)  
  //   - lastRun: en son runAt değerini al
  //   - status: eğer results varsa 'completed', yoksa 'pending' olarak belirle
  // Dashboard sayfasının doğru çalışması için bu kısım kritik.
  async getStatistics(): Promise<DashboardStats> {
    const db = this.dbService.getDb();

    const totalProjects = (db.prepare('SELECT count(*) as count FROM projects').get() as any).count;
    const totalStudents = (db.prepare('SELECT count(DISTINCT studentId) as count FROM results').get() as any).count;
    
    const passes = (db.prepare("SELECT count(*) as count FROM results WHERE status = 'pass'").get() as any).count;
    const totalResults = (db.prepare('SELECT count(*) as count FROM results').get() as any).count;
    const overallPassRate = totalResults > 0 ? (passes / totalResults) * 100 : 0;

    const recentProjectsRaw = db.prepare('SELECT id, name FROM projects ORDER BY updatedAt DESC LIMIT 5').all() as any[];

    const recentProjects = recentProjectsRaw.map(p => {
      const stats = db.prepare(`
        SELECT 
          COUNT(DISTINCT studentId) as studentCount,
          SUM(CASE WHEN status = 'pass' THEN 1 ELSE 0 END) as passedCount,
          MAX(runAt) as lastRun
        FROM results 
        WHERE projectId = ?
      `).get(p.id) as any;

      const studentCount = Number(stats.studentCount || 0);
      const passedCount = Number(stats.passedCount || 0);
      const passRate = studentCount > 0 ? (passedCount / studentCount) * 100 : 0;

      const status: "completed" | "pending" | "in-progress" = studentCount > 0 ? 'completed' : 'pending';
      
      return {
        id: String(p.id),
        name: String(p.name),
        status,
        studentCount,
        passRate,
        lastRun: stats.lastRun ? String(stats.lastRun) : null
      };
    });

    return {
      totalProjects,
      totalStudents,
      overallPassRate,
      recentProjects 
    };
  }
}

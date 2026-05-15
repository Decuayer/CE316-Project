import Database from "better-sqlite3";
import { DATABASE_SCHEMA } from "../../shared/types";

/**
 * DatabaseService
 *
 * Manages the SQLite database connection, initialization, and schema creation
 * using better-sqlite3.
 */
export class DatabaseService {
    private db: Database.Database;

    /**
     * Initializes the database connection, sets pragmas, and applies the schema.
     */
    constructor(dbPath: string) {
        try {
            this.db = new Database(dbPath);
            this.db.pragma('journal_mode = WAL');
            this.db.pragma('foreign_keys = ON');
            this.initDatabase();
            console.log(`Database initialized successfully: ${dbPath}`);
        } catch (error) {
            console.error('Error initializing database: ', error);
            throw error;
        }
    }

    /**
     * Executes the initial database schema creation.
     */
    private initDatabase() {
        try {
            this.db.exec(DATABASE_SCHEMA);
        } catch(error) {
            console.error('Error creating database schema: ', error);
            throw error;
        }
        this.runMigrations();
    }

    /**
     * Applies incremental schema migrations for databases created before certain schema additions.
     *
     * Each migration is wrapped in try/catch so that columns which already exist
     * do not cause a fatal error (SQLite does not support IF NOT EXISTS on ALTER TABLE ADD COLUMN
     * in older versions; the error code SQLITE_ERROR is caught and ignored).
     *
     * Migrations list:
     *   - v1: Add `note TEXT` and `score REAL` to results table (instructor annotations)
     */
    private runMigrations() {
        const migrations: string[] = [
            'ALTER TABLE results ADD COLUMN note TEXT',
            'ALTER TABLE results ADD COLUMN score REAL',
        ];

        for (const sql of migrations) {
            try {
                this.db.exec(sql);
            } catch {
                // Column already exists — safe to ignore.
            }
        }
    }


    /**
     * Returns the active database instance. Throws an error if not connected.
     */
    public getDb() : Database.Database {
        if (!this.isConnected()) {
            throw new Error('Database connection is not open');
        }       
        return this.db;
    }

    /**
     * Checks if the database connection is currently open.
     */
    public isConnected(): boolean {
        return this.db!== undefined && this.db.open;
    }

    /**
     * Closes the active database connection.
     */
    public close() {
        if (this.isConnected()) {
            this.db.close();
            console.log('Database connection closed');
        }
    }
}


    import Database from "better-sqlite3";
    import { DATABASE_SCHEMA } from "../../shared/types";

    export class DatabaseService {
        private db: Database.Database;

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

        private initDatabase() {
            try {
                this.db.exec(DATABASE_SCHEMA);
            } catch(error) {
                console.error('Error creating database schema: ', error);
                throw error;
            }
            
        }

        public getDb() : Database.Database {
            if (!this.isConnected()) {
                throw new Error('Database connection is not open');
            }       
            return this.db;
        }

        public isConnected(): boolean {
            return this.db!== undefined && this.db.open;
        }

        public close() {
            if (this.isConnected()) {
                this.db.close();
                console.log('Database connection closed');
            }
        }
    }


import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from './schema';
import path from 'path';
import { mkdirSync } from 'fs';

const dbPath = process.env.DATABASE_PATH ?? path.join(process.cwd(), 'data', 'komorebi.db');

// Ensure the directory exists
mkdirSync(path.dirname(dbPath), { recursive: true });

// Singleton pattern to avoid multiple connections in dev (HMR)
const globalForDb = globalThis as unknown as { sqlite: Database.Database | undefined };

const sqlite = globalForDb.sqlite ?? new Database(dbPath);
sqlite.pragma('journal_mode = WAL');
sqlite.pragma('foreign_keys = ON');

if (process.env.NODE_ENV !== 'production') {
  globalForDb.sqlite = sqlite;
}

export const db = drizzle(sqlite, { schema });

import { Database } from "bun:sqlite";
import { config } from "../config";
import { dirname } from "path";
import { mkdirSync } from "fs";

let dbInstance: Database | null = null;

export function initDatabase(dbPath = config.DB_PATH): Database {
  if (dbInstance) {
    dbInstance.close();
  }
  if (dbPath !== ":memory:") {
    try {
      mkdirSync(dirname(dbPath), { recursive: true });
    } catch {
      // directory might already exist
    }
  }
  dbInstance = new Database(dbPath);
  dbInstance.run("PRAGMA journal_mode = WAL;");
  dbInstance.run("PRAGMA foreign_keys = ON;");
  return dbInstance;
}

export function getDb(): Database {
  if (!dbInstance) {
    return initDatabase();
  }
  return dbInstance;
}

import * as SQLite from 'expo-sqlite';

let db: SQLite.SQLiteDatabase | null = null;

export function getDb(): SQLite.SQLiteDatabase {
  if (!db) throw new Error('Database not initialized');
  return db;
}

export async function initDatabase(): Promise<void> {
  db = await SQLite.openDatabaseAsync('pingpong.db');

  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS players (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS matches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      mode TEXT NOT NULL CHECK(mode IN ('singles','doubles')),
      team1_player1 INTEGER NOT NULL REFERENCES players(id),
      team1_player2 INTEGER REFERENCES players(id),
      team2_player1 INTEGER NOT NULL REFERENCES players(id),
      team2_player2 INTEGER REFERENCES players(id),
      winner_team INTEGER NOT NULL CHECK(winner_team IN (1,2)),
      played_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      match_id INTEGER NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
      set_number INTEGER NOT NULL,
      team1_score INTEGER NOT NULL,
      team2_score INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);
}

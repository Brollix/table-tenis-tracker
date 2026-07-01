import { getDb } from './database';

export interface BackupData {
  version: number;
  exportedAt: number;
  players: any[];
  matches: any[];
  sets: any[];
}

/** Lee todas las tablas crudas para exportar/migrar. */
export async function exportAllData(): Promise<BackupData> {
  const db = getDb();
  const players = await db.getAllAsync<any>('SELECT * FROM players ORDER BY id');
  const matches = await db.getAllAsync<any>('SELECT * FROM matches ORDER BY id');
  const sets = await db.getAllAsync<any>('SELECT * FROM sets ORDER BY id');
  return {
    version: 1,
    exportedAt: Math.floor(Date.now() / 1000),
    players,
    matches,
    sets,
  };
}

import { getDb } from './database';
import { Player } from '../types';

export async function getPlayers(): Promise<Player[]> {
  const db = getDb();
  return db.getAllAsync<Player>('SELECT * FROM players ORDER BY name ASC');
}

export async function addPlayer(name: string): Promise<Player> {
  const db = getDb();
  const created_at = Math.floor(Date.now() / 1000);
  const result = await db.runAsync(
    'INSERT INTO players (name, created_at) VALUES (?, ?)',
    name.trim(),
    created_at,
  );
  return { id: result.lastInsertRowId, name: name.trim(), created_at };
}

export async function deletePlayer(id: number): Promise<void> {
  const db = getDb();
  await db.runAsync('DELETE FROM players WHERE id = ?', id);
}

export async function getPlayerMatchCount(id: number): Promise<number> {
  const db = getDb();
  const row = await db.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) as count FROM matches
     WHERE team1_player1 = ? OR team1_player2 = ? OR team2_player1 = ? OR team2_player2 = ?`,
    id, id, id, id,
  );
  return row?.count ?? 0;
}

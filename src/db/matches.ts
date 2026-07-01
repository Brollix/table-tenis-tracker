import { getDb } from './database';
import { Match, NewMatchData, PlayerStats, SetScore } from '../types';
import { getPlayers } from './players';
import { setsWon } from '../lib/match';

export async function getMatches(): Promise<Match[]> {
  const db = getDb();

  const rows = await db.getAllAsync<any>(`
    SELECT
      m.*,
      p1.name AS team1_player1_name,
      p2.name AS team1_player2_name,
      p3.name AS team2_player1_name,
      p4.name AS team2_player2_name
    FROM matches m
    JOIN players p1 ON p1.id = m.team1_player1
    LEFT JOIN players p2 ON p2.id = m.team1_player2
    JOIN players p3 ON p3.id = m.team2_player1
    LEFT JOIN players p4 ON p4.id = m.team2_player2
    ORDER BY m.played_at DESC
  `);

  const matches: Match[] = [];
  for (const row of rows) {
    const sets = await db.getAllAsync<SetScore>(
      'SELECT set_number, team1_score, team2_score FROM sets WHERE match_id = ? ORDER BY set_number',
      row.id,
    );
    matches.push({ ...row, sets });
  }
  return matches;
}

export async function getMatch(id: number): Promise<Match | null> {
  const db = getDb();
  const row = await db.getFirstAsync<any>(`
    SELECT
      m.*,
      p1.name AS team1_player1_name,
      p2.name AS team1_player2_name,
      p3.name AS team2_player1_name,
      p4.name AS team2_player2_name
    FROM matches m
    JOIN players p1 ON p1.id = m.team1_player1
    LEFT JOIN players p2 ON p2.id = m.team1_player2
    JOIN players p3 ON p3.id = m.team2_player1
    LEFT JOIN players p4 ON p4.id = m.team2_player2
    WHERE m.id = ?
  `, id);
  if (!row) return null;
  const sets = await db.getAllAsync<SetScore>(
    'SELECT set_number, team1_score, team2_score FROM sets WHERE match_id = ? ORDER BY set_number',
    id,
  );
  return { ...row, sets };
}

export async function deleteMatch(id: number): Promise<void> {
  const db = getDb();
  await db.runAsync('DELETE FROM matches WHERE id = ?', id);
}

export async function updateMatch(id: number, data: NewMatchData): Promise<void> {
  const db = getDb();
  await db.withTransactionAsync(async () => {
    await db.runAsync(
      `UPDATE matches SET mode = ?, team1_player1 = ?, team1_player2 = ?, team2_player1 = ?, team2_player2 = ?, winner_team = ?
       WHERE id = ?`,
      data.mode,
      data.team1_player1,
      data.team1_player2 ?? null,
      data.team2_player1,
      data.team2_player2 ?? null,
      data.winner_team,
      id,
    );
    await db.runAsync('DELETE FROM sets WHERE match_id = ?', id);
    for (let i = 0; i < data.sets.length; i++) {
      const s = data.sets[i];
      await db.runAsync(
        'INSERT INTO sets (match_id, set_number, team1_score, team2_score) VALUES (?, ?, ?, ?)',
        id, i + 1, s.team1_score, s.team2_score,
      );
    }
  });
}

export async function addMatch(data: NewMatchData): Promise<void> {
  const db = getDb();
  const played_at = Math.floor(Date.now() / 1000);

  await db.withTransactionAsync(async () => {
    const result = await db.runAsync(
      `INSERT INTO matches (mode, team1_player1, team1_player2, team2_player1, team2_player2, winner_team, played_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      data.mode,
      data.team1_player1,
      data.team1_player2 ?? null,
      data.team2_player1,
      data.team2_player2 ?? null,
      data.winner_team,
      played_at,
    );
    const matchId = result.lastInsertRowId;

    for (let i = 0; i < data.sets.length; i++) {
      const s = data.sets[i];
      await db.runAsync(
        'INSERT INTO sets (match_id, set_number, team1_score, team2_score) VALUES (?, ?, ?, ?)',
        matchId, i + 1, s.team1_score, s.team2_score,
      );
    }
  });
}

export async function getStats(): Promise<PlayerStats[]> {
  const players = await getPlayers();
  const matches = await getMatches();

  const map = new Map<number, PlayerStats>();
  for (const p of players) {
    map.set(p.id, {
      id: p.id, name: p.name,
      matchWins: 0, matchLosses: 0, matchTotal: 0, matchPct: 0,
    });
  }

  for (const m of matches) {
    // Cada set/juego cuenta como un "partido individual".
    const games = setsWon(m.sets); // { team1, team2 }
    const totalGames = games.team1 + games.team2;
    const team1 = [m.team1_player1, m.team1_player2].filter((x): x is number => !!x);
    const team2 = [m.team2_player1, m.team2_player2].filter((x): x is number => !!x);

    for (const pid of team1) {
      const s = map.get(pid);
      if (!s) continue;
      s.matchTotal += totalGames;
      s.matchWins += games.team1;
      s.matchLosses += games.team2;
    }
    for (const pid of team2) {
      const s = map.get(pid);
      if (!s) continue;
      s.matchTotal += totalGames;
      s.matchWins += games.team2;
      s.matchLosses += games.team1;
    }
  }

  const arr = Array.from(map.values());
  for (const s of arr) {
    s.matchPct = s.matchTotal > 0 ? Math.round((s.matchWins / s.matchTotal) * 100) : 0;
  }
  arr.sort((a, b) => b.matchWins - a.matchWins || a.matchLosses - b.matchLosses);
  return arr;
}

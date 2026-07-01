import { SetScore } from '../types';

export interface MatchRules {
  pointsPerSet: number; // e.g. 11 or 21
  winByTwo: boolean;
  bestOf: number; // 3, 5, 7 -> first to ceil(bestOf/2) sets
}

export const DEFAULT_RULES: MatchRules = {
  pointsPerSet: 11,
  winByTwo: true,
  bestOf: 5,
};

/** Sets needed to win the match. */
export function setsToWin(rules: MatchRules): number {
  return Math.floor(rules.bestOf / 2) + 1;
}

/** Count of sets won by each team. */
export function setsWon(sets: { team1_score: number; team2_score: number }[]): { team1: number; team2: number } {
  let team1 = 0;
  let team2 = 0;
  for (const s of sets) {
    if (s.team1_score > s.team2_score) team1++;
    else if (s.team2_score > s.team1_score) team2++;
  }
  return { team1, team2 };
}

/** Winner team based on sets won, or null if tied / undetermined. */
export function computeWinner(sets: { team1_score: number; team2_score: number }[]): 1 | 2 | null {
  const w = setsWon(sets);
  if (w.team1 > w.team2) return 1;
  if (w.team2 > w.team1) return 2;
  return null;
}

/** Whether a single set is finished given the rules. */
export function isSetComplete(t1: number, t2: number, rules: MatchRules): boolean {
  const max = Math.max(t1, t2);
  if (max < rules.pointsPerSet) return false;
  if (!rules.winByTwo) return true;
  return Math.abs(t1 - t2) >= 2;
}

/**
 * Quién saca para el próximo punto del juego actual.
 * Cambia cada 2 puntos; al llegar a deuce (ambos en pointsPerSet-1) cambia cada punto.
 */
export function currentServer(firstServer: 1 | 2, pointsPlayed: number, pointsPerSet: number): 1 | 2 {
  const deuce = 2 * (pointsPerSet - 1);
  const switches = pointsPlayed <= deuce
    ? Math.floor(pointsPlayed / 2)
    : (pointsPerSet - 1) + (pointsPlayed - deuce);
  const other: 1 | 2 = firstServer === 1 ? 2 : 1;
  return switches % 2 === 0 ? firstServer : other;
}

/** Whether the match is decided given completed sets. */
export function isMatchComplete(
  sets: { team1_score: number; team2_score: number }[],
  rules: MatchRules,
): boolean {
  const w = setsWon(sets);
  const target = setsToWin(rules);
  return w.team1 >= target || w.team2 >= target;
}

export type Mode = 'singles' | 'doubles';

export interface Player {
  id: number;
  name: string;
  created_at: number;
}

export interface SetScore {
  set_number: number;
  team1_score: number;
  team2_score: number;
}

export interface Match {
  id: number;
  mode: Mode;
  team1_player1: number;
  team1_player2: number | null;
  team2_player1: number;
  team2_player2: number | null;
  winner_team: 1 | 2;
  played_at: number;
  sets: SetScore[];
  team1_player1_name?: string;
  team1_player2_name?: string;
  team2_player1_name?: string;
  team2_player2_name?: string;
}

export interface PlayerStats {
  id: number;
  name: string;
  matchWins: number;
  matchLosses: number;
  matchTotal: number;
  matchPct: number;
}

export interface NewMatchData {
  mode: Mode;
  team1_player1: number;
  team1_player2: number | null;
  team2_player1: number;
  team2_player2: number | null;
  winner_team: 1 | 2;
  sets: Omit<SetScore, 'set_number'>[];
}

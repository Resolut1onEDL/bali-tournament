import type { Position } from './types';

export const TOTAL_PLAYERS = 15;
export const TEAM_SIZE = 5;
export const TEAMS_PER_ROUND = 2;
export const MATCHES_PER_ROUND = 1;
export const DEFAULT_TOTAL_ROUNDS = 6;
export const TOTAL_PCS = 10;
// 15 players, one 5v5 match per round — the rest sit the round out
export const BENCH_SIZE = TOTAL_PLAYERS - TEAM_SIZE * TEAMS_PER_ROUND;
// A match needs 10 players; anyone above that rotates through the bench,
// so the tournament still runs if somebody does not show up.
export const MIN_PLAYERS = TEAM_SIZE * TEAMS_PER_ROUND;
export const MAX_PLAYERS = 20;

export const POSITION_LABELS: Record<Position, string> = {
  1: 'Carry',
  2: 'Mid',
  3: 'Offlane',
  4: 'Soft Support',
  5: 'Hard Support',
};

export const POSITION_SHORT: Record<Position, string> = {
  1: 'Pos 1',
  2: 'Pos 2',
  3: 'Pos 3',
  4: 'Pos 4',
  5: 'Pos 5',
};

export const POSITION_COLORS: Record<Position, string> = {
  1: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  2: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  3: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  4: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  5: 'bg-teal-500/20 text-teal-400 border-teal-500/30',
};

export const TEAM_NAMES = ['Alpha', 'Bravo', 'Charlie', 'Delta'];

export const TEAM_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  'Resolut1on Team':       { bg: 'bg-amber-500/10',   border: 'border-amber-500/30',   text: 'text-amber-400' },
  'Resolut1on Finalists':  { bg: 'bg-amber-500/10',   border: 'border-amber-500/30',   text: 'text-amber-400' },
  Opponents:               { bg: 'bg-blue-500/10',    border: 'border-blue-500/30',    text: 'text-blue-400' },
  'MVP All-Stars':         { bg: 'bg-fuchsia-500/10', border: 'border-fuchsia-500/30', text: 'text-fuchsia-400' },
  Alpha:   { bg: 'bg-amber-500/10',   border: 'border-amber-500/30',   text: 'text-amber-400' },
  Bravo:   { bg: 'bg-blue-500/10',    border: 'border-blue-500/30',    text: 'text-blue-400' },
  Charlie: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-400' },
  Delta:   { bg: 'bg-purple-500/10',  border: 'border-purple-500/30',  text: 'text-purple-400' },
};

export const PC_LAYOUT = {
  match1: {
    radiant: [1, 2, 3, 4, 5],
    dire: [6, 7, 8, 9, 10],
  },
} as const;

export const STORAGE_KEY = 'bali-showmatch-tournament';

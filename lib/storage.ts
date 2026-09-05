import type { TournamentState, Player, Position } from './types';
import { STORAGE_KEY, DEFAULT_TOTAL_ROUNDS } from './constants';

// Migrate old player data: `position` (single) → `positions` (array)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function migratePlayers(players: any[]): Player[] {
  return players.map(p => {
    if (!p.positions && p.position) {
      return { ...p, positions: [p.position as Position] } as Player;
    }
    if (!p.positions) {
      return { ...p, positions: [1 as Position] } as Player;
    }
    return p as Player;
  });
}

const DEFAULT_STATE: TournamentState = {
  players: [],
  rounds: [],
  currentRoundIndex: 0,
  totalRoundsTarget: 5,
  isLocked: false,
  mvpAllStarIds: [],
};

export function loadTournamentState(): TournamentState {
  if (typeof window === 'undefined') return DEFAULT_STATE;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATE;
    const parsed = JSON.parse(raw);
    parsed.players = migratePlayers(parsed.players ?? []);
    if (!parsed.mvpAllStarIds) parsed.mvpAllStarIds = [];
    // Migrate rounds missing isFinal
    if (parsed.rounds) {
      for (const r of parsed.rounds) {
        if (r.isFinal === undefined) r.isFinal = false;
        if (!r.benchedPlayerIds) r.benchedPlayerIds = [];
      }
    }
    return parsed as TournamentState;
  } catch {
    return DEFAULT_STATE;
  }
}

export function saveTournamentState(state: TournamentState): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function clearTournamentState(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
}

export function exportAsJSON(state: TournamentState): string {
  return JSON.stringify(state, null, 2);
}

export function importFromJSON(json: string): TournamentState | null {
  try {
    const parsed = JSON.parse(json);
    if (!parsed.players || !Array.isArray(parsed.players)) return null;
    parsed.players = migratePlayers(parsed.players);
    return parsed as TournamentState;
  } catch {
    return null;
  }
}

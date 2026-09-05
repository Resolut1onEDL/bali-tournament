import type { Match, Position, Round, Team } from './types';

// A tournament packed small enough to live inside a URL hash — no backend, and
// the hash never reaches the server. Names and team labels go into lookup
// tables and everything else is a number, because the link gets pasted into chat.

/** [playerIndex, pcNumber (0 = none), position] */
export type SharedPlayer = [number, number, Position];

/** [teamNameIndex, discordChannel, players] */
export type SharedTeam = [number, number, SharedPlayer[]];

export interface SharedRound {
  n: number;           // round number
  f?: 1;               // final
  t: SharedTeam[];     // 2 teams (single match) or 4 (parallel matches)
  b: number[];         // player indexes sitting the round out
}

export interface SharedTournament {
  d?: string;          // discord invite url
  p: string[];         // player names
  g: string[];         // team names
  r: SharedRound[];
}

class Dictionary {
  private index = new Map<string, number>();
  readonly values: string[] = [];

  idOf(value: string): number {
    const existing = this.index.get(value);
    if (existing !== undefined) return existing;
    const id = this.values.length;
    this.index.set(value, id);
    this.values.push(value);
    return id;
  }
}

function packTeam(team: Team, match: Match, channel: number, names: Dictionary, teams: Dictionary): SharedTeam {
  const players: SharedPlayer[] = team.players.map(player => {
    const pc = match.pcAssignments.find(a => a.playerId === player.id);
    const position = player.assignedPosition ?? player.positions[0];
    return [names.idOf(player.name), pc?.pcNumber ?? 0, position];
  });
  return [teams.idOf(team.name), channel, players];
}

export function packTournament(
  rounds: Round[],
  benchedNamesByRound: string[][],
  discordUrl?: string,
): SharedTournament {
  const names = new Dictionary();
  const teams = new Dictionary();

  const packed = rounds.map((round, i): SharedRound => ({
    n: round.roundNumber,
    ...(round.isFinal ? { f: 1 as const } : {}),
    // Channels follow the team slots: 1-2 for Resolut1on's match, 3-4 for the parallel one
    t: [
      packTeam(round.match1.team1, round.match1, 1, names, teams),
      packTeam(round.match1.team2, round.match1, 2, names, teams),
      ...(round.match2
        ? [
            packTeam(round.match2.team1, round.match2, 3, names, teams),
            packTeam(round.match2.team2, round.match2, 4, names, teams),
          ]
        : []),
    ],
    b: (benchedNamesByRound[i] ?? []).map(name => names.idOf(name)),
  }));

  return {
    ...(discordUrl ? { d: discordUrl } : {}),
    p: names.values,
    g: teams.values,
    r: packed,
  };
}

function toBase64Url(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(encoded: string): string {
  const binary = atob(encoded.replace(/-/g, '+').replace(/_/g, '/'));
  const bytes = Uint8Array.from(binary, c => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

export function encodeTournament(data: SharedTournament): string {
  return toBase64Url(JSON.stringify(data));
}

export function decodeTournament(encoded: string): SharedTournament | null {
  try {
    const parsed = JSON.parse(fromBase64Url(encoded));
    if (!parsed || !Array.isArray(parsed.r) || !Array.isArray(parsed.p)) return null;
    return parsed as SharedTournament;
  } catch {
    return null;
  }
}

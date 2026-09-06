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

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlToBytes(encoded: string): Uint8Array {
  const binary = atob(encoded.replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from(binary, c => c.charCodeAt(0));
}

// Deflate cuts the link roughly threefold — the JSON is mostly repeated
// structure. Browsers without CompressionStream fall back to plain base64,
// which is longer but still works; the prefix says which one it is.
const DEFLATED = 'z';
const PLAIN = 'j';

async function deflate(bytes: Uint8Array): Promise<Uint8Array | null> {
  if (typeof CompressionStream === 'undefined') return null;
  const stream = new Blob([bytes as BlobPart]).stream()
    .pipeThrough(new CompressionStream('deflate-raw'));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

async function inflate(bytes: Uint8Array): Promise<Uint8Array> {
  const stream = new Blob([bytes as BlobPart]).stream()
    .pipeThrough(new DecompressionStream('deflate-raw'));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

export async function encodeTournament(data: SharedTournament): Promise<string> {
  const raw = new TextEncoder().encode(JSON.stringify(data));
  const compressed = await deflate(raw);
  return compressed && compressed.length < raw.length
    ? DEFLATED + bytesToBase64Url(compressed)
    : PLAIN + bytesToBase64Url(raw);
}

export async function decodeTournament(encoded: string): Promise<SharedTournament | null> {
  try {
    const marker = encoded[0];
    const body = base64UrlToBytes(encoded.slice(1));
    const json = new TextDecoder().decode(marker === DEFLATED ? await inflate(body) : body);
    const parsed = JSON.parse(json);
    if (!parsed || !Array.isArray(parsed.r) || !Array.isArray(parsed.p)) return null;
    return parsed as SharedTournament;
  } catch {
    return null;
  }
}

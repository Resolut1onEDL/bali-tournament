import type { Player, Team, Match, Round, PCAssignment, Position } from './types';
import { PC_LAYOUT } from './constants';

// ── Utilities ──

function fisherYates<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function getPos(p: Player): Position {
  return p.assignedPosition ?? p.positions[0];
}

function avgMMR(players: Player[]): number {
  if (players.length === 0) return 0;
  return Math.round(players.reduce((s, p) => s + p.mmr, 0) / players.length);
}

function makeTeam(name: string, players: Player[]): Team {
  return {
    id: crypto.randomUUID(),
    name,
    players,
    averageMMR: avgMMR(players),
  };
}

function makeMatch(team1: Team, team2: Team): Match {
  return {
    id: crypto.randomUUID(),
    team1,
    team2,
    matchMMRDiff: Math.abs(team1.averageMMR - team2.averageMMR),
    pcAssignments: [],
  };
}

// ── Position Assignment ──
// Assign positions to a group of 5 players, covering all 5 roles as best as possible

function assignPositionsToTeam(players: Player[]): Player[] {
  const result: Player[] = [];
  const taken = new Set<number>(); // position indices taken

  // Sort by flexibility: least flexible first
  const sorted = [...players].sort((a, b) => a.positions.length - b.positions.length);

  // Pass 1: assign players to their preferred position if available
  for (const p of sorted) {
    let assigned = false;
    for (const pos of p.positions) {
      if (!taken.has(pos)) {
        result.push({ ...p, assignedPosition: pos });
        taken.add(pos);
        assigned = true;
        break;
      }
    }
    if (!assigned) {
      result.push(p); // will be assigned in pass 2
    }
  }

  // Pass 2: assign remaining players to any open position
  const allPositions: Position[] = [1, 2, 3, 4, 5];
  for (let i = 0; i < result.length; i++) {
    if (result[i].assignedPosition) continue;
    const open = allPositions.find(pos => !taken.has(pos));
    if (open) {
      result[i] = { ...result[i], assignedPosition: open };
      taken.add(open);
    } else {
      // All 5 taken — fallback to first preferred
      result[i] = { ...result[i], assignedPosition: result[i].positions[0] };
    }
  }

  return result;
}

// ── PC Assignment ──

function assignPCs(match: Match, layout: { radiant: readonly number[]; dire: readonly number[] }): PCAssignment[] {
  const assignments: PCAssignment[] = [];

  const team1Sorted = [...match.team1.players].sort((a, b) => getPos(a) - getPos(b));
  const team2Sorted = [...match.team2.players].sort((a, b) => getPos(a) - getPos(b));

  team1Sorted.forEach((player, i) => {
    assignments.push({
      pcNumber: layout.radiant[i],
      playerId: player.id,
      playerName: player.name,
      teamName: match.team1.name,
      side: 'radiant',
      position: getPos(player),
    });
  });

  team2Sorted.forEach((player, i) => {
    assignments.push({
      pcNumber: layout.dire[i],
      playerId: player.id,
      playerName: player.name,
      teamName: match.team2.name,
      side: 'dire',
      position: getPos(player),
    });
  });

  return assignments;
}

// ── Get Resolut1on's previous teammates and opponents ──

function getResolut1onHistory(rounds: Round[], resolut1onId: string) {
  const teammateIds = new Set<string>();
  const opponentIds = new Set<string>();

  for (const round of rounds) {
    if (round.isFinal) continue;

    // Find which team Resolut1on is on in match1 (he's always in match1)
    const resInTeam1 = round.match1.team1.players.some(p => p.id === resolut1onId);
    const resTeam = resInTeam1 ? round.match1.team1 : round.match1.team2;
    const oppTeam = resInTeam1 ? round.match1.team2 : round.match1.team1;

    for (const p of resTeam.players) {
      if (p.id !== resolut1onId) teammateIds.add(p.id);
    }
    for (const p of oppTeam.players) {
      opponentIds.add(p.id);
    }
  }

  return { teammateIds, opponentIds };
}

// ── Balance 10 players into 2 teams of 5 ──
// Tries many candidates and picks the most MMR-balanced split

function balancedSplit(players: Player[]): [Player[], Player[]] {
  if (players.length !== 10) {
    // fallback: just split in half
    return [players.slice(0, 5), players.slice(5)];
  }

  const CANDIDATES = 100;
  let bestDiff = Infinity;
  let bestA: Player[] = players.slice(0, 5);
  let bestB: Player[] = players.slice(5);

  for (let c = 0; c < CANDIDATES; c++) {
    const shuffled = fisherYates(players);
    const a = shuffled.slice(0, 5);
    const b = shuffled.slice(5);
    const diff = Math.abs(avgMMR(a) - avgMMR(b));
    if (diff < bestDiff) {
      bestDiff = diff;
      bestA = a;
      bestB = b;
    }
  }

  return [bestA, bestB];
}

// ══════════════════════════════════════════════════
// MAIN: Generate a regular round (1-4)
// Resolut1on gets 4 NEW teammates he hasn't played with yet.
// Opponent team is balanced from 5 more players.
// Remaining 10 play a parallel match.
// ══════════════════════════════════════════════════

export function generateRound(
  players: Player[],
  previousRounds: Round[],
  roundNumber: number,
): Round {
  const resolut1on = players.find(p => p.isResolut1on);
  if (!resolut1on) throw new Error('Resolut1on not found in player list');

  const others = players.filter(p => !p.isResolut1on);
  const { teammateIds: previousTeammateIds, opponentIds: previousOpponentIds } =
    getResolut1onHistory(previousRounds, resolut1on.id);

  // Players who haven't been Resolut1on's teammates yet
  const available = others.filter(p => !previousTeammateIds.has(p.id));
  // Players who have already been his teammates
  const alreadyPlayed = others.filter(p => previousTeammateIds.has(p.id));

  // Pick 4 teammates for Resolut1on from available pool
  // Try many candidates for best MMR balance + opponent variety
  const CANDIDATES = 200;
  let bestRound: Round | null = null;
  let bestScore = Infinity;

  for (let c = 0; c < CANDIDATES; c++) {
    // Shuffle available, pick first 4 as teammates
    let teammates: Player[];
    let opponentPool: Player[];

    if (available.length >= 4) {
      const shuffledAvailable = fisherYates(available);
      teammates = shuffledAvailable.slice(0, 4);
      const remainingAvailable = shuffledAvailable.slice(4);
      opponentPool = [...remainingAvailable, ...alreadyPlayed];
    } else {
      // Not enough new players — fill from already played
      teammates = [...available];
      const needed = 4 - teammates.length;
      const shuffledPlayed = fisherYates(alreadyPlayed);
      teammates = [...teammates, ...shuffledPlayed.slice(0, needed)];
      opponentPool = shuffledPlayed.slice(needed);
    }

    // Resolut1on's team: him + 4 teammates
    const resTeamPlayers = assignPositionsToTeam([resolut1on, ...teammates]);
    const resTeam = makeTeam('Resolut1on Team', resTeamPlayers);

    // Prioritize opponents who haven't faced Resolut1on yet
    // Sort: fresh opponents first, then already-faced
    const freshOpponents = opponentPool.filter(p => !previousOpponentIds.has(p.id));
    const repeatOpponents = opponentPool.filter(p => previousOpponentIds.has(p.id));

    // Pick 5 opponents: prefer fresh, fill with repeats if needed
    let selectedOpponents: Player[];
    if (freshOpponents.length >= 5) {
      const shuffledFresh = fisherYates(freshOpponents);
      selectedOpponents = shuffledFresh.slice(0, 5);
    } else {
      const shuffledRepeat = fisherYates(repeatOpponents);
      selectedOpponents = [
        ...fisherYates(freshOpponents),
        ...shuffledRepeat.slice(0, 5 - freshOpponents.length),
      ];
    }

    const opponentPlayers = assignPositionsToTeam(selectedOpponents);
    const opponentTeam = makeTeam('Opponents', opponentPlayers);

    // Remaining 10 for parallel match
    const usedOpponentIds = new Set(selectedOpponents.map(p => p.id));
    const parallelPlayers = opponentPool.filter(p => !usedOpponentIds.has(p.id));
    const [pA, pB] = balancedSplit(parallelPlayers);
    const parallelTeam1 = makeTeam('Team Alpha', assignPositionsToTeam(pA));
    const parallelTeam2 = makeTeam('Team Bravo', assignPositionsToTeam(pB));

    const match1 = makeMatch(resTeam, opponentTeam);
    const match2 = makeMatch(parallelTeam1, parallelTeam2);

    // Score: MMR balance + opponent variety penalty
    const repeatOpponentCount = selectedOpponents.filter(p => previousOpponentIds.has(p.id)).length;
    const score = match1.matchMMRDiff * 2 + match2.matchMMRDiff + repeatOpponentCount * 150;

    if (score < bestScore) {
      bestScore = score;
      bestRound = {
        id: crypto.randomUUID(),
        roundNumber,
        match1,
        match2,
        isFinal: false,
        timestamp: new Date().toISOString(),
      };
    }
  }

  // Assign PCs
  bestRound!.match1.pcAssignments = assignPCs(bestRound!.match1, PC_LAYOUT.match1);
  bestRound!.match2.pcAssignments = assignPCs(bestRound!.match2, PC_LAYOUT.match2);

  return bestRound!;
}

// ══════════════════════════════════════════════════
// FINAL ROUND: Resolut1on + remaining (never-teammates) vs MVP All-Stars
// ══════════════════════════════════════════════════

export function generateFinalRound(
  players: Player[],
  previousRounds: Round[],
  mvpAllStarIds: string[],
  roundNumber: number,
): Round {
  const resolut1on = players.find(p => p.isResolut1on);
  if (!resolut1on) throw new Error('Resolut1on not found in player list');

  const others = players.filter(p => !p.isResolut1on);
  const { teammateIds: previousTeammateIds } = getResolut1onHistory(previousRounds, resolut1on.id);

  // MVP All-Stars team (admin-selected)
  const allStars = others.filter(p => mvpAllStarIds.includes(p.id));

  // Resolut1on's finalists: players who haven't been his teammates yet (excluding allstars)
  const neverPlayed = others.filter(
    p => !previousTeammateIds.has(p.id) && !mvpAllStarIds.includes(p.id)
  );

  // Build Resolut1on's team: him + never-played + fill from remaining if needed
  let resTeammates = [...neverPlayed];
  if (resTeammates.length < 4) {
    // Fill from players who are not in All-Stars
    const fillPool = others.filter(
      p => !mvpAllStarIds.includes(p.id) && !neverPlayed.some(np => np.id === p.id)
    );
    const shuffledFill = fisherYates(fillPool);
    resTeammates = [...resTeammates, ...shuffledFill.slice(0, 4 - resTeammates.length)];
  }
  resTeammates = resTeammates.slice(0, 4);

  const resTeamPlayers = assignPositionsToTeam([resolut1on, ...resTeammates]);
  const resTeam = makeTeam('Resolut1on Finalists', resTeamPlayers);

  const allStarTeamPlayers = assignPositionsToTeam(allStars.slice(0, 5));
  const allStarTeam = makeTeam('MVP All-Stars', allStarTeamPlayers);

  const match1 = makeMatch(resTeam, allStarTeam);

  // Remaining 10 for parallel match
  const usedIds = new Set([
    resolut1on.id,
    ...resTeammates.map(p => p.id),
    ...allStars.slice(0, 5).map(p => p.id),
  ]);
  const remaining = players.filter(p => !usedIds.has(p.id));
  const [pA, pB] = balancedSplit(remaining);
  const parallelTeam1 = makeTeam('Team Alpha', assignPositionsToTeam(pA));
  const parallelTeam2 = makeTeam('Team Bravo', assignPositionsToTeam(pB));
  const match2 = makeMatch(parallelTeam1, parallelTeam2);

  // Assign PCs
  match1.pcAssignments = assignPCs(match1, PC_LAYOUT.match1);
  match2.pcAssignments = assignPCs(match2, PC_LAYOUT.match2);

  return {
    id: crypto.randomUUID(),
    roundNumber,
    match1,
    match2,
    isFinal: true,
    timestamp: new Date().toISOString(),
  };
}

// Generate all 4 regular rounds at once
export function generateAllRegularRounds(
  players: Player[],
  existingRounds: Round[],
): Round[] {
  const rounds = [...existingRounds.filter(r => !r.isFinal)];
  const startFrom = rounds.length + 1;

  for (let i = startFrom; i <= 4; i++) {
    const round = generateRound(players, rounds, i);
    rounds.push(round);
  }

  return rounds;
}

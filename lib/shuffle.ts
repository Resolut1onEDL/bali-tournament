import type { Player, Team, Match, Round, PCAssignment, Position } from './types';
import { PC_LAYOUT, PLAYERS_PER_MATCH } from './constants';

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
// Hand out the five roles inside a team. The greedy "least flexible first" pass
// this replaced could park a player on a role he never picked while a valid
// arrangement existed, so every permutation is scored instead — 120 of them for
// five players, which is nothing.

const ALL_POSITIONS: Position[] = [1, 2, 3, 4, 5];

// Cost of putting a player on a role: their own order of preference, or a heavy
// penalty for a role they never asked for. Resolut1on is the draw of the event,
// so pushing him off his roles costs more than moving anyone else.
const OFF_ROLE_COST = 100;
const RESOLUT1ON_OFF_ROLE_COST = 400;

function roleCost(player: Player, position: Position): number {
  const preference = player.positions.indexOf(position);
  if (preference >= 0) return preference;
  return player.isResolut1on ? RESOLUT1ON_OFF_ROLE_COST : OFF_ROLE_COST;
}

function permutations<T>(items: T[]): T[][] {
  if (items.length <= 1) return [items];
  const out: T[][] = [];
  for (let i = 0; i < items.length; i++) {
    const rest = [...items.slice(0, i), ...items.slice(i + 1)];
    for (const tail of permutations(rest)) out.push([items[i], ...tail]);
  }
  return out;
}

// How many of a team's players cannot get any role they picked. Kuhn's matching
// on the players-to-roles graph — cheap enough to score every shuffle candidate,
// unlike building the team and trying all permutations.
export function offRoleCount(players: Player[]): number {
  const roleTakenBy = new Map<Position, number>();

  function seat(playerIndex: number, visited: Set<Position>): boolean {
    for (const position of players[playerIndex].positions) {
      if (visited.has(position)) continue;
      visited.add(position);
      const holder = roleTakenBy.get(position);
      if (holder === undefined || seat(holder, visited)) {
        roleTakenBy.set(position, playerIndex);
        return true;
      }
    }
    return false;
  }

  let seated = 0;
  for (let i = 0; i < players.length; i++) {
    if (seat(i, new Set())) seated++;
  }
  return players.length - seated;
}

function assignPositionsToTeam(players: Player[]): Player[] {
  if (players.length !== ALL_POSITIONS.length) {
    // Not a full team — fall back to each player's first choice
    return players.map(p => ({ ...p, assignedPosition: p.positions[0] }));
  }

  let bestCost = Infinity;
  let best: Position[] = ALL_POSITIONS;

  for (const layout of permutations(ALL_POSITIONS)) {
    let cost = 0;
    for (let i = 0; i < players.length; i++) {
      cost += roleCost(players[i], layout[i]);
      if (cost >= bestCost) break;
    }
    if (cost < bestCost) {
      bestCost = cost;
      best = layout;
    }
  }

  return players.map((player, i) => ({ ...player, assignedPosition: best[i] }));
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

// ── How many rounds each player has already sat out ──
// Used to spread the bench fairly: whoever sat least plays next.

function getBenchCounts(rounds: Round[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const round of rounds) {
    for (const id of round.benchedPlayerIds ?? []) {
      counts.set(id, (counts.get(id) ?? 0) + 1);
    }
  }
  return counts;
}

// Bench fairness outranks everything else: the weight is large enough that no
// MMR or opponent-variety gain can buy a seat for someone who already sat out.
// Among equally fair line-ups the score then falls back to MMR balance.
const BENCH_REPEAT_PENALTY = 100_000;

function benchPenalty(benched: Player[], benchCounts: Map<string, number>): number {
  return benched.reduce((sum, p) => sum + (benchCounts.get(p.id) ?? 0) * BENCH_REPEAT_PENALTY, 0);
}

// Keep the bench representative of the roster instead of a place to park the
// strong players. Balancing a round by benching every top player is cheap now
// but expensive later: fair rotation brings them all back in the same round,
// and that round cannot be balanced at all.
const BENCH_SKEW_WEIGHT = 3;

// A player stuck on a role he never picked is worth about 250 MMR of imbalance
const OFF_ROLE_PENALTY = 500;

function benchSkewPenalty(benched: Player[], rosterAverage: number): number {
  if (benched.length === 0) return 0;
  return Math.abs(avgMMR(benched) - rosterAverage) * BENCH_SKEW_WEIGHT;
}

// ── Balance 10 players into 2 teams of 5 ──
// Tries many candidates and picks the most MMR-balanced split

function balancedSplit(players: Player[]): [Player[], Player[]] {
  if (players.length !== PLAYERS_PER_MATCH) {
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

// ── Split the players left over after Resolut1on's match ──
// With 10+ left they play a parallel match and nobody sits; with fewer they
// are the bench. Whoever has sat out most gets a seat in the parallel match first.

function splitLeftover(
  leftover: Player[],
  benchCounts: Map<string, number>,
): { match2?: Match; benched: Player[] } {
  if (leftover.length < PLAYERS_PER_MATCH) {
    return { benched: leftover };
  }

  const byBenchDesc = fisherYates(leftover).sort(
    (a, b) => (benchCounts.get(b.id) ?? 0) - (benchCounts.get(a.id) ?? 0),
  );
  const playing = byBenchDesc.slice(0, PLAYERS_PER_MATCH);
  const benched = byBenchDesc.slice(PLAYERS_PER_MATCH);

  const [pA, pB] = balancedSplit(playing);
  const match2 = makeMatch(
    makeTeam('Team Alpha', assignPositionsToTeam(pA)),
    makeTeam('Team Bravo', assignPositionsToTeam(pB)),
  );

  return { match2, benched };
}

// ══════════════════════════════════════════════════
// MAIN: Generate a regular round (1-4)
// Resolut1on gets 4 NEW teammates he hasn't played with yet.
// Opponent team is balanced from 5 more players.
// The remaining players play a parallel match (20 players) or sit this round
// out (bench), rotated fairly.
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
  const benchCounts = getBenchCounts(previousRounds);
  const rosterAverage = avgMMR(others);

  // Players who haven't been Resolut1on's teammates yet
  const available = others.filter(p => !previousTeammateIds.has(p.id));
  // Players who have already been his teammates
  const alreadyPlayed = others.filter(p => previousTeammateIds.has(p.id));

  // Pick 4 teammates for Resolut1on from available pool
  // Try many candidates for best MMR balance + opponent variety
  const CANDIDATES = 800;
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

    // The rest either play a parallel match (20 players) or sit the round out
    const usedOpponentIds = new Set(selectedOpponents.map(p => p.id));
    const leftover = opponentPool.filter(p => !usedOpponentIds.has(p.id));
    const { match2, benched } = splitLeftover(leftover, benchCounts);

    const match1 = makeMatch(resTeam, opponentTeam);

    // Score: MMR balance + opponent variety penalty + bench fairness penalty
    const repeatOpponentCount = selectedOpponents.filter(p => previousOpponentIds.has(p.id)).length;
    const offRole =
      offRoleCount([resolut1on, ...teammates]) +
      offRoleCount(selectedOpponents) +
      (match2 ? offRoleCount(match2.team1.players) + offRoleCount(match2.team2.players) : 0);

    const score =
      match1.matchMMRDiff * 2 +
      (match2?.matchMMRDiff ?? 0) +
      repeatOpponentCount * 150 +
      benchPenalty(benched, benchCounts) +
      benchSkewPenalty(benched, rosterAverage) +
      offRole * OFF_ROLE_PENALTY;

    if (score < bestScore) {
      bestScore = score;
      bestRound = {
        id: crypto.randomUUID(),
        roundNumber,
        match1,
        ...(match2 ? { match2 } : {}),
        benchedPlayerIds: benched.map(p => p.id),
        isFinal: false,
        timestamp: new Date().toISOString(),
      };
    }
  }

  // Assign PCs
  bestRound!.match1.pcAssignments = assignPCs(bestRound!.match1, PC_LAYOUT.match1);
  if (bestRound!.match2) {
    bestRound!.match2.pcAssignments = assignPCs(bestRound!.match2, PC_LAYOUT.match2);
  }

  return bestRound!;
}

// ══════════════════════════════════════════════════
// FINAL ROUND: Resolut1on + remaining (never-teammates) vs MVP All-Stars
// Everyone else plays a parallel match, or sits it out on a smaller roster.
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

  // Everyone outside the two final teams plays a parallel match, or watches
  const usedIds = new Set([
    resolut1on.id,
    ...resTeammates.map(p => p.id),
    ...allStars.slice(0, 5).map(p => p.id),
  ]);
  const leftover = players.filter(p => !usedIds.has(p.id));
  const { match2, benched } = splitLeftover(leftover, getBenchCounts(previousRounds));

  // Assign PCs
  match1.pcAssignments = assignPCs(match1, PC_LAYOUT.match1);
  if (match2) match2.pcAssignments = assignPCs(match2, PC_LAYOUT.match2);

  return {
    id: crypto.randomUUID(),
    roundNumber,
    match1,
    ...(match2 ? { match2 } : {}),
    benchedPlayerIds: benched.map(p => p.id),
    isFinal: true,
    timestamp: new Date().toISOString(),
  };
}

// ══════════════════════════════════════════════════
// Generate all 4 regular rounds at once.
//
// This plans the whole tournament instead of solving one round at a time.
// Round-by-round is greedy: it balances early rounds by benching the strongest
// players, and 4 rounds x 4 teammates consumes the roster exactly, so the last
// round gets whoever is left and cannot be balanced at all. Planning all four
// teammate groups up front lets a round that hands Resolut1on strong teammates
// also field strong opponents.
// ══════════════════════════════════════════════════

const TEAMMATES_PER_ROUND = 4;
const REGULAR_ROUNDS = 4;

export function generateAllRegularRounds(
  players: Player[],
  existingRounds: Round[],
): Round[] {
  const existing = existingRounds.filter(r => !r.isFinal);

  // Continuing a tournament that already started — keep the round-by-round path
  if (existing.length > 0) {
    const rounds = [...existing];
    for (let i = rounds.length + 1; i <= REGULAR_ROUNDS; i++) {
      rounds.push(generateRound(players, rounds, i));
    }
    return rounds;
  }

  const resolut1on = players.find(p => p.isResolut1on);
  if (!resolut1on) throw new Error('Resolut1on not found in player list');

  const others = players.filter(p => !p.isResolut1on);
  const rosterAverage = avgMMR(others);
  const TEAMMATE_SLOTS = TEAMMATES_PER_ROUND * REGULAR_ROUNDS;

  const PLANS = 250;
  const OPPONENT_TRIES = 60;

  let bestPlan: { teammates: Player[]; opponents: Player[] }[] | null = null;
  let bestScore = Infinity;

  for (let plan = 0; plan < PLANS; plan++) {
    // Deal every teammate slot before scoring, so no round inherits leftovers.
    // A roster shorter than the slot count means some players play with him twice.
    const slots: Player[] = [];
    while (slots.length < TEAMMATE_SLOTS) slots.push(...fisherYates(others));

    const benchCounts = new Map<string, number>();
    const layout: { teammates: Player[]; opponents: Player[] }[] = [];
    let planScore = 0;
    let worstDiff = 0;

    for (let r = 0; r < REGULAR_ROUNDS; r++) {
      const teammates = slots.slice(r * TEAMMATES_PER_ROUND, (r + 1) * TEAMMATES_PER_ROUND);
      const teammateIds = new Set(teammates.map(p => p.id));
      const pool = others.filter(p => !teammateIds.has(p.id));
      const resTeamAverage = avgMMR([resolut1on, ...teammates]);
      const resTeamOffRole = offRoleCount([resolut1on, ...teammates]);

      // Only numbers here — teams are built once, for the winning plan
      let bestRoundScore = Infinity;
      let bestOpponents = pool.slice(0, 5);
      let bestBenched: Player[] = [];
      let bestDiff = Infinity;

      for (let t = 0; t < OPPONENT_TRIES; t++) {
        const shuffled = fisherYates(pool);
        const opponents = shuffled.slice(0, 5);
        const leftover = shuffled.slice(5);
        const benched = leftover.length >= PLAYERS_PER_MATCH
          ? leftover.slice(PLAYERS_PER_MATCH)
          : leftover;

        const diff = Math.abs(resTeamAverage - avgMMR(opponents));
        const score =
          diff * 2 +
          benchPenalty(benched, benchCounts) +
          benchSkewPenalty(benched, rosterAverage) +
          (resTeamOffRole + offRoleCount(opponents)) * OFF_ROLE_PENALTY;

        if (score < bestRoundScore) {
          bestRoundScore = score;
          bestOpponents = opponents;
          bestBenched = benched;
          bestDiff = diff;
        }
      }

      for (const p of bestBenched) {
        benchCounts.set(p.id, (benchCounts.get(p.id) ?? 0) + 1);
      }
      planScore += bestRoundScore;
      worstDiff = Math.max(worstDiff, bestDiff);
      layout.push({ teammates, opponents: bestOpponents });
    }

    // Weight the worst round too, so three great rounds cannot hide a blowout
    const total = planScore + worstDiff * 4;
    if (total < bestScore) {
      bestScore = total;
      bestPlan = layout;
    }
  }

  const rounds: Round[] = [];

  for (let i = 0; i < REGULAR_ROUNDS; i++) {
    const { teammates, opponents } = bestPlan![i];

    const resTeam = makeTeam('Resolut1on Team', assignPositionsToTeam([resolut1on, ...teammates]));
    const opponentTeam = makeTeam('Opponents', assignPositionsToTeam(opponents));
    const match1 = makeMatch(resTeam, opponentTeam);

    const usedIds = new Set([
      resolut1on.id,
      ...teammates.map(p => p.id),
      ...opponents.map(p => p.id),
    ]);
    const leftover = others.filter(p => !usedIds.has(p.id));
    const { match2, benched } = splitLeftover(leftover, getBenchCounts(rounds));

    match1.pcAssignments = assignPCs(match1, PC_LAYOUT.match1);
    if (match2) match2.pcAssignments = assignPCs(match2, PC_LAYOUT.match2);

    rounds.push({
      id: crypto.randomUUID(),
      roundNumber: i + 1,
      match1,
      ...(match2 ? { match2 } : {}),
      benchedPlayerIds: benched.map(p => p.id),
      isFinal: false,
      timestamp: new Date().toISOString(),
    });
  }

  return rounds;
}

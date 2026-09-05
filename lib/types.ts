export type Position = 1 | 2 | 3 | 4 | 5;

export interface Player {
  id: string;
  name: string;
  mmr: number;
  positions: Position[];
  assignedPosition?: Position;
  isResolut1on?: boolean;
  isReserve?: boolean;   // registered but kept out of the shuffle until called up
}

export interface Team {
  id: string;
  name: string;
  players: Player[];
  averageMMR: number;
}

export interface PCAssignment {
  pcNumber: number;
  playerId: string;
  playerName: string;
  teamName: string;
  side: 'radiant' | 'dire';
  position: Position;
}

export interface Match {
  id: string;
  team1: Team;
  team2: Team;
  matchMMRDiff: number;
  pcAssignments: PCAssignment[];
  winner?: 'team1' | 'team2';
}

export interface Round {
  id: string;
  roundNumber: number;
  match1: Match;              // Resolut1on's match (or the final)
  match2?: Match;             // parallel match — only when 20 players are in
  benchedPlayerIds: string[]; // players sitting this round out
  isFinal: boolean;
  timestamp: string;
}

export interface TournamentState {
  players: Player[];
  rounds: Round[];
  currentRoundIndex: number;
  totalRoundsTarget: number;  // 4 regular rounds (fixed) + 1 final = 5
  isLocked: boolean;
  mvpAllStarIds: string[];    // player IDs selected as MVP All-Stars for final
}

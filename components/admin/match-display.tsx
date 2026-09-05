'use client';

import type { Match } from '@/lib/types';
import { TeamCard } from './team-card';

interface Props {
  match: Match;
  matchLabel: string;
  pcRange: string;
  onSetWinner?: (winner: 'team1' | 'team2' | undefined) => void;
}

export function MatchDisplay({ match, matchLabel, pcRange, onSetWinner }: Props) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider">
          {matchLabel}
        </h3>
        <span className="text-xs text-white/30">PC {pcRange}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] gap-3 items-start">
        <TeamCard
          team={match.team1}
          pcAssignments={match.pcAssignments}
          side="radiant"
          isWinner={match.winner === 'team1'}
        />

        <div className="flex flex-col items-center justify-center py-6 lg:py-12 gap-3">
          <span className="text-2xl font-black text-white/20">VS</span>
          <span className={`text-xs tabular-nums ${
            match.matchMMRDiff < 200 ? 'text-emerald-400' :
            match.matchMMRDiff < 500 ? 'text-amber-400' :
            'text-red-400'
          }`}>
            {match.matchMMRDiff === 0 ? 'Equal' : `${match.matchMMRDiff} MMR diff`}
          </span>

          {onSetWinner && (
            <div className="flex flex-col items-stretch gap-1.5 w-40">
              <span className="text-[10px] uppercase tracking-wider text-white/30 text-center">
                Winner
              </span>
              {(['team1', 'team2'] as const).map(side => {
                const team = side === 'team1' ? match.team1 : match.team2;
                const isWinner = match.winner === side;
                return (
                  <button
                    key={side}
                    onClick={() => onSetWinner(isWinner ? undefined : side)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                      isWinner
                        ? 'border-emerald-500/50 bg-emerald-500/15 text-emerald-300'
                        : 'border-white/[0.08] bg-white/[0.02] text-white/50 hover:bg-white/[0.06] hover:text-white/80'
                    }`}
                  >
                    {team.name}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <TeamCard
          team={match.team2}
          pcAssignments={match.pcAssignments}
          side="dire"
          isWinner={match.winner === 'team2'}
        />
      </div>
    </div>
  );
}

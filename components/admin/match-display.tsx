'use client';

import type { Match } from '@/lib/types';
import { TeamCard } from './team-card';

interface Props {
  match: Match;
  matchLabel: string;
  pcRange: string;
}

export function MatchDisplay({ match, matchLabel, pcRange }: Props) {
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
        />

        <div className="flex flex-col items-center justify-center py-6 lg:py-12">
          <span className="text-2xl font-black text-white/20">VS</span>
          <span className={`text-xs mt-1 tabular-nums ${
            match.matchMMRDiff < 200 ? 'text-emerald-400' :
            match.matchMMRDiff < 500 ? 'text-amber-400' :
            'text-red-400'
          }`}>
            {match.matchMMRDiff === 0 ? 'Equal' : `${match.matchMMRDiff} MMR diff`}
          </span>
        </div>

        <TeamCard
          team={match.team2}
          pcAssignments={match.pcAssignments}
          side="dire"
        />
      </div>
    </div>
  );
}

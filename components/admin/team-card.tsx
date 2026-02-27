'use client';

import type { Team, PCAssignment, Position } from '@/lib/types';
import { POSITION_LABELS, POSITION_COLORS, TEAM_COLORS } from '@/lib/constants';
import { Star, Monitor } from 'lucide-react';

interface Props {
  team: Team;
  pcAssignments: PCAssignment[];
  side: 'radiant' | 'dire';
}

export function TeamCard({ team, pcAssignments, side }: Props) {
  const teamKey = team.name.replace('Team ', '');
  const colors = TEAM_COLORS[teamKey] || TEAM_COLORS.Alpha;

  const getPos = (p: { assignedPosition?: Position; positions: Position[] }) =>
    p.assignedPosition ?? p.positions[0];
  const sortedPlayers = [...team.players].sort((a, b) => getPos(a) - getPos(b));

  return (
    <div className={`rounded-xl border ${colors.border} ${colors.bg} overflow-hidden`}>
      <div className={`px-4 py-3 border-b ${colors.border} flex items-center justify-between`}>
        <div className="flex items-center gap-2">
          <h4 className={`font-semibold ${colors.text}`}>{team.name}</h4>
          <span className="text-xs text-white/40 uppercase">{side}</span>
        </div>
        <span className="text-sm text-white/60 tabular-nums">
          Avg MMR: <span className="text-white font-medium">{team.averageMMR.toLocaleString()}</span>
        </span>
      </div>

      <div className="divide-y divide-white/[0.04]">
        {sortedPlayers.map(player => {
          const pc = pcAssignments.find(a => a.playerId === player.id);
          const isResolut1on = player.isResolut1on;

          return (
            <div
              key={player.id}
              className={`px-4 py-2.5 flex items-center gap-3 ${
                isResolut1on ? 'bg-amber-500/[0.06]' : ''
              }`}
            >
              <span className={`px-2 py-0.5 rounded text-xs font-medium border ${POSITION_COLORS[getPos(player)]}`}>
                {POSITION_LABELS[getPos(player)]}
              </span>

              <span className={`flex-1 font-medium text-sm flex items-center gap-1.5 ${
                isResolut1on ? 'text-amber-400' : 'text-white/90'
              }`}>
                {isResolut1on && <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />}
                {player.name}
              </span>

              <span className="text-sm text-white/50 tabular-nums w-16 text-right">
                {player.mmr.toLocaleString()}
              </span>

              {pc && (
                <span className="flex items-center gap-1 text-xs text-white/40 w-14 justify-end">
                  <Monitor className="w-3 h-3" />
                  PC {pc.pcNumber}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

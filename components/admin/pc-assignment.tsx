'use client';

import type { Round, PCAssignment as PCAssignmentType } from '@/lib/types';
import { POSITION_LABELS, TEAM_COLORS } from '@/lib/constants';
import { Monitor } from 'lucide-react';
import { RoundNavigator } from './round-navigator';

interface Props {
  rounds: Round[];
  currentIndex: number;
  onSelectRound: (index: number) => void;
}

function PCCell({ assignment }: { assignment: PCAssignmentType | undefined; pcNumber: number }) {
  if (!assignment) {
    return (
      <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3 flex flex-col items-center justify-center min-h-[90px] opacity-50">
        <Monitor className="w-5 h-5 text-white/20 mb-1" />
        <span className="text-xs text-white/20">Empty</span>
      </div>
    );
  }

  const teamKey = assignment.teamName.replace('Team ', '');
  const colors = TEAM_COLORS[teamKey] || TEAM_COLORS.Alpha;

  return (
    <div className={`rounded-lg border ${colors.border} ${colors.bg} p-3 flex flex-col items-center min-h-[90px]`}>
      <div className="flex items-center gap-1 mb-1">
        <Monitor className={`w-4 h-4 ${colors.text}`} />
        <span className={`text-sm font-bold ${colors.text}`}>PC {assignment.pcNumber}</span>
      </div>
      <span className="text-sm font-medium text-white/90 text-center truncate w-full">
        {assignment.playerName}
      </span>
      <span className="text-[10px] text-white/40 mt-0.5">
        {POSITION_LABELS[assignment.position]}
      </span>
    </div>
  );
}

export function PCAssignment({ rounds, currentIndex, onSelectRound }: Props) {
  if (rounds.length === 0) {
    return (
      <div className="rounded-xl border border-white/[0.08] bg-white/[0.04] p-12 text-center text-white/40">
        Generate rounds first to see PC assignments.
      </div>
    );
  }

  const round = rounds[currentIndex];
  const allAssignments = [
    ...round.match1.pcAssignments,
    ...round.match2.pcAssignments,
  ];

  const getAssignment = (pc: number) => allAssignments.find(a => a.pcNumber === pc);

  return (
    <div className="space-y-6">
      <RoundNavigator rounds={rounds} currentIndex={currentIndex} onSelectRound={onSelectRound} />

      {/* Match 1 Area */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider">
          Match 1 Area — PC 1–10
        </h3>
        <div className="rounded-xl border border-white/[0.08] bg-white/[0.04] p-4 space-y-4">
          <div>
            <span className="text-xs text-emerald-400/60 uppercase tracking-wider mb-2 block">Radiant</span>
            <div className="grid grid-cols-5 gap-2">
              {[1, 2, 3, 4, 5].map(pc => (
                <PCCell key={pc} assignment={getAssignment(pc)} pcNumber={pc} />
              ))}
            </div>
          </div>
          <div>
            <span className="text-xs text-red-400/60 uppercase tracking-wider mb-2 block">Dire</span>
            <div className="grid grid-cols-5 gap-2">
              {[6, 7, 8, 9, 10].map(pc => (
                <PCCell key={pc} assignment={getAssignment(pc)} pcNumber={pc} />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Match 2 Area */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider">
          Match 2 Area — PC 11–20
        </h3>
        <div className="rounded-xl border border-white/[0.08] bg-white/[0.04] p-4 space-y-4">
          <div>
            <span className="text-xs text-emerald-400/60 uppercase tracking-wider mb-2 block">Radiant</span>
            <div className="grid grid-cols-5 gap-2">
              {[11, 12, 13, 14, 15].map(pc => (
                <PCCell key={pc} assignment={getAssignment(pc)} pcNumber={pc} />
              ))}
            </div>
          </div>
          <div>
            <span className="text-xs text-red-400/60 uppercase tracking-wider mb-2 block">Dire</span>
            <div className="grid grid-cols-5 gap-2">
              {[16, 17, 18, 19, 20].map(pc => (
                <PCCell key={pc} assignment={getAssignment(pc)} pcNumber={pc} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

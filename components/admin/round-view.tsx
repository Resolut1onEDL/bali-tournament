'use client';

import type { Round } from '@/lib/types';
import { MatchDisplay } from './match-display';
import { Separator } from '@/components/ui/separator';

interface Props {
  round: Round;
}

export function RoundView({ round }: Props) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">
          {round.isFinal ? 'Final' : `Round ${round.roundNumber}`}
          {round.isFinal && <span className="ml-2 text-sm text-fuchsia-400 font-medium">MVP All-Stars Match</span>}
        </h2>
        <span className="text-xs text-white/30">
          {new Date(round.timestamp).toLocaleString()}
        </span>
      </div>

      <MatchDisplay
        match={round.match1}
        matchLabel={round.isFinal ? 'Final Match' : "Resolut1on's Match"}
        pcRange="1–10"
      />

      <Separator className="bg-white/[0.08]" />

      <MatchDisplay
        match={round.match2}
        matchLabel="Match 2"
        pcRange="11–20"
      />
    </div>
  );
}

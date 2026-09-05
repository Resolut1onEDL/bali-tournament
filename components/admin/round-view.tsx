'use client';

import type { Player, Round } from '@/lib/types';
import { MatchDisplay } from './match-display';
import { Separator } from '@/components/ui/separator';
import { Coffee } from 'lucide-react';

interface Props {
  round: Round;
  players: Player[];
  onSetWinner?: (match: 'match1' | 'match2', winner: 'team1' | 'team2' | undefined) => void;
}

export function RoundView({ round, players, onSetWinner }: Props) {
  const benched = (round.benchedPlayerIds ?? [])
    .map(id => players.find(p => p.id === id))
    .filter((p): p is Player => Boolean(p));

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
        onSetWinner={onSetWinner && (winner => onSetWinner('match1', winner))}
      />

      {round.match2 && (
        <>
          <Separator className="bg-white/[0.08]" />

          <MatchDisplay
            match={round.match2}
            matchLabel="Parallel Match"
            pcRange="11–20"
            onSetWinner={onSetWinner && (winner => onSetWinner('match2', winner))}
          />
        </>
      )}

      {benched.length > 0 && (
        <>
          <Separator className="bg-white/[0.08]" />

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Coffee className="w-4 h-4 text-white/40" />
              <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider">
                Sitting out this round — {benched.length}
              </h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {benched.map(player => (
                <span
                  key={player.id}
                  className="px-3 py-1.5 rounded-lg border border-white/[0.08] bg-white/[0.02] text-sm text-white/60"
                >
                  {player.name}
                  <span className="ml-2 text-xs text-white/30 tabular-nums">
                    {player.mmr > 0 ? player.mmr.toLocaleString() : '—'}
                  </span>
                </span>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

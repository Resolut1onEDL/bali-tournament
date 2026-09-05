'use client';

import type { Player, Round } from '@/lib/types';
import { MIN_PLAYERS } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { Shuffle, Zap, Trash2, Trophy } from 'lucide-react';

interface Props {
  players: Player[];
  rounds: Round[];
  hasResolut1on: boolean;
  mvpAllStarIds: string[];
  onGenerateRound: () => void;
  onGenerateAllRounds: () => void;
  onGenerateFinal: () => void;
  onClearRounds: () => void;
}

export function ShuffleControls({
  players,
  rounds,
  hasResolut1on,
  mvpAllStarIds,
  onGenerateRound,
  onGenerateAllRounds,
  onGenerateFinal,
  onClearRounds,
}: Props) {
  const regularRounds = rounds.filter(r => !r.isFinal);
  const hasFinal = rounds.some(r => r.isFinal);
  const playersWithoutMMR = players.filter(p => p.mmr <= 0);
  const canShuffle =
    players.length >= MIN_PLAYERS &&
    hasResolut1on &&
    playersWithoutMMR.length === 0 &&
    regularRounds.length < 4;
  const canFinal = regularRounds.length === 4 && !hasFinal && mvpAllStarIds.length === 5;

  const missingParts: string[] = [];
  if (players.length < MIN_PLAYERS) missingParts.push(`${MIN_PLAYERS - players.length} more players`);
  if (!hasResolut1on) missingParts.push('mark Resolut1on');
  if (playersWithoutMMR.length > 0) {
    missingParts.push(`MMR for ${playersWithoutMMR.map(p => p.name).join(', ')}`);
  }

  return (
    <div className="rounded-xl border border-white/[0.08] bg-white/[0.04] p-6 space-y-4">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold">Shuffle Controls</h3>
          <p className="text-sm text-white/50 mt-1">
            {missingParts.length > 0
              ? `Need: ${missingParts.join(', ')}`
              : hasFinal
              ? 'Tournament complete — 4 rounds + final'
              : regularRounds.length === 4
              ? 'All 4 rounds done — select MVP All-Stars for final'
              : `Round ${regularRounds.length} / 4 completed — ${players.length} players, ${
                  players.length >= MIN_PLAYERS * 2
                    ? 'two matches in parallel'
                    : `${players.length - MIN_PLAYERS} on the bench each round`
                }`
            }
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            onClick={onGenerateRound}
            disabled={!canShuffle}
            className="bg-amber-500 hover:bg-amber-600 text-black font-semibold gap-2"
          >
            <Shuffle className="w-4 h-4" />
            Round {regularRounds.length + 1}
          </Button>

          {regularRounds.length === 0 && (
            <Button
              onClick={onGenerateAllRounds}
              disabled={!canShuffle}
              variant="outline"
              className="border-amber-500/30 text-amber-400 hover:bg-amber-500/10 gap-2"
            >
              <Zap className="w-4 h-4" />
              All 4 Rounds
            </Button>
          )}

          {regularRounds.length === 4 && !hasFinal && (
            <Button
              onClick={onGenerateFinal}
              disabled={!canFinal}
              className="bg-fuchsia-500 hover:bg-fuchsia-600 text-white font-semibold gap-2"
            >
              <Trophy className="w-4 h-4" />
              Generate Final
            </Button>
          )}

          {rounds.length > 0 && (
            <Button
              onClick={onClearRounds}
              variant="outline"
              className="border-red-500/30 text-red-400 hover:bg-red-500/10 gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Status bar */}
      <div className="flex gap-1">
        {[1, 2, 3, 4].map(i => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full ${
              i <= regularRounds.length ? 'bg-amber-500' : 'bg-white/[0.08]'
            }`}
          />
        ))}
        <div
          className={`h-1.5 flex-1 rounded-full ${
            hasFinal ? 'bg-fuchsia-500' : 'bg-white/[0.08]'
          }`}
        />
      </div>
    </div>
  );
}

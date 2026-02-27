'use client';

import type { Round } from '@/lib/types';

interface Props {
  rounds: Round[];
  currentIndex: number;
  onSelectRound: (index: number) => void;
}

export function RoundNavigator({ rounds, currentIndex, onSelectRound }: Props) {
  if (rounds.length === 0) return null;

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-2">
      {rounds.map((round, i) => (
        <button
          key={round.id}
          onClick={() => onSelectRound(i)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
            i === currentIndex
              ? round.isFinal ? 'bg-fuchsia-500 text-white' : 'bg-amber-500 text-black'
              : 'bg-white/[0.04] text-white/60 hover:bg-white/[0.08] hover:text-white/80'
          }`}
        >
          {round.isFinal ? 'Final' : `Round ${round.roundNumber}`}
        </button>
      ))}
    </div>
  );
}

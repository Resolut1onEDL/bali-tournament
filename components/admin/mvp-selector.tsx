'use client';

import type { Player } from '@/lib/types';
import { POSITION_LABELS, POSITION_COLORS } from '@/lib/constants';
import { Star, Trophy } from 'lucide-react';

interface Props {
  players: Player[];
  selectedIds: string[];
  onToggle: (id: string) => void;
}

export function MvpSelector({ players, selectedIds, onToggle }: Props) {
  const others = players.filter(p => !p.isResolut1on);
  const sorted = [...others].sort((a, b) => b.mmr - a.mmr);

  return (
    <div className="rounded-xl border border-fuchsia-500/20 bg-fuchsia-500/[0.04] p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-fuchsia-400" />
          <h3 className="text-lg font-semibold text-fuchsia-400">MVP All-Stars Selection</h3>
        </div>
        <span className={`text-sm font-medium ${
          selectedIds.length === 5 ? 'text-fuchsia-400' : 'text-white/50'
        }`}>
          {selectedIds.length}/5 selected
        </span>
      </div>

      <p className="text-sm text-white/40">
        Select 5 players for the All-Stars team. They will face Resolut1on in the final round.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {sorted.map(player => {
          const isSelected = selectedIds.includes(player.id);
          return (
            <button
              key={player.id}
              onClick={() => onToggle(player.id)}
              disabled={!isSelected && selectedIds.length >= 5}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-lg border text-left transition-all ${
                isSelected
                  ? 'border-fuchsia-500/40 bg-fuchsia-500/10'
                  : selectedIds.length >= 5
                  ? 'border-white/[0.04] bg-white/[0.02] opacity-40 cursor-not-allowed'
                  : 'border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/[0.1]'
              }`}
            >
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                isSelected ? 'border-fuchsia-400 bg-fuchsia-500' : 'border-white/20'
              }`}>
                {isSelected && <Star className="w-3 h-3 text-white fill-white" />}
              </div>

              <span className="flex-1 font-medium text-sm text-white/90 truncate">
                {player.name}
              </span>

              <div className="flex gap-1">
                {player.positions.map(pos => (
                  <span key={pos} className={`px-1.5 py-0.5 rounded text-[10px] font-medium border ${POSITION_COLORS[pos]}`}>
                    {POSITION_LABELS[pos]}
                  </span>
                ))}
              </div>

              <span className="text-xs text-white/40 tabular-nums w-12 text-right">
                {player.mmr.toLocaleString()}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

'use client';

import type { Player, Position } from '@/lib/types';
import { POSITION_LABELS, POSITION_COLORS, TOTAL_PLAYERS } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { Star, Pencil, Trash2 } from 'lucide-react';

interface Props {
  players: Player[];
  isLocked: boolean;
  onEditPlayer: (player: Player) => void;
  onRemovePlayer: (id: string) => void;
}

export function PlayerList({ players, isLocked, onEditPlayer, onRemovePlayer }: Props) {
  // Count players who can play each position (primary = first in list)
  const positionCounts: Record<Position, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const p of players) {
    for (const pos of p.positions) {
      positionCounts[pos]++;
    }
  }

  const sortedPlayers = [...players].sort((a, b) => b.mmr - a.mmr);

  return (
    <div className="rounded-xl border border-white/[0.08] bg-white/[0.04] overflow-hidden">
      {/* Position distribution */}
      <div className="px-6 py-4 border-b border-white/[0.08]">
        <div className="flex flex-wrap gap-3">
          {([1, 2, 3, 4, 5] as Position[]).map(pos => (
            <div key={pos} className={`px-3 py-1 rounded-full text-xs font-medium border ${POSITION_COLORS[pos]}`}>
              {POSITION_LABELS[pos]}: {positionCounts[pos]}/{TOTAL_PLAYERS / 5}
            </div>
          ))}
        </div>
      </div>

      {/* Player table */}
      {players.length === 0 ? (
        <div className="px-6 py-12 text-center text-white/40">
          No players registered yet. Add players above.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/[0.08] text-white/50 text-sm">
                <th className="px-6 py-3 text-left font-medium">#</th>
                <th className="px-6 py-3 text-left font-medium">Name</th>
                <th className="px-6 py-3 text-left font-medium">MMR</th>
                <th className="px-6 py-3 text-left font-medium">Position</th>
                <th className="px-6 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedPlayers.map((player, i) => (
                <tr
                  key={player.id}
                  className={`border-b border-white/[0.04] hover:bg-white/[0.03] transition-colors ${
                    player.isResolut1on ? 'bg-amber-500/[0.05]' : ''
                  }`}
                >
                  <td className="px-6 py-3 text-white/40 text-sm">{i + 1}</td>
                  <td className="px-6 py-3 font-medium flex items-center gap-2">
                    {player.isResolut1on && <Star className="w-4 h-4 text-amber-400 fill-amber-400" />}
                    <span className={player.isResolut1on ? 'text-amber-400' : ''}>
                      {player.name}
                    </span>
                  </td>
                  <td className="px-6 py-3 tabular-nums">
                    {player.mmr > 0 ? (
                      <span className="text-white/80">{player.mmr.toLocaleString()}</span>
                    ) : (
                      <span className="text-red-400">not set</span>
                    )}
                  </td>
                  <td className="px-6 py-3">
                    <div className="flex flex-wrap gap-1">
                      {player.positions.map(pos => (
                        <span key={pos} className={`px-2 py-0.5 rounded-full text-xs font-medium border ${POSITION_COLORS[pos]}`}>
                          {POSITION_LABELS[pos]}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEditPlayer(player)}
                        className="text-white/40 hover:text-white hover:bg-white/[0.06] h-8 w-8 p-0"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onRemovePlayer(player.id)}
                        disabled={isLocked}
                        className="text-white/40 hover:text-red-400 hover:bg-red-500/10 h-8 w-8 p-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

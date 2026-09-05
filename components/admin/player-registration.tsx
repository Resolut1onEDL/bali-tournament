'use client';

import { useState, useEffect } from 'react';
import type { Player, Position } from '@/lib/types';
import { POSITION_LABELS, POSITION_COLORS, TOTAL_PLAYERS, MAX_PLAYERS } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface Props {
  players: Player[];
  editingPlayer: Player | null;
  isLocked: boolean;
  onAddPlayer: (player: Omit<Player, 'id'>) => void;
  onUpdatePlayer: (player: Player) => void;
  onCancelEdit: () => void;
}

export function PlayerRegistration({
  players,
  editingPlayer,
  isLocked,
  onAddPlayer,
  onUpdatePlayer,
  onCancelEdit,
}: Props) {
  const [name, setName] = useState(editingPlayer?.name ?? '');
  const [mmr, setMmr] = useState(editingPlayer?.mmr?.toString() ?? '');
  const [positions, setPositions] = useState<Position[]>(editingPlayer?.positions ?? [1]);
  const [isResolut1on, setIsResolut1on] = useState(editingPlayer?.isResolut1on ?? false);
  const [isReserve, setIsReserve] = useState(editingPlayer?.isReserve ?? false);

  const isEditing = !!editingPlayer;
  const activeCount = players.filter(p => !p.isReserve).length;
  // The cap applies to the playing roster; reserves can always be added
  const isFull = activeCount >= MAX_PLAYERS && !isReserve && !isEditing;

  useEffect(() => {
    if (editingPlayer) {
      setName(editingPlayer.name);
      setMmr(editingPlayer.mmr.toString());
      setPositions(editingPlayer.positions);
      setIsResolut1on(editingPlayer.isResolut1on ?? false);
      setIsReserve(editingPlayer.isReserve ?? false);
    } else {
      setName('');
      setMmr('');
      setPositions([1]);
      setIsResolut1on(false);
      setIsReserve(false);
    }
  }, [editingPlayer]);

  function togglePosition(pos: Position) {
    setPositions(prev => {
      if (prev.includes(pos)) {
        if (prev.length <= 1) return prev; // at least one required
        return prev.filter(p => p !== pos).sort((a, b) => a - b);
      }
      return [...prev, pos].sort((a, b) => a - b);
    });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const mmrNum = parseInt(mmr, 10);
    if (!name.trim() || isNaN(mmrNum) || mmrNum < 0 || positions.length === 0) return;

    if (isEditing) {
      onUpdatePlayer({
        ...editingPlayer!,
        name: name.trim(),
        mmr: mmrNum,
        positions,
        isResolut1on,
        isReserve,
      });
    } else {
      onAddPlayer({
        name: name.trim(),
        mmr: mmrNum,
        positions,
        isResolut1on,
        isReserve,
      });
    }

    setName('');
    setMmr('');
    setPositions([1]);
    setIsResolut1on(false);
    setIsReserve(false);
  }

  function handleCancel() {
    setName('');
    setMmr('');
    setPositions([1]);
    setIsResolut1on(false);
    setIsReserve(false);
    onCancelEdit();
  }

  const hasResolut1on = players.some(p => p.isResolut1on && p.id !== editingPlayer?.id);

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-white/[0.08] bg-white/[0.04] p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">
          {isEditing ? 'Edit Player' : 'Add Player'}
        </h3>
        <span className="text-sm text-white/50">
          {activeCount}/{TOTAL_PLAYERS} playing
          {players.length - activeCount > 0 && ` · ${players.length - activeCount} reserve`}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Player name"
            disabled={isLocked && !isEditing}
            className="bg-white/[0.06] border-white/[0.1] text-white placeholder:text-white/30"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="mmr">MMR</Label>
          <Input
            id="mmr"
            type="number"
            value={mmr}
            onChange={e => setMmr(e.target.value)}
            placeholder="e.g. 5000"
            min={0}
            max={18000}
            disabled={isLocked && !isEditing}
            className="bg-white/[0.06] border-white/[0.1] text-white placeholder:text-white/30"
          />
        </div>

        <div className="flex items-end">
          <div className="flex gap-2">
            <Button
              type="submit"
              disabled={(isLocked && !isEditing) || isFull || !name.trim() || !mmr || positions.length === 0}
              className="bg-amber-500 hover:bg-amber-600 text-black font-semibold"
            >
              {isEditing ? 'Update' : 'Add'}
            </Button>
            {isEditing && (
              <Button type="button" variant="outline" onClick={handleCancel}
                className="border-white/[0.15] text-white/70 hover:bg-white/[0.06]">
                Cancel
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Position multi-select */}
      <div className="space-y-2">
        <Label>Positions <span className="text-white/40 font-normal">(select one or more)</span></Label>
        <div className="flex flex-wrap gap-2">
          {([1, 2, 3, 4, 5] as Position[]).map(pos => {
            const isSelected = positions.includes(pos);
            return (
              <button
                key={pos}
                type="button"
                onClick={() => togglePosition(pos)}
                disabled={isLocked && !isEditing}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${
                  isSelected
                    ? POSITION_COLORS[pos]
                    : 'border-white/[0.08] text-white/30 bg-white/[0.02] hover:bg-white/[0.04] hover:text-white/50'
                }`}
              >
                {pos} — {POSITION_LABELS[pos]}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="resolut1on"
          checked={isResolut1on}
          onChange={e => setIsResolut1on(e.target.checked)}
          disabled={hasResolut1on && !editingPlayer?.isResolut1on}
          className="accent-amber-500"
        />
        <Label htmlFor="resolut1on" className="text-sm text-white/60 cursor-pointer">
          This is Resolut1on {hasResolut1on && !editingPlayer?.isResolut1on && '(already assigned)'}
        </Label>

        <span className="mx-2 text-white/15">|</span>

        <input
          type="checkbox"
          id="reserve"
          checked={isReserve}
          onChange={e => setIsReserve(e.target.checked)}
          disabled={isResolut1on}
          className="accent-sky-500"
        />
        <Label htmlFor="reserve" className="text-sm text-white/60 cursor-pointer">
          Reserve <span className="text-white/30">(not shuffled until called up)</span>
        </Label>
      </div>
    </form>
  );
}

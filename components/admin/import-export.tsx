'use client';

import { useRef } from 'react';
import type { TournamentState } from '@/lib/types';
import { exportAsJSON, importFromJSON } from '@/lib/storage';
import { Button } from '@/components/ui/button';
import { Download, Upload, Trash2 } from 'lucide-react';

interface Props {
  state: TournamentState;
  onImport: (state: TournamentState) => void;
  onReset: () => void;
}

export function ImportExport({ state, onImport, onReset }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleExport() {
    const json = exportAsJSON(state);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `showmatch-data-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const parsed = importFromJSON(text);
      if (parsed) {
        onImport(parsed);
      } else {
        alert('Invalid file format');
      }
    };
    reader.readAsText(file);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }

  function handleReset() {
    if (confirm('Are you sure? This will delete all players and rounds.')) {
      if (confirm('This action cannot be undone. Continue?')) {
        onReset();
      }
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-white/[0.08] bg-white/[0.04] p-6 space-y-4">
        <h3 className="text-lg font-semibold">Data Management</h3>

        <div className="flex flex-wrap gap-3">
          <Button
            onClick={handleExport}
            variant="outline"
            className="border-white/[0.15] text-white/70 hover:bg-white/[0.06] gap-2"
          >
            <Download className="w-4 h-4" />
            Export JSON
          </Button>

          <Button
            onClick={() => fileInputRef.current?.click()}
            variant="outline"
            className="border-white/[0.15] text-white/70 hover:bg-white/[0.06] gap-2"
          >
            <Upload className="w-4 h-4" />
            Import JSON
          </Button>

          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleImport}
            className="hidden"
          />
        </div>
      </div>

      <div className="rounded-xl border border-red-500/20 bg-red-500/[0.04] p-6 space-y-4">
        <h3 className="text-lg font-semibold text-red-400">Danger Zone</h3>
        <p className="text-sm text-white/50">
          This will permanently delete all players, rounds, and settings.
        </p>
        <Button
          onClick={handleReset}
          variant="outline"
          className="border-red-500/30 text-red-400 hover:bg-red-500/10 gap-2"
        >
          <Trash2 className="w-4 h-4" />
          Reset Everything
        </Button>
      </div>

      <div className="rounded-xl border border-white/[0.08] bg-white/[0.04] p-6">
        <h3 className="text-lg font-semibold mb-2">Stats</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-white/40">Players</span>
            <p className="text-2xl font-bold tabular-nums">{state.players.length}</p>
          </div>
          <div>
            <span className="text-white/40">Rounds</span>
            <p className="text-2xl font-bold tabular-nums">{state.rounds.length}</p>
          </div>
          <div>
            <span className="text-white/40">Target</span>
            <p className="text-2xl font-bold tabular-nums">{state.totalRoundsTarget}</p>
          </div>
          <div>
            <span className="text-white/40">Status</span>
            <p className="text-2xl font-bold">
              {state.isLocked ? '🔒' : '🔓'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

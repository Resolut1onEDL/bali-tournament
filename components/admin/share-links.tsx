'use client';

import { useState } from 'react';
import type { Player, Round } from '@/lib/types';
import { encodeTournament, packTournament } from '@/lib/share';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Link2, Check } from 'lucide-react';

interface Props {
  rounds: Round[];
  players: Player[];
  discordUrl: string;
  onDiscordUrlChange: (url: string) => void;
}

export function ShareLinks({ rounds, players, discordUrl, onDiscordUrlChange }: Props) {
  const [copied, setCopied] = useState<string | null>(null);

  const regular = rounds.filter(r => !r.isFinal);
  const final = rounds.find(r => r.isFinal);

  async function buildLink(selected: Round[]): Promise<string> {
    const nameById = new Map(players.map(p => [p.id, p.name]));
    const benchedNames = selected.map(round =>
      (round.benchedPlayerIds ?? [])
        .map(id => nameById.get(id))
        .filter((name): name is string => Boolean(name)),
    );
    const encoded = await encodeTournament(
      packTournament(selected, benchedNames, discordUrl.trim() || undefined),
    );
    return `${window.location.origin}/round#${encoded}`;
  }

  async function copy(selected: Round[], key: string) {
    const link = await buildLink(selected);
    try {
      await navigator.clipboard.writeText(link);
    } catch {
      window.prompt('Скопируй ссылку вручную:', link);
    }
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  }

  return (
    <div className="rounded-xl border border-white/[0.08] bg-white/[0.04] p-6 space-y-4">
      <div>
        <h3 className="text-lg font-semibold">Ссылка для участников</h3>
        <p className="text-sm text-white/50 mt-1">
          Составы упакованы в саму ссылку — кинь её в общий чат, каждый найдёт свой ПК и канал.
          Каналы закреплены за командами: 1 — Resolut1on, 2 — соперники, 3 и 4 — параллельный матч.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="discord">Инвайт в Discord <span className="text-white/40 font-normal">(необязательно)</span></Label>
        <Input
          id="discord"
          value={discordUrl}
          onChange={e => onDiscordUrlChange(e.target.value)}
          placeholder="https://discord.gg/..."
          className="bg-white/[0.06] border-white/[0.1] text-white placeholder:text-white/30"
        />
      </div>

      <div className="flex flex-wrap gap-3">
        <Button
          onClick={() => copy(regular, 'regular')}
          disabled={regular.length === 0}
          className="bg-amber-500 hover:bg-amber-600 text-black font-semibold gap-2"
        >
          {copied === 'regular' ? <Check className="w-4 h-4" /> : <Link2 className="w-4 h-4" />}
          {copied === 'regular' ? 'Скопировано' : `Ссылка на раунды 1–${regular.length || 4}`}
        </Button>

        <Button
          onClick={() => final && copy([final], 'final')}
          disabled={!final}
          variant="outline"
          className="border-fuchsia-500/30 text-fuchsia-400 hover:bg-fuchsia-500/10 gap-2"
        >
          {copied === 'final' ? <Check className="w-4 h-4" /> : <Link2 className="w-4 h-4" />}
          {copied === 'final' ? 'Скопировано' : 'Ссылка на финал'}
        </Button>
      </div>

      {regular.length === 0 && (
        <p className="text-sm text-white/30">Сначала сгенерируй раунды.</p>
      )}
    </div>
  );
}

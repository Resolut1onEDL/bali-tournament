'use client';

import type { Player, Round } from '@/lib/types';
import { Star, Trophy } from 'lucide-react';

interface Props {
  players: Player[];
  rounds: Round[];
}

interface Row {
  player: Player;
  played: number;
  wins: number;
  losses: number;
  benched: number;
}

function buildRows(players: Player[], rounds: Round[]): Row[] {
  const rows = new Map<string, Row>(
    players.map(p => [p.id, { player: p, played: 0, wins: 0, losses: 0, benched: 0 }]),
  );

  for (const round of rounds) {
    const matches = [round.match1, round.match2].filter(Boolean) as Round['match1'][];

    for (const match of matches) {
      const sides = [
        { players: match.team1.players, side: 'team1' as const },
        { players: match.team2.players, side: 'team2' as const },
      ];

      for (const { players: teamPlayers, side } of sides) {
        for (const p of teamPlayers) {
          const row = rows.get(p.id);
          if (!row) continue;
          row.played++;
          // Matches with no winner recorded yet count as played, not as a win or a loss
          if (match.winner === side) row.wins++;
          else if (match.winner) row.losses++;
        }
      }
    }

    for (const id of round.benchedPlayerIds ?? []) {
      const row = rows.get(id);
      if (row) row.benched++;
    }
  }

  return [...rows.values()].sort((a, b) => {
    if (b.wins !== a.wins) return b.wins - a.wins;
    if (a.losses !== b.losses) return a.losses - b.losses;
    return b.played - a.played;
  });
}

export function Standings({ players, rounds }: Props) {
  if (players.length === 0) {
    return (
      <div className="rounded-xl border border-white/[0.08] bg-white/[0.04] p-12 text-center text-white/40">
        Register players first.
      </div>
    );
  }

  const rows = buildRows(players, rounds);
  const allMatches = rounds.flatMap(r => [r.match1, r.match2].filter(Boolean) as Round['match1'][]);
  const decided = allMatches.filter(m => m.winner).length;

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-white/[0.08] bg-white/[0.04] p-6">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-amber-400" />
          <h3 className="text-lg font-semibold">Standings</h3>
        </div>
        <p className="text-sm text-white/50 mt-1">
          One point per won match. Results recorded: {decided} / {allMatches.length} matches.
          {decided < allMatches.length && ' Mark a winner in the Shuffle tab to score a match.'}
        </p>
      </div>

      <div className="rounded-xl border border-white/[0.08] bg-white/[0.04] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/[0.08] text-white/50 text-sm">
                <th className="px-6 py-3 text-left font-medium">#</th>
                <th className="px-6 py-3 text-left font-medium">Player</th>
                <th className="px-6 py-3 text-right font-medium">Wins</th>
                <th className="px-6 py-3 text-right font-medium">Losses</th>
                <th className="px-6 py-3 text-right font-medium">Played</th>
                <th className="px-6 py-3 text-right font-medium">Sat out</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr
                  key={row.player.id}
                  className={`border-b border-white/[0.04] ${
                    row.player.isResolut1on ? 'bg-amber-500/[0.05]' : ''
                  }`}
                >
                  <td className="px-6 py-3 text-white/40 text-sm">{i + 1}</td>
                  <td className="px-6 py-3 font-medium">
                    <span className="flex items-center gap-2">
                      {row.player.isResolut1on && (
                        <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                      )}
                      <span className={row.player.isResolut1on ? 'text-amber-400' : ''}>
                        {row.player.name}
                      </span>
                    </span>
                  </td>
                  <td className="px-6 py-3 text-right tabular-nums font-semibold text-emerald-400">
                    {row.wins}
                  </td>
                  <td className="px-6 py-3 text-right tabular-nums text-white/50">{row.losses}</td>
                  <td className="px-6 py-3 text-right tabular-nums text-white/70">{row.played}</td>
                  <td className="px-6 py-3 text-right tabular-nums text-white/40">{row.benched}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

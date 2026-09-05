'use client';

import { useMemo, useSyncExternalStore } from 'react';
import type { SharedRound, SharedTournament } from '@/lib/share';
import { decodeTournament } from '@/lib/share';
import { POSITION_LABELS } from '@/lib/constants';

const ME_KEY = 'showmatch-me';

// The link data lives in the URL hash and the "who am I" pick in localStorage —
// both are outside React, so they are read as external stores rather than
// synced into state from an effect.

function subscribeHash(onChange: () => void) {
  window.addEventListener('hashchange', onChange);
  return () => window.removeEventListener('hashchange', onChange);
}

let mePick: string | null | undefined;
const meListeners = new Set<() => void>();

function subscribeMe(onChange: () => void) {
  meListeners.add(onChange);
  return () => { meListeners.delete(onChange); };
}

function readMe(): string | null {
  if (mePick === undefined) {
    try {
      mePick = localStorage.getItem(ME_KEY);
    } catch {
      mePick = null; // private mode — the page still works, just without the highlight
    }
  }
  return mePick;
}

function writeMe(name: string | null) {
  mePick = name;
  try {
    if (name) localStorage.setItem(ME_KEY, name);
    else localStorage.removeItem(ME_KEY);
  } catch {
    // ignore — the pick just won't persist
  }
  for (const listener of meListeners) listener();
}

const CHANNEL_COLORS: Record<number, string> = {
  1: 'border-amber-500/40 bg-amber-500/10 text-amber-300',
  2: 'border-blue-500/40 bg-blue-500/10 text-blue-300',
  3: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300',
  4: 'border-fuchsia-500/40 bg-fuchsia-500/10 text-fuchsia-300',
};

function roundLabel(round: SharedRound) {
  return round.f ? 'ФИНАЛ' : `РАУНД ${round.n}`;
}

/** Where one player has to be in a given round */
function findMe(round: SharedRound, meIndex: number) {
  for (const [teamNameId, channel, players] of round.t) {
    const player = players.find(([nameId]) => nameId === meIndex);
    if (player) return { teamNameId, channel, player };
  }
  return null;
}

export default function RoundPage() {
  // null on the server, a (possibly empty) string once the client has it
  const hash = useSyncExternalStore(
    subscribeHash,
    () => window.location.hash,
    () => null,
  );
  const me = useSyncExternalStore(subscribeMe, readMe, () => null);

  const data: SharedTournament | null = useMemo(() => {
    if (!hash) return null;
    return decodeTournament(hash.replace(/^#/, ''));
  }, [hash]);

  const everyone = useMemo(() => {
    if (!data) return [];
    return [...data.p].sort((a, b) => a.localeCompare(b, 'ru'));
  }, [data]);

  const meIndex = useMemo(() => (data && me ? data.p.indexOf(me) : -1), [data, me]);

  if (hash === null) return null; // server render — nothing to show yet

  if (!data || data.r.length === 0) {
    return (
      <div className="min-h-screen bg-[#070710] text-white flex items-center justify-center px-6">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-black">Ссылка неполная</h1>
          <p className="mt-3 text-white/50">
            Открой ссылку целиком — вместе с длинным хвостом после решётки. Именно в нём
            лежат составы: без него страница пустая.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070710] text-white">
      <div className="max-w-3xl mx-auto px-4 py-8 md:py-12 space-y-8">

        <header className="text-center space-y-3">
          <p className="text-xs tracking-[0.2em] text-white/40 uppercase">
            Resolut1on Showmatch · TimeHub Убуд
          </p>
          <h1 className="text-3xl md:text-4xl font-black">Составы и каналы</h1>
          {data.d && (
            <a
              href={data.d}
              target="_blank"
              rel="noopener"
              className="inline-flex items-center justify-center px-6 py-2.5 bg-indigo-500 hover:bg-indigo-400 text-white font-semibold text-sm rounded-lg transition-colors"
            >
              Открыть Discord
            </a>
          )}
        </header>

        {/* Who am I — drives the personal summary below */}
        <section className="rounded-xl border border-white/[0.08] bg-white/[0.04] p-5">
          {me ? (
            <div className="flex items-center justify-between gap-4">
              <div>
                <span className="text-xs uppercase tracking-wider text-white/40">Это ты</span>
                <p className="text-lg font-bold text-amber-400 break-words">{me}</p>
              </div>
              <button
                onClick={() => writeMe(null)}
                className="text-sm text-white/40 hover:text-white/70 underline underline-offset-4 whitespace-nowrap shrink-0"
              >
                Это не я
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-white/60">Найди себя — покажу твои компы и каналы:</p>
              <div className="flex flex-wrap gap-2">
                {everyone.map(name => (
                  <button
                    key={name}
                    onClick={() => writeMe(name)}
                    className="px-3 py-1.5 rounded-lg border border-white/[0.08] bg-white/[0.02] text-sm text-white/70 hover:bg-white/[0.06] hover:text-white transition-colors"
                  >
                    {name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Personal route through the rounds */}
        {me && (
          <section className="space-y-2">
            {data.r.map(round => {
              const spot = meIndex >= 0 ? findMe(round, meIndex) : null;
              return (
                <div
                  key={`me-${round.n}`}
                  className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3"
                >
                  <span className="text-sm font-bold text-white/70 w-24 shrink-0">
                    {roundLabel(round)}
                  </span>
                  {spot ? (
                    <div className="flex flex-wrap items-center justify-end gap-2 text-sm">
                      <span className="text-white/60">{data.g[spot.teamNameId]}</span>
                      <span className={`px-2 py-0.5 rounded border text-xs font-bold ${CHANNEL_COLORS[spot.channel]}`}>
                        Канал {spot.channel}
                      </span>
                      {spot.player[1] > 0 && (
                        <span className="px-2 py-0.5 rounded border border-white/[0.1] bg-white/[0.04] text-xs font-medium text-white/70">
                          ПК {spot.player[1]}
                        </span>
                      )}
                      <span className="text-xs text-white/40">{POSITION_LABELS[spot.player[2]]}</span>
                    </div>
                  ) : (
                    <span className="text-sm text-white/30">отдыхаешь</span>
                  )}
                </div>
              );
            })}
          </section>
        )}

        {/* Full rounds */}
        {data.r.map(round => (
          <section key={round.n} className="space-y-3">
            <h2 className={`text-sm font-bold tracking-wider ${round.f ? 'text-fuchsia-400' : 'text-white/50'}`}>
              {roundLabel(round)}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {round.t.map(([teamNameId, channel, players]) => (
                <div
                  key={`${round.n}-${channel}`}
                  className="rounded-xl border border-white/[0.08] bg-white/[0.03] overflow-hidden"
                >
                  <div className="px-4 py-3 border-b border-white/[0.06] flex items-center justify-between gap-2">
                    <span className="font-semibold text-sm">{data.g[teamNameId]}</span>
                    <span className={`px-2 py-0.5 rounded border text-xs font-bold ${CHANNEL_COLORS[channel]}`}>
                      Канал {channel}
                    </span>
                  </div>
                  <div className="divide-y divide-white/[0.04]">
                    {players.map(([nameId, pc, position]) => (
                      <div
                        key={nameId}
                        className={`px-4 py-2 flex items-center gap-2 text-sm ${
                          nameId === meIndex ? 'bg-amber-500/10 text-amber-300 font-semibold' : 'text-white/80'
                        }`}
                      >
                        <span className="flex-1">{data.p[nameId]}</span>
                        <span className="text-xs text-white/40">{POSITION_LABELS[position]}</span>
                        {pc > 0 && (
                          <span className="text-xs text-white/50 w-14 text-right">ПК {pc}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {round.b.length > 0 && (
              <p className="text-sm text-white/35">
                Отдыхают: {round.b.map(i => data.p[i]).join(', ')}
              </p>
            )}
          </section>
        ))}

        <footer className="pt-4 text-center text-xs text-white/20 uppercase tracking-wide">
          Resolut1on Showmatch Series · Bali · Сезон 2
        </footer>
      </div>
    </div>
  );
}

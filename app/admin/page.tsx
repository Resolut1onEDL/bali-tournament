'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Player, TournamentState } from '@/lib/types';
import { TOTAL_PLAYERS, MIN_PLAYERS } from '@/lib/constants';
import { loadTournamentState, saveTournamentState, clearTournamentState } from '@/lib/storage';
import { generateRound, generateAllRegularRounds, generateFinalRound } from '@/lib/shuffle';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PlayerRegistration } from '@/components/admin/player-registration';
import { PlayerList } from '@/components/admin/player-list';
import { ShuffleControls } from '@/components/admin/shuffle-controls';
import { RoundNavigator } from '@/components/admin/round-navigator';
import { RoundView } from '@/components/admin/round-view';
import { MvpSelector } from '@/components/admin/mvp-selector';
import { PCAssignment } from '@/components/admin/pc-assignment';
import { ImportExport } from '@/components/admin/import-export';
import { Standings } from '@/components/admin/standings';

import { Users, Shuffle, Monitor, Settings, Trophy } from 'lucide-react';

export default function AdminPage() {
  const [state, setState] = useState<TournamentState>(() => ({
    players: [],
    rounds: [],
    currentRoundIndex: 0,
    totalRoundsTarget: 5,
    isLocked: false,
    mvpAllStarIds: [],
  }));
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setState(loadTournamentState());
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) saveTournamentState(state);
  }, [state, mounted]);

  const hasResolut1on = state.players.some(p => p.isResolut1on);
  const regularRounds = state.rounds.filter(r => !r.isFinal);
  const hasFinal = state.rounds.some(r => r.isFinal);

  // Player management
  const addPlayer = useCallback((playerData: Omit<Player, 'id'>) => {
    setState(prev => ({
      ...prev,
      players: [...prev.players, { ...playerData, id: crypto.randomUUID() }],
    }));
  }, []);

  const updatePlayer = useCallback((player: Player) => {
    setState(prev => ({
      ...prev,
      players: prev.players.map(p => p.id === player.id ? player : p),
    }));
    setEditingPlayer(null);
  }, []);

  const removePlayer = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      players: prev.players.filter(p => p.id !== id),
    }));
  }, []);

  // Shuffle — single round
  const handleGenerateRound = useCallback(() => {
    if (state.players.length < MIN_PLAYERS || !hasResolut1on) return;
    if (regularRounds.length >= 4) return;

    const round = generateRound(state.players, regularRounds, regularRounds.length + 1);
    const newRounds = [...state.rounds.filter(r => !r.isFinal), round];
    setState(prev => ({
      ...prev,
      rounds: newRounds,
      currentRoundIndex: newRounds.length - 1,
      isLocked: true,
    }));
  }, [state.players, state.rounds, regularRounds, hasResolut1on]);

  // Shuffle — all 4 regular rounds
  const handleGenerateAllRounds = useCallback(() => {
    if (state.players.length < MIN_PLAYERS || !hasResolut1on) return;

    const allRounds = generateAllRegularRounds(state.players, []);
    setState(prev => ({
      ...prev,
      rounds: allRounds,
      currentRoundIndex: allRounds.length - 1,
      isLocked: true,
    }));
  }, [state.players, hasResolut1on]);

  // Final round
  const handleGenerateFinal = useCallback(() => {
    if (state.mvpAllStarIds.length !== 5) return;

    const finalRound = generateFinalRound(
      state.players,
      regularRounds,
      state.mvpAllStarIds,
      5,
    );

    const newRounds = [...state.rounds.filter(r => !r.isFinal), finalRound];
    setState(prev => ({
      ...prev,
      rounds: newRounds,
      currentRoundIndex: newRounds.length - 1,
    }));
  }, [state.players, state.mvpAllStarIds, state.rounds, regularRounds]);

  // MVP toggle
  const handleToggleMvp = useCallback((id: string) => {
    setState(prev => {
      const ids = prev.mvpAllStarIds.includes(id)
        ? prev.mvpAllStarIds.filter(x => x !== id)
        : [...prev.mvpAllStarIds, id];
      return { ...prev, mvpAllStarIds: ids };
    });
  }, []);

  const handleClearRounds = useCallback(() => {
    if (confirm('Clear all generated rounds?')) {
      setState(prev => ({
        ...prev,
        rounds: [],
        currentRoundIndex: 0,
        isLocked: false,
        mvpAllStarIds: [],
      }));
    }
  }, []);

  const handleSetWinner = useCallback((
    roundId: string,
    match: 'match1' | 'match2',
    winner: 'team1' | 'team2' | undefined,
  ) => {
    setState(prev => ({
      ...prev,
      rounds: prev.rounds.map(r => {
        if (r.id !== roundId) return r;
        const target = match === 'match1' ? r.match1 : r.match2;
        if (!target) return r;
        return { ...r, [match]: { ...target, winner } };
      }),
    }));
  }, []);

  const handleSelectRound = useCallback((index: number) => {
    setState(prev => ({ ...prev, currentRoundIndex: index }));
  }, []);

  const handleImport = useCallback((imported: TournamentState) => {
    setState(imported);
  }, []);

  const handleReset = useCallback(() => {
    clearTournamentState();
    setState({
      players: [],
      rounds: [],
      currentRoundIndex: 0,
      totalRoundsTarget: 5,
      isLocked: false,
      mvpAllStarIds: [],
    });
    setEditingPlayer(null);
  }, []);

  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-white/40">Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-black tracking-tight">
          <span className="text-amber-400">Bali Showmatch</span>{' '}
          <span className="text-white/60">Shuffle</span>
        </h1>
        <p className="text-white/40 text-sm mt-1">
          4 rounds + MVP All-Stars final. Resolut1on gets new teammates each round.
          With {TOTAL_PLAYERS} players a round runs two matches in parallel and nobody sits;
          with fewer, one match runs and the rest rotate through the bench.
        </p>
      </div>

      <Tabs defaultValue="players" className="space-y-6">
        <TabsList className="bg-white/[0.04] border border-white/[0.08] p-1 rounded-xl">
          <TabsTrigger value="players" className="data-[state=active]:bg-amber-500 data-[state=active]:text-black rounded-lg gap-2">
            <Users className="w-4 h-4" />
            Players
          </TabsTrigger>
          <TabsTrigger value="shuffle" className="data-[state=active]:bg-amber-500 data-[state=active]:text-black rounded-lg gap-2">
            <Shuffle className="w-4 h-4" />
            Shuffle
          </TabsTrigger>
          <TabsTrigger value="pcmap" className="data-[state=active]:bg-amber-500 data-[state=active]:text-black rounded-lg gap-2">
            <Monitor className="w-4 h-4" />
            PC Map
          </TabsTrigger>
          <TabsTrigger value="standings" className="data-[state=active]:bg-amber-500 data-[state=active]:text-black rounded-lg gap-2">
            <Trophy className="w-4 h-4" />
            Standings
          </TabsTrigger>
          <TabsTrigger value="settings" className="data-[state=active]:bg-amber-500 data-[state=active]:text-black rounded-lg gap-2">
            <Settings className="w-4 h-4" />
            Settings
          </TabsTrigger>
        </TabsList>

        {/* Players Tab */}
        <TabsContent value="players" className="space-y-6">
          <PlayerRegistration
            players={state.players}
            editingPlayer={editingPlayer}
            isLocked={state.isLocked}
            onAddPlayer={addPlayer}
            onUpdatePlayer={updatePlayer}
            onCancelEdit={() => setEditingPlayer(null)}
          />
          <PlayerList
            players={state.players}
            isLocked={state.isLocked}
            onEditPlayer={setEditingPlayer}
            onRemovePlayer={removePlayer}
          />
        </TabsContent>

        {/* Shuffle Tab */}
        <TabsContent value="shuffle" className="space-y-6">
          <ShuffleControls
            players={state.players}
            rounds={state.rounds}
            hasResolut1on={hasResolut1on}
            mvpAllStarIds={state.mvpAllStarIds}
            onGenerateRound={handleGenerateRound}
            onGenerateAllRounds={handleGenerateAllRounds}
            onGenerateFinal={handleGenerateFinal}
            onClearRounds={handleClearRounds}
          />

          {/* MVP All-Stars selector — show after 4 rounds, before final */}
          {regularRounds.length === 4 && !hasFinal && (
            <MvpSelector
              players={state.players}
              selectedIds={state.mvpAllStarIds}
              onToggle={handleToggleMvp}
            />
          )}

          {state.rounds.length > 0 && (
            <>
              <RoundNavigator
                rounds={state.rounds}
                currentIndex={state.currentRoundIndex}
                onSelectRound={handleSelectRound}
              />
              {state.rounds[state.currentRoundIndex] && (
                <RoundView
                  round={state.rounds[state.currentRoundIndex]}
                  players={state.players}
                  onSetWinner={(match, winner) =>
                    handleSetWinner(state.rounds[state.currentRoundIndex].id, match, winner)
                  }
                />
              )}
            </>
          )}

          {state.rounds.length === 0 && state.players.length >= MIN_PLAYERS && hasResolut1on && (
            <div className="rounded-xl border border-white/[0.08] bg-white/[0.04] p-12 text-center">
              <Shuffle className="w-12 h-12 text-white/20 mx-auto mb-4" />
              <p className="text-white/40">
                {state.players.length} players registered. Click &quot;Round 1&quot; to start.
              </p>
            </div>
          )}

          {(state.players.length < MIN_PLAYERS || !hasResolut1on) && (
            <div className="rounded-xl border border-white/[0.08] bg-white/[0.04] p-12 text-center">
              <Users className="w-12 h-12 text-white/20 mx-auto mb-4" />
              <p className="text-white/40">
                {state.players.length < MIN_PLAYERS &&
                  `Register ${MIN_PLAYERS - state.players.length} more players. `}
                {!hasResolut1on && 'Mark one player as Resolut1on.'}
              </p>
            </div>
          )}
        </TabsContent>

        {/* PC Map Tab */}
        <TabsContent value="pcmap">
          <PCAssignment
            rounds={state.rounds}
            players={state.players}
            currentIndex={state.currentRoundIndex}
            onSelectRound={handleSelectRound}
          />
        </TabsContent>

        {/* Standings Tab */}
        <TabsContent value="standings">
          <Standings players={state.players} rounds={state.rounds} />
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings">
          <ImportExport
            state={state}
            onImport={handleImport}
            onReset={handleReset}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

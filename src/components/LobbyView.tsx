import React, { useState } from 'react';
import type { GameRoomState, Player, UserProfile } from '../types/game';
import { sounds } from '../services/soundFx';
import { 
  Users, 
  Bot, 
  Play, 
  Copy, 
  Check, 
  Plus, 
  Minus, 
  Settings, 
  ShieldCheck, 
  Radio, 
  Key, 
  Sparkles,
  UserPlus
} from 'lucide-react';

interface LobbyViewProps {
  roomState: GameRoomState | null;
  currentPlayer: Player | null;
  userProfile: UserProfile;
  onCreateRoom: (settings?: any) => void;
  onJoinRoom: (roomId: string) => void;
  onSetReady: (isReady: boolean) => void;
  onAddBots: (count: number) => void;
  onRemoveBot: (botId: string) => void;
  onStartGame: () => void;
}

export const LobbyView: React.FC<LobbyViewProps> = ({
  roomState,
  currentPlayer,
  userProfile,
  onCreateRoom,
  onJoinRoom,
  onSetReady,
  onAddBots,
  onRemoveBot,
  onStartGame,
}) => {
  const [joinCode, setJoinCode] = useState('');
  const [copied, setCopied] = useState(false);

  // If not joined to any room yet, show Create / Join screen
  if (!roomState || !currentPlayer) {
    return (
      <div className="max-w-xl mx-auto my-8 bg-slate-900/90 border border-cyan-500/40 rounded-2xl p-6 shadow-2xl backdrop-blur-md">
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-[11px] font-mono text-cyan-300 mb-3">
            <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            SECURE QUANTUM RECEPTACLE READY
          </div>
          <h2 className="font-mono text-2xl font-black uppercase tracking-wider text-slate-100">
            Enter Research Facility
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Create a private decontamination chamber or enter an existing 4-letter room code.
          </p>
        </div>

        {/* Profile Card Preview */}
        <div className="p-3.5 bg-slate-950/80 rounded-xl border border-slate-800 mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{userProfile.avatar}</span>
            <div>
              <div className="text-xs font-mono font-bold text-slate-100">{userProfile.displayName}</div>
              <div className="text-[10px] font-mono text-cyan-400">
                Clearance Level {userProfile.clearanceLevel} • {userProfile.stats.gamesPlayed} Matches
              </div>
            </div>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
            DOSSIER ACTIVE
          </span>
        </div>

        <div className="space-y-4">
          <button
            onClick={() => {
              sounds.playClick(750);
              onCreateRoom();
            }}
            className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-mono text-sm font-bold shadow-lg shadow-cyan-500/20 transition active:scale-95 flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            CREATE NEW FACILITY CHAMBER
          </button>

          <div className="flex items-center gap-2 my-4">
            <div className="h-px bg-slate-800 flex-1" />
            <span className="text-[10px] font-mono text-slate-500 uppercase">OR JOIN CHAMBER</span>
            <div className="h-px bg-slate-800 flex-1" />
          </div>

          <div className="flex gap-2">
            <div className="relative flex-1">
              <Key className="w-4 h-4 absolute left-3 top-3.5 text-slate-500" />
              <input
                type="text"
                maxLength={4}
                placeholder="4-LETTER CODE (E.G. NEON)"
                value={joinCode}
                onChange={e => setJoinCode(e.target.value.toUpperCase())}
                className="w-full pl-9 pr-3 py-3 rounded-xl bg-slate-950 border border-slate-700 text-sm font-mono text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-400 uppercase tracking-widest text-center"
              />
            </div>
            <button
              onClick={() => {
                if (joinCode.length === 4) {
                  sounds.playClick(800);
                  onJoinRoom(joinCode);
                }
              }}
              disabled={joinCode.length !== 4}
              className={`px-6 rounded-xl font-mono text-xs font-bold transition flex items-center gap-1.5 ${
                joinCode.length === 4
                  ? 'bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/40'
                  : 'bg-slate-900 text-slate-600 border border-slate-800 cursor-not-allowed'
              }`}
            >
              JOIN
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Inside Active Lobby
  const players = Object.values(roomState.players);
  const isHost = currentPlayer.isHost;
  const canStart = players.length >= 2;

  const handleCopyCode = () => {
    sounds.playClick(600);
    navigator.clipboard.writeText(roomState.roomId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto my-6 bg-slate-900/90 border border-cyan-500/40 rounded-2xl p-6 shadow-2xl backdrop-blur-md">
      {/* Lobby Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-cyan-500/20 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
              FACILITY PRE-FLIGHT
            </span>
            <h2 className="font-mono text-xl font-black uppercase tracking-wider text-slate-100">
              Decontamination Chamber
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Assemble the research expedition squad. One member will be designated the Rogue Anomaly upon launch.
          </p>
        </div>

        {/* Room Code Badge */}
        <div className="flex items-center gap-2 bg-slate-950 px-4 py-2.5 rounded-xl border border-cyan-500/40">
          <div className="text-left font-mono">
            <div className="text-[9px] text-slate-500">CHAMBER CODE</div>
            <div className="text-lg font-black tracking-widest text-cyan-300">
              {roomState.roomId}
            </div>
          </div>
          <button
            onClick={handleCopyCode}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-cyan-300 transition"
            title="Copy Code"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main Grid: Roster & Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Researcher Roster (2 Cols) */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400">
            <span className="flex items-center gap-1.5 font-bold uppercase">
              <Users className="w-4 h-4 text-cyan-400" />
              CONNECTED RESEARCHERS ({players.length}/{roomState.settings.maxPlayers})
            </span>
            {players.length < 2 && (
              <span className="text-amber-400 text-[11px] animate-pulse">
                Needs 2+ researchers (Click 'Fill with AI Bots')
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {players.map(p => {
              const isMe = p.id === currentPlayer.id;
              return (
                <div
                  key={p.id}
                  className={`p-3 rounded-xl border flex items-center justify-between transition ${
                    isMe
                      ? 'bg-cyan-950/40 border-cyan-500/50 shadow-sm'
                      : 'bg-slate-950/70 border-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl">{p.avatar}</span>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-xs text-slate-200">
                          {p.name}
                        </span>
                        {isMe && (
                          <span className="text-[9px] font-mono px-1 rounded bg-cyan-900 text-cyan-300">
                            YOU
                          </span>
                        )}
                        {p.isHost && (
                          <span className="text-[9px] font-mono px-1 rounded bg-amber-950 text-amber-300 border border-amber-800">
                            HOST
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] font-mono text-slate-500">
                        {p.isBot ? 'Synthesized Neural AI' : 'Human Researcher'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {p.isReady ? (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950 border border-emerald-800 text-emerald-400 flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        READY
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
                        PREPARING
                      </span>
                    )}

                    {isHost && p.isBot && (
                      <button
                        onClick={() => onRemoveBot(p.id)}
                        className="p-1 rounded hover:bg-slate-800 text-slate-500 hover:text-rose-400 transition"
                        title="Remove Bot"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick AI Bot Adder Button for Instant Play */}
          {isHost && players.length < roomState.settings.maxPlayers && (
            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-mono text-slate-300">
                <Bot className="w-4 h-4 text-cyan-400" />
                <span>Solo Testing or Need More Players?</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    sounds.playClick(650);
                    onAddBots(1);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 font-mono text-xs transition flex items-center gap-1 border border-slate-700"
                >
                  <Plus className="w-3 h-3" />
                  +1 BOT
                </button>
                <button
                  onClick={() => {
                    sounds.playClick(700);
                    onAddBots(3);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 font-mono text-xs transition flex items-center gap-1 border border-slate-700"
                >
                  <Plus className="w-3 h-3" />
                  +3 BOTS (FULL CREW)
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Action Panel & Settings (1 Col) */}
        <div className="bg-slate-950/80 rounded-xl border border-slate-800 p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 font-bold mb-3 pb-2 border-b border-slate-800">
              <Settings className="w-4 h-4" />
              EXPEDITION CONFIGURATION
            </div>

            <div className="space-y-2.5 text-xs font-mono text-slate-300">
              <div className="flex justify-between">
                <span className="text-slate-500">Round Duration:</span>
                <span className="text-slate-200">{roomState.settings.roundDurationSeconds}s</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Deliberation Timer:</span>
                <span className="text-slate-200">{roomState.settings.discussionDurationSeconds}s</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Base Corruption:</span>
                <span className="text-rose-400">0.15% / sec</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Sabotage Cooldown:</span>
                <span className="text-slate-200">{roomState.settings.anomalySabotageCooldown}s</span>
              </div>
            </div>

            <div className="mt-4 p-2.5 bg-slate-900 rounded-lg border border-slate-800 text-[11px] font-mono text-slate-400">
              💡 <strong>Objective:</strong> Scientists must complete diagnostic tasks or identify the Anomaly during emergency votes before corruption strikes 100%.
            </div>
          </div>

          <div className="mt-5 space-y-2">
            {!currentPlayer.isReady ? (
              <button
                onClick={() => {
                  sounds.playClick(700);
                  onSetReady(true);
                }}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 font-mono text-xs font-bold border border-cyan-500/40 transition"
              >
                CONFIRM DECONTAMINATION (READY)
              </button>
            ) : (
              <button
                onClick={() => {
                  sounds.playClick(600);
                  onSetReady(false);
                }}
                className="w-full py-2.5 rounded-xl bg-slate-800 text-slate-400 font-mono text-xs border border-slate-700 hover:text-slate-200 transition"
              >
                UNREADY
              </button>
            )}

            {isHost && (
              <button
                onClick={() => {
                  sounds.playTaskSuccess();
                  onStartGame();
                }}
                disabled={!canStart}
                className={`w-full py-3.5 rounded-xl font-mono text-xs font-bold transition flex items-center justify-center gap-2 shadow-lg ${
                  canStart
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 shadow-cyan-500/20 active:scale-95'
                    : 'bg-slate-900 text-slate-600 border border-slate-800 cursor-not-allowed'
                }`}
              >
                <Play className="w-4 h-4 fill-current" />
                INITIATE RESEARCH EXPEDITION
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

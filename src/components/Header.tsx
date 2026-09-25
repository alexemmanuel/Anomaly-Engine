import React from 'react';
import type { GameRoomState, Player, UserProfile } from '../types/game';
import { sounds } from '../services/soundFx';
import { auth } from '../services/firebase';
import { 
  ShieldAlert, 
  Volume2, 
  VolumeX, 
  Trophy, 
  User, 
  HelpCircle, 
  Activity, 
  Flame, 
  LogIn,
  LogOut,
  Sparkles,
  Bot
} from 'lucide-react';

interface HeaderProps {
  roomState: GameRoomState | null;
  currentPlayer: Player | null;
  userProfile: UserProfile;
  isMuted: boolean;
  onToggleMute: () => void;
  onOpenLeaderboard: () => void;
  onOpenProfile: () => void;
  onOpenGuide: () => void;
  onOpenAuth: () => void;
  onOpenAdam: () => void;
  onLogOut: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  roomState,
  currentPlayer,
  userProfile,
  isMuted,
  onToggleMute,
  onOpenLeaderboard,
  onOpenProfile,
  onOpenGuide,
  onOpenAuth,
  onOpenAdam,
  onLogOut,
}) => {
  const isPlaying = roomState && roomState.phase !== 'lobby';
  const currentUser = auth.currentUser;
  const isGuest = !currentUser || currentUser.isAnonymous;

  return (
    <header className="bg-slate-950/90 border-b border-cyan-500/30 sticky top-0 z-40 backdrop-blur-md px-4 py-2.5">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Logo and Subtitle */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-rose-500 p-0.5 flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.4)]">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center text-cyan-400">
                <Activity className="w-5 h-5 animate-pulse" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-mono font-black text-sm tracking-wider uppercase text-slate-100 flex items-center gap-1.5">
                  THE ANOMALY ENGINE
                </h1>
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800">
                  WILD VS LOGIC
                </span>
              </div>
              <p className="text-[10px] font-mono text-slate-400">
                Deep Synapse Sublevel 9 • Forensic Social Deduction
              </p>
            </div>
          </div>

          <div className="flex md:hidden items-center gap-1.5">
            <button
              onClick={() => {
                sounds.playClick(600);
                onOpenAdam();
              }}
              className="p-1.5 rounded-lg bg-cyan-950/80 border border-cyan-500/40 text-cyan-300"
              title="A.D.A.M. Forensic AI"
            >
              <Bot className="w-4 h-4" />
            </button>

            {isGuest ? (
              <button
                onClick={onOpenAuth}
                className="px-2 py-1 rounded-lg bg-cyan-500 text-slate-950 text-xs font-mono font-bold flex items-center gap-1"
              >
                <LogIn className="w-3.5 h-3.5" />
                LOGIN
              </button>
            ) : (
              <button
                onClick={onLogOut}
                className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-rose-400"
                title="Log Out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            )}

            <button
              onClick={onToggleMute}
              className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-cyan-300 transition"
              title="Toggle Audio"
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
            </button>
          </div>
        </div>

        {/* Live Facility Health Meters (Only active when in game) */}
        {isPlaying && (
          <div className="flex items-center gap-4 bg-slate-900/80 px-4 py-1.5 rounded-xl border border-slate-800 font-mono text-xs w-full md:w-auto justify-center">
            {/* Stability */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                STABILITY:
              </span>
              <div className="w-20 bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                <div
                  className="bg-emerald-400 h-full transition-all duration-300"
                  style={{ width: `${roomState.facilityStability}%` }}
                />
              </div>
              <span className="font-bold text-emerald-300">{roomState.facilityStability}%</span>
            </div>

            <div className="h-4 w-px bg-slate-800" />

            {/* Corruption */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-rose-400 font-bold flex items-center gap-1">
                <Flame className="w-3 h-3 text-rose-400" />
                CORRUPTION:
              </span>
              <div className="w-20 bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                <div
                  className={`h-full transition-all duration-300 ${
                    roomState.facilityCorruption > 60 ? 'bg-rose-500 animate-pulse' : 'bg-rose-600'
                  }`}
                  style={{ width: `${roomState.facilityCorruption}%` }}
                />
              </div>
              <span className="font-bold text-rose-300">{roomState.facilityCorruption}%</span>
            </div>
          </div>
        )}

        {/* Global Navigation Tools: Leaderboard, Profile, A.D.A.M., Auth, Audio, Guide */}
        <div className="hidden md:flex items-center gap-2">
          {/* A.D.A.M. Forensic AI Terminal */}
          <button
            onClick={() => {
              sounds.playClick(600);
              onOpenAdam();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-950/90 to-blue-950/90 hover:from-cyan-900/90 hover:to-blue-900/90 border border-cyan-500/50 text-cyan-300 text-xs font-mono font-bold transition shadow-sm"
            title="Open A.D.A.M. Forensic AI Terminal"
          >
            <Bot className="w-4 h-4 text-cyan-400 animate-pulse" />
            <span>A.D.A.M. AI</span>
          </button>

          {/* Guide */}
          <button
            onClick={() => {
              sounds.playClick(600);
              onOpenGuide();
            }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-cyan-300 text-xs font-mono transition"
          >
            <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
            <span>HOW TO PLAY</span>
          </button>

          {/* Leaderboard */}
          <button
            onClick={() => {
              sounds.playClick(600);
              onOpenLeaderboard();
            }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-amber-300 text-xs font-mono transition"
          >
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span>LEADERBOARD</span>
          </button>

          {/* User Profile Dossier */}
          <button
            onClick={() => {
              sounds.playClick(600);
              onOpenProfile();
            }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-500/40 text-cyan-200 text-xs font-mono transition"
          >
            <span className="text-base">{userProfile.avatar}</span>
            <div className="text-left leading-tight">
              <span className="font-bold block truncate max-w-[100px]">{userProfile.displayName}</span>
              <span className="text-[9px] text-cyan-400">LVL {userProfile.clearanceLevel}</span>
            </div>
          </button>

          {/* Login or Logout Button */}
          {isGuest ? (
            <button
              onClick={() => {
                sounds.playClick(600);
                onOpenAuth();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-mono text-xs font-bold transition shadow-sm"
              title="Sign in with Email or Google"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>LOG IN</span>
            </button>
          ) : (
            <button
              onClick={() => {
                sounds.playClick(600);
                onLogOut();
              }}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-rose-950/40 border border-slate-800 hover:border-rose-500/40 text-slate-400 hover:text-rose-300 font-mono text-xs transition"
              title={`Logged in as ${currentUser?.email || userProfile.displayName}. Click to sign out.`}
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>LOG OUT</span>
            </button>
          )}

          {/* Sound Toggle */}
          <button
            onClick={onToggleMute}
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-cyan-300 transition"
            title="Toggle Synthesizer Audio"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
          </button>
        </div>
      </div>
    </header>
  );
};

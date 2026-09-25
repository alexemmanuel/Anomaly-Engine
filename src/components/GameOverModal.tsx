import React, { useEffect } from 'react';
import type { GameRoomState, Player, UserProfile } from '../types/game';
import { sounds } from '../services/soundFx';
import { recordMatchResult } from '../services/firebase';
import confetti from 'canvas-confetti';
import { 
  Trophy, 
  Skull, 
  RotateCcw, 
  Award, 
  Activity, 
  CheckCircle2, 
  Zap, 
  ShieldCheck,
  Flame
} from 'lucide-react';

interface GameOverProps {
  roomState: GameRoomState;
  currentPlayer: Player;
  userProfile: UserProfile;
  onProfileUpdated: (updated: UserProfile) => void;
  onRestart: () => void;
}

export const GameOverModal: React.FC<GameOverProps> = ({
  roomState,
  currentPlayer,
  userProfile,
  onProfileUpdated,
  onRestart,
}) => {
  const winner = roomState.winner;
  const isScientistWin = winner === 'scientists';
  const playerRole = currentPlayer.role || 'scientist';
  const didIWin = (isScientistWin && playerRole === 'scientist') || (!isScientistWin && playerRole === 'anomaly');

  // Find who was the anomaly
  const anomalyPlayer = Object.values(roomState.players).find(p => p.role === 'anomaly');

  useEffect(() => {
    if (didIWin) {
      sounds.playTaskSuccess();
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
    } else {
      sounds.playGlitch();
    }

    // Persist match result to Firestore
    recordMatchResult(userProfile, {
      won: didIWin,
      role: playerRole,
      tasksDone: currentPlayer.completedTasks.length,
      correctDeduction: isScientistWin && anomalyPlayer?.id === roomState.ejectedPlayerId,
      sabotages: playerRole === 'anomaly' ? 2 : 0,
    }).then(updated => {
      onProfileUpdated(updated);
    });
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4 backdrop-blur-lg animate-fadeIn overflow-y-auto">
      <div className="max-w-xl w-full bg-slate-950 border-2 rounded-2xl p-6 text-center shadow-2xl relative overflow-hidden my-8 border-slate-800">
        {/* Glowing Top Banner */}
        <div
          className={`absolute top-0 left-0 right-0 h-2 ${
            isScientistWin
              ? 'bg-gradient-to-r from-emerald-500 via-cyan-400 to-emerald-500'
              : 'bg-gradient-to-r from-rose-500 via-purple-500 to-rose-500'
          }`}
        />

        <div className="flex flex-col items-center">
          <div className="mb-3">
            {isScientistWin ? (
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border-2 border-emerald-500/40 flex items-center justify-center text-emerald-400 text-3xl mx-auto shadow-[0_0_30px_rgba(16,185,129,0.3)]">
                <Trophy className="w-8 h-8" />
              </div>
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border-2 border-rose-500/40 flex items-center justify-center text-rose-400 text-3xl mx-auto shadow-[0_0_30px_rgba(244,63,94,0.3)]">
                <Skull className="w-8 h-8" />
              </div>
            )}
          </div>

          <div className="text-[10px] font-mono tracking-widest uppercase mb-1 text-slate-400">
            INCIDENT POST-MORTEM DOSSIER
          </div>

          <h2
            className={`font-mono text-2xl font-black uppercase tracking-wider ${
              isScientistWin ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {isScientistWin ? 'SCIENTISTS PREVAILED (LOGIC TRIUMPH)' : 'THE ANOMALY PREVAILED (WILD TRIUMPH)'}
          </h2>

          <p className="text-xs text-slate-300 font-mono mt-1 max-w-md">
            {roomState.winReason}
          </p>

          {/* Reveal Anomaly Identity */}
          <div className="my-5 p-3.5 rounded-xl bg-slate-900 border border-slate-800 w-full flex items-center justify-between text-left">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{anomalyPlayer ? anomalyPlayer.avatar : '☣️'}</span>
              <div>
                <div className="text-[10px] font-mono text-rose-400 uppercase font-bold">
                  THE SECRET ANOMALY WAS
                </div>
                <div className="font-mono font-bold text-sm text-slate-100">
                  {anomalyPlayer ? anomalyPlayer.name : 'Unknown Rogue Synthetic'}
                </div>
              </div>
            </div>

            <div className="px-2.5 py-1 rounded bg-rose-950/70 border border-rose-500/40 text-[11px] font-mono font-bold text-rose-300">
              WILD VARIABLE
            </div>
          </div>

          {/* Forensic Match Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 w-full mb-5 font-mono text-left">
            <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800">
              <span className="text-[10px] text-slate-500 block">YOUR RESULT</span>
              <span className={`text-xs font-bold ${didIWin ? 'text-emerald-400' : 'text-rose-400'}`}>
                {didIWin ? 'VICTORIOUS' : 'DEFEATED'}
              </span>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800">
              <span className="text-[10px] text-slate-500 block">TASKS DONE</span>
              <span className="text-xs font-bold text-cyan-400">
                {currentPlayer.completedTasks.length}
              </span>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800">
              <span className="text-[10px] text-slate-500 block">FINAL STABILITY</span>
              <span className="text-xs font-bold text-emerald-400">
                {roomState.facilityStability}%
              </span>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800">
              <span className="text-[10px] text-slate-500 block">CORRUPTION</span>
              <span className="text-xs font-bold text-rose-400">
                {roomState.facilityCorruption}%
              </span>
            </div>
          </div>

          {/* XP & Clearance Progression Badge */}
          <div className="p-3 bg-gradient-to-r from-cyan-950/40 to-slate-900 rounded-xl border border-cyan-500/30 w-full mb-6 flex items-center justify-between text-left">
            <div className="flex items-center gap-2.5">
              <Award className="w-5 h-5 text-cyan-400" />
              <div>
                <div className="text-xs font-mono font-bold text-cyan-300">
                  CLEARANCE LEVEL {userProfile.clearanceLevel}
                </div>
                <div className="text-[10px] font-mono text-slate-400">
                  Career XP: {userProfile.xp} • Synced to Cloud Firestore
                </div>
              </div>
            </div>

            <span className="text-xs font-mono font-bold text-emerald-400">
              +{didIWin ? 150 : 50} XP
            </span>
          </div>

          {/* Action buttons */}
          {currentPlayer.isHost ? (
            <button
              onClick={() => {
                sounds.playClick(800);
                onRestart();
              }}
              className="w-full py-3 px-6 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-mono text-sm font-bold shadow-lg shadow-cyan-500/20 transition active:scale-95 flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              COMMENCE NEW RESEARCH ROUND (RESET TO LOBBY)
            </button>
          ) : (
            <div className="text-xs font-mono text-slate-400 animate-pulse">
              Waiting for facility commander ({Object.values(roomState.players).find(p => p.isHost)?.name}) to reset chamber...
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

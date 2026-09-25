import React, { useEffect } from 'react';
import type { GameRoomState, Player } from '../types/game';
import { sounds } from '../services/soundFx';
import { ShieldCheck, Skull, Activity, AlertTriangle } from 'lucide-react';

interface BriefingProps {
  roomState: GameRoomState;
  currentPlayer: Player;
}

export const BriefingModal: React.FC<BriefingProps> = ({ roomState, currentPlayer }) => {
  const isAnomaly = currentPlayer.role === 'anomaly';

  useEffect(() => {
    if (isAnomaly) {
      sounds.playGlitch();
    } else {
      sounds.playEmergencyAlarm();
    }
  }, [isAnomaly]);

  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4 backdrop-blur-lg animate-fadeIn">
      <div
        className={`max-w-lg w-full bg-slate-950 border-2 rounded-2xl p-6 text-center shadow-2xl relative overflow-hidden ${
          isAnomaly
            ? 'border-rose-500 shadow-[0_0_50px_rgba(244,63,94,0.35)]'
            : 'border-emerald-500 shadow-[0_0_50px_rgba(16,185,129,0.35)]'
        }`}
      >
        {/* Glow Stripe */}
        <div
          className={`absolute top-0 left-0 right-0 h-1.5 animate-pulse ${
            isAnomaly
              ? 'bg-gradient-to-r from-rose-500 via-purple-500 to-rose-500'
              : 'bg-gradient-to-r from-emerald-500 via-cyan-400 to-emerald-500'
          }`}
        />

        <div className="flex flex-col items-center">
          <div className="text-[10px] font-mono tracking-widest text-slate-400 uppercase mb-3 px-3 py-1 rounded-full bg-slate-900 border border-slate-800">
            DEEP SYNAPSE DIRECTIVE // ROLE CLASSIFICATION
          </div>

          <div className="my-3">
            {isAnomaly ? (
              <div className="w-20 h-20 rounded-2xl bg-rose-500/10 border-2 border-rose-500 flex items-center justify-center text-4xl text-rose-400 shadow-[0_0_30px_rgba(244,63,94,0.4)] animate-bounce">
                <Skull className="w-10 h-10" />
              </div>
            ) : (
              <div className="w-20 h-20 rounded-2xl bg-emerald-500/10 border-2 border-emerald-500 flex items-center justify-center text-4xl text-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.4)]">
                <ShieldCheck className="w-10 h-10" />
              </div>
            )}
          </div>

          <h2
            className={`font-mono text-2xl font-black uppercase tracking-wider ${
              isAnomaly ? 'text-rose-400' : 'text-emerald-400'
            }`}
          >
            {isAnomaly ? 'YOU ARE THE ROGUE ANOMALY' : 'YOU ARE A RESEARCH SCIENTIST'}
          </h2>

          <div
            className={`my-3 px-3 py-1 rounded-full text-xs font-mono font-bold border inline-block ${
              isAnomaly
                ? 'bg-rose-950 text-rose-300 border-rose-500/50'
                : 'bg-emerald-950 text-emerald-300 border-emerald-500/50'
            }`}
          >
            {isAnomaly ? 'FACTION: WILD (ROGUE SYNTHETIC)' : 'FACTION: LOGIC (FACILITY RESEARCHER)'}
          </div>

          <p className="text-xs font-mono text-slate-300 max-w-sm mt-2 leading-relaxed">
            {isAnomaly ? (
              <span>
                Your identity is concealed. Subtly trigger power blackouts, scramble telemetry logs, and corrupt diagnostic consoles without being caught.
              </span>
            ) : (
              <span>
                Keep facility systems operational by completing diagnostic mini-games. Scrutinize the Black Box flight logs to deduce and quarantine the impostor.
              </span>
            )}
          </p>

          <div className="mt-6 flex items-center gap-2 text-xs font-mono text-cyan-400 animate-pulse">
            <Activity className="w-4 h-4" />
            <span>Facility systems activating in {roomState.phaseTimeRemaining}s...</span>
          </div>
        </div>
      </div>
    </div>
  );
};

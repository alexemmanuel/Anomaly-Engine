import React, { useEffect } from 'react';
import type { GameRoomState, Player } from '../types/game';
import { sounds } from '../services/soundFx';
import { ShieldCheck, Skull, HelpCircle } from 'lucide-react';

interface EjectionRevealProps {
  roomState: GameRoomState;
}

export const EjectionRevealModal: React.FC<EjectionRevealProps> = ({ roomState }) => {
  const ejectedId = roomState.ejectedPlayerId;
  const ejectedRole = roomState.ejectedPlayerRole;
  const ejectedPlayer = ejectedId && ejectedId !== 'none' ? roomState.players[ejectedId] : null;

  useEffect(() => {
    sounds.playEjection();
  }, []);

  const isSkipped = ejectedId === 'none' || !ejectedPlayer;
  const wasAnomaly = ejectedRole === 'anomaly';

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 backdrop-blur-md animate-fadeIn">
      <div className="max-w-md w-full bg-slate-950 border-2 border-cyan-500/60 rounded-2xl p-6 text-center shadow-[0_0_50px_rgba(6,182,212,0.3)] relative overflow-hidden">
        {/* Holographic Stasis Chamber Light Beam */}
        <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/10 via-transparent to-purple-500/10 pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center">
          <div className="text-[10px] font-mono tracking-widest text-cyan-400 uppercase mb-4 px-3 py-1 rounded-full bg-cyan-950/70 border border-cyan-500/40">
            AIRLOCK FORENSIC QUARANTINE PROTOCOL
          </div>

          {/* Stasis Pod Graphic */}
          <div className="relative my-4">
            <div className="w-24 h-24 rounded-2xl bg-slate-900 border-2 border-cyan-400 flex items-center justify-center text-4xl shadow-[0_0_30px_rgba(6,182,212,0.5)] animate-pulse">
              {ejectedPlayer ? ejectedPlayer.avatar : '⚖️'}
            </div>
            {/* Energy Rings */}
            <div className="absolute -inset-2 rounded-2xl border border-cyan-400/40 animate-ping" />
          </div>

          {/* Verdict Announcement */}
          {isSkipped ? (
            <div className="space-y-2">
              <h3 className="font-mono text-xl font-bold text-slate-200">
                NO RESEARCHER QUARANTINED
              </h3>
              <p className="text-xs font-mono text-slate-400">
                Voting consensus was tied or the research council elected to abstain. Containment operations resume.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <h3 className="font-mono text-xl font-bold text-slate-100">
                {ejectedPlayer.name} was jettisoned into stasis.
              </h3>

              <div className="py-3 px-4 rounded-xl my-2 border inline-block">
                {wasAnomaly ? (
                  <div className="flex items-center gap-2 text-rose-400 font-mono font-bold text-sm bg-rose-950/60 px-4 py-2 rounded-lg border border-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.4)]">
                    <Skull className="w-5 h-5 animate-bounce" />
                    FORENSIC MATCH: THE ROGUE ANOMALY
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-emerald-400 font-mono font-bold text-sm bg-emerald-950/60 px-4 py-2 rounded-lg border border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                    <ShieldCheck className="w-5 h-5" />
                    TRAGEDY: INNOCENT RESEARCH SCIENTIST
                  </div>
                )}
              </div>

              <p className="text-xs font-mono text-slate-400">
                {wasAnomaly
                  ? 'The wild anomalous variable has been successfully excised from the facility!'
                  : 'An innocent scientist was quarantined. The rogue Anomaly still walks among the crew.'}
              </p>
            </div>
          )}

          <div className="mt-6 text-[11px] font-mono text-cyan-400/70 animate-pulse">
            Resuming facility operations in {roomState.phaseTimeRemaining}s...
          </div>
        </div>
      </div>
    </div>
  );
};

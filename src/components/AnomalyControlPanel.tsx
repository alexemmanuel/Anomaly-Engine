import React from 'react';
import type { GameRoomState, Player } from '../types/game';
import { sounds } from '../services/soundFx';
import { 
  Biohazard, 
  ZapOff, 
  RadioTower, 
  ShieldAlert, 
  Skull, 
  Flame,
  Check
} from 'lucide-react';

interface AnomalyControlProps {
  roomState: GameRoomState;
  currentPlayer: Player;
  onTriggerSabotage: (type: 'blackout' | 'telemetry_glitch') => void;
  onCorruptTask: (taskId: string) => void;
}

export const AnomalyControlPanel: React.FC<AnomalyControlProps> = ({
  roomState,
  currentPlayer,
  onTriggerSabotage,
  onCorruptTask,
}) => {
  if (currentPlayer.role !== 'anomaly') return null;

  const { sabotage, tasks, facilityCorruption } = roomState;
  const blackoutCd = sabotage.cooldowns.blackout;
  const glitchCd = sabotage.cooldowns.telemetryGlitch;

  // Available tasks in current sector that can be corrupted
  const currentSectorTasks = tasks.filter(
    t => t.sector === currentPlayer.currentSector && !t.isCorrupted && !t.isCompleted
  );

  const handleBlackout = () => {
    if (blackoutCd > 0 || sabotage.blackoutActive) return;
    sounds.playGlitch();
    onTriggerSabotage('blackout');
  };

  const handleGlitch = () => {
    if (glitchCd > 0 || sabotage.telemetryGlitched) return;
    sounds.playGlitch();
    onTriggerSabotage('telemetry_glitch');
  };

  return (
    <div className="bg-gradient-to-r from-rose-950/80 via-slate-900/90 to-purple-950/80 border-2 border-rose-500/60 rounded-xl p-4 shadow-2xl text-slate-100 relative overflow-hidden">
      {/* Glitch Strobe Top Accent */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-500 via-purple-500 to-rose-500 animate-pulse" />

      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 pb-3 border-b border-rose-500/20 mb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-rose-500/20 border border-rose-500/50 text-rose-400 animate-bounce">
            <Biohazard className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-rose-400">
                CLASSIFIED: THE ROGUE ANOMALY (WILD VARIABLE)
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-rose-900/60 text-rose-200 border border-rose-500/40">
                ACTIVE INFILTRATION
              </span>
            </div>
            <p className="text-xs text-slate-300">
              Corrupt experiments, manipulate flight logs, and eliminate logic scientists before stability reaches 100%.
            </p>
          </div>
        </div>

        {/* Global Facility Meltdown Progress */}
        <div className="flex items-center gap-3 font-mono text-xs bg-slate-950/80 px-3 py-1.5 rounded-lg border border-rose-900/50">
          <span className="text-rose-400">TOTAL CORRUPTION:</span>
          <span className="font-bold text-rose-300 text-sm">{facilityCorruption}%</span>
        </div>
      </div>

      {/* Sabotage Action Toolbar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {/* Action 1: Blackout */}
        <button
          onClick={handleBlackout}
          disabled={blackoutCd > 0 || sabotage.blackoutActive}
          className={`p-3 rounded-lg border text-left font-mono transition flex items-center justify-between ${
            blackoutCd > 0 || sabotage.blackoutActive
              ? 'bg-slate-900/60 border-slate-800 text-slate-500 cursor-not-allowed'
              : 'bg-rose-950/40 border-rose-500/50 hover:border-rose-400 text-rose-200 hover:bg-rose-900/40 shadow-lg shadow-rose-950/30'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <ZapOff className={`w-4 h-4 ${blackoutCd === 0 ? 'text-rose-400' : 'text-slate-600'}`} />
            <div>
              <div className="font-bold text-xs">AUXILIARY BLACKOUT</div>
              <div className="text-[10px] text-slate-400">Cut lights & accelerate corruption for 15s</div>
            </div>
          </div>
          <span className="text-xs font-bold text-rose-400">
            {sabotage.blackoutActive ? 'ACTIVE' : blackoutCd > 0 ? `${blackoutCd}s` : 'READY'}
          </span>
        </button>

        {/* Action 2: Scramble Telemetry */}
        <button
          onClick={handleGlitch}
          disabled={glitchCd > 0 || sabotage.telemetryGlitched}
          className={`p-3 rounded-lg border text-left font-mono transition flex items-center justify-between ${
            glitchCd > 0 || sabotage.telemetryGlitched
              ? 'bg-slate-900/60 border-slate-800 text-slate-500 cursor-not-allowed'
              : 'bg-purple-950/40 border-purple-500/50 hover:border-purple-400 text-purple-200 hover:bg-purple-900/40 shadow-lg shadow-purple-950/30'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <RadioTower className={`w-4 h-4 ${glitchCd === 0 ? 'text-purple-400' : 'text-slate-600'}`} />
            <div>
              <div className="font-bold text-xs">SCRAMBLE TELEMETRY</div>
              <div className="text-[10px] text-slate-400">Inject phantom movement log to frame researchers</div>
            </div>
          </div>
          <span className="text-xs font-bold text-purple-400">
            {sabotage.telemetryGlitched ? 'GLITCHING' : glitchCd > 0 ? `${glitchCd}s` : 'READY'}
          </span>
        </button>

        {/* Action 3: Corrupt Current Chamber Console */}
        <div className="p-2.5 rounded-lg border border-rose-900/60 bg-slate-950/60 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[11px] font-mono mb-1">
            <span className="text-slate-300 font-bold flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 text-rose-400" />
              INFILTRATE CONSOLE:
            </span>
            <span className="text-[10px] text-slate-500">{currentPlayer.currentSector.toUpperCase()}</span>
          </div>

          {currentSectorTasks.length === 0 ? (
            <div className="text-[11px] text-slate-500 font-mono italic">
              No corruptible consoles in this chamber. Move to another sector.
            </div>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {currentSectorTasks.map(t => (
                <button
                  key={t.id}
                  onClick={() => {
                    sounds.playGlitch();
                    onCorruptTask(t.id);
                  }}
                  className="px-2 py-1 bg-rose-600 hover:bg-rose-500 text-white font-mono text-[10px] font-bold rounded shadow transition active:scale-95 flex items-center gap-1"
                >
                  <Skull className="w-3 h-3" />
                  CORRUPT {t.name.split(' ')[0]}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

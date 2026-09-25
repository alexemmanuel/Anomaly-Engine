import React from 'react';
import type { GameRoomState, Player, SectorId, FacilityTask } from '../types/game';
import { sounds } from '../services/soundFx';
import { 
  Zap, 
  Radio, 
  Flame, 
  Cpu, 
  Activity, 
  AlertOctagon, 
  CheckCircle2, 
  Users, 
  ArrowRight,
  ShieldAlert
} from 'lucide-react';

interface FacilityMapProps {
  roomState: GameRoomState;
  currentPlayer: Player;
  onMoveSector: (sector: SectorId) => void;
  onOpenTask: (task: FacilityTask) => void;
  onTriggerEmergency: () => void;
}

interface SectorConfig {
  id: SectorId;
  name: string;
  code: string;
  subTitle: string;
  icon: React.ComponentType<{ className?: string }>;
  accentColor: string;
  borderClass: string;
  bgClass: string;
}

const SECTOR_CONFIGS: Record<SectorId, SectorConfig> = {
  reactor: {
    id: 'reactor',
    name: 'Sector A: Quantum Reactor',
    code: 'SEC-A',
    subTitle: 'Core Pressure & Plasma Containment',
    icon: Flame,
    accentColor: '#f59e0b',
    borderClass: 'border-amber-500/40 hover:border-amber-400',
    bgClass: 'bg-amber-950/20',
  },
  signal: {
    id: 'signal',
    name: 'Sector B: Signal Array',
    code: 'SEC-B',
    subTitle: 'Tachyon Waveforms & Decryption',
    icon: Radio,
    accentColor: '#10b981',
    borderClass: 'border-emerald-500/40 hover:border-emerald-400',
    bgClass: 'bg-emerald-950/20',
  },
  telemetry_hub: {
    id: 'telemetry_hub',
    name: 'Central Holo-Hub & Bridge',
    code: 'HUB-0',
    subTitle: 'Black Box Diagnostics & Containment Override',
    icon: Activity,
    accentColor: '#06b6d4',
    borderClass: 'border-cyan-500/50 hover:border-cyan-400',
    bgClass: 'bg-cyan-950/25',
  },
  conduits: {
    id: 'conduits',
    name: 'Sector C: Conduit Matrix',
    code: 'SEC-C',
    subTitle: 'Auxiliary Shunts & High-Voltage Relays',
    icon: Zap,
    accentColor: '#38bdf8',
    borderClass: 'border-sky-500/40 hover:border-sky-400',
    bgClass: 'bg-sky-950/20',
  },
  archive: {
    id: 'archive',
    name: 'Sector D: Neural Archive',
    code: 'SEC-D',
    subTitle: 'Memory Buffers & Subroutine Quarantine',
    icon: Cpu,
    accentColor: '#a855f7',
    borderClass: 'border-purple-500/40 hover:border-purple-400',
    bgClass: 'bg-purple-950/20',
  },
};

export const FacilityMapView: React.FC<FacilityMapProps> = ({
  roomState,
  currentPlayer,
  onMoveSector,
  onOpenTask,
  onTriggerEmergency,
}) => {
  const isBlackout = roomState.sabotage.blackoutActive;

  // Group players by sector
  const playersInSector: Record<SectorId, Player[]> = {
    reactor: [],
    signal: [],
    telemetry_hub: [],
    conduits: [],
    archive: [],
  };

  Object.values(roomState.players).forEach(p => {
    if (p.isAlive && p.currentSector && playersInSector[p.currentSector]) {
      playersInSector[p.currentSector].push(p);
    }
  });

  const handleMove = (sector: SectorId) => {
    if (currentPlayer.currentSector === sector) return;
    sounds.playClick(700);
    onMoveSector(sector);
  };

  const handleTaskClick = (task: FacilityTask) => {
    sounds.playClick(900);
    onOpenTask(task);
  };

  const renderSectorCard = (sectorId: SectorId, isCenter = false) => {
    const config = SECTOR_CONFIGS[sectorId];
    const isCurrent = currentPlayer.currentSector === sectorId;
    const occupants = playersInSector[sectorId];
    const sectorTasks = roomState.tasks.filter(t => t.sector === sectorId);
    const uncompletedTasks = sectorTasks.filter(t => !t.isCompleted);
    const Icon = config.icon;

    // In blackout, other sectors are obscured unless you are in it
    const isObscured = isBlackout && !isCurrent;

    return (
      <div
        key={sectorId}
        className={`relative rounded-xl border p-4 transition-all duration-300 flex flex-col justify-between ${
          config.bgClass
        } ${config.borderClass} ${
          isCurrent
            ? 'ring-2 ring-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.25)] bg-slate-900/90'
            : 'bg-slate-950/80 shadow-md'
        } ${isObscured ? 'opacity-40 grayscale blur-[1px]' : ''}`}
      >
        {/* Sector Header */}
        <div>
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
              <div
                className="p-2 rounded-lg border"
                style={{
                  backgroundColor: `${config.accentColor}15`,
                  borderColor: `${config.accentColor}40`,
                  color: config.accentColor,
                }}
              >
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                    {config.code}
                  </span>
                  <h4 className="font-mono font-bold text-xs tracking-wide text-slate-100">
                    {config.name}
                  </h4>
                </div>
                <p className="text-[11px] text-slate-400 font-sans mt-0.5">{config.subTitle}</p>
              </div>
            </div>

            {isCurrent && (
              <span className="flex items-center gap-1 font-mono text-[10px] text-cyan-400 bg-cyan-950/80 border border-cyan-500/40 px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                YOU ARE HERE
              </span>
            )}
          </div>

          {/* Occupants / Researcher Badges */}
          <div className="my-2.5 bg-slate-900/70 rounded-lg p-2 border border-slate-800">
            <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mb-1.5">
              <span className="flex items-center gap-1">
                <Users className="w-3 h-3 text-slate-400" />
                RADAR SCANNERS ({occupants.length})
              </span>
              {isBlackout && (
                <span className="text-rose-400 font-bold animate-pulse">SENSORS OFFLINE</span>
              )}
            </div>

            {occupants.length === 0 ? (
              <div className="text-[11px] font-mono text-slate-600 italic">No researchers detected in sector</div>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {occupants.map(p => (
                  <div
                    key={p.id}
                    className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] font-mono border ${
                      p.id === currentPlayer.id
                        ? 'bg-cyan-950/80 border-cyan-500/50 text-cyan-200'
                        : 'bg-slate-800/90 border-slate-700 text-slate-300'
                    }`}
                  >
                    <span>{p.avatar}</span>
                    <span className="truncate max-w-[90px]">{p.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Terminals in this Sector */}
          {sectorTasks.length > 0 && (
            <div className="space-y-1.5 my-2">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
                DIAGNOSTIC TERMINALS ({sectorTasks.filter(t => t.isCompleted).length}/{sectorTasks.length})
              </span>

              {sectorTasks.map(task => {
                const canAccess = isCurrent && !task.isCompleted;
                return (
                  <div
                    key={task.id}
                    className={`p-2 rounded border flex items-center justify-between transition-all ${
                      task.isCompleted
                        ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300'
                        : canAccess
                        ? 'bg-slate-800/90 border-cyan-500/40 text-cyan-200 hover:border-cyan-400 shadow-sm'
                        : 'bg-slate-900/60 border-slate-800 text-slate-400'
                    }`}
                  >
                    <div className="flex items-center gap-2 text-xs font-mono">
                      {task.isCompleted ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                      )}
                      <span className={task.isCompleted ? 'line-through text-slate-500' : ''}>
                        {task.name}
                      </span>
                    </div>

                    {canAccess && (
                      <button
                        onClick={() => handleTaskClick(task)}
                        className="px-2.5 py-1 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-mono text-[10px] font-bold rounded shadow transition flex items-center gap-1"
                      >
                        ACCESS
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Central Hub Emergency Button */}
          {isCenter && (
            <div className="mt-3 p-3 bg-rose-950/30 border border-rose-500/40 rounded-lg flex flex-col items-center gap-2 text-center">
              <div className="flex items-center gap-2 text-rose-400 font-mono text-xs font-bold">
                <AlertOctagon className="w-4 h-4 animate-bounce" />
                CENTRAL CONTAINMENT GAVEL
              </div>
              <p className="text-[11px] text-slate-400">
                Call an immediate emergency meeting if anomalous behavior is observed.
              </p>
              <button
                onClick={() => {
                  sounds.playEmergencyAlarm();
                  onTriggerEmergency();
                }}
                className="w-full py-2 px-3 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-mono text-xs font-bold rounded shadow-lg shadow-rose-900/40 transition active:scale-95 flex items-center justify-center gap-2"
              >
                <ShieldAlert className="w-4 h-4" />
                INITIATE EMERGENCY VOTE
              </button>
            </div>
          )}
        </div>

        {/* Sector Navigation Trigger */}
        <div className="mt-3 pt-2 border-t border-slate-800 flex items-center justify-between">
          {!isCurrent ? (
            <button
              onClick={() => handleMove(sectorId)}
              className="w-full py-1.5 px-3 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono text-xs transition flex items-center justify-center gap-1.5 border border-slate-700"
            >
              MOVE TO {config.code}
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <span className="text-[11px] font-mono text-slate-500 w-full text-center">
              ACTIVE INSIDE CHAMBER
            </span>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="relative">
      {/* Blackout Atmospheric Warning Overlay */}
      {isBlackout && (
        <div className="mb-3 px-4 py-2 bg-rose-950/80 border border-rose-500 text-rose-200 rounded-xl flex items-center justify-between text-xs font-mono animate-pulse">
          <div className="flex items-center gap-2">
            <AlertOctagon className="w-4 h-4 text-rose-400" />
            <span className="font-bold">AUXILIARY POWER BREACH: EMERGENCY GENERATOR TIMER {roomState.sabotage.blackoutTimer}s</span>
          </div>
          <span className="text-rose-300">Minimap radar feeds disrupted</span>
        </div>
      )}

      {/* Facility Grid Map */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Sector A: Reactor */}
        {renderSectorCard('reactor')}

        {/* Sector E: Central Holo-Hub */}
        {renderSectorCard('telemetry_hub', true)}

        {/* Sector B: Signal Array */}
        {renderSectorCard('signal')}

        {/* Sector C: Conduit Junction */}
        {renderSectorCard('conduits')}

        {/* Tactical Overview Card */}
        <div className="rounded-xl border border-cyan-500/30 bg-slate-900/60 p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs font-bold mb-2">
              <Activity className="w-4 h-4" />
              FACILITY TELEMETRY SUMMARY
            </div>
            <div className="space-y-2 text-xs font-mono">
              <div className="flex justify-between text-slate-300">
                <span>Active Researchers:</span>
                <span className="font-bold text-cyan-400">
                  {Object.values(roomState.players).filter(p => p.isAlive).length} / {Object.keys(roomState.players).length}
                </span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Total Diagnostic Tasks:</span>
                <span className="font-bold text-emerald-400">
                  {roomState.tasks.filter(t => t.isCompleted).length} / {roomState.tasks.length} Completed
                </span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Facility Corruption Level:</span>
                <span className={`font-bold ${roomState.facilityCorruption > 60 ? 'text-rose-400' : 'text-amber-400'}`}>
                  {roomState.facilityCorruption}%
                </span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Core System Stability:</span>
                <span className="font-bold text-emerald-400">
                  {roomState.facilityStability}%
                </span>
              </div>
            </div>
          </div>

          <div className="mt-3 p-2 bg-slate-950/80 rounded border border-slate-800 text-[11px] text-slate-400 font-mono leading-relaxed">
            💡 <strong className="text-cyan-300">Tip:</strong> Check the{' '}
            <strong className="text-slate-200">Black Box Telemetry Log</strong> tab above to verify researcher whereabouts during system glitch spikes!
          </div>
        </div>

        {/* Sector D: Neural Archive */}
        {renderSectorCard('archive')}
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import type { GameRoomState, SectorId, TelemetryLog } from '../types/game';
import { sounds } from '../services/soundFx';
import { 
  FileText, 
  Filter, 
  Search, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  UserCheck, 
  HelpCircle, 
  EyeOff,
  Flame,
  Radio,
  Zap,
  Cpu,
  Activity
} from 'lucide-react';

interface TelemetryAuditProps {
  roomState: GameRoomState;
}

export const TelemetryAuditView: React.FC<TelemetryAuditProps> = ({ roomState }) => {
  const [sectorFilter, setSectorFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Researcher deduction scratchpad state
  const [suspectNotes, setSuspectNotes] = useState<Record<string, { status: 'clear' | 'suspect' | 'unknown'; note: string }>>({});

  const handleStatusToggle = (playerId: string) => {
    sounds.playClick(700);
    setSuspectNotes(prev => {
      const cur = prev[playerId]?.status || 'unknown';
      const nextStatus = cur === 'unknown' ? 'suspect' : cur === 'suspect' ? 'clear' : 'unknown';
      return {
        ...prev,
        [playerId]: {
          status: nextStatus,
          note: prev[playerId]?.note || '',
        },
      };
    });
  };

  const handleNoteChange = (playerId: string, note: string) => {
    setSuspectNotes(prev => ({
      ...prev,
      [playerId]: {
        status: prev[playerId]?.status || 'unknown',
        note,
      },
    }));
  };

  const filteredLogs = roomState.logs.filter(log => {
    if (sectorFilter !== 'all' && log.sector !== sectorFilter) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const matchDesc = log.description.toLowerCase().includes(term);
      const matchActor = log.actorName?.toLowerCase().includes(term);
      if (!matchDesc && !matchActor) return false;
    }
    return true;
  });

  const getLogIcon = (log: TelemetryLog) => {
    if (log.type === 'anomaly_spike' || log.isGlitched) {
      return <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />;
    }
    if (log.type === 'blackout') {
      return <EyeOff className="w-4 h-4 text-amber-400 shrink-0" />;
    }
    if (log.type === 'task_completed') {
      return <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />;
    }
    if (log.type === 'sector_entry') {
      return <Activity className="w-4 h-4 text-cyan-400 shrink-0" />;
    }
    return <FileText className="w-4 h-4 text-slate-400 shrink-0" />;
  };

  const getSectorBadge = (sec: SectorId) => {
    switch (sec) {
      case 'reactor': return <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-950/60 border border-amber-500/40 text-amber-300">SEC-A</span>;
      case 'signal': return <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-950/60 border border-emerald-500/40 text-emerald-300">SEC-B</span>;
      case 'conduits': return <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-sky-950/60 border border-sky-500/40 text-sky-300">SEC-C</span>;
      case 'archive': return <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-purple-950/60 border border-purple-500/40 text-purple-300">SEC-D</span>;
      default: return <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-950/60 border border-cyan-500/40 text-cyan-300">HUB-0</span>;
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
      {/* Black Box Audit Log (2 Cols) */}
      <div className="lg:col-span-2 bg-slate-900/80 border border-cyan-500/30 rounded-xl p-4 flex flex-col shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-cyan-500/20 mb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-mono font-bold text-xs uppercase tracking-wider text-cyan-300">
                Facility Black Box Flight Recorder
              </h3>
              <p className="text-[11px] text-slate-400">Time-stamped audit records of chamber movements and subsystem events</p>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-500" />
              <input
                type="text"
                placeholder="Search logs..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-8 pr-3 py-1 rounded bg-slate-950 border border-slate-800 text-xs font-mono text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500 w-36"
              />
            </div>

            <select
              value={sectorFilter}
              onChange={e => setSectorFilter(e.target.value)}
              className="py-1 px-2.5 rounded bg-slate-950 border border-slate-800 text-xs font-mono text-slate-300 focus:outline-none focus:border-cyan-500"
            >
              <option value="all">All Sectors</option>
              <option value="reactor">Sector A (Reactor)</option>
              <option value="signal">Sector B (Signal)</option>
              <option value="conduits">Sector C (Conduits)</option>
              <option value="archive">Sector D (Archive)</option>
              <option value="telemetry_hub">Central Hub</option>
            </select>
          </div>
        </div>

        {/* Log Entries Container */}
        <div className="flex-1 overflow-y-auto max-h-[460px] space-y-2 pr-1 custom-scrollbar">
          {filteredLogs.length === 0 ? (
            <div className="text-center py-12 text-slate-500 font-mono text-xs">
              No telemetry events match query filter.
            </div>
          ) : (
            filteredLogs.map(log => {
              const dateStr = new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
              return (
                <div
                  key={log.id}
                  className={`p-2.5 rounded border text-xs font-mono transition-all flex items-start gap-2.5 ${
                    log.isGlitched
                      ? 'bg-rose-950/20 border-rose-500/40 text-rose-200 shadow-sm'
                      : log.type === 'task_completed'
                      ? 'bg-emerald-950/15 border-emerald-500/30 text-emerald-200'
                      : 'bg-slate-950/70 border-slate-800/80 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div className="mt-0.5">{getLogIcon(log)}</div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] text-slate-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {dateStr}
                      </span>
                      {getSectorBadge(log.sector)}
                      {log.isGlitched && (
                        <span className="text-[9px] px-1 py-0.2 bg-rose-500/30 border border-rose-500/50 text-rose-300 rounded uppercase font-bold animate-pulse">
                          SENSOR GLITCH
                        </span>
                      )}
                    </div>
                    <p className="text-xs leading-relaxed text-slate-200">{log.description}</p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Forensic Deduction Scratchpad (1 Col) */}
      <div className="bg-slate-900/80 border border-cyan-500/30 rounded-xl p-4 flex flex-col shadow-xl">
        <div className="pb-3 border-b border-cyan-500/20 mb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <UserCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-mono font-bold text-xs uppercase tracking-wider text-cyan-300">
                Forensic Deduction Matrix
              </h3>
              <p className="text-[11px] text-slate-400">Tag suspects and cross-reference alibis</p>
            </div>
          </div>
        </div>

        <div className="space-y-3 overflow-y-auto max-h-[460px] pr-1">
          {Object.values(roomState.players).map(player => {
            const deduction = suspectNotes[player.id] || { status: 'unknown', note: '' };
            const isAlive = player.isAlive;

            return (
              <div
                key={player.id}
                className={`p-3 rounded-lg border text-xs font-mono transition-all ${
                  !isAlive
                    ? 'opacity-40 bg-slate-950/50 border-slate-800 line-through'
                    : deduction.status === 'suspect'
                    ? 'bg-rose-950/30 border-rose-500/60 shadow-[0_0_12px_rgba(244,63,94,0.15)]'
                    : deduction.status === 'clear'
                    ? 'bg-emerald-950/30 border-emerald-500/50'
                    : 'bg-slate-950/70 border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-base">{player.avatar}</span>
                    <span className="font-bold text-slate-100">{player.name}</span>
                    {player.isBot && (
                      <span className="text-[9px] px-1 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700">
                        AI
                      </span>
                    )}
                  </div>

                  {isAlive && (
                    <button
                      onClick={() => handleStatusToggle(player.id)}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold border transition ${
                        deduction.status === 'suspect'
                          ? 'bg-rose-500 text-white border-rose-400 shadow-rose-500/30'
                          : deduction.status === 'clear'
                          ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                          : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
                      }`}
                    >
                      {deduction.status === 'suspect'
                        ? '⚠️ SUSPECT'
                        : deduction.status === 'clear'
                        ? '🛡️ CLEAR'
                        : '❓ UNKNOWN'}
                    </button>
                  )}
                </div>

                {isAlive && (
                  <input
                    type="text"
                    placeholder="Log alibi or suspicious notes..."
                    value={deduction.note}
                    onChange={e => handleNoteChange(player.id, e.target.value)}
                    className="w-full mt-1 px-2 py-1 rounded bg-slate-900 border border-slate-800 text-[11px] text-slate-300 placeholder-slate-600 focus:outline-none focus:border-cyan-500"
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

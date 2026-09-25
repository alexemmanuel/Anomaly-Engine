import React, { useState, useEffect } from 'react';
import type { GameRoomState, Player } from '../types/game';
import { sounds } from '../services/soundFx';
import { 
  AlertOctagon, 
  Clock, 
  Send, 
  Vote, 
  Check, 
  ShieldAlert, 
  HelpCircle,
  MessageSquare,
  Activity
} from 'lucide-react';

interface EmergencyMeetingProps {
  roomState: GameRoomState;
  currentPlayer: Player;
  onCastVote: (targetId: string | 'skip') => void;
  onSendChat: (message: string) => void;
  chatMessages: Array<{ senderId: string; senderName: string; senderColor: string; message: string; timestamp: number }>;
}

const PRESET_EVIDENCE_PROMPTS = [
  "I was with Dr. Vance in Sector C running conduits.",
  "Check the Black Box! Anomaly spike occurred in Sector A.",
  "I just completed the Signal Array decryption.",
  "Someone flipped auxiliary power! Who was in the Reactor?",
  "I vote to SKIP this round. Insufficient telemetry.",
];

export const EmergencyMeetingView: React.FC<EmergencyMeetingProps> = ({
  roomState,
  currentPlayer,
  onCastVote,
  onSendChat,
  chatMessages,
}) => {
  const [inputText, setInputText] = useState('');
  const caller = roomState.emergencyCallerId ? roomState.players[roomState.emergencyCallerId] : null;

  // Heartbeat sound pulse effect
  useEffect(() => {
    sounds.playHeartbeat();
    const interval = setInterval(() => {
      sounds.playHeartbeat();
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleVote = (target: string | 'skip') => {
    sounds.playClick(850);
    onCastVote(target);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    sounds.playClick(600);
    onSendChat(inputText);
    setInputText('');
  };

  const handlePresetClick = (preset: string) => {
    sounds.playClick(600);
    onSendChat(preset);
  };

  const alivePlayers = Object.values(roomState.players).filter(p => p.isAlive);
  const myVote = currentPlayer.votedFor;

  return (
    <div className="bg-slate-900/90 border-2 border-rose-500/50 rounded-2xl p-5 shadow-2xl text-slate-100 flex flex-col gap-5 max-w-5xl mx-auto backdrop-blur-md">
      {/* Top Emergency Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-rose-500/20">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-400 animate-pulse">
            <AlertOctagon className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-mono font-bold text-lg text-rose-400 uppercase tracking-widest">
                Emergency Containment Deliberation
              </h2>
            </div>
            <p className="text-xs text-slate-300 font-sans mt-0.5">
              Convened by{' '}
              <strong className="text-rose-300 font-mono">
                {caller ? caller.name : 'Automated Containment Sensor'}
              </strong>
              . Review flight logs and vote to quarantine the suspected Anomaly.
            </p>
          </div>
        </div>

        {/* Countdown Timer */}
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-950 border border-rose-500/40 shadow-inner">
          <Clock className="w-5 h-5 text-rose-400 animate-spin" />
          <div className="font-mono">
            <div className="text-[10px] text-slate-400">VOTING EXPIRES IN</div>
            <div className="text-xl font-bold text-rose-300">
              {roomState.phaseTimeRemaining}s
            </div>
          </div>
        </div>
      </div>

      {/* Main Deliberation Body: Suspect Roster & Real-time Chat */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Suspect Roster & Voting Cards (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400">
            <span className="uppercase tracking-wider font-semibold">Active Researchers ({alivePlayers.length})</span>
            <span>{myVote ? 'VOTE RECORDED' : 'AWAITING YOUR BALLOT'}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {alivePlayers.map(player => {
              const isMe = player.id === currentPlayer.id;
              const hasVoted = player.votedFor !== undefined && player.votedFor !== null;
              const isMyTarget = myVote === player.id;

              return (
                <div
                  key={player.id}
                  className={`p-3.5 rounded-xl border transition-all flex flex-col justify-between ${
                    isMyTarget
                      ? 'bg-rose-950/40 border-rose-500 ring-2 ring-rose-400/50 shadow-lg shadow-rose-950/50'
                      : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-lg bg-slate-900 border border-slate-700 flex items-center justify-center text-xl shadow-inner">
                        {player.avatar}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-xs text-slate-100">
                            {player.name}
                          </span>
                          {isMe && (
                            <span className="text-[9px] font-mono px-1 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                              YOU
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                          Sector: <span className="text-cyan-300 uppercase">{player.currentSector}</span>
                        </div>
                      </div>
                    </div>

                    {hasVoted ? (
                      <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-800">
                        <Check className="w-3 h-3" />
                        VOTED
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono text-slate-500 animate-pulse">
                        THINKING...
                      </span>
                    )}
                  </div>

                  {/* Task contributions count */}
                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pt-2 border-t border-slate-800/80 my-1">
                    <span>Tasks Completed:</span>
                    <span className="font-bold text-slate-200">{player.completedTasks.length}</span>
                  </div>

                  {/* Vote Action Button */}
                  <div className="mt-2">
                    {currentPlayer.isAlive && !isMe && (
                      <button
                        onClick={() => handleVote(player.id)}
                        disabled={myVote === player.id}
                        className={`w-full py-1.5 px-3 rounded font-mono text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                          isMyTarget
                            ? 'bg-rose-600 text-white shadow'
                            : 'bg-slate-800 hover:bg-rose-950/50 hover:border-rose-500/50 text-slate-300 border border-slate-700'
                        }`}
                      >
                        <Vote className="w-3.5 h-3.5" />
                        {isMyTarget ? 'VOTED FOR QUARANTINE' : 'QUARANTINE SUSPECT'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Skip Vote Row */}
          {currentPlayer.isAlive && (
            <button
              onClick={() => handleVote('skip')}
              className={`w-full py-2.5 px-4 rounded-xl font-mono text-xs font-bold transition flex items-center justify-center gap-2 border ${
                myVote === 'skip'
                  ? 'bg-amber-600/40 border-amber-400 text-amber-200 ring-2 ring-amber-400/30'
                  : 'bg-slate-950 hover:bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <HelpCircle className="w-4 h-4 text-amber-400" />
              <span>SKIP VOTE (INSUFFICIENT FORENSIC EVIDENCE)</span>
            </button>
          )}
        </div>

        {/* Real-time Forensic Deliberation Chat & Evidence Presets (5 Cols) */}
        <div className="lg:col-span-5 bg-slate-950/90 rounded-xl border border-slate-800 p-4 flex flex-col justify-between shadow-xl">
          <div>
            <div className="flex items-center gap-2 pb-2.5 border-b border-slate-800 mb-3 text-xs font-mono text-cyan-400 font-bold">
              <MessageSquare className="w-4 h-4" />
              <span>SECURE RESEARCH DELIBERATION CHANNEL</span>
            </div>

            {/* Quick Evidence Presets */}
            <div className="mb-3">
              <div className="text-[10px] font-mono text-slate-500 uppercase mb-1.5">QUICK EVIDENCE CHIPS</div>
              <div className="flex flex-wrap gap-1">
                {PRESET_EVIDENCE_PROMPTS.map((prompt, idx) => (
                  <button
                    key={idx}
                    onClick={() => handlePresetClick(prompt)}
                    className="text-[10px] font-mono bg-slate-900 hover:bg-cyan-950/50 hover:border-cyan-500/40 text-slate-300 px-2 py-1 rounded border border-slate-800 transition text-left"
                  >
                    "{prompt}"
                  </button>
                ))}
              </div>
            </div>

            {/* Chat Messages Log */}
            <div className="overflow-y-auto max-h-[220px] space-y-2 pr-1 custom-scrollbar">
              {chatMessages.length === 0 ? (
                <div className="text-center py-8 text-slate-600 font-mono text-xs italic">
                  Open frequency. Present your logic deduction or state your alibi.
                </div>
              ) : (
                chatMessages.map((msg, i) => (
                  <div key={i} className="text-xs font-mono bg-slate-900/60 p-2 rounded border border-slate-800/80">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="font-bold text-cyan-300">{msg.senderName}:</span>
                      <span className="text-[10px] text-slate-500">
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-slate-200">{msg.message}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Chat Input */}
          <form onSubmit={handleSendMessage} className="mt-3 flex gap-2">
            <input
              type="text"
              placeholder="State evidence or cross-examine..."
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              className="flex-1 px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs font-mono text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
            <button
              type="submit"
              className="p-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold transition shadow-md"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

import React, { useState, useRef, useEffect } from 'react';
import type { GameRoomState, Player } from '../types/game';
import { chatWithAdam, type ChatMessage } from '../services/gemini';
import { sounds } from '../services/soundFx';
import { 
  Bot, 
  Send, 
  X, 
  Sparkles, 
  Activity, 
  AlertTriangle, 
  RotateCcw, 
  Terminal,
  Cpu
} from 'lucide-react';

interface AdamAssistantProps {
  roomState: GameRoomState | null;
  currentPlayer: Player | null;
  onClose: () => void;
}

const PRESET_QUERIES = [
  'Analyze recent Black Box logs for anomalous movement',
  'What are the telltale signs of a sabotaged conduit?',
  'Help me formulate an alibi check for the crew',
  'How do I maintain reactor pressure harmonics?',
];

export const AdamAssistantModal: React.FC<AdamAssistantProps> = ({
  roomState,
  currentPlayer,
  onClose,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'model',
      text: 'A.D.A.M. Mainframe online. I am monitoring Deep Synapse Sublevel 9 telemetry streams. State your query regarding facility diagnostics, flight logs, or anomalous patterns.',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async (textToSend?: string) => {
    const query = textToSend || input;
    if (!query.trim() || loading) return;

    sounds.playClick(650);
    const newHistory: ChatMessage[] = [...messages, { role: 'user', text: query }];
    setMessages(newHistory);
    setInput('');
    setLoading(true);

    try {
      // Build real-time context from current room state
      const facilityContext = roomState ? {
        phase: roomState.phase,
        facilityCorruption: roomState.facilityCorruption,
        facilityStability: roomState.facilityStability,
        activePlayersCount: Object.values(roomState.players).filter(p => p.isAlive).length,
        blackoutActive: roomState.sabotage.blackoutActive,
        recentTelemetryLogs: roomState.logs.slice(0, 8).map(l => ({
          time: new Date(l.timestamp).toLocaleTimeString(),
          sector: l.sector,
          desc: l.description,
          glitched: l.isGlitched,
        })),
        queriedBy: currentPlayer ? { name: currentPlayer.name, sector: currentPlayer.currentSector } : 'Guest',
      } : null;

      const reply = await chatWithAdam(newHistory, facilityContext);
      sounds.playTaskSuccess();
      setMessages([...newHistory, { role: 'model', text: reply }]);
    } catch (err: any) {
      sounds.playGlitch();
      setMessages([
        ...newHistory,
        { role: 'model', text: `ERROR: Sublevel 9 mainframe link degraded. [${err?.message || 'Connection timeout'}]` },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    sounds.playClick(400);
    setMessages([
      {
        role: 'model',
        text: 'A.D.A.M. conversation buffer flushed. Awaiting new diagnostic inquiry.',
      },
    ]);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4 backdrop-blur-md animate-fadeIn">
      <div className="max-w-2xl w-full bg-slate-950 border-2 border-cyan-500/50 rounded-2xl p-5 shadow-2xl text-slate-100 flex flex-col max-h-[85vh] relative overflow-hidden">
        {/* Holographic Header Bar */}
        <div className="flex items-center justify-between pb-3 border-b border-cyan-500/20 mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
              <Cpu className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-mono font-bold text-sm tracking-wider uppercase text-cyan-300">
                  A.D.A.M. FORENSIC AI MAINFRAME
                </h3>
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5" />
                  GEMINI 3.5 FLASH
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Autonomous Diagnostic & Telemetry Analysis Intelligence</p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={handleReset}
              className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-cyan-300 transition"
              title="Reset Conversation Buffer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                sounds.playClick(500);
                onClose();
              }}
              className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-100 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Quick Query Chips */}
        <div className="mb-2">
          <div className="text-[10px] font-mono text-slate-500 uppercase mb-1">SUGGESTED DIAGNOSTIC INQUIRIES</div>
          <div className="flex flex-wrap gap-1.5">
            {PRESET_QUERIES.map((q, idx) => (
              <button
                key={idx}
                disabled={loading}
                onClick={() => handleSend(q)}
                className="text-[10px] font-mono bg-slate-900/90 hover:bg-cyan-950/60 hover:border-cyan-500/40 text-slate-300 px-2 py-1 rounded border border-slate-800 transition text-left"
              >
                "{q}"
              </button>
            ))}
          </div>
        </div>

        {/* Conversation Thread */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1 py-2 custom-scrollbar border-y border-slate-900">
          {messages.map((m, idx) => {
            const isModel = m.role === 'model';
            return (
              <div
                key={idx}
                className={`flex gap-2.5 text-xs font-mono ${
                  isModel ? 'items-start' : 'items-end flex-row-reverse'
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-lg shrink-0 flex items-center justify-center text-xs shadow-inner ${
                    isModel
                      ? 'bg-cyan-950 border border-cyan-500/50 text-cyan-300'
                      : 'bg-slate-800 border border-slate-700 text-slate-200'
                  }`}
                >
                  {isModel ? <Bot className="w-4 h-4" /> : '👤'}
                </div>

                <div
                  className={`max-w-[85%] rounded-xl p-3 leading-relaxed shadow-sm ${
                    isModel
                      ? 'bg-slate-900/90 border border-cyan-500/20 text-slate-200'
                      : 'bg-cyan-950/60 border border-cyan-500/40 text-cyan-100'
                  }`}
                >
                  {m.text}
                </div>
              </div>
            );
          })}

          {loading && (
            <div className="flex gap-2.5 text-xs font-mono items-center text-cyan-400">
              <div className="w-7 h-7 rounded-lg bg-cyan-950 border border-cyan-500/50 flex items-center justify-center animate-spin">
                <Activity className="w-4 h-4" />
              </div>
              <span className="animate-pulse">A.D.A.M. synthesizing telemetry analysis...</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="mt-3 flex gap-2"
        >
          <div className="relative flex-1">
            <Terminal className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-500" />
            <input
              type="text"
              placeholder="Query A.D.A.M. about logs, sabotages, alibis, or diagnostics..."
              value={input}
              onChange={e => setInput(e.target.value)}
              disabled={loading}
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-400"
            />
          </div>
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className={`px-4 py-2 rounded-xl font-mono text-xs font-bold transition flex items-center gap-1.5 shadow ${
              input.trim() && !loading
                ? 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 active:scale-95'
                : 'bg-slate-900 text-slate-600 border border-slate-800 cursor-not-allowed'
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            TRANSMIT
          </button>
        </form>
      </div>
    </div>
  );
};

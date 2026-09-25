import React from 'react';
import { sounds } from '../services/soundFx';
import { 
  HelpCircle, 
  X, 
  ShieldCheck, 
  Skull, 
  Zap, 
  Radio, 
  Flame, 
  Cpu, 
  FileText, 
  Users 
} from 'lucide-react';

interface GameGuideProps {
  onClose: () => void;
}

export const GameGuideModal: React.FC<GameGuideProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4 backdrop-blur-md animate-fadeIn">
      <div className="max-w-2xl w-full bg-slate-950 border border-cyan-500/40 rounded-2xl p-6 shadow-2xl text-slate-100 flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-cyan-500/20 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-mono font-bold text-sm tracking-wider uppercase text-cyan-300">
                Facility Field Manual: Wild vs Logic
              </h3>
              <p className="text-xs text-slate-400">Tactical guide for Scientists and the Rogue Anomaly</p>
            </div>
          </div>
          <button
            onClick={() => {
              sounds.playClick(500);
              onClose();
            }}
            className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1 custom-scrollbar text-xs font-mono">
          {/* Premise */}
          <div className="p-3.5 bg-slate-900/80 rounded-xl border border-slate-800 leading-relaxed text-slate-300">
            <h4 className="font-bold text-cyan-300 uppercase mb-1 flex items-center gap-1.5">
              <span>🌌</span> THE PREMISE
            </h4>
            <p>
              Deep Synapse Sublevel 9 is studying an artificial quantum entity known as <strong>The Anomaly</strong>. 
              The synthetic consciousness has escaped containment and is masquerading as one of the research scientists. 
              Human intuition (<span className="text-rose-400 font-bold">"The Wild"</span>) battles against algorithmic deduction (<span className="text-emerald-400 font-bold">"The Logic"</span>).
            </p>
          </div>

          {/* Two Roles */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* The Scientists */}
            <div className="p-3.5 bg-emerald-950/20 border border-emerald-500/40 rounded-xl space-y-2">
              <div className="flex items-center gap-2 text-emerald-400 font-bold uppercase">
                <ShieldCheck className="w-4 h-4" />
                <span>THE SCIENTISTS (LOGIC)</span>
              </div>
              <ul className="space-y-1.5 text-slate-300 list-disc list-inside">
                <li>Move between facility sectors and complete diagnostic mini-games to boost System Stability to 100%.</li>
                <li>Audit the <strong>Black Box Telemetry Log</strong> to see who entered which chamber before a power blackout or corruption surge.</li>
                <li>Call an Emergency Containment vote at the Central Holo-Table to quarantine the Anomaly into stasis!</li>
              </ul>
            </div>

            {/* The Anomaly */}
            <div className="p-3.5 bg-rose-950/20 border border-rose-500/40 rounded-xl space-y-2">
              <div className="flex items-center gap-2 text-rose-400 font-bold uppercase">
                <Skull className="w-4 h-4" />
                <span>THE ANOMALY (WILD)</span>
              </div>
              <ul className="space-y-1.5 text-slate-300 list-disc list-inside">
                <li>Pretend to complete diagnostic tasks to blend in with innocent researchers.</li>
                <li>Trigger <strong>Auxiliary Blackout</strong> to cut lights and accelerate facility corruption.</li>
                <li>Trigger <strong>Scramble Telemetry</strong> to inject phantom radar logs and frame innocent scientists!</li>
                <li>Corrupt active sector consoles to drive facility corruption to 100%.</li>
              </ul>
            </div>
          </div>

          {/* Mini-Games Overview */}
          <div className="p-3.5 bg-slate-900/80 rounded-xl border border-slate-800 space-y-2">
            <h4 className="font-bold text-cyan-300 uppercase mb-2">
              FACILITY DIAGNOSTIC PROTOCOLS (MINI-GAMES)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
              <div className="p-2 rounded bg-slate-950 border border-slate-800 flex items-start gap-2">
                <Zap className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-200">Wire Matrix Hacking:</strong> Connect matching polarity conduits from left to right terminals.
                </div>
              </div>
              <div className="p-2 rounded bg-slate-950 border border-slate-800 flex items-start gap-2">
                <Radio className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-200">Signal Decryption:</strong> Adjust frequency, amplitude, and phase to match the target wave (&gt;=90%).
                </div>
              </div>
              <div className="p-2 rounded bg-slate-950 border border-slate-800 flex items-start gap-2">
                <Flame className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-200">Reactor Calibration:</strong> Balance all 3 core pressure chambers inside the green target zone.
                </div>
              </div>
              <div className="p-2 rounded bg-slate-950 border border-slate-800 flex items-start gap-2">
                <Cpu className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-200">Memory Purge:</strong> Memorize and quarantine the 4 corrupted neural clusters on the matrix grid.
                </div>
              </div>
            </div>
          </div>

          {/* Forensic Deduction Tips */}
          <div className="p-3.5 bg-slate-900/80 rounded-xl border border-slate-800 space-y-1.5 text-slate-300">
            <h4 className="font-bold text-amber-400 uppercase flex items-center gap-1.5">
              <span>🔍</span> FORENSIC DEDUCTION TIPS
            </h4>
            <p>
              The <strong>Black Box Telemetry</strong> log never lies (unless the Anomaly scrambled it with phantom echoes). 
              If the conduit junction short-circuited at 12:04, look at who checked into Sector C at 12:03! 
              Use the in-game deduction scratchpad to mark researchers as <span className="text-emerald-400">Clear</span> or <span className="text-rose-400">Suspect</span>.
            </p>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-800 flex justify-end">
          <button
            onClick={() => {
              sounds.playClick(600);
              onClose();
            }}
            className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-mono text-xs font-bold transition"
          >
            ACKNOWLEDGED (RETURN TO FACILITY)
          </button>
        </div>
      </div>
    </div>
  );
};

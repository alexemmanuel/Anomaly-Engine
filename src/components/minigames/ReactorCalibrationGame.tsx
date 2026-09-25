import React, { useState, useEffect } from 'react';
import { sounds } from '../../services/soundFx';
import { Flame, ShieldCheck, Plus, Minus, CheckCircle2 } from 'lucide-react';

interface ReactorProps {
  onComplete: () => void;
  onCancel: () => void;
  isCorrupted?: boolean;
}

export const ReactorCalibrationGame: React.FC<ReactorProps> = ({ onComplete, onCancel, isCorrupted }) => {
  const [pressures, setPressures] = useState<[number, number, number]>([35, 75, 25]);
  const [lockProgress, setLockProgress] = useState(0);
  const [isSuccess, setIsSuccess] = useState(false);

  // Stability check: all three between 45 and 65
  const isAllInZone = pressures.every(p => p >= 45 && p <= 65);

  useEffect(() => {
    const timer = setInterval(() => {
      // Natural slight drift
      setPressures(prev => [
        Math.max(10, Math.min(90, prev[0] + (Math.random() > 0.5 ? 1 : -1))),
        Math.max(10, Math.min(90, prev[1] + (Math.random() > 0.5 ? 1 : -1))),
        Math.max(10, Math.min(90, prev[2] + (Math.random() > 0.5 ? 1 : -1))),
      ]);
    }, 800);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (isSuccess) return;

    const lockInterval = setInterval(() => {
      if (isAllInZone) {
        setLockProgress(prev => {
          const next = prev + 10;
          if (next >= 100) {
            setIsSuccess(true);
            sounds.playTaskSuccess();
            setTimeout(() => {
              onComplete();
            }, 800);
            return 100;
          }
          return next;
        });
      } else {
        setLockProgress(prev => Math.max(0, prev - 8));
      }
    }, 250);

    return () => clearInterval(lockInterval);
  }, [isAllInZone, isSuccess, onComplete]);

  const adjustCore = (index: number, delta: number) => {
    sounds.playClick(600 + delta * 20);
    setPressures(prev => {
      const copy = [...prev] as [number, number, number];
      copy[index] = Math.max(10, Math.min(90, copy[index] + delta));
      return copy;
    });
  };

  return (
    <div className="bg-slate-900 border border-amber-500/40 rounded-xl p-5 shadow-2xl max-w-lg w-full text-slate-100">
      <div className="flex items-center justify-between pb-3 border-b border-amber-500/20 mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400">
            <Flame className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="font-mono font-bold text-sm tracking-wider uppercase text-amber-300">
              Quantum Reactor Stabilizer
            </h3>
            <p className="text-xs text-slate-400">Balance all three core harmonics inside the target green threshold</p>
          </div>
        </div>
      </div>

      {/* Target Progress Lock */}
      <div className="mb-4 bg-slate-950 p-3 rounded-lg border border-slate-800">
        <div className="flex justify-between items-center text-xs font-mono mb-1.5">
          <span className="text-slate-400 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            Harmonic Equilibrium Lock:
          </span>
          <span className={`font-bold ${isAllInZone ? 'text-emerald-400' : 'text-slate-500'}`}>
            {lockProgress}%
          </span>
        </div>
        <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden border border-slate-800">
          <div
            className={`h-full transition-all duration-300 ${
              isAllInZone ? 'bg-gradient-to-r from-emerald-500 to-cyan-400' : 'bg-amber-600/60'
            }`}
            style={{ width: `${lockProgress}%` }}
          />
        </div>
      </div>

      {/* Three Pressure Gauges */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        {(['Alpha Cell', 'Beta Cell', 'Gamma Cell'] as const).map((name, idx) => {
          const val = pressures[idx];
          const inZone = val >= 45 && val <= 65;

          return (
            <div
              key={name}
              className={`p-3 rounded-lg border bg-slate-950/80 flex flex-col items-center gap-2 transition-all ${
                inZone
                  ? 'border-emerald-500/50 shadow-[0_0_12px_rgba(16,185,129,0.15)]'
                  : 'border-slate-800'
              }`}
            >
              <span className="text-[11px] font-mono font-semibold text-slate-400">{name}</span>

              {/* Vertical Gauge Column */}
              <div className="relative w-8 h-32 bg-slate-900 rounded-full border border-slate-800 overflow-hidden flex flex-col justify-end p-1">
                {/* Target Zone Highlight (45% - 65%) */}
                <div
                  className="absolute left-0 right-0 bg-emerald-500/20 border-y border-emerald-500/40 pointer-events-none"
                  style={{ bottom: '45%', height: '20%' }}
                />

                {/* Fill Indicator */}
                <div
                  className={`w-full rounded-full transition-all duration-200 ${
                    inZone ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]' : 'bg-amber-500'
                  }`}
                  style={{ height: `${val}%` }}
                />
              </div>

              <span className={`font-mono text-xs font-bold ${inZone ? 'text-emerald-400' : 'text-amber-400'}`}>
                {val} PSI
              </span>

              {/* Step Controls */}
              <div className="flex gap-1 mt-1">
                <button
                  onClick={() => adjustCore(idx, -8)}
                  className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                  title="Vent Pressure"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => adjustCore(idx, 8)}
                  className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                  title="Inject Pressure"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex justify-between items-center pt-2">
        <button
          onClick={onCancel}
          className="text-xs font-mono text-slate-400 hover:text-slate-200 px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 transition"
        >
          Disengage
        </button>

        {isSuccess ? (
          <div className="flex items-center gap-1.5 font-mono text-xs text-emerald-400">
            <CheckCircle2 className="w-4 h-4" />
            CORE HARMONIZED
          </div>
        ) : (
          <div className="font-mono text-[11px] text-slate-500">
            {isAllInZone ? 'HOLDING STEADY...' : 'PRESSURES OUT OF TOLERANCE'}
          </div>
        )}
      </div>
    </div>
  );
};

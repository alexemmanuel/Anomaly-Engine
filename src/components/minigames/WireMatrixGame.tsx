import React, { useState } from 'react';
import { sounds } from '../../services/soundFx';
import { Zap, CheckCircle2, RotateCcw, AlertTriangle } from 'lucide-react';

interface WireMatrixProps {
  onComplete: () => void;
  onCancel: () => void;
  isCorrupted?: boolean;
}

interface WireNode {
  id: string;
  colorName: string;
  hex: string;
}

const WIRE_TYPES: WireNode[] = [
  { id: 'cyan', colorName: 'Quantum Cyan', hex: '#06b6d4' },
  { id: 'rose', colorName: 'Tachyon Crimson', hex: '#f43f5e' },
  { id: 'amber', colorName: 'Plasma Amber', hex: '#f59e0b' },
  { id: 'violet', colorName: 'Subspace Violet', hex: '#a855f7' },
];

export const WireMatrixGame: React.FC<WireMatrixProps> = ({ onComplete, onCancel, isCorrupted }) => {
  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);
  const [connections, setConnections] = useState<Record<string, string>>({});
  // Shuffled right wire targets
  const [rightOrder] = useState<WireNode[]>(() => {
    return [...WIRE_TYPES].sort(() => Math.random() - 0.5);
  });
  const [isSuccess, setIsSuccess] = useState(false);

  const handleLeftClick = (id: string) => {
    sounds.playClick(600);
    setSelectedLeft(id);
  };

  const handleRightClick = (rightId: string) => {
    if (!selectedLeft) return;

    sounds.playWireConnect();

    // Map connection
    const updated = { ...connections };
    // Remove any existing left node pointing to this right node
    Object.keys(updated).forEach(k => {
      if (updated[k] === rightId) delete updated[k];
    });

    updated[selectedLeft] = rightId;
    setConnections(updated);
    setSelectedLeft(null);

    // Check if all 4 are correctly matched (left.id === right.id)
    const keys = Object.keys(updated);
    if (keys.length === 4) {
      const allCorrect = keys.every(k => updated[k] === k);
      if (allCorrect) {
        setIsSuccess(true);
        sounds.playTaskSuccess();
        setTimeout(() => {
          onComplete();
        }, 900);
      } else {
        sounds.playGlitch();
      }
    }
  };

  const handleReset = () => {
    sounds.playClick(400);
    setConnections({});
    setSelectedLeft(null);
  };

  return (
    <div className="bg-slate-900 border border-cyan-500/40 rounded-xl p-5 shadow-2xl max-w-lg w-full text-slate-100">
      <div className="flex items-center justify-between pb-3 border-b border-cyan-500/20 mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <Zap className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="font-mono font-bold text-sm tracking-wider uppercase text-cyan-300">
              Conduit Junction Matrix
            </h3>
            <p className="text-xs text-slate-400">Route matching polarity conduits to restore power grid</p>
          </div>
        </div>
        <button
          onClick={handleReset}
          className="p-1.5 rounded bg-slate-800 text-slate-400 hover:text-cyan-300 hover:bg-slate-700 transition"
          title="Reset Wires"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {isCorrupted && (
        <div className="mb-3 px-3 py-1.5 bg-rose-500/20 border border-rose-500/40 rounded flex items-center gap-2 text-rose-300 text-xs">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>ANOMALY WARNING: Electromagnetic interference detected in conduit harness.</span>
        </div>
      )}

      {/* Wire Connection Field */}
      <div className="relative py-4 flex justify-between items-center bg-slate-950/70 border border-slate-800 rounded-lg p-6 min-h-[220px]">
        {/* Left Terminals */}
        <div className="flex flex-col gap-5 z-10">
          {WIRE_TYPES.map((node) => {
            const isConnected = !!connections[node.id];
            const isSelected = selectedLeft === node.id;
            return (
              <button
                key={node.id}
                onClick={() => handleLeftClick(node.id)}
                className={`flex items-center gap-3 px-3 py-2 rounded border text-xs font-mono transition-all text-left ${
                  isSelected
                    ? 'ring-2 ring-cyan-400 border-cyan-300 bg-cyan-950/60 shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                    : isConnected
                    ? 'border-slate-700 bg-slate-800/80 text-slate-300'
                    : 'border-slate-800 bg-slate-900/90 hover:border-slate-600'
                }`}
              >
                <div
                  className="w-3.5 h-3.5 rounded-full shadow-inner"
                  style={{ backgroundColor: node.hex, boxShadow: `0 0 8px ${node.hex}` }}
                />
                <span className="font-semibold">{node.colorName}</span>
              </button>
            );
          })}
        </div>

        {/* Center Connection Indicator */}
        <div className="text-center font-mono text-[11px] text-slate-500 max-w-[100px]">
          {isSuccess ? (
            <div className="flex flex-col items-center gap-1 text-emerald-400 animate-bounce">
              <CheckCircle2 className="w-6 h-6" />
              <span>CIRCUIT CLOSED</span>
            </div>
          ) : (
            <div className="space-y-1">
              <div className="text-cyan-400/80">
                {Object.keys(connections).length} / 4
              </div>
              <p className="text-[10px] leading-tight">SELECT LEFT THEN RIGHT</p>
            </div>
          )}
        </div>

        {/* Right Terminals */}
        <div className="flex flex-col gap-5 z-10">
          {rightOrder.map((node) => {
            const connectedFrom = Object.keys(connections).find(k => connections[k] === node.id);
            const isMatch = connectedFrom === node.id;
            return (
              <button
                key={node.id}
                onClick={() => handleRightClick(node.id)}
                className={`flex items-center justify-end gap-3 px-3 py-2 rounded border text-xs font-mono transition-all text-right ${
                  connectedFrom
                    ? isMatch
                      ? 'border-emerald-500/60 bg-emerald-950/40 text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.2)]'
                      : 'border-rose-500/60 bg-rose-950/40 text-rose-300'
                    : selectedLeft
                    ? 'border-cyan-500/50 hover:bg-cyan-950/30'
                    : 'border-slate-800 bg-slate-900/90 hover:border-slate-600'
                }`}
              >
                <span className="font-semibold">{node.colorName}</span>
                <div
                  className="w-3.5 h-3.5 rounded-full shadow-inner"
                  style={{ backgroundColor: node.hex, boxShadow: `0 0 8px ${node.hex}` }}
                />
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-4 flex justify-between items-center pt-2">
        <button
          onClick={onCancel}
          className="text-xs font-mono text-slate-400 hover:text-slate-200 px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 transition"
        >
          Abort Bypass
        </button>
        <span className="text-[11px] font-mono text-cyan-400/70">
          STATUS: {isSuccess ? 'CALIBRATION COMPLETE' : 'POLARITY MISMATCH'}
        </span>
      </div>
    </div>
  );
};

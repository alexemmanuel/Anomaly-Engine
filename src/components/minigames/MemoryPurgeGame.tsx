import React, { useState, useEffect } from 'react';
import { sounds } from '../../services/soundFx';
import { Cpu, CheckCircle2, RotateCcw } from 'lucide-react';

interface MemoryPurgeProps {
  onComplete: () => void;
  onCancel: () => void;
  isCorrupted?: boolean;
}

export const MemoryPurgeGame: React.FC<MemoryPurgeProps> = ({ onComplete, onCancel }) => {
  const [corruptedIndices, setCorruptedIndices] = useState<number[]>([]);
  const [revealed, setRevealed] = useState(true);
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const [mistakeIndex, setMistakeIndex] = useState<number | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const startRound = () => {
    // Pick 4 unique random indices from 0-15
    const indices: number[] = [];
    while (indices.length < 4) {
      const rand = Math.floor(Math.random() * 16);
      if (!indices.includes(rand)) indices.push(rand);
    }
    setCorruptedIndices(indices);
    setSelectedIndices([]);
    setRevealed(true);
    setMistakeIndex(null);

    // Hide after 2.4 seconds
    setTimeout(() => {
      setRevealed(false);
    }, 2400);
  };

  useEffect(() => {
    startRound();
  }, []);

  const handleTileClick = (index: number) => {
    if (revealed || isSuccess) return;
    if (selectedIndices.includes(index)) return;

    if (corruptedIndices.includes(index)) {
      sounds.playClick(800);
      const next = [...selectedIndices, index];
      setSelectedIndices(next);

      if (next.length === corruptedIndices.length) {
        setIsSuccess(true);
        sounds.playTaskSuccess();
        setTimeout(() => {
          onComplete();
        }, 800);
      }
    } else {
      // Mistake
      sounds.playGlitch();
      setMistakeIndex(index);
      setTimeout(() => {
        setMistakeIndex(null);
      }, 500);
    }
  };

  return (
    <div className="bg-slate-900 border border-purple-500/40 rounded-xl p-5 shadow-2xl max-w-lg w-full text-slate-100">
      <div className="flex items-center justify-between pb-3 border-b border-purple-500/20 mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/30 text-purple-400">
            <Cpu className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="font-mono font-bold text-sm tracking-wider uppercase text-purple-300">
              Neural Archive Memory Purge
            </h3>
            <p className="text-xs text-slate-400">Memorize corrupted neural clusters, then isolate and purge them</p>
          </div>
        </div>
        <button
          onClick={startRound}
          className="p-1.5 rounded bg-slate-800 text-slate-400 hover:text-purple-300 transition"
          title="Restart Scan"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* 4x4 Grid */}
      <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 flex flex-col items-center">
        <div className="text-xs font-mono mb-3 text-slate-400 flex items-center justify-between w-full max-w-[280px]">
          <span>
            {revealed ? (
              <span className="text-purple-400 font-bold animate-pulse">MEMORIZE CORRUPTED BLOCKS...</span>
            ) : (
              <span>ISOLATE {corruptedIndices.length - selectedIndices.length} REMAINING</span>
            )}
          </span>
          <span className="text-purple-400 font-semibold">{selectedIndices.length} / 4</span>
        </div>

        <div className="grid grid-cols-4 gap-2.5 max-w-[280px] w-full">
          {Array.from({ length: 16 }).map((_, i) => {
            const isTarget = corruptedIndices.includes(i);
            const isSelected = selectedIndices.includes(i);
            const isError = mistakeIndex === i;

            let tileStyle = 'bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-600';

            if (revealed && isTarget) {
              tileStyle = 'bg-purple-950/80 border-purple-500 text-purple-300 shadow-[0_0_12px_rgba(168,85,247,0.4)] animate-pulse';
            } else if (isSelected) {
              tileStyle = 'bg-emerald-950/80 border-emerald-500 text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.3)]';
            } else if (isError) {
              tileStyle = 'bg-rose-950/80 border-rose-500 text-rose-300 animate-shake';
            }

            return (
              <button
                key={i}
                disabled={revealed || isSuccess}
                onClick={() => handleTileClick(i)}
                className={`h-14 rounded-lg border font-mono text-xs flex flex-col items-center justify-center transition-all ${tileStyle}`}
              >
                {revealed && isTarget ? (
                  <span className="text-xs font-bold">☣️ GLITCH</span>
                ) : isSelected ? (
                  <span className="text-xs font-bold text-emerald-400">PURGED</span>
                ) : (
                  <span className="text-[10px] text-slate-600">0x{i.toString(16).toUpperCase()}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between pt-2">
        <button
          onClick={onCancel}
          className="text-xs font-mono text-slate-400 hover:text-slate-200 px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 transition"
        >
          Cancel Purge
        </button>

        {isSuccess ? (
          <div className="flex items-center gap-1.5 font-mono text-xs text-emerald-400">
            <CheckCircle2 className="w-4 h-4" />
            BUFFER RESTORED
          </div>
        ) : (
          <span className="text-[11px] font-mono text-purple-400/80">
            {revealed ? 'SCANNING HARMONICS' : 'ISOLATION READY'}
          </span>
        )}
      </div>
    </div>
  );
};

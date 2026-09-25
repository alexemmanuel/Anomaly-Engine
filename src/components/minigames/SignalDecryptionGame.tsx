import React, { useState, useEffect, useRef } from 'react';
import { sounds } from '../../services/soundFx';
import { Radio, Lock, Unlock, Sliders, CheckCircle2 } from 'lucide-react';

interface SignalDecryptionProps {
  onComplete: () => void;
  onCancel: () => void;
  isCorrupted?: boolean;
}

export const SignalDecryptionGame: React.FC<SignalDecryptionProps> = ({ onComplete, onCancel, isCorrupted }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Target randomized signal
  const [targetFreq] = useState(() => Math.floor(Math.random() * 4) + 2); // 2 to 5
  const [targetAmp] = useState(() => Math.floor(Math.random() * 3) + 2);  // 2 to 4
  const [targetPhase] = useState(() => Math.floor(Math.random() * 3) * 30); // 0, 30, 60

  // User carrier adjustments
  const [freq, setFreq] = useState(1);
  const [amp, setAmp] = useState(1);
  const [phase, setPhase] = useState(0);

  const [matchPercentage, setMatchPercentage] = useState(0);
  const [isSuccess, setIsSuccess] = useState(false);

  // Compute similarity
  useEffect(() => {
    const freqDiff = Math.abs(freq - targetFreq) / 5;
    const ampDiff = Math.abs(amp - targetAmp) / 4;
    const phaseDiff = Math.abs(phase - targetPhase) / 90;

    const diff = (freqDiff * 0.5) + (ampDiff * 0.3) + (phaseDiff * 0.2);
    const match = Math.max(0, Math.min(100, Math.round((1 - diff) * 100)));
    setMatchPercentage(match);
  }, [freq, amp, phase, targetFreq, targetAmp, targetPhase]);

  // Render canvas oscilloscope
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let time = 0;

    const render = () => {
      time += 0.05;
      const width = canvas.width;
      const height = canvas.height;
      const centerY = height / 2;

      ctx.fillStyle = '#020617';
      ctx.fillRect(0, 0, width, height);

      // Grid lines
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 1;
      for (let x = 0; x < width; x += 20) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += 20) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Draw Target Corrupted Signal (Cyan/Magenta)
      ctx.strokeStyle = isCorrupted ? '#f43f5e' : '#06b6d4';
      ctx.lineWidth = 2;
      ctx.shadowBlur = 8;
      ctx.shadowColor = isCorrupted ? '#f43f5e' : '#06b6d4';
      ctx.beginPath();
      for (let x = 0; x < width; x++) {
        const rad = (x / width) * Math.PI * 2 * targetFreq + (targetPhase * Math.PI / 180) + time;
        const y = centerY + Math.sin(rad) * (targetAmp * 12);
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Draw Player Carrier Wave (Emerald)
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 2.5;
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#10b981';
      ctx.beginPath();
      for (let x = 0; x < width; x++) {
        const rad = (x / width) * Math.PI * 2 * freq + (phase * Math.PI / 180) + time;
        const y = centerY + Math.sin(rad) * (amp * 12);
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      ctx.shadowBlur = 0;
      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [freq, amp, phase, targetFreq, targetAmp, targetPhase, isCorrupted]);

  const handleTransmit = () => {
    if (matchPercentage >= 90) {
      setIsSuccess(true);
      sounds.playTaskSuccess();
      setTimeout(() => {
        onComplete();
      }, 800);
    } else {
      sounds.playGlitch();
    }
  };

  return (
    <div className="bg-slate-900 border border-emerald-500/40 rounded-xl p-5 shadow-2xl max-w-lg w-full text-slate-100">
      <div className="flex items-center justify-between pb-3 border-b border-emerald-500/20 mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="font-mono font-bold text-sm tracking-wider uppercase text-emerald-300">
              Signal Array Harmonizer
            </h3>
            <p className="text-xs text-slate-400">Match carrier wave (green) to target signal telemetry</p>
          </div>
        </div>
        <div className="flex items-center gap-1 font-mono text-xs px-2.5 py-1 rounded bg-slate-800 border border-slate-700">
          <span className="text-slate-400">ALIGN:</span>
          <span className={`font-bold ${matchPercentage >= 90 ? 'text-emerald-400' : 'text-amber-400'}`}>
            {matchPercentage}%
          </span>
        </div>
      </div>

      {/* Oscilloscope Canvas */}
      <div className="relative border border-slate-800 rounded-lg overflow-hidden bg-slate-950 shadow-inner">
        <canvas ref={canvasRef} width={460} height={150} className="w-full h-[150px] block" />
        <div className="absolute top-2 left-3 flex items-center gap-4 text-[10px] font-mono">
          <div className="flex items-center gap-1.5 text-cyan-400">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            TARGET TRANSMISSION
          </div>
          <div className="flex items-center gap-1.5 text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            LOCAL SYNTHESIZER
          </div>
        </div>
      </div>

      {/* Tuning Controls */}
      <div className="mt-5 space-y-3.5 bg-slate-950/60 p-4 rounded-lg border border-slate-800/80">
        <div className="space-y-1">
          <div className="flex justify-between text-xs font-mono">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-emerald-400" />
              Harmonic Frequency:
            </span>
            <span className="text-emerald-300 font-bold">{freq * 125} MHz</span>
          </div>
          <input
            type="range"
            min={1}
            max={6}
            step={1}
            value={freq}
            onChange={(e) => {
              sounds.playClick(500 + Number(e.target.value) * 60);
              setFreq(Number(e.target.value));
            }}
            className="w-full accent-emerald-400 cursor-pointer"
          />
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-xs font-mono">
            <span className="text-slate-400">Wave Amplitude:</span>
            <span className="text-emerald-300 font-bold">{amp * 20}%</span>
          </div>
          <input
            type="range"
            min={1}
            max={5}
            step={1}
            value={amp}
            onChange={(e) => {
              sounds.playClick(400 + Number(e.target.value) * 50);
              setAmp(Number(e.target.value));
            }}
            className="w-full accent-emerald-400 cursor-pointer"
          />
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-xs font-mono">
            <span className="text-slate-400">Phase Offset Angle:</span>
            <span className="text-emerald-300 font-bold">{phase}°</span>
          </div>
          <input
            type="range"
            min={0}
            max={90}
            step={30}
            value={phase}
            onChange={(e) => {
              sounds.playClick(300 + Number(e.target.value) * 4);
              setPhase(Number(e.target.value));
            }}
            className="w-full accent-emerald-400 cursor-pointer"
          />
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between pt-2">
        <button
          onClick={onCancel}
          className="text-xs font-mono text-slate-400 hover:text-slate-200 px-3 py-2 rounded bg-slate-800 hover:bg-slate-700 transition"
        >
          Exit Console
        </button>

        <button
          onClick={handleTransmit}
          disabled={matchPercentage < 90 || isSuccess}
          className={`flex items-center gap-2 px-5 py-2 rounded font-mono text-xs font-bold transition shadow-lg ${
            isSuccess
              ? 'bg-emerald-500 text-slate-950'
              : matchPercentage >= 90
              ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/30'
              : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
          }`}
        >
          {isSuccess ? (
            <>
              <CheckCircle2 className="w-4 h-4" />
              DECRYPTION VALIDATED
            </>
          ) : matchPercentage >= 90 ? (
            <>
              <Unlock className="w-4 h-4" />
              ENGAGE DECRYPTION LOCK
            </>
          ) : (
            <>
              <Lock className="w-4 h-4" />
              ALIGN CARRIER (&gt;=90%)
            </>
          )}
        </button>
      </div>
    </div>
  );
};

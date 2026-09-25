import React, { useState, useEffect } from 'react';
import type { LeaderboardEntry } from '../types/game';
import { fetchTopResearchers } from '../services/firebase';
import { sounds } from '../services/soundFx';
import { Trophy, Medal, X, Shield, Skull, Award } from 'lucide-react';

interface LeaderboardProps {
  onClose: () => void;
}

export const LeaderboardModal: React.FC<LeaderboardProps> = ({ onClose }) => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTopResearchers().then(data => {
      setEntries(data);
      setLoading(false);
    });
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4 backdrop-blur-md animate-fadeIn">
      <div className="max-w-xl w-full bg-slate-950 border border-amber-500/40 rounded-2xl p-6 shadow-2xl text-slate-100 flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-amber-500/20 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-mono font-bold text-sm tracking-wider uppercase text-amber-300">
                Facility Hall of Fame
              </h3>
              <p className="text-xs text-slate-400">Top ranked researchers & forensic deduction specialists</p>
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

        {/* List */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
          {loading ? (
            <div className="text-center py-12 text-slate-500 font-mono text-xs animate-pulse">
              Retrieving cryptographic records from Firestore...
            </div>
          ) : entries.length === 0 ? (
            <div className="text-center py-12 text-slate-500 font-mono text-xs">
              No facility archives recorded yet. Be the first to prevail!
            </div>
          ) : (
            entries.map((item, index) => {
              const isTop3 = index < 3;
              return (
                <div
                  key={item.uid || index}
                  className={`p-3 rounded-xl border flex items-center justify-between text-xs font-mono transition ${
                    index === 0
                      ? 'bg-amber-950/30 border-amber-500/50 shadow-md'
                      : index === 1
                      ? 'bg-slate-900/80 border-slate-700'
                      : index === 2
                      ? 'bg-amber-950/15 border-amber-800/40'
                      : 'bg-slate-950/70 border-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs ${
                        index === 0
                          ? 'bg-amber-500 text-slate-950'
                          : index === 1
                          ? 'bg-slate-300 text-slate-950'
                          : index === 2
                          ? 'bg-amber-700 text-white'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {index + 1}
                    </span>

                    <span className="text-2xl">{item.avatar}</span>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-200">{item.displayName}</span>
                        {item.favoriteRole === 'anomaly' ? (
                          <span className="text-[9px] px-1 rounded bg-rose-950 text-rose-300 border border-rose-800 flex items-center gap-0.5">
                            <Skull className="w-2.5 h-2.5" />
                            WILD
                          </span>
                        ) : (
                          <span className="text-[9px] px-1 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 flex items-center gap-0.5">
                            <Shield className="w-2.5 h-2.5" />
                            LOGIC
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        Clearance Level {item.clearanceLevel} • {item.wins} Wins ({item.winRate}% Rate)
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-bold text-amber-400 text-sm">{item.rating}</div>
                    <div className="text-[9px] text-slate-500">RATING</div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] font-mono text-slate-500 text-center">
          Rankings synchronized in real-time with Google Cloud Firestore database.
        </div>
      </div>
    </div>
  );
};

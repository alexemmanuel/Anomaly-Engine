import React, { useState } from 'react';
import type { UserProfile } from '../types/game';
import { saveLocalProfile, updateLeaderboardEntry, db, auth } from '../services/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { sounds } from '../services/soundFx';
import { 
  User, 
  X, 
  Award, 
  ShieldCheck, 
  Skull, 
  Zap, 
  Check, 
  Activity,
  Edit2
} from 'lucide-react';

interface UserProfileModalProps {
  profile: UserProfile;
  onUpdate: (profile: UserProfile) => void;
  onClose: () => void;
}

const AVATAR_OPTIONS = ['🔬', '🧬', '⚡', '🤖', '🛰️', '🧠', '🛡️', '☣️', '🕵️', '🦾', '🪐', '🔮'];

const ACHIEVEMENT_DETAILS: Record<string, { title: string; desc: string; icon: string }> = {
  RECRUIT_CLEARANCE: { title: 'Facility Recruit', desc: 'Inducted into Deep Synapse research protocol', icon: '📋' },
  FIRST_CONTAINMENT: { title: 'First Deployment', desc: 'Completed your first research shift', icon: '🚪' },
  LOGIC_SPECIALIST: { title: 'Logic Specialist', desc: 'Won 3 matches as Research Scientist', icon: '🔬' },
  WILD_CARD: { title: 'The Wild Variable', desc: 'Won 2 matches as The Anomaly', icon: '☣️' },
  FORENSIC_MASTER: { title: 'Forensic Master', desc: 'Accurately voted out the Anomaly 3 times', icon: '🔍' },
  SYSTEMS_ARCHITECT: { title: 'Systems Architect', desc: 'Successfully executed 10+ diagnostic tasks', icon: '⚡' },
  LEVEL_5_CLEARANCE: { title: 'Senior Director', desc: 'Attained Level 5 Security Clearance', icon: '🎖️' },
};

export const UserProfileModal: React.FC<UserProfileModalProps> = ({ profile, onUpdate, onClose }) => {
  const [name, setName] = useState(profile.displayName);
  const [avatar, setAvatar] = useState(profile.avatar);
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = async () => {
    sounds.playTaskSuccess();
    const updated: UserProfile = {
      ...profile,
      displayName: name.trim() || 'Researcher',
      avatar,
      updatedAt: Date.now(),
    };
    saveLocalProfile(updated);
    onUpdate(updated);

    try {
      if (auth.currentUser) {
        const userDocRef = doc(db, 'users', auth.currentUser.uid);
        await setDoc(userDocRef, updated, { merge: true });
        await updateLeaderboardEntry(updated);
      }
    } catch {}

    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const nextLevelXp = profile.clearanceLevel * 250;
  const currentLevelBase = (profile.clearanceLevel - 1) * 250;
  const levelProgress = Math.min(100, Math.round(((profile.xp - currentLevelBase) / 250) * 100));

  return (
    <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4 backdrop-blur-md animate-fadeIn">
      <div className="max-w-xl w-full bg-slate-950 border border-cyan-500/40 rounded-2xl p-6 shadow-2xl text-slate-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-cyan-500/20 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-mono font-bold text-sm tracking-wider uppercase text-cyan-300">
                Researcher Personnel Dossier
              </h3>
              <p className="text-xs text-slate-400">Security clearance records and forensic achievements</p>
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
        <div className="flex-1 overflow-y-auto space-y-5 pr-1 custom-scrollbar">
          {/* Identity Customization */}
          <div className="p-4 bg-slate-900/80 rounded-xl border border-slate-800">
            <div className="text-xs font-mono text-slate-400 uppercase mb-3 flex items-center gap-1.5">
              <Edit2 className="w-3.5 h-3.5 text-cyan-400" />
              IDENTIFICATION CREDENTIALS
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-slate-950 border-2 border-cyan-500/50 flex items-center justify-center text-3xl shadow-inner shrink-0">
                {avatar}
              </div>

              <div className="flex-1 w-full space-y-2">
                <div>
                  <label className="text-[10px] font-mono text-slate-500 uppercase block mb-1">
                    Researcher Codename
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    maxLength={20}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs font-mono text-slate-100 focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>
            </div>

            {/* Avatar Selector */}
            <div className="mt-3 pt-3 border-t border-slate-800/80">
              <span className="text-[10px] font-mono text-slate-500 uppercase block mb-1.5">
                Choose Security Badge Avatar
              </span>
              <div className="flex flex-wrap gap-2">
                {AVATAR_OPTIONS.map(emoji => (
                  <button
                    key={emoji}
                    onClick={() => {
                      sounds.playClick(700);
                      setAvatar(emoji);
                    }}
                    className={`w-9 h-9 rounded-lg border text-lg flex items-center justify-center transition ${
                      avatar === emoji
                        ? 'bg-cyan-950 border-cyan-400 ring-2 ring-cyan-400/40'
                        : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-3 flex justify-end">
              <button
                onClick={handleSave}
                className="px-4 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-mono text-xs font-bold transition flex items-center gap-1.5"
              >
                {isSaved ? <Check className="w-3.5 h-3.5" /> : null}
                {isSaved ? 'SAVED TO CLOUD' : 'SAVE DOSSIER'}
              </button>
            </div>
          </div>

          {/* Clearance Level Progress */}
          <div className="p-4 bg-slate-900/80 rounded-xl border border-slate-800 font-mono text-xs">
            <div className="flex justify-between items-center mb-2">
              <span className="text-cyan-400 font-bold flex items-center gap-1.5">
                <Award className="w-4 h-4" />
                SECURITY CLEARANCE LEVEL {profile.clearanceLevel}
              </span>
              <span className="text-slate-400">{profile.xp} XP</span>
            </div>
            <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-800 mb-1.5">
              <div
                className="bg-gradient-to-r from-cyan-500 to-blue-500 h-full transition-all duration-300"
                style={{ width: `${levelProgress}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>Current Rank: {currentLevelBase} XP</span>
              <span>Next Clearance Rank: {nextLevelXp} XP</span>
            </div>
          </div>

          {/* Career Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 font-mono text-xs">
            <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
              <span className="text-[10px] text-slate-500 block">TOTAL SHIFTS</span>
              <span className="text-sm font-bold text-slate-100">{profile.stats.gamesPlayed}</span>
            </div>
            <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
              <span className="text-[10px] text-emerald-400 block">LOGIC (SCIENTIST) WINS</span>
              <span className="text-sm font-bold text-emerald-300">{profile.stats.scientistWins}</span>
            </div>
            <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
              <span className="text-[10px] text-rose-400 block">WILD (ANOMALY) WINS</span>
              <span className="text-sm font-bold text-rose-300">{profile.stats.anomalyWins}</span>
            </div>
            <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
              <span className="text-[10px] text-cyan-400 block">DIAGNOSTICS EXECUTED</span>
              <span className="text-sm font-bold text-cyan-300">{profile.stats.tasksCompleted}</span>
            </div>
            <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
              <span className="text-[10px] text-amber-400 block">CORRECT DEDUCTIONS</span>
              <span className="text-sm font-bold text-amber-300">{profile.stats.correctDeductions}</span>
            </div>
            <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
              <span className="text-[10px] text-purple-400 block">SABOTAGES TRIGGERED</span>
              <span className="text-sm font-bold text-purple-300">{profile.stats.sabotagesTriggered}</span>
            </div>
          </div>

          {/* Badges / Achievements */}
          <div>
            <div className="text-xs font-mono text-slate-400 uppercase mb-2.5">
              UNLOCKED ACHIEVEMENTS & PROTOCOLS ({profile.achievements.length})
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {Object.entries(ACHIEVEMENT_DETAILS).map(([key, item]) => {
                const unlocked = profile.achievements.includes(key);
                return (
                  <div
                    key={key}
                    className={`p-2.5 rounded-lg border text-xs font-mono flex items-center gap-2.5 ${
                      unlocked
                        ? 'bg-cyan-950/20 border-cyan-500/40 text-slate-200'
                        : 'bg-slate-950/40 border-slate-900 text-slate-600 opacity-60'
                    }`}
                  >
                    <span className="text-xl">{item.icon}</span>
                    <div>
                      <div className={`font-bold ${unlocked ? 'text-cyan-300' : 'text-slate-500'}`}>
                        {item.title}
                      </div>
                      <div className="text-[10px] text-slate-400">{item.desc}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

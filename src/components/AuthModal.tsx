import React, { useState } from 'react';
import type { UserProfile } from '../types/game';
import { 
  logInWithEmail, 
  registerWithEmail, 
  logInWithGoogle, 
  logInAsGuest,
  auth
} from '../services/firebase';
import { sounds } from '../services/soundFx';
import { 
  Lock, 
  UserPlus, 
  LogIn, 
  X, 
  AlertCircle, 
  CheckCircle2, 
  Sparkles, 
  Mail, 
  KeyRound, 
  ShieldCheck,
  Bot
} from 'lucide-react';

interface AuthModalProps {
  onSuccess: (profile: UserProfile) => void;
  onClose: () => void;
}

const AVATARS = ['🔬', '🧬', '⚡', '🤖', '🛰️', '🧠', '🛡️', '☣️', '🕵️', '🪐'];

export const AuthModal: React.FC<AuthModalProps> = ({ onSuccess, onClose }) => {
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(AVATARS[0]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isGuest = auth.currentUser?.isAnonymous;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setError(null);
    setLoading(true);

    try {
      sounds.playClick(600);
      const profile = await logInWithEmail(email, password);
      sounds.playTaskSuccess();
      onSuccess(profile);
    } catch (err: any) {
      sounds.playGlitch();
      const code = err?.code || '';
      if (code === 'auth/invalid-credential' || code === 'auth/user-not-found' || code === 'auth/wrong-password') {
        setError('Invalid security credentials. Check email and password.');
      } else if (code === 'auth/invalid-email') {
        setError('Invalid email address format.');
      } else {
        setError(err?.message || 'Authentication error occurred.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setError(null);
    setLoading(true);

    try {
      sounds.playClick(600);
      const name = displayName.trim() || 'Dr. ' + email.split('@')[0];
      const profile = await registerWithEmail(email, password, name, selectedAvatar);
      sounds.playTaskSuccess();
      onSuccess(profile);
    } catch (err: any) {
      sounds.playGlitch();
      const code = err?.code || '';
      if (code === 'auth/email-already-in-use') {
        setError('This email is already registered in the facility database. Try logging in.');
      } else if (code === 'auth/weak-password') {
        setError('Password must be at least 6 characters long.');
      } else {
        setError(err?.message || 'Registration failed.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError(null);
    setLoading(true);
    try {
      sounds.playClick(600);
      const profile = await logInWithGoogle();
      sounds.playTaskSuccess();
      onSuccess(profile);
    } catch (err: any) {
      sounds.playGlitch();
      if (err?.code !== 'auth/popup-closed-by-user') {
        setError(err?.message || 'Google authentication interrupted.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGuest = async () => {
    setError(null);
    setLoading(true);
    try {
      sounds.playClick(500);
      const profile = await logInAsGuest();
      sounds.playTaskSuccess();
      onSuccess(profile);
    } catch (err: any) {
      sounds.playGlitch();
      setError('Guest initialization error.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4 backdrop-blur-md animate-fadeIn">
      <div className="max-w-md w-full bg-slate-950 border border-cyan-500/40 rounded-2xl p-6 shadow-2xl text-slate-100 flex flex-col relative overflow-hidden">
        {/* Top Sci-Fi Accent Line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 via-rose-500 to-cyan-500" />

        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-mono font-bold text-sm tracking-wider uppercase text-cyan-300">
                Facility Access Terminal
              </h3>
              <p className="text-[11px] text-slate-400">Security Clearance & Personnel Authentication</p>
            </div>
          </div>
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

        {/* Guest Warning Pill if applicable */}
        {isGuest && (
          <div className="mb-3 px-3 py-1.5 rounded-lg bg-amber-950/40 border border-amber-500/30 text-amber-300 text-[11px] font-mono flex items-center gap-2">
            <Bot className="w-4 h-4 shrink-0 text-amber-400" />
            <span>Currently using temporary guest clearance. Log in to keep records across sessions.</span>
          </div>
        )}

        {/* Tab Switcher: Login vs Register */}
        <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800 mb-4 font-mono text-xs">
          <button
            onClick={() => {
              sounds.playClick(600);
              setTab('login');
              setError(null);
            }}
            className={`flex-1 py-1.5 rounded-lg font-bold transition flex items-center justify-center gap-1.5 ${
              tab === 'login'
                ? 'bg-cyan-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            LOG IN
          </button>
          <button
            onClick={() => {
              sounds.playClick(600);
              setTab('register');
              setError(null);
            }}
            className={`flex-1 py-1.5 rounded-lg font-bold transition flex items-center justify-center gap-1.5 ${
              tab === 'register'
                ? 'bg-cyan-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            NEW DOSSIER (SIGN UP)
          </button>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-3 p-2.5 rounded-lg bg-rose-950/50 border border-rose-500/50 text-rose-300 text-xs font-mono flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        {tab === 'login' ? (
          <form onSubmit={handleLogin} className="space-y-3 font-mono text-xs">
            <div>
              <label className="text-[10px] text-slate-400 uppercase block mb-1">
                Personnel Email
              </label>
              <div className="relative">
                <Mail className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-500" />
                <input
                  type="email"
                  required
                  placeholder="researcher@synapse.org"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-400"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] text-slate-400 uppercase block mb-1">
                Passcode / Clearance Key
              </label>
              <div className="relative">
                <KeyRound className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-500" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-400"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold transition shadow-lg shadow-cyan-500/20 active:scale-95 flex items-center justify-center gap-2 mt-2"
            >
              <LogIn className="w-4 h-4" />
              {loading ? 'AUTHENTICATING...' : 'LOG IN TO TERMINAL'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="space-y-3 font-mono text-xs">
            <div>
              <label className="text-[10px] text-slate-400 uppercase block mb-1">
                Researcher Codename
              </label>
              <input
                type="text"
                placeholder="Dr. Vance"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                maxLength={20}
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div>
              <label className="text-[10px] text-slate-400 uppercase block mb-1">
                Badge Avatar
              </label>
              <div className="flex flex-wrap gap-1.5">
                {AVATARS.map(emoji => (
                  <button
                    type="button"
                    key={emoji}
                    onClick={() => {
                      sounds.playClick(600);
                      setSelectedAvatar(emoji);
                    }}
                    className={`w-7 h-7 rounded-lg border text-sm flex items-center justify-center transition ${
                      selectedAvatar === emoji
                        ? 'bg-cyan-950 border-cyan-400 ring-2 ring-cyan-400/40'
                        : 'bg-slate-900 border-slate-800'
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-[10px] text-slate-400 uppercase block mb-1">
                Personnel Email
              </label>
              <div className="relative">
                <Mail className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-500" />
                <input
                  type="email"
                  required
                  placeholder="researcher@synapse.org"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-400"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] text-slate-400 uppercase block mb-1">
                Passcode (Min 6 Characters)
              </label>
              <div className="relative">
                <KeyRound className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-500" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-400"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold transition shadow-lg shadow-cyan-500/20 active:scale-95 flex items-center justify-center gap-2 mt-2"
            >
              <UserPlus className="w-4 h-4" />
              {loading ? 'COMMISSIONING DOSSIER...' : 'CREATE RESEARCH DOSSIER'}
            </button>
          </form>
        )}

        {/* Divider */}
        <div className="flex items-center gap-2 my-4">
          <div className="h-px bg-slate-800 flex-1" />
          <span className="text-[10px] font-mono text-slate-500 uppercase">OR INSTANT AUTH</span>
          <div className="h-px bg-slate-800 flex-1" />
        </div>

        {/* Social / Alternative Buttons */}
        <div className="space-y-2">
          <button
            onClick={handleGoogle}
            disabled={loading}
            className="w-full py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-slate-600 text-slate-200 font-mono text-xs transition flex items-center justify-center gap-2"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
              <path
                fill="#EA4335"
                d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.4 9 5 12 5z"
              />
              <path
                fill="#4285F4"
                d="M23.5 12.3c0-.8-.1-1.7-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.9z"
              />
              <path
                fill="#FBBC05"
                d="M5.6 14.8c-.3-.8-.4-1.8-.4-2.8s.1-2 .4-2.8L1.9 6.3C.7 8.7 0 10.3 0 12s.7 3.3 1.9 5.7l3.7-2.9z"
              />
              <path
                fill="#34A853"
                d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.4-6.4-5.2L1.9 16C3.7 19.7 7.5 23 12 23z"
              />
            </svg>
            SIGN IN WITH GOOGLE
          </button>

          <button
            onClick={handleGuest}
            disabled={loading}
            className="w-full py-1.5 px-3 rounded-lg bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 font-mono text-[11px] transition flex items-center justify-center gap-1.5"
          >
            <span>CONTINUE AS GUEST OPERATIVE</span>
          </button>
        </div>
      </div>
    </div>
  );
};

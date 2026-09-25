/**
 * Firebase Integration for The Anomaly Engine
 * Handles user profiles, persistent dossiers, stats, and leaderboards.
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc, 
  collection, 
  query, 
  orderBy, 
  limit, 
  getDocs,
  Firestore 
} from 'firebase/firestore';
import type { UserProfile, LeaderboardEntry } from '../types/game';
import configJson from '../../firebase-applet-config.json';

const firebaseConfig = {
  apiKey: configJson.apiKey,
  authDomain: configJson.authDomain,
  projectId: configJson.projectId,
  storageBucket: configJson.storageBucket,
  messagingSenderId: configJson.messagingSenderId,
  appId: configJson.appId,
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const db: Firestore = getFirestore(app, configJson.firestoreDatabaseId || '(default)');

// Local fallback user storage
const LOCAL_STORAGE_USER_KEY = 'ae_user_profile_v1';

export function getLocalProfile(): UserProfile {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_USER_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {}

  const defaultId = 'dr_' + Math.random().toString(36).substring(2, 8);
  const defaultNames = ['Dr. Vance', 'Synthesist Chen', 'Architect Mercer', 'Cyber-Geneticist Thorne', 'Dr. Aris', 'Engineer Kael'];
  const avatars = ['🔬', '🧬', '⚡', '🤖', '🛰️', '🧠', '🛡️', '☣️'];

  const initial: UserProfile = {
    uid: defaultId,
    displayName: defaultNames[Math.floor(Math.random() * defaultNames.length)],
    avatar: avatars[Math.floor(Math.random() * avatars.length)],
    clearanceLevel: 1,
    xp: 0,
    stats: {
      gamesPlayed: 0,
      scientistWins: 0,
      anomalyWins: 0,
      tasksCompleted: 0,
      sabotagesThwarted: 0,
      sabotagesTriggered: 0,
      correctDeductions: 0,
    },
    achievements: ['RECRUIT_CLEARANCE'],
    updatedAt: Date.now(),
  };

  saveLocalProfile(initial);
  return initial;
}

export function saveLocalProfile(profile: UserProfile): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(profile));
  } catch {}
}

/**
 * Initializes authentication and retrieves or provisions user profile in Firestore
 */
export async function initUserProfile(): Promise<{ user: FirebaseUser | null; profile: UserProfile }> {
  let localProfile = getLocalProfile();

  try {
    const userCred = await signInAnonymously(auth);
    const user = userCred.user;

    // Use firebase auth uid
    localProfile.uid = user.uid;

    const userDocRef = doc(db, 'users', user.uid);
    const docSnap = await getDoc(userDocRef);

    if (docSnap.exists()) {
      const data = docSnap.data() as UserProfile;
      localProfile = { ...localProfile, ...data, uid: user.uid };
      saveLocalProfile(localProfile);
    } else {
      // First time in Firestore, write initial profile
      await setDoc(userDocRef, localProfile);
      await updateLeaderboardEntry(localProfile);
    }

    return { user, profile: localProfile };
  } catch (err) {
    console.warn('Firebase auth / Firestore connection using local profile fallback:', err);
    return { user: null, profile: localProfile };
  }
}

/**
 * Updates profile after a game concludes
 */
export async function recordMatchResult(
  profile: UserProfile, 
  result: {
    won: boolean;
    role: 'scientist' | 'anomaly';
    tasksDone: number;
    correctDeduction: boolean;
    sabotages: number;
  }
): Promise<UserProfile> {
  const updated: UserProfile = {
    ...profile,
    stats: {
      ...profile.stats,
      gamesPlayed: profile.stats.gamesPlayed + 1,
      scientistWins: result.role === 'scientist' && result.won ? profile.stats.scientistWins + 1 : profile.stats.scientistWins,
      anomalyWins: result.role === 'anomaly' && result.won ? profile.stats.anomalyWins + 1 : profile.stats.anomalyWins,
      tasksCompleted: profile.stats.tasksCompleted + result.tasksDone,
      correctDeductions: result.correctDeduction ? profile.stats.correctDeductions + 1 : profile.stats.correctDeductions,
      sabotagesTriggered: result.role === 'anomaly' ? profile.stats.sabotagesTriggered + result.sabotages : profile.stats.sabotagesTriggered,
      sabotagesThwarted: result.role === 'scientist' && result.won ? profile.stats.sabotagesThwarted + 1 : profile.stats.sabotagesThwarted,
    },
    xp: profile.xp + (result.won ? 150 : 50) + (result.tasksDone * 20) + (result.correctDeduction ? 80 : 0),
    updatedAt: Date.now(),
  };

  // Calculate clearance level
  updated.clearanceLevel = Math.floor(updated.xp / 250) + 1;

  // Calculate achievements
  const achievements = new Set(updated.achievements);
  if (updated.stats.gamesPlayed >= 1) achievements.add('FIRST_CONTAINMENT');
  if (updated.stats.scientistWins >= 3) achievements.add('LOGIC_SPECIALIST');
  if (updated.stats.anomalyWins >= 2) achievements.add('WILD_CARD');
  if (updated.stats.correctDeductions >= 3) achievements.add('FORENSIC_MASTER');
  if (updated.stats.tasksCompleted >= 10) achievements.add('SYSTEMS_ARCHITECT');
  if (updated.clearanceLevel >= 5) achievements.add('LEVEL_5_CLEARANCE');
  updated.achievements = Array.from(achievements);

  saveLocalProfile(updated);

  try {
    if (auth.currentUser) {
      const userDocRef = doc(db, 'users', auth.currentUser.uid);
      await setDoc(userDocRef, updated, { merge: true });
      await updateLeaderboardEntry(updated);
    }
  } catch (e) {
    console.warn('Could not sync to Firestore:', e);
  }

  return updated;
}

/**
 * Updates public leaderboard entry
 */
export async function updateLeaderboardEntry(profile: UserProfile): Promise<void> {
  try {
    const totalWins = profile.stats.scientistWins + profile.stats.anomalyWins;
    const winRate = profile.stats.gamesPlayed > 0 
      ? Math.round((totalWins / profile.stats.gamesPlayed) * 100) 
      : 0;

    const entry: LeaderboardEntry = {
      uid: profile.uid,
      displayName: profile.displayName,
      avatar: profile.avatar,
      clearanceLevel: profile.clearanceLevel,
      wins: totalWins,
      winRate,
      gamesPlayed: profile.stats.gamesPlayed,
      favoriteRole: profile.stats.anomalyWins > profile.stats.scientistWins ? 'anomaly' : 'scientist',
      rating: Math.max(1000, 1000 + (totalWins * 35) - ((profile.stats.gamesPlayed - totalWins) * 15)),
    };

    const docRef = doc(db, 'leaderboard', profile.uid);
    await setDoc(docRef, entry, { merge: true });
  } catch (err) {
    console.warn('Failed to update leaderboard doc:', err);
  }
}

/**
 * Fetches high scorers for the global research ranking
 */
export async function fetchTopResearchers(): Promise<LeaderboardEntry[]> {
  try {
    const q = query(collection(db, 'leaderboard'), orderBy('rating', 'desc'), limit(15));
    const snapshot = await getDocs(q);
    const results: LeaderboardEntry[] = [];
    snapshot.forEach((d) => {
      results.push(d.data() as LeaderboardEntry);
    });
    if (results.length > 0) return results;
  } catch (err) {
    console.warn('Error fetching Firestore leaderboard, fallback to simulated top operatives:', err);
  }

  // Fallback high scores if fresh database
  return [
    { uid: 'f1', displayName: 'Chief Synthesist Mercer', avatar: '🧠', clearanceLevel: 9, wins: 42, winRate: 78, gamesPlayed: 54, favoriteRole: 'scientist', rating: 2150 },
    { uid: 'f2', displayName: 'Synthesist Cipher_X', avatar: '☣️', clearanceLevel: 8, wins: 36, winRate: 72, gamesPlayed: 50, favoriteRole: 'anomaly', rating: 1980 },
    { uid: 'f3', displayName: 'Dr. Evelyn Vance', avatar: '🔬', clearanceLevel: 7, wins: 29, winRate: 67, gamesPlayed: 43, favoriteRole: 'scientist', rating: 1840 },
    { uid: 'f4', displayName: 'Cyber-Geneticist Thorne', avatar: '🧬', clearanceLevel: 6, wins: 24, winRate: 63, gamesPlayed: 38, favoriteRole: 'scientist', rating: 1710 },
    { uid: 'f5', displayName: 'Specter Node 9', avatar: '🤖', clearanceLevel: 5, wins: 18, winRate: 60, gamesPlayed: 30, favoriteRole: 'anomaly', rating: 1590 },
  ];
}

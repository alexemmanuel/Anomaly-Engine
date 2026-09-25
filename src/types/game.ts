/**
 * The Anomaly Engine - Core Game Types
 */

export type Role = 'scientist' | 'anomaly';

export type GamePhase = 
  | 'lobby'
  | 'briefing'
  | 'operation'
  | 'emergency'
  | 'ejection'
  | 'game_over';

export type SectorId = 
  | 'reactor'
  | 'signal'
  | 'conduits'
  | 'archive'
  | 'telemetry_hub';

export interface SectorInfo {
  id: SectorId;
  name: string;
  code: string;
  description: string;
  taskType: MiniGameType;
  color: string;
}

export type MiniGameType = 
  | 'wire_matrix'
  | 'signal_decryption'
  | 'reactor_calibration'
  | 'memory_purge';

export interface Player {
  id: string;
  name: string;
  avatar: string;
  color: string;
  role?: Role; // Hidden from other players
  isHost: boolean;
  isReady: boolean;
  isAlive: boolean;
  isBot: boolean;
  currentSector: SectorId;
  completedTasks: string[];
  votedFor?: string | 'skip' | null;
  connectionStatus: 'connected' | 'disconnected';
  lastPing: number;
}

export interface FacilityTask {
  id: string;
  sector: SectorId;
  type: MiniGameType;
  name: string;
  isCompleted: boolean;
  isCorrupted: boolean;
  completedBy?: string;
  corruptedBy?: string;
  corruptedAt?: number;
}

export interface TelemetryLog {
  id: string;
  timestamp: number;
  type: 'sector_entry' | 'task_completed' | 'task_corrupted' | 'anomaly_spike' | 'blackout' | 'emergency_call';
  sector: SectorId;
  actorId?: string; // May be anonymous or spoofed if glitched
  actorName?: string;
  description: string;
  isGlitched?: boolean;
}

export interface SabotageStatus {
  blackoutActive: boolean;
  blackoutTimer: number;
  telemetryGlitched: boolean;
  glitchTimer: number;
  cooldowns: {
    blackout: number;
    telemetryGlitch: number;
    corruptConsole: number;
    whisper: number;
  };
}

export interface GameSettings {
  maxPlayers: number;
  roundDurationSeconds: number;
  discussionDurationSeconds: number;
  corruptionRatePerSec: number;
  tasksPerScientist: number;
  anomalySabotageCooldown: number;
}

export interface GameRoomState {
  roomId: string;
  phase: GamePhase;
  phaseTimeRemaining: number;
  settings: GameSettings;
  players: Record<string, Player>;
  tasks: FacilityTask[];
  logs: TelemetryLog[];
  facilityCorruption: number; // 0 to 100. At 100 -> Anomaly wins
  facilityStability: number;  // 0 to 100. At 100 -> Scientists win
  sabotage: SabotageStatus;
  emergencyCallerId?: string;
  ejectedPlayerId?: string | 'none';
  ejectedPlayerRole?: Role;
  winner?: 'scientists' | 'anomaly';
  winReason?: string;
  createdAt: number;
}

// Client to Server WebSocket Packets
export type ClientMessage =
  | { type: 'join_room'; roomId: string; player: { id: string; name: string; avatar: string; color: string } }
  | { type: 'create_room'; settings?: Partial<GameSettings>; player: { id: string; name: string; avatar: string; color: string } }
  | { type: 'leave_room' }
  | { type: 'set_ready'; isReady: boolean }
  | { type: 'add_bots'; count: number }
  | { type: 'remove_bot'; botId: string }
  | { type: 'start_game' }
  | { type: 'move_sector'; sector: SectorId }
  | { type: 'complete_task'; taskId: string }
  | { type: 'corrupt_task'; taskId: string }
  | { type: 'trigger_sabotage'; sabotageType: 'blackout' | 'telemetry_glitch' }
  | { type: 'trigger_emergency'; reason?: string }
  | { type: 'cast_vote'; targetId: string | 'skip' }
  | { type: 'send_chat'; message: string }
  | { type: 'restart_game' };

// Server to Client WebSocket Packets
export type ServerMessage =
  | { type: 'room_state'; state: GameRoomState; yourRole?: Role }
  | { type: 'player_joined'; player: Player }
  | { type: 'player_left'; playerId: string }
  | { type: 'chat_broadcast'; senderId: string; senderName: string; senderColor: string; message: string; timestamp: number }
  | { type: 'anomaly_whisper'; message: string }
  | { type: 'error'; message: string };

export interface UserProfile {
  uid: string;
  displayName: string;
  avatar: string;
  clearanceLevel: number;
  xp: number;
  stats: {
    gamesPlayed: number;
    scientistWins: number;
    anomalyWins: number;
    tasksCompleted: number;
    sabotagesThwarted: number;
    sabotagesTriggered: number;
    correctDeductions: number;
  };
  achievements: string[];
  updatedAt: number;
}

export interface LeaderboardEntry {
  uid: string;
  displayName: string;
  avatar: string;
  clearanceLevel: number;
  wins: number;
  winRate: number;
  gamesPlayed: number;
  favoriteRole: 'scientist' | 'anomaly';
  rating: number;
}

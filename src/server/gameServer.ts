/**
 * The Anomaly Engine - Server-Authoritative WebSocket Game Server
 */

import { WebSocketServer, WebSocket } from 'ws';
import type { Server } from 'http';
import type { 
  GameRoomState, 
  Player, 
  FacilityTask, 
  TelemetryLog, 
  Role, 
  SectorId, 
  ClientMessage, 
  ServerMessage,
  GameSettings
} from '../types/game';

interface ClientConnection {
  ws: WebSocket;
  playerId: string;
  roomId?: string;
}

const DEFAULT_SETTINGS: GameSettings = {
  maxPlayers: 8,
  roundDurationSeconds: 180,
  discussionDurationSeconds: 45,
  corruptionRatePerSec: 0.15,
  tasksPerScientist: 4,
  anomalySabotageCooldown: 25,
};

const SECTOR_IDS: SectorId[] = ['reactor', 'signal', 'conduits', 'archive', 'telemetry_hub'];

export class AnomalyGameServer {
  private wss: WebSocketServer | null = null;
  private connections: Map<WebSocket, ClientConnection> = new Map();
  private rooms: Map<string, GameRoomState> = new Map();
  private gameLoops: Map<string, NodeJS.Timeout> = new Map();

  constructor() {}

  public attach(httpServer: Server) {
    this.wss = new WebSocketServer({ noServer: true });

    httpServer.on('upgrade', (request, socket, head) => {
      const url = request.url || '';
      // Support /ws, /api/ws, or generic websocket upgrades
      if (url.startsWith('/ws') || url.startsWith('/socket') || url === '/' || url === '') {
        this.wss?.handleUpgrade(request, socket, head, (ws) => {
          this.wss?.emit('connection', ws, request);
        });
      }
    });

    this.wss.on('connection', (ws: WebSocket) => {
      const conn: ClientConnection = {
        ws,
        playerId: 'p_' + Math.random().toString(36).substring(2, 9),
      };
      this.connections.set(ws, conn);

      ws.on('message', (data: string | Buffer) => {
        try {
          const msg = JSON.parse(data.toString()) as ClientMessage;
          this.handleClientMessage(conn, msg);
        } catch (err) {
          console.error('Invalid WS packet:', err);
        }
      });

      ws.on('close', () => {
        this.handleDisconnect(conn);
        this.connections.delete(ws);
      });

      ws.on('error', (err) => {
        console.error('Socket error:', err);
      });
    });

    console.log('[AnomalyEngine] WebSocket game server mounted.');
  }

  private handleDisconnect(conn: ClientConnection) {
    if (!conn.roomId) return;
    const room = this.rooms.get(conn.roomId);
    if (!room) return;

    const player = room.players[conn.playerId];
    if (player) {
      player.connectionStatus = 'disconnected';
      if (room.phase === 'lobby') {
        delete room.players[conn.playerId];
        // If host left, assign new host
        const remainingIds = Object.keys(room.players);
        if (remainingIds.length > 0 && player.isHost) {
          room.players[remainingIds[0]].isHost = true;
        }
      }
      this.broadcastRoomState(room);
    }

    // Clean up empty rooms
    const activePlayers = Object.values(room.players).filter(p => !p.isBot && p.connectionStatus === 'connected');
    if (activePlayers.length === 0 && room.phase === 'lobby') {
      this.stopRoomLoop(room.roomId);
      this.rooms.delete(room.roomId);
    }
  }

  private handleClientMessage(conn: ClientConnection, msg: ClientMessage) {
    switch (msg.type) {
      case 'create_room': {
        const roomId = this.generateRoomCode();
        conn.roomId = roomId;
        conn.playerId = msg.player.id;

        const hostPlayer: Player = {
          id: msg.player.id,
          name: msg.player.name,
          avatar: msg.player.avatar,
          color: msg.player.color,
          isHost: true,
          isReady: true,
          isAlive: true,
          isBot: false,
          currentSector: 'telemetry_hub',
          completedTasks: [],
          connectionStatus: 'connected',
          lastPing: Date.now(),
        };

        const roomState: GameRoomState = {
          roomId,
          phase: 'lobby',
          phaseTimeRemaining: 0,
          settings: { ...DEFAULT_SETTINGS, ...msg.settings },
          players: { [hostPlayer.id]: hostPlayer },
          tasks: [],
          logs: [],
          facilityCorruption: 10,
          facilityStability: 20,
          sabotage: {
            blackoutActive: false,
            blackoutTimer: 0,
            telemetryGlitched: false,
            glitchTimer: 0,
            cooldowns: {
              blackout: 0,
              telemetryGlitch: 0,
              corruptConsole: 0,
              whisper: 0,
            },
          },
          createdAt: Date.now(),
        };

        this.rooms.set(roomId, roomState);
        this.broadcastRoomState(roomState);
        break;
      }

      case 'join_room': {
        const normalizedCode = msg.roomId.toUpperCase().trim();
        const room = this.rooms.get(normalizedCode);
        if (!room) {
          this.sendToClient(conn.ws, { type: 'error', message: `Facility chamber [${normalizedCode}] not found.` });
          return;
        }

        conn.roomId = normalizedCode;
        conn.playerId = msg.player.id;

        const existingPlayer = room.players[msg.player.id];
        if (existingPlayer) {
          existingPlayer.connectionStatus = 'connected';
          existingPlayer.name = msg.player.name;
          existingPlayer.avatar = msg.player.avatar;
          existingPlayer.color = msg.player.color;
        } else {
          if (room.phase !== 'lobby') {
            this.sendToClient(conn.ws, { type: 'error', message: 'Experiment already in progress. Wait for round end.' });
            return;
          }
          if (Object.keys(room.players).length >= room.settings.maxPlayers) {
            this.sendToClient(conn.ws, { type: 'error', message: 'Decontamination chamber is at maximum capacity.' });
            return;
          }

          room.players[msg.player.id] = {
            id: msg.player.id,
            name: msg.player.name,
            avatar: msg.player.avatar,
            color: msg.player.color,
            isHost: Object.keys(room.players).length === 0,
            isReady: false,
            isAlive: true,
            isBot: false,
            currentSector: 'telemetry_hub',
            completedTasks: [],
            connectionStatus: 'connected',
            lastPing: Date.now(),
          };
        }

        this.broadcastRoomState(room);
        break;
      }

      case 'set_ready': {
        if (!conn.roomId) return;
        const room = this.rooms.get(conn.roomId);
        if (!room || !room.players[conn.playerId]) return;
        room.players[conn.playerId].isReady = msg.isReady;
        this.broadcastRoomState(room);
        break;
      }

      case 'add_bots': {
        if (!conn.roomId) return;
        const room = this.rooms.get(conn.roomId);
        if (!room || room.phase !== 'lobby') return;

        const botNames = ['Dr. Turing [AI]', 'Synth Ada [BOT]', 'Specter-04 [SIM]', 'Unit Kelvin [BOT]', 'Dr. Rosalind [SIM]', 'Cyber-Euler [BOT]'];
        const botAvatars = ['🤖', '🧬', '🔬', '⚙️', '🛡️', '⚡'];
        const botColors = ['#06b6d4', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#64748b'];

        for (let i = 0; i < msg.count; i++) {
          const count = Object.keys(room.players).length;
          if (count >= room.settings.maxPlayers) break;
          const botId = 'bot_' + Math.random().toString(36).substring(2, 7);
          const name = botNames[count % botNames.length] || `Researcher Bot-${count + 1}`;
          const avatar = botAvatars[count % botAvatars.length] || '🤖';
          const color = botColors[count % botColors.length] || '#10b981';

          room.players[botId] = {
            id: botId,
            name,
            avatar,
            color,
            isHost: false,
            isReady: true,
            isAlive: true,
            isBot: true,
            currentSector: 'telemetry_hub',
            completedTasks: [],
            connectionStatus: 'connected',
            lastPing: Date.now(),
          };
        }

        this.broadcastRoomState(room);
        break;
      }

      case 'remove_bot': {
        if (!conn.roomId) return;
        const room = this.rooms.get(conn.roomId);
        if (!room || room.phase !== 'lobby') return;
        if (room.players[msg.botId] && room.players[msg.botId].isBot) {
          delete room.players[msg.botId];
          this.broadcastRoomState(room);
        }
        break;
      }

      case 'start_game': {
        if (!conn.roomId) return;
        const room = this.rooms.get(conn.roomId);
        if (!room || room.phase !== 'lobby') return;

        const playersList = Object.values(room.players);
        if (playersList.length < 2) {
          this.sendToClient(conn.ws, { type: 'error', message: 'Requires at least 2 researchers (or add AI Bots) to begin.' });
          return;
        }

        this.initializeGame(room);
        break;
      }

      case 'move_sector': {
        if (!conn.roomId) return;
        const room = this.rooms.get(conn.roomId);
        if (!room || room.phase !== 'operation') return;
        const player = room.players[conn.playerId];
        if (!player || !player.isAlive) return;

        if (player.currentSector !== msg.sector) {
          player.currentSector = msg.sector;
          
          // Add telemetry log (unless glitched by anomaly)
          if (!room.sabotage.telemetryGlitched) {
            this.addTelemetryLog(room, {
              type: 'sector_entry',
              sector: msg.sector,
              actorId: player.id,
              actorName: player.name,
              description: `${player.name} moved badge scanner to Sector [${msg.sector.toUpperCase()}].`,
            });
          }
          this.broadcastRoomState(room);
        }
        break;
      }

      case 'complete_task': {
        if (!conn.roomId) return;
        const room = this.rooms.get(conn.roomId);
        if (!room || room.phase !== 'operation') return;
        const player = room.players[conn.playerId];
        if (!player || !player.isAlive) return;

        const task = room.tasks.find(t => t.id === msg.taskId);
        if (task && !task.isCompleted) {
          task.isCompleted = true;
          task.completedBy = player.id;
          if (!player.completedTasks.includes(task.id)) {
            player.completedTasks.push(task.id);
          }

          // Adjust stability & corruption
          room.facilityStability = Math.min(100, room.facilityStability + 15);
          room.facilityCorruption = Math.max(0, room.facilityCorruption - 6);

          this.addTelemetryLog(room, {
            type: 'task_completed',
            sector: task.sector,
            actorId: player.id,
            actorName: player.name,
            description: `${player.name} successfully executed ${task.name}. System stability +15%.`,
          });

          // Check if scientists win by 100% stability or all tasks completed
          const allDone = room.tasks.every(t => t.isCompleted);
          if (room.facilityStability >= 100 || allDone) {
            this.endGame(room, 'scientists', 'Facility Stabilized: All diagnostic protocols completed successfully.');
          } else {
            this.broadcastRoomState(room);
          }
        }
        break;
      }

      case 'corrupt_task': {
        if (!conn.roomId) return;
        const room = this.rooms.get(conn.roomId);
        if (!room || room.phase !== 'operation') return;
        const player = room.players[conn.playerId];
        if (!player || !player.isAlive || player.role !== 'anomaly') return;

        const task = room.tasks.find(t => t.id === msg.taskId);
        if (task && !task.isCorrupted) {
          task.isCorrupted = true;
          task.corruptedBy = player.id;
          task.corruptedAt = Date.now();

          room.facilityCorruption = Math.min(100, room.facilityCorruption + 12);
          room.facilityStability = Math.max(0, room.facilityStability - 8);

          // Add a suspicious spike log without explicitly stating the player's name
          this.addTelemetryLog(room, {
            type: 'task_corrupted',
            sector: task.sector,
            description: `WARNING: Algorithmic corruption spike registered at console [${task.name}]. Sensor telemetry disrupted.`,
          });

          if (room.facilityCorruption >= 100) {
            this.endGame(room, 'anomaly', 'Facility Meltdown: Anomaly corruption overwhelmed facility containment.');
          } else {
            this.broadcastRoomState(room);
          }
        }
        break;
      }

      case 'trigger_sabotage': {
        if (!conn.roomId) return;
        const room = this.rooms.get(conn.roomId);
        if (!room || room.phase !== 'operation') return;
        const player = room.players[conn.playerId];
        if (!player || !player.isAlive || player.role !== 'anomaly') return;

        if (msg.sabotageType === 'blackout') {
          if (room.sabotage.cooldowns.blackout <= 0) {
            room.sabotage.blackoutActive = true;
            room.sabotage.blackoutTimer = 15;
            room.sabotage.cooldowns.blackout = room.settings.anomalySabotageCooldown;
            room.facilityCorruption = Math.min(100, room.facilityCorruption + 8);

            this.addTelemetryLog(room, {
              type: 'blackout',
              sector: player.currentSector,
              description: 'CRITICAL ALERT: Facility Auxiliary Power grid collapsed. Emergency emergency lighting engaged.',
            });
            this.broadcastRoomState(room);
          }
        } else if (msg.sabotageType === 'telemetry_glitch') {
          if (room.sabotage.cooldowns.telemetryGlitch <= 0) {
            room.sabotage.telemetryGlitched = true;
            room.sabotage.glitchTimer = 20;
            room.sabotage.cooldowns.telemetryGlitch = room.settings.anomalySabotageCooldown;

            // Invert or inject phantom telemetry logs
            const fakeSectors: SectorId[] = ['reactor', 'signal', 'archive', 'conduits'];
            const randomSector = fakeSectors[Math.floor(Math.random() * fakeSectors.length)];
            this.addTelemetryLog(room, {
              type: 'anomaly_spike',
              sector: randomSector,
              isGlitched: true,
              description: `PHANTOM ECHO: Quantum sensor reading anomaly detected at Sector [${randomSector.toUpperCase()}]. Data verification degraded.`,
            });
            this.broadcastRoomState(room);
          }
        }
        break;
      }

      case 'trigger_emergency': {
        if (!conn.roomId) return;
        const room = this.rooms.get(conn.roomId);
        if (!room || room.phase !== 'operation') return;
        const player = room.players[conn.playerId];
        if (!player || !player.isAlive) return;

        this.startEmergencyMeeting(room, player.id, msg.reason);
        break;
      }

      case 'cast_vote': {
        if (!conn.roomId) return;
        const room = this.rooms.get(conn.roomId);
        if (!room || room.phase !== 'emergency') return;
        const player = room.players[conn.playerId];
        if (!player || !player.isAlive) return;

        player.votedFor = msg.targetId;

        // Check if all living players have voted
        const alivePlayers = Object.values(room.players).filter(p => p.isAlive);
        const allVoted = alivePlayers.every(p => p.votedFor !== undefined && p.votedFor !== null);

        if (allVoted) {
          this.concludeVoting(room);
        } else {
          this.broadcastRoomState(room);
        }
        break;
      }

      case 'send_chat': {
        if (!conn.roomId) return;
        const room = this.rooms.get(conn.roomId);
        if (!room) return;
        const player = room.players[conn.playerId];
        if (!player) return;

        const chatPkt: ServerMessage = {
          type: 'chat_broadcast',
          senderId: player.id,
          senderName: player.name,
          senderColor: player.color,
          message: msg.message.slice(0, 200),
          timestamp: Date.now(),
        };

        this.broadcastToRoom(room.roomId, chatPkt);
        break;
      }

      case 'restart_game': {
        if (!conn.roomId) return;
        const room = this.rooms.get(conn.roomId);
        if (!room) return;
        const player = room.players[conn.playerId];
        if (!player || !player.isHost) return;

        this.stopRoomLoop(room.roomId);
        room.phase = 'lobby';
        room.phaseTimeRemaining = 0;
        room.facilityCorruption = 10;
        room.facilityStability = 20;
        room.tasks = [];
        room.logs = [];
        room.winner = undefined;
        room.winReason = undefined;
        room.ejectedPlayerId = undefined;

        Object.values(room.players).forEach(p => {
          p.isAlive = true;
          p.isReady = p.isBot;
          p.role = undefined;
          p.completedTasks = [];
          p.votedFor = null;
          p.currentSector = 'telemetry_hub';
        });

        this.broadcastRoomState(room);
        break;
      }
    }
  }

  private initializeGame(room: GameRoomState) {
    room.phase = 'briefing';
    room.phaseTimeRemaining = 6; // 6 seconds dramatic intro
    room.facilityCorruption = 5;
    room.facilityStability = 15;
    room.logs = [];
    room.sabotage = {
      blackoutActive: false,
      blackoutTimer: 0,
      telemetryGlitched: false,
      glitchTimer: 0,
      cooldowns: {
        blackout: 10,
        telemetryGlitch: 10,
        corruptConsole: 5,
        whisper: 5,
      },
    };

    // Assign roles: exactly 1 Anomaly (the wild variable)
    const players = Object.values(room.players);
    players.forEach(p => {
      p.isAlive = true;
      p.role = 'scientist';
      p.completedTasks = [];
      p.votedFor = null;
      p.currentSector = 'telemetry_hub';
    });

    const anomalyIndex = Math.floor(Math.random() * players.length);
    players[anomalyIndex].role = 'anomaly';

    // Generate facility tasks
    room.tasks = [
      { id: 't_wire_1', sector: 'conduits', type: 'wire_matrix', name: 'Quantum Conduit Realignment', isCompleted: false, isCorrupted: false },
      { id: 't_wire_2', sector: 'conduits', type: 'wire_matrix', name: 'Junction Shunt Coupling', isCompleted: false, isCorrupted: false },
      { id: 't_sig_1', sector: 'signal', type: 'signal_decryption', name: 'Synthetic Waveform Decryption', isCompleted: false, isCorrupted: false },
      { id: 't_sig_2', sector: 'signal', type: 'signal_decryption', name: 'Cryptographic Frequency Lock', isCompleted: false, isCorrupted: false },
      { id: 't_react_1', sector: 'reactor', type: 'reactor_calibration', name: 'Core Pressure Equalization', isCompleted: false, isCorrupted: false },
      { id: 't_react_2', sector: 'reactor', type: 'reactor_calibration', name: 'Plasma Harmonic Balancer', isCompleted: false, isCorrupted: false },
      { id: 't_purge_1', sector: 'archive', type: 'memory_purge', name: 'Neural Buffer Glitch Purge', isCompleted: false, isCorrupted: false },
      { id: 't_purge_2', sector: 'archive', type: 'memory_purge', name: 'Quarantine Corrupted Subroutines', isCompleted: false, isCorrupted: false },
    ];

    this.addTelemetryLog(room, {
      type: 'anomaly_spike',
      sector: 'telemetry_hub',
      description: 'SECURITY LOCKDOWN: Containment Protocol Chimera engaged. Anomaly signature confirmed within squad.',
    });

    this.broadcastRoomState(room);
    this.startRoomLoop(room.roomId);
  }

  private startRoomLoop(roomId: string) {
    this.stopRoomLoop(roomId);

    const interval = setInterval(() => {
      const room = this.rooms.get(roomId);
      if (!room) {
        clearInterval(interval);
        return;
      }
      this.tickRoom(room);
    }, 1000);

    this.gameLoops.set(roomId, interval);
  }

  private stopRoomLoop(roomId: string) {
    const existing = this.gameLoops.get(roomId);
    if (existing) {
      clearInterval(existing);
      this.gameLoops.delete(roomId);
    }
  }

  private tickRoom(room: GameRoomState) {
    if (room.phase === 'briefing') {
      room.phaseTimeRemaining--;
      if (room.phaseTimeRemaining <= 0) {
        room.phase = 'operation';
        room.phaseTimeRemaining = room.settings.roundDurationSeconds;
      }
      this.broadcastRoomState(room);
      return;
    }

    if (room.phase === 'operation') {
      room.phaseTimeRemaining--;

      // Corruption tick
      const corruptionIncrement = room.sabotage.blackoutActive 
        ? room.settings.corruptionRatePerSec * 2.5 
        : room.settings.corruptionRatePerSec;
      room.facilityCorruption = Math.min(100, Number((room.facilityCorruption + corruptionIncrement).toFixed(2)));

      // Decrement sabotage timers
      if (room.sabotage.blackoutActive) {
        room.sabotage.blackoutTimer--;
        if (room.sabotage.blackoutTimer <= 0) {
          room.sabotage.blackoutActive = false;
          this.addTelemetryLog(room, {
            type: 'blackout',
            sector: 'reactor',
            description: 'FACILITY REBOOT: Main reactor relays stabilized. Power restored.',
          });
        }
      }

      if (room.sabotage.telemetryGlitched) {
        room.sabotage.glitchTimer--;
        if (room.sabotage.glitchTimer <= 0) {
          room.sabotage.telemetryGlitched = false;
        }
      }

      // Decrement cooldowns
      Object.keys(room.sabotage.cooldowns).forEach(k => {
        const key = k as keyof typeof room.sabotage.cooldowns;
        if (room.sabotage.cooldowns[key] > 0) {
          room.sabotage.cooldowns[key]--;
        }
      });

      // Run Simulated Bot AI
      this.tickBots(room);

      // Check win/lose
      if (room.facilityCorruption >= 100) {
        this.endGame(room, 'anomaly', 'Containment Failure: System corrupted beyond recovery threshold.');
        return;
      }

      if (room.phaseTimeRemaining <= 0) {
        // Time expired, if scientists didn't reach 100% stability, anomaly claims facility
        if (room.facilityStability >= 85) {
          this.endGame(room, 'scientists', 'Shift Concluded: Scientists held facility stable under maximum pressure.');
        } else {
          this.endGame(room, 'anomaly', 'Time Expired: Facility protocols eroded before full containment.');
        }
        return;
      }

      this.broadcastRoomState(room);
      return;
    }

    if (room.phase === 'emergency') {
      room.phaseTimeRemaining--;

      // Bot voting logic if bots haven't voted yet
      Object.values(room.players).forEach(p => {
        if (p.isBot && p.isAlive && p.votedFor === null) {
          // If 15 seconds have passed or random chance
          if (room.phaseTimeRemaining <= 20 || Math.random() < 0.1) {
            const living = Object.values(room.players).filter(x => x.isAlive);
            // 20% skip, 80% vote for random suspect
            if (Math.random() < 0.25) {
              p.votedFor = 'skip';
            } else {
              const others = living.filter(x => x.id !== p.id);
              const target = others[Math.floor(Math.random() * others.length)];
              p.votedFor = target ? target.id : 'skip';
            }
          }
        }
      });

      const alive = Object.values(room.players).filter(p => p.isAlive);
      const allVoted = alive.every(p => p.votedFor !== undefined && p.votedFor !== null);

      if (room.phaseTimeRemaining <= 0 || allVoted) {
        this.concludeVoting(room);
        return;
      }

      this.broadcastRoomState(room);
      return;
    }

    if (room.phase === 'ejection') {
      room.phaseTimeRemaining--;
      if (room.phaseTimeRemaining <= 0) {
        // Check post-ejection state
        const alivePlayers = Object.values(room.players).filter(p => p.isAlive);
        const aliveAnomaly = alivePlayers.find(p => p.role === 'anomaly');
        const aliveScientists = alivePlayers.filter(p => p.role === 'scientist');

        if (!aliveAnomaly) {
          this.endGame(room, 'scientists', 'Anomaly Contained: The rogue variable was quarantined into deep stasis.');
        } else if (aliveScientists.length <= 1) {
          this.endGame(room, 'anomaly', 'Facility Overrun: The Anomaly eliminated research majority.');
        } else {
          // Return to operation phase
          room.phase = 'operation';
          room.phaseTimeRemaining = Math.max(60, room.phaseTimeRemaining);
          alivePlayers.forEach(p => {
            p.votedFor = null;
          });
          this.broadcastRoomState(room);
        }
      } else {
        this.broadcastRoomState(room);
      }
      return;
    }
  }

  /**
   * Simulated Bot AI Behavior during Operation Phase
   */
  private tickBots(room: GameRoomState) {
    const bots = Object.values(room.players).filter(p => p.isBot && p.isAlive);
    bots.forEach(bot => {
      // 10% chance per second to change sector
      if (Math.random() < 0.12) {
        const otherSectors = SECTOR_IDS.filter(s => s !== bot.currentSector);
        const newSector = otherSectors[Math.floor(Math.random() * otherSectors.length)];
        bot.currentSector = newSector;

        if (!room.sabotage.telemetryGlitched) {
          this.addTelemetryLog(room, {
            type: 'sector_entry',
            sector: newSector,
            actorId: bot.id,
            actorName: bot.name,
            description: `${bot.name} arrived at Sector [${newSector.toUpperCase()}].`,
          });
        }
      }

      // If Bot is Scientist: 15% chance to work on a task in current sector
      if (bot.role === 'scientist') {
        const availableTask = room.tasks.find(t => t.sector === bot.currentSector && !t.isCompleted);
        if (availableTask && Math.random() < 0.08) {
          availableTask.isCompleted = true;
          availableTask.completedBy = bot.id;
          bot.completedTasks.push(availableTask.id);
          room.facilityStability = Math.min(100, room.facilityStability + 15);
          room.facilityCorruption = Math.max(0, room.facilityCorruption - 4);

          this.addTelemetryLog(room, {
            type: 'task_completed',
            sector: bot.currentSector,
            actorId: bot.id,
            actorName: bot.name,
            description: `${bot.name} stabilized [${availableTask.name}].`,
          });
        }
      }

      // If Bot is Anomaly: 8% chance to trigger sabotage or corrupt task
      if (bot.role === 'anomaly') {
        if (Math.random() < 0.06 && room.sabotage.cooldowns.blackout <= 0 && !room.sabotage.blackoutActive) {
          room.sabotage.blackoutActive = true;
          room.sabotage.blackoutTimer = 15;
          room.sabotage.cooldowns.blackout = room.settings.anomalySabotageCooldown;
          this.addTelemetryLog(room, {
            type: 'blackout',
            sector: bot.currentSector,
            description: 'CRITICAL ALERT: Power breaker flipped. Auxiliary systems offline.',
          });
        } else if (Math.random() < 0.06 && room.sabotage.cooldowns.telemetryGlitch <= 0) {
          room.sabotage.telemetryGlitched = true;
          room.sabotage.glitchTimer = 18;
          room.sabotage.cooldowns.telemetryGlitch = room.settings.anomalySabotageCooldown;
        }
      }
    });
  }

  private startEmergencyMeeting(room: GameRoomState, callerId: string, reason?: string) {
    room.phase = 'emergency';
    room.phaseTimeRemaining = room.settings.discussionDurationSeconds;
    room.emergencyCallerId = callerId;

    // Reset votes
    Object.values(room.players).forEach(p => {
      p.votedFor = null;
    });

    const caller = room.players[callerId];
    this.addTelemetryLog(room, {
      type: 'emergency_call',
      sector: 'telemetry_hub',
      actorId: callerId,
      actorName: caller?.name || 'Unknown Researcher',
      description: `EMERGENCY PROTOCOL INITIATED: ${caller?.name || 'Researcher'} called emergency containment vote! ${reason ? `Reason: "${reason}"` : ''}`,
    });

    this.broadcastRoomState(room);
  }

  private concludeVoting(room: GameRoomState) {
    const votes: Record<string, number> = {};
    const alivePlayers = Object.values(room.players).filter(p => p.isAlive);

    alivePlayers.forEach(p => {
      const target = p.votedFor || 'skip';
      votes[target] = (votes[target] || 0) + 1;
    });

    let highestTarget = 'skip';
    let highestCount = 0;
    let isTie = false;

    Object.entries(votes).forEach(([target, count]) => {
      if (count > highestCount) {
        highestCount = count;
        highestTarget = target;
        isTie = false;
      } else if (count === highestCount) {
        isTie = true;
      }
    });

    room.phase = 'ejection';
    room.phaseTimeRemaining = 7; // 7 seconds suspense reveal

    if (isTie || highestTarget === 'skip') {
      room.ejectedPlayerId = 'none';
      room.ejectedPlayerRole = undefined;
      this.addTelemetryLog(room, {
        type: 'emergency_call',
        sector: 'telemetry_hub',
        description: `Deliberation inconclusive: ${isTie ? 'Tie in voting consensus' : 'Team elected to skip quarantine'}. No researcher ejected.`,
      });
    } else {
      const victim = room.players[highestTarget];
      if (victim) {
        victim.isAlive = false;
        room.ejectedPlayerId = victim.id;
        room.ejectedPlayerRole = victim.role;

        this.addTelemetryLog(room, {
          type: 'emergency_call',
          sector: 'telemetry_hub',
          actorId: victim.id,
          actorName: victim.name,
          description: `QUARANTINE EXECUTED: ${victim.name} was jettisoned into stasis beam. Forensic analysis reveals: ${victim.role === 'anomaly' ? 'IDENTITY MATCH: THE ROGUE ANOMALY!' : 'TRAGEDY: INNOCENT RESEARCH SCIENTIST.'}`,
        });
      }
    }

    this.broadcastRoomState(room);
  }

  private endGame(room: GameRoomState, winner: 'scientists' | 'anomaly', reason: string) {
    room.phase = 'game_over';
    room.winner = winner;
    room.winReason = reason;
    this.stopRoomLoop(room.roomId);

    // Reveal all roles to everyone
    this.broadcastRoomState(room, true);
  }

  private addTelemetryLog(room: GameRoomState, log: Omit<TelemetryLog, 'id' | 'timestamp'>) {
    const fullLog: TelemetryLog = {
      ...log,
      id: 'log_' + Math.random().toString(36).substring(2, 9),
      timestamp: Date.now(),
    };
    room.logs.unshift(fullLog);
    if (room.logs.length > 50) {
      room.logs.pop();
    }
  }

  private broadcastRoomState(room: GameRoomState, revealAllRoles = false) {
    this.connections.forEach(conn => {
      if (conn.roomId === room.roomId && conn.ws.readyState === WebSocket.OPEN) {
        const player = room.players[conn.playerId];
        // Send state with hidden roles unless game_over or specifically their own role
        const maskedState: GameRoomState = {
          ...room,
          players: Object.fromEntries(
            Object.entries(room.players).map(([id, p]) => [
              id,
              {
                ...p,
                role: revealAllRoles || id === conn.playerId || room.phase === 'game_over' ? p.role : undefined,
              },
            ])
          ),
        };

        this.sendToClient(conn.ws, {
          type: 'room_state',
          state: maskedState,
          yourRole: player?.role,
        });
      }
    });
  }

  private broadcastToRoom(roomId: string, message: ServerMessage) {
    this.connections.forEach(conn => {
      if (conn.roomId === roomId && conn.ws.readyState === WebSocket.OPEN) {
        this.sendToClient(conn.ws, message);
      }
    });
  }

  private sendToClient(ws: WebSocket, message: ServerMessage) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  private generateRoomCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 4; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }
}

// Global server singleton
let gameServerInstance: AnomalyGameServer | null = null;

export function setupGameWebSocketServer(httpServer: Server): AnomalyGameServer {
  if (!gameServerInstance) {
    gameServerInstance = new AnomalyGameServer();
    gameServerInstance.attach(httpServer);
  }
  return gameServerInstance;
}

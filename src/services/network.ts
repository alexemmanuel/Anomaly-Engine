/**
 * WebSocket Network Client for The Anomaly Engine
 * Handles connection lifecycle, reconnects, state caching, and typed messages.
 */

import type { ClientMessage, ServerMessage, GameRoomState, Role } from '../types/game';

type StateListener = (state: GameRoomState, yourRole?: Role) => void;
type ChatListener = (chat: { senderId: string; senderName: string; senderColor: string; message: string; timestamp: number }) => void;
type ErrorListener = (error: string) => void;
type StatusListener = (status: 'connecting' | 'connected' | 'disconnected') => void;

class GameNetworkClient {
  private ws: WebSocket | null = null;
  private stateListeners: Set<StateListener> = new Set();
  private chatListeners: Set<ChatListener> = new Set();
  private errorListeners: Set<ErrorListener> = new Set();
  private statusListeners: Set<StatusListener> = new Set();

  private status: 'connecting' | 'connected' | 'disconnected' = 'disconnected';
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private pendingQueue: ClientMessage[] = [];
  private lastKnownState: GameRoomState | null = null;
  private lastKnownRole: Role | undefined = undefined;

  constructor() {
    this.connect();
  }

  public connect() {
    if (typeof window === 'undefined') return;
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    this.setStatus('connecting');

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    // Connect to same host:port
    const host = window.location.host;
    const wsUrl = `${protocol}//${host}/ws`;

    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.setStatus('connected');
        // Flush pending messages
        while (this.pendingQueue.length > 0) {
          const msg = this.pendingQueue.shift();
          if (msg) this.send(msg);
        }
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as ServerMessage;
          this.handleServerMessage(data);
        } catch (err) {
          console.error('Failed to parse incoming message:', err);
        }
      };

      this.ws.onclose = () => {
        this.setStatus('disconnected');
        this.scheduleReconnect();
      };

      this.ws.onerror = () => {
        this.setStatus('disconnected');
      };
    } catch {
      this.setStatus('disconnected');
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimeout) return;
    this.reconnectTimeout = setTimeout(() => {
      this.reconnectTimeout = null;
      this.connect();
    }, 2000);
  }

  private setStatus(newStatus: 'connecting' | 'connected' | 'disconnected') {
    this.status = newStatus;
    this.statusListeners.forEach((l) => l(newStatus));
  }

  public getStatus() {
    return this.status;
  }

  public getLastKnownState() {
    return { state: this.lastKnownState, role: this.lastKnownRole };
  }

  public send(message: ClientMessage) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      this.pendingQueue.push(message);
      this.connect();
    }
  }

  private handleServerMessage(msg: ServerMessage) {
    switch (msg.type) {
      case 'room_state':
        this.lastKnownState = msg.state;
        if (msg.yourRole) {
          this.lastKnownRole = msg.yourRole;
        }
        this.stateListeners.forEach((l) => l(msg.state, msg.yourRole));
        break;
      case 'chat_broadcast':
        this.chatListeners.forEach((l) => l(msg));
        break;
      case 'error':
        this.errorListeners.forEach((l) => l(msg.message));
        break;
    }
  }

  public onState(cb: StateListener) {
    this.stateListeners.add(cb);
    if (this.lastKnownState) {
      cb(this.lastKnownState, this.lastKnownRole);
    }
    return () => {
      this.stateListeners.delete(cb);
    };
  }

  public onChat(cb: ChatListener) {
    this.chatListeners.add(cb);
    return () => {
      this.chatListeners.delete(cb);
    };
  }

  public onError(cb: ErrorListener) {
    this.errorListeners.add(cb);
    return () => {
      this.errorListeners.delete(cb);
    };
  }

  public onStatus(cb: StatusListener) {
    this.statusListeners.add(cb);
    cb(this.status);
    return () => {
      this.statusListeners.delete(cb);
    };
  }
}

export const network = new GameNetworkClient();

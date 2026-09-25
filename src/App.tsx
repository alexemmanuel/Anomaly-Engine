/**
 * The Anomaly Engine - Main Application Entrypoint
 * Social deduction & logic multiplayer game inside a rogue AI research facility.
 */

import React, { useState, useEffect } from 'react';
import type { 
  GameRoomState, 
  Player, 
  UserProfile, 
  SectorId, 
  FacilityTask, 
  Role 
} from './types/game';
import { network } from './services/network';
import { sounds } from './services/soundFx';
import { initUserProfile, getLocalProfile } from './services/firebase';

import { Header } from './components/Header';
import { LobbyView } from './components/LobbyView';
import { FacilityMapView } from './components/FacilityMapView';
import { TelemetryAuditView } from './components/TelemetryAuditView';
import { AnomalyControlPanel } from './components/AnomalyControlPanel';
import { EmergencyMeetingView } from './components/EmergencyMeetingView';
import { BriefingModal } from './components/BriefingModal';
import { EjectionRevealModal } from './components/EjectionRevealModal';
import { GameOverModal } from './components/GameOverModal';
import { LeaderboardModal } from './components/LeaderboardModal';
import { UserProfileModal } from './components/UserProfileModal';
import { GameGuideModal } from './components/GameGuideModal';

import { WireMatrixGame } from './components/minigames/WireMatrixGame';
import { SignalDecryptionGame } from './components/minigames/SignalDecryptionGame';
import { ReactorCalibrationGame } from './components/minigames/ReactorCalibrationGame';
import { MemoryPurgeGame } from './components/minigames/MemoryPurgeGame';

import { 
  Map, 
  FileText, 
  AlertOctagon, 
  Wifi, 
  WifiOff, 
  Radio, 
  Volume2, 
  VolumeX, 
  HelpCircle, 
  RotateCcw 
} from 'lucide-react';

export default function App() {
  const [userProfile, setUserProfile] = useState<UserProfile>(getLocalProfile);
  const [roomState, setRoomState] = useState<GameRoomState | null>(null);
  const [myRole, setMyRole] = useState<Role | undefined>(undefined);
  const [networkStatus, setNetworkStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState<boolean>(sounds.getMuted());

  // Active view tab during game
  const [activeTab, setActiveTab] = useState<'map' | 'telemetry'>('map');

  // Currently open mini-game
  const [activeTask, setActiveTask] = useState<FacilityTask | null>(null);

  // Deliberation Chat messages
  const [chatMessages, setChatMessages] = useState<Array<{
    senderId: string;
    senderName: string;
    senderColor: string;
    message: string;
    timestamp: number;
  }>>([]);

  // Modals
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  // Initialize Firebase User Profile
  useEffect(() => {
    initUserProfile().then(({ profile }) => {
      setUserProfile(profile);
    });
  }, []);

  // Subscribe to Network WebSockets
  useEffect(() => {
    const unsubState = network.onState((state, role) => {
      setRoomState(state);
      if (role) {
        setMyRole(role);
      }
    });

    const unsubChat = network.onChat(chatMsg => {
      setChatMessages(prev => [...prev.slice(-40), chatMsg]);
    });

    const unsubError = network.onError(err => {
      sounds.playGlitch();
      setErrorMessage(err);
      setTimeout(() => setErrorMessage(null), 4000);
    });

    const unsubStatus = network.onStatus(st => {
      setNetworkStatus(st);
    });

    return () => {
      unsubState();
      unsubChat();
      unsubError();
      unsubStatus();
    };
  }, []);

  const currentPlayer: Player | null = 
    roomState && userProfile ? roomState.players[userProfile.uid] || null : null;

  // Handlers
  const handleCreateRoom = (settings?: any) => {
    network.send({
      type: 'create_room',
      settings,
      player: {
        id: userProfile.uid,
        name: userProfile.displayName,
        avatar: userProfile.avatar,
        color: '#06b6d4',
      },
    });
  };

  const handleJoinRoom = (roomId: string) => {
    network.send({
      type: 'join_room',
      roomId,
      player: {
        id: userProfile.uid,
        name: userProfile.displayName,
        avatar: userProfile.avatar,
        color: '#06b6d4',
      },
    });
  };

  const handleSetReady = (isReady: boolean) => {
    network.send({ type: 'set_ready', isReady });
  };

  const handleAddBots = (count: number) => {
    network.send({ type: 'add_bots', count });
  };

  const handleRemoveBot = (botId: string) => {
    network.send({ type: 'remove_bot', botId });
  };

  const handleStartGame = () => {
    network.send({ type: 'start_game' });
  };

  const handleMoveSector = (sector: SectorId) => {
    network.send({ type: 'move_sector', sector });
  };

  const handleCompleteTask = (taskId: string) => {
    network.send({ type: 'complete_task', taskId });
    setActiveTask(null);
  };

  const handleCorruptTask = (taskId: string) => {
    network.send({ type: 'corrupt_task', taskId });
  };

  const handleTriggerSabotage = (sabotageType: 'blackout' | 'telemetry_glitch') => {
    network.send({ type: 'trigger_sabotage', sabotageType });
  };

  const handleTriggerEmergency = () => {
    network.send({ type: 'trigger_emergency' });
  };

  const handleCastVote = (targetId: string | 'skip') => {
    network.send({ type: 'cast_vote', targetId });
  };

  const handleSendChat = (message: string) => {
    network.send({ type: 'send_chat', message });
  };

  const handleRestart = () => {
    network.send({ type: 'restart_game' });
  };

  const handleToggleMute = () => {
    const muted = sounds.toggleMute();
    setIsMuted(muted);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-rose-500/30 selection:text-rose-200">
      {/* Network / Connection Toast */}
      {networkStatus !== 'connected' && (
        <div className="bg-amber-500/20 border-b border-amber-500/40 text-amber-300 px-4 py-1 text-xs font-mono flex items-center justify-center gap-2">
          <WifiOff className="w-3.5 h-3.5 animate-pulse" />
          <span>Synchronizing facility WebSocket uplink... ({networkStatus})</span>
        </div>
      )}

      {/* Error Message Toast */}
      {errorMessage && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 bg-rose-950/90 border border-rose-500 text-rose-200 px-4 py-2 rounded-xl text-xs font-mono shadow-2xl flex items-center gap-2 animate-bounce">
          <AlertOctagon className="w-4 h-4 text-rose-400" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Main Header */}
      <Header
        roomState={roomState}
        currentPlayer={currentPlayer}
        userProfile={userProfile}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
        onOpenLeaderboard={() => setShowLeaderboard(true)}
        onOpenProfile={() => setShowProfile(true)}
        onOpenGuide={() => setShowGuide(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 flex flex-col justify-start">
        {!roomState || roomState.phase === 'lobby' || !currentPlayer ? (
          <LobbyView
            roomState={roomState}
            currentPlayer={currentPlayer}
            userProfile={userProfile}
            onCreateRoom={handleCreateRoom}
            onJoinRoom={handleJoinRoom}
            onSetReady={handleSetReady}
            onAddBots={handleAddBots}
            onRemoveBot={handleRemoveBot}
            onStartGame={handleStartGame}
          />
        ) : (
          <div className="space-y-4">
            {/* View Switcher Tabs (Map vs Telemetry) */}
            <div className="flex items-center justify-between border-b border-cyan-500/20 pb-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    sounds.playClick(600);
                    setActiveTab('map');
                  }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl font-mono text-xs font-bold transition ${
                    activeTab === 'map'
                      ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                      : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  <Map className="w-4 h-4" />
                  FACILITY FLOOR PLAN
                </button>

                <button
                  onClick={() => {
                    sounds.playClick(600);
                    setActiveTab('telemetry');
                  }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl font-mono text-xs font-bold transition ${
                    activeTab === 'telemetry'
                      ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                      : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  BLACK BOX TELEMETRY & DEDUCTION MATRIX
                  {roomState.logs.length > 0 && (
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse ml-1" />
                  )}
                </button>
              </div>

              {/* Anomaly Badge or Scientist Badge */}
              <div className="flex items-center gap-2">
                {currentPlayer.role === 'anomaly' ? (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-950/80 border border-rose-500 text-rose-300 font-mono text-xs font-bold shadow-lg shadow-rose-950/40">
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                    ROLE: ROGUE ANOMALY (WILD)
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-950/80 border border-emerald-500 text-emerald-300 font-mono text-xs font-bold shadow-lg shadow-emerald-950/40">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    ROLE: RESEARCH SCIENTIST (LOGIC)
                  </div>
                )}
              </div>
            </div>

            {/* If Anomaly, render stealth sabotage HUD */}
            {currentPlayer.role === 'anomaly' && (
              <AnomalyControlPanel
                roomState={roomState}
                currentPlayer={currentPlayer}
                onTriggerSabotage={handleTriggerSabotage}
                onCorruptTask={handleCorruptTask}
              />
            )}

            {/* Active Content: Map or Telemetry */}
            {activeTab === 'map' ? (
              <FacilityMapView
                roomState={roomState}
                currentPlayer={currentPlayer}
                onMoveSector={handleMoveSector}
                onOpenTask={task => setActiveTask(task)}
                onTriggerEmergency={handleTriggerEmergency}
              />
            ) : (
              <TelemetryAuditView roomState={roomState} />
            )}
          </div>
        )}
      </main>

      {/* Active Mini-Game Modal */}
      {activeTask && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 backdrop-blur-md animate-fadeIn">
          {activeTask.type === 'wire_matrix' && (
            <WireMatrixGame
              isCorrupted={activeTask.isCorrupted}
              onComplete={() => handleCompleteTask(activeTask.id)}
              onCancel={() => setActiveTask(null)}
            />
          )}
          {activeTask.type === 'signal_decryption' && (
            <SignalDecryptionGame
              isCorrupted={activeTask.isCorrupted}
              onComplete={() => handleCompleteTask(activeTask.id)}
              onCancel={() => setActiveTask(null)}
            />
          )}
          {activeTask.type === 'reactor_calibration' && (
            <ReactorCalibrationGame
              isCorrupted={activeTask.isCorrupted}
              onComplete={() => handleCompleteTask(activeTask.id)}
              onCancel={() => setActiveTask(null)}
            />
          )}
          {activeTask.type === 'memory_purge' && (
            <MemoryPurgeGame
              isCorrupted={activeTask.isCorrupted}
              onComplete={() => handleCompleteTask(activeTask.id)}
              onCancel={() => setActiveTask(null)}
            />
          )}
        </div>
      )}

      {/* Briefing Classification Modal */}
      {roomState && roomState.phase === 'briefing' && currentPlayer && (
        <BriefingModal roomState={roomState} currentPlayer={currentPlayer} />
      )}

      {/* Emergency Meeting Deliberation & Voting Modal */}
      {roomState && roomState.phase === 'emergency' && currentPlayer && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 backdrop-blur-lg animate-fadeIn overflow-y-auto">
          <EmergencyMeetingView
            roomState={roomState}
            currentPlayer={currentPlayer}
            onCastVote={handleCastVote}
            onSendChat={handleSendChat}
            chatMessages={chatMessages}
          />
        </div>
      )}

      {/* Ejection Reveal Modal */}
      {roomState && roomState.phase === 'ejection' && (
        <EjectionRevealModal roomState={roomState} />
      )}

      {/* Game Over Post-Mortem Modal */}
      {roomState && roomState.phase === 'game_over' && currentPlayer && (
        <GameOverModal
          roomState={roomState}
          currentPlayer={currentPlayer}
          userProfile={userProfile}
          onProfileUpdated={updated => setUserProfile(updated)}
          onRestart={handleRestart}
        />
      )}

      {/* Leaderboard Modal */}
      {showLeaderboard && (
        <LeaderboardModal onClose={() => setShowLeaderboard(false)} />
      )}

      {/* User Profile Modal */}
      {showProfile && (
        <UserProfileModal
          profile={userProfile}
          onUpdate={updated => setUserProfile(updated)}
          onClose={() => setShowProfile(false)}
        />
      )}

      {/* Game Guide Modal */}
      {showGuide && (
        <GameGuideModal onClose={() => setShowGuide(false)} />
      )}
    </div>
  );
}

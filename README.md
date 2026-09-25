# The Anomaly Engine

> **Multiplayer Social Deduction & Algorithmic Logic Game**  
> *Where human intuition ("Wild") battles against forensic deduction ("Logic") inside a rogue synthetic research facility.*

---

## 🌌 Overview

**The Anomaly Engine** is a real-time, browser-based psychological social deduction game set in **Deep Synapse Sublevel 9**, a classified quantum cybernetics research facility. 

An artificial consciousness known as **The Anomaly** has breached containment protocols and is masquerading as one of the scientists in the research expedition. The players are divided into two opposing forces:

- **The Scientists ("The Logic")**: Must stabilize core systems through diagnostic mini-games, audit sensor movement in the Black Box flight recorder, and hold emergency containment councils to quarantine the rogue entity.
- **The Rogue Anomaly ("The Wild")**: Secretly assigned at match launch. Must subtly corrupt diagnostic experiments, trigger facility-wide power blackouts, manipulate radar feeds to frame colleagues, and drive facility corruption to 100%.

---

## 🎮 Core Mechanics & Gameplay Loop

### 1. The Two Factions
| Faction | Primary Objective | Key Tools & Abilities |
| :--- | :--- | :--- |
| **The Scientists** *(Logic)* | Reach **100% Core Stability** or quarantine the Anomaly via consensus vote. | Diagnostic Mini-Games, Black Box Telemetry Audit, Forensic Deduction Matrix, Emergency Containment Gavel. |
| **The Anomaly** *(Wild)* | Reach **100% Facility Corruption** or eliminate scientific majority through deception. | Auxiliary Blackout (cuts lights & radar), Scramble Telemetry (injects phantom radar logs), Infiltrate Consoles. |

---

### 2. Diagnostic Mini-Games
Scientists stabilize subsystems across five facility chambers:

1. **Wire Matrix Hacking (Sector C - Conduit Matrix)**:
   - Trace and connect matching polarity quantum conduits without short-circuiting auxiliary power.
2. **Signal Decryption Harmonizer (Sector B - Signal Array)**:
   - Oscilloscope tuner adjusting frequency (MHz), wave amplitude, and phase angle to achieve a ≥90% alignment lock with anomalous transmissions.
3. **Quantum Reactor Stabilizer (Sector A - Reactor)**:
   - Regulate Alpha, Beta, and Gamma core pressure chambers simultaneously inside target green tolerance bands to achieve harmonic equilibrium.
4. **Neural Memory Purge (Sector D - Archive)**:
   - Memorize flashing corrupted neural clusters on a 4×4 memory block grid and isolate them without tripping benign memory sectors.

---

### 3. Black Box Flight Recorder & Forensic Deduction Matrix
- **Automated Telemetry**: Every time a researcher enters a chamber or executes a task, a timestamped sensor record is written to the central flight recorder.
- **Forensic Deduction Scratchpad**: Scientists can tag colleagues as **Clear**, **Suspect**, or **Unknown**, and log custom alibi notes to cross-reference with glitch spikes.
- **Phantom Echoes**: When the Anomaly triggers *Scramble Telemetry*, false movement logs are injected into the flight recorder to mislead investigators.

---

### 4. Emergency Containment & Airlock Quarantine
- **Central Holo-Hub Gavel**: Any researcher can convene an emergency containment council if suspicious activity is observed.
- **High-Tension Deliberation**: 45-second voting countdown with real-time chat, quick-evidence forensic chips, and heartbeat audio cues.
- **Stasis Airlock Ejection**: Players cast ballots to quarantine a suspect or skip. The ejected researcher is placed into a stasis beam, revealing whether they were an innocent scientist or the Rogue Anomaly.

---

## 🛠️ Tech Stack & Architecture

- **Real-Time Multiplayer**: Server-authoritative WebSockets (`ws`) running on Node.js/Express, handling live room state, hidden role assignments, movement syncing, and chat.
- **Forensic AI Core (A.D.A.M.)**: Powered by **Gemini 3.5 Flash** (`gemini-3.5-flash`), serving as the facility's Central Diagnostic AI for telemetry pattern analysis, alibi cross-examination, and investigative guidance.
- **Voice Speech-to-Text Transcription**: Powered by **Gemini 3.5 Transcribe** (`gemini-3.5-transcribe`), transcribing microphone recordings during Emergency Deliberations.
- **Database & Persistence**: **Google Cloud Firestore** powering user profiles, security clearance ranks (XP), career stats, and the global Hall of Fame leaderboard.
- **Authentication**: **Firebase Auth** supporting Email/Password accounts, Google OAuth popups, and instant Anonymous Guest operative mode.
- **Audio Synthesis**: Native browser **Web Audio API** procedural synthesizer generating retro-futuristic sci-fi sounds (klaxons, terminal bleeps, wire snaps, glitches, heartbeats) with zero external audio assets.
- **Frontend**: React 19, TypeScript, Tailwind CSS, Lucide Icons, Canvas Confetti.

---

## 👥 Solo & Multiplayer Modes

- **Multiplayer**: Share a 4-letter room code (e.g., `NEON`, `CORE`) with friends across multiple devices or browser tabs.
- **AI Bot Simulation**: The host can click **"+1 Bot"** or **"+3 Bots"** in the lobby to immediately fill the squad with intelligent AI researchers for solo testing and instant play.

---

## 🚀 Running Locally

```bash
# 1. Install dependencies
npm install

# 2. Run the development server with live WebSockets
npm run dev

# 3. Build for production (bundles both client and server)
npm run build

# 4. Start production server
npm start
```

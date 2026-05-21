# NEURO-X: AI Cyber Intelligence System

```
███╗   ██╗███████╗██╗   ██╗██████╗  ██████╗       ██╗  ██╗
████╗  ██║██╔════╝██║   ██║██╔══██╗██╔═══██╗      ╚██╗██╔╝
██╔██╗ ██║█████╗  ██║   ██║██████╔╝██║   ██║       ╚███╔╝ 
██║╚██╗██║██╔══╝  ██║   ██║██╔══██╗██║   ██║       ██╔██╗ 
██║ ╚████║███████╗╚██████╔╝██║  ██║╚██████╔╝      ██╔╝ ██╗
╚═╝  ╚═══╝╚══════╝ ╚═════╝ ╚═╝  ╚═╝ ╚═════╝       ╚═╝  ╚═╝
```

> **Futuristic AI-Powered Cyber Intelligence & Network Monitoring System**
> FOR EDUCATIONAL AND ETHICAL CYBERSECURITY LEARNING ONLY

---

## 🌐 Overview

NEURO-X is a real-time AI cyber intelligence desktop application combining a React/Electron frontend, Python FastAPI backend, and C++ low-level engine. It provides a cyberpunk-style dashboard for monitoring system/network activity, AI threat analysis, voice commands, and live visualizations.

---

## 📁 Project Structure

```
NEURO-X/
├── frontend/                  # React + Electron app
│   ├── src/
│   │   ├── components/        # UI Components
│   │   │   ├── Terminal.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── NetworkAnalyzer.jsx
│   │   │   ├── AIThinkingEngine.jsx
│   │   │   ├── SystemMonitor.jsx
│   │   │   ├── ThreatMeter.jsx
│   │   │   ├── ParticleBackground.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   ├── VoiceCommand.jsx
│   │   │   └── LoginScreen.jsx
│   │   ├── pages/
│   │   │   └── App.jsx
│   │   ├── hooks/
│   │   │   └── useWebSocket.js
│   │   └── utils/
│   │       └── soundEffects.js
│   ├── electron/
│   │   └── main.js            # Electron entry point
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.js
├── backend/                   # Python FastAPI server
│   ├── main.py                # Entry point
│   ├── monitor.py             # System monitoring
│   ├── ai_engine.py           # AI analysis engine
│   ├── websocket_manager.py   # WebSocket manager
│   ├── threat_detector.py     # Threat detection logic
│   └── requirements.txt
├── cpp-engine/                # C++ low-level engine
│   ├── packet_sniffer.cpp
│   ├── performance_monitor.cpp
│   ├── monitor_bridge.cpp
│   ├── CMakeLists.txt
│   └── include/
│       └── monitor.h
├── docs/
│   ├── ARCHITECTURE.md
│   └── VOICE_COMMANDS.md
└── README.md
```

---

## ⚡ Quick Start

### Prerequisites

| Tool | Version | Purpose |
|------|---------|---------|
| Node.js | 18+ | Frontend / Electron |
| Python | 3.10+ | Backend |
| CMake | 3.15+ | C++ Build |
| g++ / clang | Latest | C++ Compiler |
| Git | Any | Clone repo |

Optional:
- **Ollama** (for local AI): https://ollama.ai
- **OpenAI API key** (for cloud AI)

---

## 🚀 Installation & Running in VS Code

### Step 1 — Clone & Open in VS Code

```bash
# Open integrated terminal in VS Code (Ctrl+`)
cd NEURO-X
```

---

### Step 2 — Backend Setup

```bash
cd backend
pip install -r requirements.txt
```

**Run backend:**
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

You should see:
```
INFO:     NEURO-X Backend starting...
INFO:     Uvicorn running on http://0.0.0.0:8000
INFO:     WebSocket ready at ws://localhost:8000/ws
```

---

### Step 3 — Frontend Setup

Open a **new terminal tab** in VS Code:

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at: http://localhost:5173

---

### Step 4 — Electron (Desktop App)

Open another **new terminal tab**:

```bash
cd frontend
npm run electron
```

The full desktop app will launch.

---

### Step 5 — C++ Engine (Optional, for production use)

```bash
cd cpp-engine
cmake -B build -S .
cmake --build build
```

The compiled library will be at `cpp-engine/build/libmonitor.so` (Linux) or `libmonitor.dll` (Windows).

---

## 🎮 Features

### 🖥️ Live Hacker Terminal
- Real-time streaming AI thoughts
- Typewriter effect with cyberpunk styling
- Color-coded log levels (INFO / WARN / CRITICAL)

### 📊 System Monitoring
- CPU / RAM / Disk / Network in real time
- Process list with threat scoring
- Open ports scanner

### 🔍 Network Analyzer
- Port scan detection
- Brute-force attempt detection
- Traffic spike alerts
- Live packet visualization

### 🧠 AI Thinking Engine
- Continuous threat reasoning
- Pattern recognition
- Confidence scoring
- Recommendations engine

### 🎙️ Voice Commands
| Command | Action |
|---------|--------|
| "scan network" | Triggers full network scan |
| "show active ports" | Lists open ports |
| "start deep analysis" | Runs AI deep analysis |
| "enable stealth monitor" | Activates passive mode |
| "show threats" | Displays active threats |

### 📈 Real-Time Dashboard
- Live line charts (Recharts)
- Threat heatmap
- AI activity visualization
- Threat meter gauge

---

## 🔑 Login

Default credentials:
```
Username: admin
Password: neuro-x2024
```

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+T` | Open Terminal |
| `Ctrl+N` | Network Analyzer |
| `Ctrl+S` | System Monitor |
| `Ctrl+A` | AI Engine |
| `Ctrl+V` | Voice Command |
| `Ctrl+L` | Export Logs |
| `Esc` | Close modal |

---

## 🤖 AI Engine Modes

| Mode | Provider | Setup |
|------|----------|-------|
| Simulated | Built-in | No setup needed |
| Local AI | Ollama | `ollama pull llama3` |
| Cloud AI | OpenAI | Set `OPENAI_API_KEY` env var |

---

## 🔊 Sample AI Output

```
[NEURO-X ACTIVE] ██████████ 100%

> Initializing neural monitoring protocols...
> Binding to network interfaces...
> Loading threat signature database: 47,832 patterns loaded

[00:01] Monitoring packets on all interfaces...
[00:02] CPU baseline established: 12.3% idle average
[00:03] Analyzing system behavior...
[00:05] ⚠ Unusual packet burst detected on port 22
[00:06] Comparing against 47,832 known attack signatures...
[00:07] Pattern match: SSH brute-force reconnaissance
[00:08] Confidence Level: 84%
[00:09] Recommendation: Block source IP, alert admin
[00:10] Logging event to threat database...
```

---

## 📸 UI Description

**Login Screen**: Animated matrix rain background, glowing NEURO-X logo, glassmorphism login card.

**Main Dashboard**: Dark cyberpunk layout with neon green/blue accents, animated particle background, 4-panel grid showing CPU/RAM/Network/Threats.

**Terminal Panel**: Full-width scrolling terminal with typewriter AI thoughts, color-coded by severity.

**Network Analyzer**: Live graph of packet rates, flagged connections table, geographic threat map.

**AI Status**: Pulsing brain icon, real-time reasoning stream, confidence meter, recommendation cards.

---

## ⚠️ Legal & Ethical Notice

This software is designed **exclusively** for:
- Educational cybersecurity learning
- Monitoring your own systems
- Authorized penetration testing environments

**Never** use on networks or systems you don't own or have explicit permission to monitor.

---

## 📄 License

MIT License — Educational Use Only

---

*Built with ❤️ for the cybersecurity community*

# NEURO-X Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        NEURO-X SYSTEM                           │
│                                                                  │
│  ┌──────────────────────────────────────────────┐              │
│  │              FRONTEND (Electron + React)       │              │
│  │                                                │              │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────────┐  │              │
│  │  │ Terminal  │ │Dashboard │ │  AI Engine   │  │              │
│  │  │ Component │ │ Charts   │ │  Visualizer  │  │              │
│  │  └──────────┘ └──────────┘ └──────────────┘  │              │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────────┐  │              │
│  │  │ Network  │ │  System  │ │    Voice     │  │              │
│  │  │ Analyzer │ │ Monitor  │ │   Command    │  │              │
│  │  └──────────┘ └──────────┘ └──────────────┘  │              │
│  │                                                │              │
│  │       WebSocket Client (socket.io-client)      │              │
│  └─────────────────────┬──────────────────────────┘              │
│                         │ ws://localhost:8000/ws                  │
│  ┌──────────────────────▼──────────────────────────┐            │
│  │              BACKEND (Python FastAPI)             │            │
│  │                                                   │            │
│  │  ┌────────────┐  ┌────────────┐  ┌───────────┐  │            │
│  │  │  monitor   │  │  threat    │  │  ai       │  │            │
│  │  │  .py       │  │  _detector │  │  _engine  │  │            │
│  │  │  (psutil)  │  │  .py       │  │  .py      │  │            │
│  │  └────────────┘  └────────────┘  └───────────┘  │            │
│  │                                                   │            │
│  │  ┌────────────────────────────────────────────┐  │            │
│  │  │          websocket_manager.py               │  │            │
│  │  │  (broadcasts to all connected clients)      │  │            │
│  │  └────────────────────────────────────────────┘  │            │
│  │                                                   │            │
│  │  ┌────────────────────────────────────────────┐  │            │
│  │  │            cpp_bridge.py                    │  │            │
│  │  │  (ctypes → C++ shared library)              │  │            │
│  │  └──────────────────────┬─────────────────────┘  │            │
│  └─────────────────────────┼─────────────────────────┘            │
│                             │                                      │
│  ┌──────────────────────────▼──────────────────────┐             │
│  │          C++ ENGINE (libmonitor.so)               │             │
│  │                                                   │             │
│  │  ┌──────────────────┐  ┌────────────────────┐   │             │
│  │  │  packet_sniffer  │  │ performance_monitor │   │             │
│  │  │  .cpp            │  │ .cpp                │   │             │
│  │  │  (raw sockets)   │  │ (/proc, sysinfo)    │   │             │
│  │  └──────────────────┘  └────────────────────┘   │             │
│  │  ┌────────────────────────────────────────────┐  │             │
│  │  │         monitor_bridge.cpp                  │  │             │
│  │  │  (JSON serialization, ctypes-safe API)      │  │             │
│  │  └────────────────────────────────────────────┘  │             │
│  └───────────────────────────────────────────────────┘             │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow

```
Network/OS → C++ Engine → Python Backend → WebSocket → React Frontend
                ↑               ↑
           Raw Packets      psutil / scapy
```

## WebSocket Message Protocol

All messages follow this structure:
```json
{
  "type": "message_type",
  "data": { ... }
}
```

### Message Types (Server → Client)

| Type | Frequency | Payload |
|------|-----------|---------|
| `system_stats` | 2s | CPU, RAM, disk, temp, uptime, network I/O |
| `network_stats` | 2s | Packet rate, I/O rates, interface info |
| `threat_detected` | 5s (when threats found) | Array of ThreatEvent objects |
| `ai_thought` | 3s | `{level, msg}` for terminal streaming |
| `command_result` | On demand | Response to a command |

### Message Types (Client → Server)

| Type | Payload |
|------|---------|
| `init` | `{client: "neuro-x-frontend"}` |
| `command` | `{action: "scan_network" \| "deep_analysis" \| "stealth_mode"}` |

## Component Breakdown

### Frontend Components

| Component | Description |
|-----------|-------------|
| `LoginScreen` | Matrix rain animation, boot sequence, auth form |
| `App` | Root state manager, keyboard shortcuts, notifications |
| `Sidebar` | Navigation, settings, theme switcher |
| `Dashboard` | Stat cards, area charts, threat feed, radial bar |
| `Terminal` | Streaming log display, typewriter AI thoughts, command input |
| `NetworkAnalyzer` | Live packet canvas, connection table, attack pattern cards |
| `AIThinkingEngine` | Neural network SVG viz, reasoning chains, recommendations |
| `SystemMonitor` | Gauge SVGs, CPU core bar chart, process table, port list |
| `VoiceCommand` | Web Speech API overlay, command list |
| `ParticleBackground` | Canvas particle system with connection lines |

### Backend Modules

| Module | Responsibility |
|--------|---------------|
| `main.py` | FastAPI app, lifespan, REST routes, WebSocket endpoint |
| `websocket_manager.py` | Multi-client broadcast, connection registry |
| `monitor.py` | psutil wrapper — CPU, RAM, disk, network, processes, ports |
| `threat_detector.py` | Connection analysis, pattern matching, demo threat generation |
| `ai_engine.py` | Thought bank cycling, deep analysis chains, LLM integration |
| `cpp_bridge.py` | ctypes wrapper around compiled C++ shared library |

## Security Considerations

- Raw packet capture requires root/administrator privileges
- Never expose the WebSocket server to untrusted networks
- OpenAI API key should be set via environment variable, not hardcoded
- The system monitors **your own** traffic only — unauthorized monitoring is illegal

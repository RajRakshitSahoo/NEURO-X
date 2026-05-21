"""
NEURO-X Backend — FastAPI Entry Point
main.py

Starts the WebSocket server, REST API, and launches background monitoring tasks.
Run: uvicorn main:app --reload --host 0.0.0.0 --port 8000
"""

import asyncio
import json
from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from loguru import logger

from websocket_manager import WebSocketManager
from monitor import SystemMonitor
from threat_detector import ThreatDetector
from ai_engine import AIEngine

# ── Shared instances
ws_manager = WebSocketManager()
sys_monitor = SystemMonitor()
threat_detector = ThreatDetector()
ai_engine = AIEngine()

# ── Lifespan: start background tasks on startup
@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("NEURO-X Backend starting...")
    # Launch background monitoring loops
    task1 = asyncio.create_task(monitoring_loop())
    task2 = asyncio.create_task(ai_reasoning_loop())
    task3 = asyncio.create_task(threat_scan_loop())
    logger.info("All monitoring tasks started")
    yield
    # Shutdown
    task1.cancel(); task2.cancel(); task3.cancel()
    logger.info("NEURO-X Backend shutting down")

# ── App setup
app = FastAPI(
    title="NEURO-X API",
    description="AI Cyber Intelligence Backend",
    version="2.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],           # In production: restrict to electron app
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ──────────────────────────────────────────────
#  REST Endpoints
# ──────────────────────────────────────────────

@app.get("/")
async def root():
    return {"status": "NEURO-X Active", "version": "2.1.0"}

@app.get("/api/system")
async def get_system_stats():
    """Return current system stats snapshot."""
    return sys_monitor.get_stats()

@app.get("/api/threats")
async def get_threats():
    """Return latest threat detections."""
    return threat_detector.get_recent_threats()

@app.get("/api/network")
async def get_network():
    """Return live network snapshot."""
    return sys_monitor.get_network_stats()

@app.get("/api/processes")
async def get_processes():
    """Return top processes by CPU usage."""
    return sys_monitor.get_processes()

@app.get("/api/ports")
async def get_ports():
    """Return open ports list."""
    return sys_monitor.get_open_ports()

@app.post("/api/command")
async def handle_command(body: dict):
    """Handle a command from the frontend (scan, deep analysis, etc)."""
    action = body.get("action", "")
    result = await process_command(action)
    return {"status": "ok", "result": result}

# ──────────────────────────────────────────────
#  WebSocket endpoint
# ──────────────────────────────────────────────

@app.websocket("/ws")
async def websocket_endpoint(ws: WebSocket):
    await ws_manager.connect(ws)
    logger.info(f"Client connected: {ws.client}")
    try:
        while True:
            # Receive messages from the frontend
            raw = await ws.receive_text()
            try:
                msg = json.loads(raw)
                msg_type = msg.get("type", "")

                if msg_type == "init":
                    # Send immediate welcome payload
                    await ws_manager.send_to(ws, {
                        "type": "welcome",
                        "data": {"message": "NEURO-X connected", "version": "2.1.0"},
                    })

                elif msg_type == "command":
                    action = msg.get("action", "")
                    result = await process_command(action)
                    await ws_manager.send_to(ws, {
                        "type": "command_result",
                        "data": {"action": action, "result": result},
                    })

            except json.JSONDecodeError:
                logger.warning(f"Invalid JSON from client: {raw}")

    except WebSocketDisconnect:
        ws_manager.disconnect(ws)
        logger.info(f"Client disconnected: {ws.client}")

# ──────────────────────────────────────────────
#  Background loops (broadcast to all clients)
# ──────────────────────────────────────────────

async def monitoring_loop():
    """Broadcasts system stats and network data every 2 seconds."""
    while True:
        try:
            stats = sys_monitor.get_stats()
            await ws_manager.broadcast({"type": "system_stats", "data": stats})

            net = sys_monitor.get_network_stats()
            await ws_manager.broadcast({"type": "network_stats", "data": net})

        except Exception as e:
            logger.error(f"Monitoring loop error: {e}")
        await asyncio.sleep(2)

async def threat_scan_loop():
    """Runs threat detection every 5 seconds and broadcasts findings."""
    while True:
        try:
            threats = threat_detector.scan()
            if threats:
                await ws_manager.broadcast({"type": "threat_detected", "data": threats})
                logger.warning(f"Threats detected: {len(threats)}")
        except Exception as e:
            logger.error(f"Threat scan error: {e}")
        await asyncio.sleep(5)

async def ai_reasoning_loop():
    """Broadcasts AI thoughts/analysis every 3 seconds."""
    while True:
        try:
            thought = ai_engine.get_next_thought()
            await ws_manager.broadcast({
                "type": "ai_thought",
                "data": {"level": thought["level"], "msg": thought["msg"]},
            })
        except Exception as e:
            logger.error(f"AI loop error: {e}")
        await asyncio.sleep(3)

async def process_command(action: str) -> str:
    """Handles commands dispatched from frontend or REST."""
    if action == "scan_network":
        return "Network scan initiated. Results will stream via WebSocket."
    elif action == "deep_analysis":
        thought = ai_engine.deep_analysis()
        await ws_manager.broadcast({"type": "ai_thought", "data": thought})
        return "Deep analysis started"
    elif action == "stealth_mode":
        return "Stealth monitor enabled — passive observation active"
    else:
        return f"Unknown command: {action}"

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

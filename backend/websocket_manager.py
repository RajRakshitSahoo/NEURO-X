"""
websocket_manager.py
Manages multiple WebSocket client connections and broadcasting.
"""

import json
import asyncio
from typing import List
from fastapi import WebSocket
from loguru import logger


class WebSocketManager:
    """Thread-safe WebSocket connection manager for broadcasting real-time data."""

    def __init__(self):
        self.active_connections: List[WebSocket] = []
        self._lock = asyncio.Lock()

    async def connect(self, ws: WebSocket) -> None:
        """Accept and register a new WebSocket connection."""
        await ws.accept()
        async with self._lock:
            self.active_connections.append(ws)
        logger.info(f"WebSocket connected. Total clients: {len(self.active_connections)}")

    def disconnect(self, ws: WebSocket) -> None:
        """Remove a disconnected WebSocket."""
        if ws in self.active_connections:
            self.active_connections.remove(ws)
        logger.info(f"WebSocket disconnected. Remaining: {len(self.active_connections)}")

    async def send_to(self, ws: WebSocket, data: dict) -> None:
        """Send a message to a specific WebSocket client."""
        try:
            await ws.send_text(json.dumps(data))
        except Exception as e:
            logger.warning(f"Failed to send to client: {e}")
            self.disconnect(ws)

    async def broadcast(self, data: dict) -> None:
        """Broadcast a message to ALL connected clients."""
        if not self.active_connections:
            return

        disconnected = []
        message = json.dumps(data)

        for ws in self.active_connections:
            try:
                await ws.send_text(message)
            except Exception:
                disconnected.append(ws)

        # Clean up dead connections
        for ws in disconnected:
            self.disconnect(ws)

    @property
    def client_count(self) -> int:
        return len(self.active_connections)

"""
monitor.py
System monitoring module using psutil.
Provides CPU, RAM, disk, network, process, and port data.
"""

import psutil
import socket
import time
from datetime import datetime, timedelta
from typing import List, Dict, Any
from loguru import logger


class SystemMonitor:
    """
    Wraps psutil to provide structured system monitoring data.
    All methods are synchronous and can be called from async contexts
    via asyncio.to_thread() if needed.
    """

    def __init__(self):
        self._start_time = time.time()
        self._prev_net = psutil.net_io_counters()
        self._prev_net_time = time.time()

    # ── Main stats bundle
    def get_stats(self) -> Dict[str, Any]:
        """Return a comprehensive system stats snapshot."""
        try:
            cpu = psutil.cpu_percent(interval=None)
            mem = psutil.virtual_memory()
            disk = psutil.disk_usage('/')
            temps = self._get_temps()
            uptime = self._get_uptime()
            net = self.get_network_stats()

            return {
                "cpu": round(cpu, 1),
                "cpu_cores": psutil.cpu_count(logical=True),
                "cpu_per_core": psutil.cpu_percent(percpu=True),
                "ram": round(mem.percent, 1),
                "ram_total_gb": round(mem.total / (1024**3), 2),
                "ram_used_gb": round(mem.used / (1024**3), 2),
                "ram_available_gb": round(mem.available / (1024**3), 2),
                "disk": round(disk.percent, 1),
                "disk_total_gb": round(disk.total / (1024**3), 1),
                "disk_used_gb": round(disk.used / (1024**3), 1),
                "temp": temps,
                "uptime": uptime,
                "network_in": net.get("bytes_recv_rate_kb", 0),
                "network_out": net.get("bytes_sent_rate_kb", 0),
                "timestamp": datetime.utcnow().isoformat(),
            }
        except Exception as e:
            logger.error(f"Error getting system stats: {e}")
            return {"error": str(e)}

    def get_network_stats(self) -> Dict[str, Any]:
        """Return live network I/O rates."""
        try:
            current = psutil.net_io_counters()
            now = time.time()
            elapsed = now - self._prev_net_time

            if elapsed > 0:
                sent_rate = (current.bytes_sent - self._prev_net.bytes_sent) / elapsed / 1024
                recv_rate = (current.bytes_recv - self._prev_net.bytes_recv) / elapsed / 1024
            else:
                sent_rate = recv_rate = 0

            self._prev_net = current
            self._prev_net_time = now

            return {
                "bytes_sent_rate_kb": round(sent_rate, 1),
                "bytes_recv_rate_kb": round(recv_rate, 1),
                "packets_sent": current.packets_sent,
                "packets_recv": current.packets_recv,
                "errors_in": current.errin,
                "errors_out": current.errout,
                "time": datetime.utcnow().strftime("%H:%M:%S"),
            }
        except Exception as e:
            logger.error(f"Network stats error: {e}")
            return {}

    def get_processes(self, top_n: int = 20) -> List[Dict]:
        """Return top N processes sorted by CPU usage."""
        procs = []
        for proc in psutil.process_iter(['pid', 'name', 'cpu_percent', 'memory_info', 'status', 'username']):
            try:
                info = proc.info
                procs.append({
                    "pid": info['pid'],
                    "name": info['name'] or 'unknown',
                    "cpu": round(info['cpu_percent'] or 0, 1),
                    "ram_mb": round((info['memory_info'].rss if info['memory_info'] else 0) / (1024**2), 1),
                    "status": info['status'],
                    "user": info['username'] or 'unknown',
                })
            except (psutil.NoSuchProcess, psutil.AccessDenied):
                continue

        # Sort by CPU descending
        procs.sort(key=lambda x: x['cpu'], reverse=True)
        return procs[:top_n]

    def get_open_ports(self) -> List[Dict]:
        """Return list of open TCP/UDP ports."""
        ports = []
        try:
            for conn in psutil.net_connections(kind='inet'):
                if conn.status in ('LISTEN', 'ESTABLISHED'):
                    ports.append({
                        "local_addr": str(conn.laddr.ip) if conn.laddr else '',
                        "local_port": conn.laddr.port if conn.laddr else 0,
                        "remote_addr": str(conn.raddr.ip) if conn.raddr else '',
                        "remote_port": conn.raddr.port if conn.raddr else 0,
                        "status": conn.status,
                        "pid": conn.pid or 0,
                        "family": "TCP" if conn.type == socket.SOCK_STREAM else "UDP",
                    })
        except (psutil.AccessDenied, Exception) as e:
            logger.warning(f"Port scan requires elevated privileges: {e}")
        return ports

    def _get_temps(self) -> float:
        """Get CPU temperature if available."""
        try:
            temps = psutil.sensors_temperatures()
            if temps:
                for key in ('coretemp', 'cpu_thermal', 'k10temp', 'acpitz'):
                    if key in temps and temps[key]:
                        return round(temps[key][0].current, 1)
        except (AttributeError, Exception):
            pass
        return 0.0

    def _get_uptime(self) -> str:
        """Return system uptime as HH:MM:SS string."""
        boot_time = psutil.boot_time()
        uptime_sec = time.time() - boot_time
        td = timedelta(seconds=int(uptime_sec))
        hours, remainder = divmod(td.seconds, 3600)
        minutes, seconds = divmod(remainder, 60)
        days = td.days
        if days > 0:
            return f"{days}d {hours:02d}:{minutes:02d}:{seconds:02d}"
        return f"{hours:02d}:{minutes:02d}:{seconds:02d}"

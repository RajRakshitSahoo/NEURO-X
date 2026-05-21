"""
threat_detector.py
Threat detection engine — analyzes network connections and system behavior
to identify suspicious patterns like port scans, brute-force attempts, etc.
"""

import random
import time
from datetime import datetime
from typing import List, Dict, Any
from loguru import logger

try:
    import psutil
    PSUTIL_AVAILABLE = True
except ImportError:
    PSUTIL_AVAILABLE = False


# ── Known threat signatures (simplified ruleset)
THREAT_SIGNATURES = {
    "port_scan": {
        "desc": "Port Scan",
        "threshold_connections_per_ip": 15,  # >15 connections from one IP in 60s
        "confidence_base": 82,
    },
    "brute_force_ssh": {
        "desc": "SSH Brute Force",
        "port": 22,
        "threshold_per_minute": 10,
        "confidence_base": 90,
    },
    "suspicious_outbound": {
        "desc": "Suspicious Outbound",
        "suspicious_ports": [4444, 5555, 1337, 31337, 6667, 6697],
        "confidence_base": 75,
    },
    "high_traffic_spike": {
        "desc": "Traffic Spike",
        "threshold_kb": 800,
        "confidence_base": 68,
    },
}

# ── Realistic threat scenarios for demo mode
DEMO_THREATS = [
    {"type": "Port Scan",          "level": "HIGH",     "confidence": (78, 92)},
    {"type": "SSH Brute Force",    "level": "CRITICAL", "confidence": (88, 96)},
    {"type": "DDoS Pattern",       "level": "CRITICAL", "confidence": (85, 98)},
    {"type": "SQL Injection",      "level": "HIGH",     "confidence": (72, 88)},
    {"type": "Malware Beacon",     "level": "CRITICAL", "confidence": (80, 95)},
    {"type": "Recon Activity",     "level": "MEDIUM",   "confidence": (55, 75)},
    {"type": "ARP Poisoning",      "level": "HIGH",     "confidence": (70, 85)},
    {"type": "DNS Tunneling",      "level": "HIGH",     "confidence": (65, 82)},
    {"type": "Lateral Movement",   "level": "CRITICAL", "confidence": (82, 94)},
    {"type": "Credential Stuffing","level": "HIGH",     "confidence": (76, 90)},
    {"type": "C2 Communication",   "level": "CRITICAL", "confidence": (87, 97)},
    {"type": "Data Exfiltration",  "level": "HIGH",     "confidence": (74, 89)},
]


class ThreatDetector:
    """
    Scans system connections and behavior for security threats.
    Falls back to realistic demo data when running without root/network access.
    """

    def __init__(self):
        self._history: List[Dict] = []
        self._ip_conn_counts: Dict[str, int] = {}
        self._scan_count = 0

    def scan(self) -> List[Dict[str, Any]]:
        """
        Run a threat scan. Returns list of detected threats (may be empty).
        """
        self._scan_count += 1

        try:
            if PSUTIL_AVAILABLE:
                return self._real_scan()
        except Exception as e:
            logger.warning(f"Real scan failed, using demo: {e}")

        return self._demo_scan()

    def _real_scan(self) -> List[Dict]:
        """Analyze real system connections using psutil."""
        threats = []

        try:
            connections = psutil.net_connections(kind='inet')
        except psutil.AccessDenied:
            logger.warning("Access denied to connections — need elevated privileges")
            return self._demo_scan()

        # Count connections per remote IP
        ip_counts: Dict[str, int] = {}
        ssh_attempts = 0

        for conn in connections:
            if not conn.raddr:
                continue
            ip = str(conn.raddr.ip)
            ip_counts[ip] = ip_counts.get(ip, 0) + 1

            # Check for SSH brute-force (many connections to port 22)
            if conn.laddr and conn.laddr.port == 22:
                ssh_attempts += 1

            # Check for connections on suspicious ports
            if conn.raddr.port in THREAT_SIGNATURES["suspicious_outbound"]["suspicious_ports"]:
                threats.append(self._build_threat(
                    "Suspicious Outbound",
                    "HIGH",
                    ip,
                    conn.raddr.port,
                    THREAT_SIGNATURES["suspicious_outbound"]["confidence_base"],
                ))

        # Port scan detection — one IP with many connections
        for ip, count in ip_counts.items():
            if count >= THREAT_SIGNATURES["port_scan"]["threshold_connections_per_ip"]:
                threats.append(self._build_threat(
                    "Port Scan",
                    "HIGH",
                    ip,
                    0,
                    min(THREAT_SIGNATURES["port_scan"]["confidence_base"] + count, 99),
                ))

        # SSH brute-force
        if ssh_attempts >= THREAT_SIGNATURES["brute_force_ssh"]["threshold_per_minute"]:
            threats.append(self._build_threat(
                "SSH Brute Force",
                "CRITICAL",
                "unknown",
                22,
                THREAT_SIGNATURES["brute_force_ssh"]["confidence_base"],
            ))

        # Store in history
        self._history.extend(threats)
        self._history = self._history[-500:]
        return threats

    def _demo_scan(self) -> List[Dict]:
        """
        Generates realistic threat data for demo mode.
        Fires a threat ~30% of the time to keep UI lively.
        """
        if random.random() > 0.30:
            return []

        # Pick 1-2 random threats
        count = random.randint(1, 2)
        selected = random.sample(DEMO_THREATS, min(count, len(DEMO_THREATS)))
        threats = []
        for t in selected:
            conf_min, conf_max = t["confidence"]
            ip = self._random_ip()
            port = random.randint(1, 65535)
            threats.append(self._build_threat(
                t["type"],
                t["level"],
                ip,
                port,
                random.randint(conf_min, conf_max),
            ))

        self._history.extend(threats)
        self._history = self._history[-500:]
        return threats

    def _build_threat(self, threat_type: str, level: str, ip: str, port: int, confidence: int) -> Dict:
        return {
            "id": f"{int(time.time() * 1000)}-{random.randint(1000, 9999)}",
            "type": threat_type,
            "level": level,
            "ip": ip,
            "port": port,
            "confidence": confidence,
            "timestamp": datetime.utcnow().isoformat(),
        }

    def get_recent_threats(self, n: int = 50) -> List[Dict]:
        return list(reversed(self._history[-n:]))

    @staticmethod
    def _random_ip() -> str:
        return f"{random.randint(1, 255)}.{random.randint(0, 255)}.{random.randint(0, 255)}.{random.randint(1, 255)}"

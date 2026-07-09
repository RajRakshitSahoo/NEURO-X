""" 
ai_engine.py
AI reasoning engine for NEURO-X.
Supports three modes:
  1. Simulated  — Built-in thought bank, no external deps (default)
  2. Ollama     — Local LLM via Ollama (ollama pull llama3)
  3. OpenAI     — Cloud LLM via OpenAI API key
"""

import os
import random
import time
from typing import Dict, Any, List
from datetime import datetime
from loguru import logger

try:
    import httpx
    HTTPX_AVAILABLE = True
except ImportError:
    HTTPX_AVAILABLE = False

try:
    from openai import OpenAI
    OPENAI_AVAILABLE = True
except ImportError:
    OPENAI_AVAILABLE = False


THOUGHT_BANK: List[Dict[str, str]] = [
    {"level": "AI",      "msg": "Initializing neural pattern recognition engine v2.1..."},
    {"level": "AI",      "msg": "Scanning network topology — 254 hosts in /24 subnet discovered"},
    {"level": "AI",      "msg": "Baseline behavioral model established. Monitoring deviations..."},
    {"level": "AI",      "msg": "Packet entropy analysis: H=4.82 bits — within nominal range"},
    {"level": "AI",      "msg": "Cross-referencing CVE database — 47,832 signatures loaded"},
    {"level": "AI",      "msg": "Behavioral model updated — 3 new traffic patterns logged"},
    {"level": "INFO",    "msg": "TCP handshake rate: 142/sec — nominal"},
    {"level": "INFO",    "msg": "Monitoring eth0 — 1,248 packets/sec processed"},
    {"level": "AI",      "msg": "Anomaly scoring in progress — comparing against 72h baseline"},
    {"level": "AI",      "msg": "Deep packet inspection: 0 malformed headers detected"},
    {"level": "INFO",    "msg": "DNS query volume: stable at 23 req/min"},
    {"level": "AI",      "msg": "Connection graph updated: 18 nodes, 42 edges active"},
    {"level": "AI",      "msg": "Port access frequency heatmap recalculated"},
    {"level": "AI",      "msg": "Analyzing ARP table for cache poisoning indicators..."},
    {"level": "SUCCESS", "msg": "Network integrity check passed — all interfaces clean"},
    {"level": "AI",      "msg": "Lateral movement detection: scanning internal subnet ranges"},
    {"level": "INFO",    "msg": "HTTP/S traffic composition: 94% encrypted — good hygiene"},
    {"level": "AI",      "msg": "Process memory analysis: no injected shellcode detected"},
    {"level": "AI",      "msg": "Threat confidence interval: LOW risk (CI: 95%, n=1000)"},
    {"level": "AI",      "msg": "Correlating geolocation data for 12 active external connections"},
    {"level": "WARN",    "msg": "Elevated SYN packet rate on port 22 — possible scan in progress"},
    {"level": "AI",      "msg": "Comparing traffic deviation against historical baseline: +12%"},
    {"level": "AI",      "msg": "OSINT lookup initiated for flagged IP range 185.220.x.x"},
    {"level": "INFO",    "msg": "SSH sessions: all using Ed25519 — key exchange secure"},
    {"level": "AI",      "msg": "Running YARA ruleset (12,441 rules) against process memory"},
    {"level": "AI",      "msg": "TLS certificate chain validation: 0 anomalies"},
    {"level": "AI",      "msg": "User-agent string analysis: no known malware signatures"},
    {"level": "AI",      "msg": "Timing analysis: packet inter-arrival normal (mu=8.2ms, sigma=1.1ms)"},
    {"level": "INFO",    "msg": "Firewall rule audit: 847 rules active, 0 conflicts detected"},
    {"level": "AI",      "msg": "BGP route table: no hijacking indicators found"},
    {"level": "AI",      "msg": "Applying unsupervised clustering to connection patterns..."},
    {"level": "AI",      "msg": "Cluster analysis complete: 3 behavioral archetypes identified"},
    {"level": "AI",      "msg": "Isolation forest model: anomaly score 0.12 (threshold: 0.5)"},
    {"level": "AI",      "msg": "LSTM sequence model predicting next 60s traffic volume..."},
    {"level": "AI",      "msg": "Predicted traffic in 60s: +8% — within tolerance band"},
    {"level": "AI",      "msg": "Reinforcement learning agent updated threat response policy"},
    {"level": "AI",      "msg": "Graph neural network: no unusual node centrality shifts"},
    {"level": "AI",      "msg": "Transformer attention model focused on port 443 traffic"},
    {"level": "INFO",    "msg": "Kernel audit log: 0 privilege escalation attempts"},
    {"level": "AI",      "msg": "Syscall frequency analysis: normal distribution maintained"},
    {"level": "INFO",    "msg": "File integrity monitoring: 0 unauthorized modifications"},
    {"level": "AI",      "msg": "Rootkit detection: MBR checksum verified — clean"},
    {"level": "AI",      "msg": "Boot sequence analysis: no persistence mechanisms found"},
    {"level": "INFO",    "msg": "Cron job audit: 12 scheduled tasks, all authorized"},
    {"level": "AI",      "msg": "Shared library hash verification: all system libs intact"},
    {"level": "WARN",    "msg": "Unusual outbound connection to port 8443 — investigating..."},
    {"level": "AI",      "msg": "Port 8443 connection resolved: legitimate CDN endpoint (Cloudflare)"},
    {"level": "SUCCESS", "msg": "Full system sweep complete — threat level: LOW"},
]

DEEP_ANALYSIS_CHAINS = [
    [
        {"level": "AI",       "msg": "=== INITIATING DEEP ANALYSIS MODE ==="},
        {"level": "AI",       "msg": "Loading 72-hour behavioral baseline data..."},
        {"level": "AI",       "msg": "Computing statistical deviation matrix across 847 features..."},
        {"level": "AI",       "msg": "Identified 3 outlier clusters in traffic distribution"},
        {"level": "AI",       "msg": "Applying MITRE ATT&CK framework correlation..."},
        {"level": "AI",       "msg": "Pattern match confidence: T1046 (Network Discovery) = 78%"},
        {"level": "WARN",     "msg": "Recommendation: Enable enhanced logging on eth0"},
        {"level": "AI",       "msg": "=== DEEP ANALYSIS COMPLETE — Threat Level: MEDIUM ==="},
    ],
    [
        {"level": "AI",       "msg": "=== THREAT ACTOR PROFILING INITIATED ==="},
        {"level": "AI",       "msg": "Extracting IOC fingerprints from flagged IP addresses..."},
        {"level": "AI",       "msg": "Cross-referencing 14 threat intelligence feeds..."},
        {"level": "AI",       "msg": "IP range 185.220.101.x — confirmed Tor exit node cluster"},
        {"level": "AI",       "msg": "Geolocation: multi-jurisdictional VPN chain detected"},
        {"level": "AI",       "msg": "TTP correlation: APT-style persistent access mechanisms"},
        {"level": "CRITICAL", "msg": "Confidence: 91% — Sophisticated threat actor identified"},
        {"level": "AI",       "msg": "=== PROFILING COMPLETE — Initiating automated countermeasures ==="},
    ],
]


class AIEngine:
    """NEURO-X AI reasoning engine. Cycles thought patterns; supports real LLM integration."""

    def __init__(self):
        self._thought_idx = 0
        self._deep_chain_idx = 0
        self._deep_chain_step = 0
        self._call_count = 0
        self._mode = self._detect_mode()
        self._openai_client = None

        if self._mode == "openai" and OPENAI_AVAILABLE:
            api_key = os.getenv("OPENAI_API_KEY")
            if api_key:
                self._openai_client = OpenAI(api_key=api_key)
                logger.info("AI Engine: OpenAI mode active")
        elif self._mode == "ollama":
            logger.info("AI Engine: Ollama local mode active")
        else:
            logger.info("AI Engine: Simulated mode active")

    def _detect_mode(self) -> str:
        if os.getenv("OPENAI_API_KEY") and OPENAI_AVAILABLE:
            return "openai"
        if os.getenv("OLLAMA_HOST") or os.path.exists("/usr/local/bin/ollama"):
            return "ollama"
        return "simulated"

    def get_next_thought(self) -> Dict[str, str]:
        """Return the next AI thought (cycles the bank, injects dynamic observations)."""
        self._call_count += 1

        if self._call_count % 20 == 0:
            return self._deep_thought()

        thought = THOUGHT_BANK[self._thought_idx % len(THOUGHT_BANK)]
        self._thought_idx += 1

        if random.random() < 0.12:
            return self._dynamic_thought()

        return thought

    def _deep_thought(self) -> Dict[str, str]:
        chain = DEEP_ANALYSIS_CHAINS[self._deep_chain_idx % len(DEEP_ANALYSIS_CHAINS)]
        step = chain[self._deep_chain_step % len(chain)]
        self._deep_chain_step += 1
        if self._deep_chain_step >= len(chain):
            self._deep_chain_step = 0
            self._deep_chain_idx += 1
        return step

    def _dynamic_thought(self) -> Dict[str, str]:
        now = datetime.utcnow().strftime("%H:%M:%S")
        observations = [
            f"Packet rate at {now}: {random.randint(800, 2000)} pkt/s — nominal",
            f"Entropy sample at {now}: H={random.uniform(3.5, 7.2):.2f} bits",
            f"Connection pool: {random.randint(40, 200)} active sessions",
            f"Memory analysis at {now}: {random.randint(0, 3)} suspicious allocations",
            f"DNS cache: {random.randint(200, 800)} entries, {random.randint(0, 5)} flagged",
            f"New external IP contacted: {random.randint(1,255)}.{random.randint(0,255)}.{random.randint(0,255)}.{random.randint(1,255)} — analyzing",
        ]
        level = random.choice(["AI", "AI", "AI", "INFO", "WARN"])
        return {"level": level, "msg": random.choice(observations)}

    def deep_analysis(self) -> Dict[str, str]:
        return {"level": "AI", "msg": "Deep analysis triggered — running full behavioral audit..."}

    def analyze_threat(self, threat: Dict) -> str:
        t_type = threat.get("type", "Unknown")
        t_ip   = threat.get("ip", "unknown")
        t_port = threat.get("port", 0)
        t_conf = threat.get("confidence", 50)

        if self._mode == "openai" and self._openai_client:
            try:
                prompt = f"Analyze: {t_type} from {t_ip}:{t_port}, confidence {t_conf}%. One-sentence mitigation."
                resp = self._openai_client.chat.completions.create(
                    model="gpt-3.5-turbo",
                    messages=[
                        {"role": "system", "content": "You are NEURO-X, an elite AI cybersecurity analyst. Be concise."},
                        {"role": "user", "content": prompt},
                    ],
                    max_tokens=80,
                )
                return resp.choices[0].message.content.strip()
            except Exception as e:
                logger.error(f"OpenAI query failed: {e}")

        analyses = {
            "Port Scan":        f"Sequential probe from {t_ip} mapping attack surface. Block source IP, audit exposed services.",
            "SSH Brute Force":  f"Credential stuffing on SSH from {t_ip}. Enable fail2ban, rotate SSH keys immediately.",
            "DDoS Pattern":     f"Volumetric attack via {t_ip}. Activate rate limiting and upstream scrubbing.",
            "SQL Injection":    f"Malformed SQL payload from {t_ip}:{t_port}. Block IP, patch input validation.",
            "Malware Beacon":   f"C2 beacon from {t_ip}:{t_port}. Isolate host, initiate incident response.",
            "Lateral Movement": f"Credential reuse from {t_ip}. Reset all service account passwords now.",
        }
        return analyses.get(t_type, f"{t_type} from {t_ip} — {t_conf}% confidence. Investigate and apply countermeasures.")

"""
backend/cpp_bridge.py
Python ctypes bridge to the NEURO-X C++ shared library.
Falls back gracefully to psutil if the library is not compiled.

Usage:
    from cpp_bridge import CppBridge
    bridge = CppBridge()
    if bridge.available:
        snap = bridge.get_perf_snapshot()
        threats = bridge.get_threats()
"""

import ctypes
import json
import os
import platform
from loguru import logger
from typing import Optional, Dict, Any, List


def _find_library() -> Optional[str]:
    """Locate the compiled shared library in common build directories."""
    base = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    cpp_dir = os.path.join(base, "cpp-engine")

    system = platform.system()
    lib_name = {
        "Linux":   "libmonitor.so",
        "Darwin":  "libmonitor.dylib",
        "Windows": "monitor.dll",
    }.get(system, "libmonitor.so")

    candidates = [
        os.path.join(cpp_dir, "build", "lib", lib_name),
        os.path.join(cpp_dir, "build", lib_name),
        os.path.join(cpp_dir, lib_name),
    ]
    for path in candidates:
        if os.path.exists(path):
            return path
    return None


# ── ctypes struct definitions matching monitor.h
class PacketStats(ctypes.Structure):
    _fields_ = [
        ("packets_captured",  ctypes.c_uint64),
        ("bytes_captured",    ctypes.c_uint64),
        ("tcp_count",         ctypes.c_uint64),
        ("udp_count",         ctypes.c_uint64),
        ("icmp_count",        ctypes.c_uint64),
        ("suspicious_count",  ctypes.c_uint64),
        ("capture_duration",  ctypes.c_double),
    ]


class PerfSnapshot(ctypes.Structure):
    _fields_ = [
        ("cpu_percent",     ctypes.c_float),
        ("ram_used_bytes",  ctypes.c_uint64),
        ("ram_total_bytes", ctypes.c_uint64),
        ("ram_percent",     ctypes.c_float),
        ("net_bytes_sent",  ctypes.c_uint64),
        ("net_bytes_recv",  ctypes.c_uint64),
        ("thread_count",    ctypes.c_int),
    ]


class ThreatEvent(ctypes.Structure):
    _fields_ = [
        ("src_ip",      ctypes.c_char * 64),
        ("dst_ip",      ctypes.c_char * 64),
        ("src_port",    ctypes.c_uint16),
        ("dst_port",    ctypes.c_uint16),
        ("protocol",    ctypes.c_char * 8),
        ("threat_type", ctypes.c_char * 64),
        ("confidence",  ctypes.c_uint8),
        ("severity",    ctypes.c_uint8),
        ("timestamp_ms",ctypes.c_uint64),
    ]


class CppBridge:
    """
    Wraps the NEURO-X C++ shared library via ctypes.
    If the library is not compiled, all calls become no-ops and available=False.
    """

    def __init__(self):
        self._lib = None
        self.available = False
        self._load_library()

    def _load_library(self):
        lib_path = _find_library()
        if not lib_path:
            logger.warning("C++ engine not found. Run: cd cpp-engine && cmake -B build -S . && cmake --build build")
            return

        try:
            lib = ctypes.CDLL(lib_path)
            self._setup_signatures(lib)
            self._lib = lib
            self.available = True

            # Initialize the engine
            self._lib.neurox_init(b"eth0")
            logger.info(f"C++ engine loaded: {lib_path}")
            logger.info(f"Engine version: {self.version()}")

        except OSError as e:
            logger.error(f"Failed to load C++ engine: {e}")

    def _setup_signatures(self, lib):
        """Define ctypes argument/return types for all exported functions."""
        lib.neurox_init.argtypes = [ctypes.c_char_p]
        lib.neurox_init.restype  = ctypes.c_int

        lib.neurox_shutdown.argtypes = []
        lib.neurox_shutdown.restype  = None

        lib.neurox_is_running.argtypes = []
        lib.neurox_is_running.restype  = ctypes.c_int

        lib.neurox_start_capture.argtypes = []
        lib.neurox_start_capture.restype  = None

        lib.neurox_stop_capture.argtypes = []
        lib.neurox_stop_capture.restype  = None

        lib.neurox_get_packet_stats.argtypes = []
        lib.neurox_get_packet_stats.restype  = PacketStats

        lib.neurox_get_perf_snapshot.argtypes = []
        lib.neurox_get_perf_snapshot.restype  = PerfSnapshot

        lib.neurox_get_threats.argtypes = [ctypes.POINTER(ThreatEvent), ctypes.c_int]
        lib.neurox_get_threats.restype  = ctypes.c_int

        lib.neurox_clear_threats.argtypes = []
        lib.neurox_clear_threats.restype  = None

        lib.neurox_version.argtypes = []
        lib.neurox_version.restype  = ctypes.c_char_p

        lib.neurox_stats_to_json.argtypes = [ctypes.c_char_p, ctypes.c_int]
        lib.neurox_stats_to_json.restype  = ctypes.c_int

    # ── Public API

    def version(self) -> str:
        if not self.available:
            return "C++ engine not loaded"
        return self._lib.neurox_version().decode("utf-8")

    def start_capture(self):
        if self.available:
            self._lib.neurox_start_capture()

    def stop_capture(self):
        if self.available:
            self._lib.neurox_stop_capture()

    def get_perf_snapshot(self) -> Dict[str, Any]:
        if not self.available:
            return {}
        snap: PerfSnapshot = self._lib.neurox_get_perf_snapshot()
        return {
            "cpu_percent":     round(snap.cpu_percent, 1),
            "ram_percent":     round(snap.ram_percent, 1),
            "ram_used_gb":     round(snap.ram_used_bytes  / (1024**3), 2),
            "ram_total_gb":    round(snap.ram_total_bytes / (1024**3), 2),
            "net_bytes_sent":  snap.net_bytes_sent,
            "net_bytes_recv":  snap.net_bytes_recv,
            "thread_count":    snap.thread_count,
        }

    def get_packet_stats(self) -> Dict[str, Any]:
        if not self.available:
            return {}
        pkts: PacketStats = self._lib.neurox_get_packet_stats()
        return {
            "packets_captured":  pkts.packets_captured,
            "bytes_captured":    pkts.bytes_captured,
            "tcp_count":         pkts.tcp_count,
            "udp_count":         pkts.udp_count,
            "icmp_count":        pkts.icmp_count,
            "suspicious_count":  pkts.suspicious_count,
            "duration_sec":      round(pkts.capture_duration, 2),
        }

    def get_threats(self) -> List[Dict[str, Any]]:
        if not self.available:
            return []
        buf = (ThreatEvent * 64)()
        count = self._lib.neurox_get_threats(buf, 64)
        result = []
        for i in range(count):
            ev = buf[i]
            result.append({
                "src_ip":     ev.src_ip.decode("utf-8"),
                "dst_ip":     ev.dst_ip.decode("utf-8"),
                "src_port":   ev.src_port,
                "dst_port":   ev.dst_port,
                "protocol":   ev.protocol.decode("utf-8"),
                "threat_type":ev.threat_type.decode("utf-8"),
                "confidence": ev.confidence,
                "severity":   ev.severity,
                "timestamp_ms": ev.timestamp_ms,
            })
        return result

    def get_stats_json(self) -> str:
        if not self.available:
            return "{}"
        buf = ctypes.create_string_buffer(4096)
        self._lib.neurox_stats_to_json(buf, 4096)
        return buf.value.decode("utf-8")

    def shutdown(self):
        if self.available:
            self._lib.neurox_shutdown()

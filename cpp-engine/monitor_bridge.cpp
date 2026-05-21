// monitor_bridge.cpp
// NEURO-X C++ Engine — Python ctypes bridge.
// This file re-exports all symbols and adds Python-friendly helpers.
// The shared library exposes the full C API from monitor.h.

#include "include/monitor.h"
#include <cstdio>
#include <cstring>

// ── neurox_version is defined here so only one TU owns it
const char* neurox_version() {
    return "NEURO-X C++ Engine v2.1.0 (ctypes bridge)";
}

// ── Python helper: fill a pre-allocated JSON string with current stats
// Returns number of bytes written (excluding null terminator)
extern "C"
int neurox_stats_to_json(char* out_buf, int buf_len) {
    PerfSnapshot snap = neurox_get_perf_snapshot();
    PacketStats  pkts = neurox_get_packet_stats();

    int written = snprintf(out_buf, buf_len,
        "{"
        "\"cpu_percent\":%.1f,"
        "\"ram_percent\":%.1f,"
        "\"ram_used_gb\":%.2f,"
        "\"ram_total_gb\":%.2f,"
        "\"net_bytes_sent\":%llu,"
        "\"net_bytes_recv\":%llu,"
        "\"thread_count\":%d,"
        "\"packets_captured\":%llu,"
        "\"bytes_captured\":%llu,"
        "\"tcp_count\":%llu,"
        "\"udp_count\":%llu,"
        "\"suspicious_count\":%llu,"
        "\"engine_version\":\"%s\""
        "}",
        snap.cpu_percent,
        snap.ram_percent,
        (double)snap.ram_used_bytes  / (1024.0*1024.0*1024.0),
        (double)snap.ram_total_bytes / (1024.0*1024.0*1024.0),
        (unsigned long long)snap.net_bytes_sent,
        (unsigned long long)snap.net_bytes_recv,
        snap.thread_count,
        (unsigned long long)pkts.packets_captured,
        (unsigned long long)pkts.bytes_captured,
        (unsigned long long)pkts.tcp_count,
        (unsigned long long)pkts.udp_count,
        (unsigned long long)pkts.suspicious_count,
        neurox_version()
    );
    return written;
}

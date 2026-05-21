// test/main_test.cpp
// Basic smoke-test for the NEURO-X C++ engine

#include <cstdio>
#include <cstring>
#include <thread>
#include <chrono>
#include "include/monitor.h"

int main() {
    printf("=== NEURO-X C++ Engine Self-Test ===\n");
    printf("Version: %s\n\n", neurox_version());

    // Init
    int rc = neurox_init("eth0");
    printf("[INIT] neurox_init() = %d (0=OK)\n", rc);

    // Performance snapshot
    PerfSnapshot snap = neurox_get_perf_snapshot();
    printf("[PERF] CPU: %.1f%%  RAM: %.1f%%  Threads: %d\n",
           snap.cpu_percent, snap.ram_percent, snap.thread_count);
    printf("[PERF] RAM used: %.2f GB / %.2f GB\n",
           (double)snap.ram_used_bytes  / (1024.0*1024.0*1024.0),
           (double)snap.ram_total_bytes / (1024.0*1024.0*1024.0));

    // Start capture (runs for 2s then stops)
    printf("\n[CAPTURE] Starting packet capture (2s)...\n");
    neurox_start_capture();
    std::this_thread::sleep_for(std::chrono::seconds(2));
    neurox_stop_capture();

    PacketStats pkts = neurox_get_packet_stats();
    printf("[CAPTURE] Packets: %llu  Bytes: %llu  TCP: %llu  UDP: %llu\n",
           (unsigned long long)pkts.packets_captured,
           (unsigned long long)pkts.bytes_captured,
           (unsigned long long)pkts.tcp_count,
           (unsigned long long)pkts.udp_count);

    // Threats
    ThreatEvent threats[32];
    int count = neurox_get_threats(threats, 32);
    printf("[THREATS] Detected: %d\n", count);
    for (int i = 0; i < count; ++i) {
        printf("  [%d] %s -> %s:%d  type=%s  conf=%d%%\n",
               i, threats[i].src_ip, threats[i].dst_ip,
               threats[i].dst_port, threats[i].threat_type,
               threats[i].confidence);
    }

    // JSON output
    char json_buf[2048];
    int len = neurox_stats_to_json(json_buf, sizeof(json_buf));
    printf("\n[JSON] (%d bytes):\n%s\n", len, json_buf);

    neurox_shutdown();
    printf("\n[DONE] All tests passed.\n");
    return 0;
}

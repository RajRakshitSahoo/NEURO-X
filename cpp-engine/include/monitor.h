#pragma once
// include/monitor.h  —  NEURO-X C++ Engine public API (ctypes-compatible)

#include <stdint.h>

#ifdef __cplusplus
extern "C" {
#endif

typedef struct {
    uint64_t packets_captured;
    uint64_t bytes_captured;
    uint64_t tcp_count;
    uint64_t udp_count;
    uint64_t icmp_count;
    uint64_t suspicious_count;
    double   capture_duration_sec;
} PacketStats;

typedef struct {
    float    cpu_percent;
    uint64_t ram_used_bytes;
    uint64_t ram_total_bytes;
    float    ram_percent;
    uint64_t net_bytes_sent;
    uint64_t net_bytes_recv;
    int      thread_count;
} PerfSnapshot;

typedef struct {
    char     src_ip[64];
    char     dst_ip[64];
    uint16_t src_port;
    uint16_t dst_port;
    char     protocol[8];
    char     threat_type[64];
    uint8_t  confidence;
    uint8_t  severity;
    uint64_t timestamp_ms;
} ThreatEvent;

int         neurox_init(const char* interface_name);
void        neurox_shutdown(void);
int         neurox_is_running(void);
void        neurox_start_capture(void);
void        neurox_stop_capture(void);
PacketStats  neurox_get_packet_stats(void);
PerfSnapshot neurox_get_perf_snapshot(void);
int         neurox_get_threats(ThreatEvent* out_events, int max_events);
void        neurox_clear_threats(void);
const char* neurox_version(void);

#ifdef __cplusplus
}
#endif

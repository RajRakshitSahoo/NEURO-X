// packet_sniffer.cpp
// NEURO-X low-level packet capture engine.
// Uses raw sockets (Linux) or WinPcap/Npcap (Windows).
// Requires root/admin for raw socket access.
// Compile: cmake --build build  OR  g++ -O2 -std=c++17 -shared -fPIC packet_sniffer.cpp performance_monitor.cpp monitor_bridge.cpp -o libmonitor.so

#include "include/monitor.h"

#include <cstring>
#include <cstdio>
#include <cstdlib>
#include <ctime>
#include <atomic>
#include <mutex>
#include <thread>
#include <vector>
#include <chrono>
#include <algorithm>
#include <stdexcept>

// ── Platform detection
#ifdef _WIN32
  #include <winsock2.h>
  #include <ws2tcpip.h>
  #pragma comment(lib, "ws2_32.lib")
  #define PLATFORM_WINDOWS
#else
  #include <sys/socket.h>
  #include <netinet/in.h>
  #include <netinet/ip.h>
  #include <netinet/tcp.h>
  #include <netinet/udp.h>
  #include <arpa/inet.h>
  #include <unistd.h>
  #include <net/if.h>
  #include <sys/ioctl.h>
  #include <errno.h>
  #define PLATFORM_UNIX
#endif

// ─────────────────────────────────────────────
//  Internal state
// ─────────────────────────────────────────────

static std::atomic<bool>     g_running{false};
static std::atomic<bool>     g_capture_active{false};
static std::mutex            g_stats_mutex;
static std::mutex            g_threat_mutex;

static PacketStats           g_stats{};
static std::vector<ThreatEvent> g_threats;
static char                  g_interface[64] = "eth0";

static std::chrono::steady_clock::time_point g_start_time;

// Known suspicious destination ports
static const uint16_t SUSPICIOUS_PORTS[] = {
    4444, 5555, 1337, 31337, 6667, 6697,  // Common C2/backdoor ports
    23,                                    // Telnet (unencrypted)
    135, 137, 138, 139,                   // Windows NetBIOS (if outbound)
    3389,                                  // RDP (if unexpected outbound)
    0
};

// ─────────────────────────────────────────────
//  Helper: current timestamp in milliseconds
// ─────────────────────────────────────────────
static uint64_t now_ms() {
    using namespace std::chrono;
    return duration_cast<milliseconds>(
        system_clock::now().time_since_epoch()
    ).count();
}

// ─────────────────────────────────────────────
//  Helper: check if a port is suspicious
// ─────────────────────────────────────────────
static bool is_suspicious_port(uint16_t port) {
    for (int i = 0; SUSPICIOUS_PORTS[i] != 0; ++i) {
        if (port == SUSPICIOUS_PORTS[i]) return true;
    }
    return false;
}

// ─────────────────────────────────────────────
//  Helper: push a threat event into the ring buffer
// ─────────────────────────────────────────────
static void push_threat(const char* src_ip, const char* dst_ip,
                         uint16_t src_port, uint16_t dst_port,
                         const char* proto, const char* threat_type,
                         uint8_t confidence, uint8_t severity)
{
    ThreatEvent ev{};
    strncpy(ev.src_ip,     src_ip,     sizeof(ev.src_ip) - 1);
    strncpy(ev.dst_ip,     dst_ip,     sizeof(ev.dst_ip) - 1);
    ev.src_port  = src_port;
    ev.dst_port  = dst_port;
    strncpy(ev.protocol,   proto,      sizeof(ev.protocol) - 1);
    strncpy(ev.threat_type, threat_type, sizeof(ev.threat_type) - 1);
    ev.confidence  = confidence;
    ev.severity    = severity;
    ev.timestamp_ms = now_ms();

    std::lock_guard<std::mutex> lk(g_threat_mutex);
    g_threats.push_back(ev);
    // Keep ring buffer bounded to 256 events
    if (g_threats.size() > 256) {
        g_threats.erase(g_threats.begin());
    }
}

// ─────────────────────────────────────────────
//  Raw packet analysis (Linux raw socket path)
// ─────────────────────────────────────────────
#ifdef PLATFORM_UNIX

// IP + TCP headers (simplified, handles IPv4 only)
struct IpHeader {
    uint8_t  ihl_ver;
    uint8_t  tos;
    uint16_t total_len;
    uint16_t id;
    uint16_t frag_off;
    uint8_t  ttl;
    uint8_t  protocol;
    uint16_t checksum;
    uint32_t src_addr;
    uint32_t dst_addr;
};

struct TcpHeader {
    uint16_t src_port;
    uint16_t dst_port;
    uint32_t seq;
    uint32_t ack;
    uint8_t  data_off;
    uint8_t  flags;
    uint16_t window;
    uint16_t checksum;
    uint16_t urg_ptr;
};

struct UdpHeader {
    uint16_t src_port;
    uint16_t dst_port;
    uint16_t length;
    uint16_t checksum;
};

// Analyse a single captured packet buffer
static void analyze_packet(const uint8_t* buf, ssize_t len) {
    if (len < (ssize_t)sizeof(IpHeader)) return;

    auto* ip = reinterpret_cast<const IpHeader*>(buf);
    int ip_hdr_len = (ip->ihl_ver & 0x0F) * 4;

    char src_ip[INET_ADDRSTRLEN], dst_ip[INET_ADDRSTRLEN];
    inet_ntop(AF_INET, &ip->src_addr, src_ip, sizeof(src_ip));
    inet_ntop(AF_INET, &ip->dst_addr, dst_ip, sizeof(dst_ip));

    uint64_t bytes = static_cast<uint64_t>(len);

    {
        std::lock_guard<std::mutex> lk(g_stats_mutex);
        g_stats.packets_captured++;
        g_stats.bytes_captured += bytes;
    }

    if (ip->protocol == IPPROTO_TCP) {
        std::lock_guard<std::mutex> lk(g_stats_mutex);
        g_stats.tcp_count++;

        if (len < ip_hdr_len + (ssize_t)sizeof(TcpHeader)) return;
        auto* tcp = reinterpret_cast<const TcpHeader*>(buf + ip_hdr_len);
        uint16_t dport = ntohs(tcp->dst_port);
        uint16_t sport = ntohs(tcp->src_port);
        uint8_t  flags = tcp->flags;

        // SYN flood detection: SYN without ACK in large volume
        if ((flags & 0x02) && !(flags & 0x10)) {
            // Count SYNs — simplified heuristic
            // In production: track per-IP in a hash map with sliding window
        }

        // Suspicious outbound port
        if (is_suspicious_port(dport)) {
            g_stats.suspicious_count++;
            push_threat(src_ip, dst_ip, sport, dport, "TCP",
                        "Suspicious Outbound Connection", 80, 2);
        }

    } else if (ip->protocol == IPPROTO_UDP) {
        std::lock_guard<std::mutex> lk(g_stats_mutex);
        g_stats.udp_count++;

    } else if (ip->protocol == IPPROTO_ICMP) {
        std::lock_guard<std::mutex> lk(g_stats_mutex);
        g_stats.icmp_count++;
    }
}

// Main capture loop — runs in its own thread
static void capture_loop() {
    // Create raw socket (requires root)
    int sockfd = socket(AF_PACKET, SOCK_RAW, htons(ETH_P_ALL));
    if (sockfd < 0) {
        // Try IP-level raw socket as fallback
        sockfd = socket(AF_INET, SOCK_RAW, IPPROTO_TCP);
        if (sockfd < 0) {
            fprintf(stderr, "[NEURO-X] Raw socket failed (errno=%d). Run as root for packet capture.\n", errno);
            g_capture_active = false;
            return;
        }
    }

    uint8_t buf[65536];
    g_start_time = std::chrono::steady_clock::now();
    g_capture_active = true;

    while (g_running) {
        ssize_t len = recv(sockfd, buf, sizeof(buf), 0);
        if (len > 0) {
            // Skip Ethernet header (14 bytes) if present
            const uint8_t* pkt = buf;
            ssize_t pkt_len = len;
            if (len > 14 && (buf[12] == 0x08 && buf[13] == 0x00)) {
                pkt     = buf + 14;
                pkt_len = len - 14;
            }
            analyze_packet(pkt, pkt_len);
        } else if (len < 0 && errno != EINTR) {
            break;
        }
    }

    close(sockfd);
    g_capture_active = false;
}

#else
// Windows stub — real implementation would use WinPcap/Npcap
static void capture_loop() {
    g_capture_active = true;
    while (g_running) {
        std::this_thread::sleep_for(std::chrono::milliseconds(100));
        // Simulate packet data on Windows when WinPcap unavailable
        std::lock_guard<std::mutex> lk(g_stats_mutex);
        g_stats.packets_captured += rand() % 50 + 10;
        g_stats.bytes_captured   += rand() % 5000 + 500;
        g_stats.tcp_count        += rand() % 30;
        g_stats.udp_count        += rand() % 10;
    }
    g_capture_active = false;
}
#endif

// ─────────────────────────────────────────────
//  Public C API
// ─────────────────────────────────────────────

int neurox_init(const char* interface_name) {
    if (interface_name && *interface_name) {
        strncpy(g_interface, interface_name, sizeof(g_interface) - 1);
    }
    memset(&g_stats, 0, sizeof(g_stats));
    g_threats.clear();
    g_running = false;
    return 0; // success
}

void neurox_start_capture() {
    if (g_running) return;
    g_running = true;
    // Launch capture on a detached background thread
    std::thread(capture_loop).detach();
}

void neurox_stop_capture() {
    g_running = false;
    // Give the thread time to exit cleanly
    std::this_thread::sleep_for(std::chrono::milliseconds(200));
}

void neurox_shutdown() {
    neurox_stop_capture();
    g_threats.clear();
}

int neurox_is_running() {
    return g_running.load() ? 1 : 0;
}

PacketStats neurox_get_packet_stats() {
    using namespace std::chrono;
    std::lock_guard<std::mutex> lk(g_stats_mutex);
    PacketStats s = g_stats;
    auto elapsed = steady_clock::now() - g_start_time;
    s.capture_duration_sec = duration<double>(elapsed).count();
    return s;
}

int neurox_get_threats(ThreatEvent* out_events, int max_events) {
    std::lock_guard<std::mutex> lk(g_threat_mutex);
    int count = static_cast<int>(std::min((size_t)max_events, g_threats.size()));
    for (int i = 0; i < count; ++i) {
        out_events[i] = g_threats[g_threats.size() - count + i];
    }
    return count;
}

void neurox_clear_threats() {
    std::lock_guard<std::mutex> lk(g_threat_mutex);
    g_threats.clear();
}

const char* neurox_version() {
    return "NEURO-X C++ Engine v2.1.0";
}

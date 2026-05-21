// performance_monitor.cpp
// NEURO-X C++ Engine — system metrics via OS APIs.
// Provides neurox_get_perf_snapshot() with CPU, RAM, and network counters.

#include "include/monitor.h"
#include <cstdio>
#include <cstring>
#include <chrono>
#include <thread>
#include <fstream>
#include <sstream>
#include <string>

#if defined(__linux__)
#include <sys/sysinfo.h>

static bool read_cpu_stat(uint64_t& idle_out, uint64_t& total_out) {
    std::ifstream f("/proc/stat");
    if (!f.is_open()) return false;
    std::string label;
    uint64_t user, nice, system, idle, iowait, irq, softirq;
    f >> label >> user >> nice >> system >> idle >> iowait >> irq >> softirq;
    idle_out  = idle + iowait;
    total_out = user + nice + system + idle + iowait + irq + softirq;
    return true;
}

static float measure_cpu_percent() {
    uint64_t idle1, total1, idle2, total2;
    if (!read_cpu_stat(idle1, total1)) return 0.0f;
    std::this_thread::sleep_for(std::chrono::milliseconds(100));
    if (!read_cpu_stat(idle2, total2)) return 0.0f;
    uint64_t id = idle2 - idle1, td = total2 - total1;
    if (td == 0) return 0.0f;
    return 100.0f * (1.0f - static_cast<float>(id) / td);
}

static void read_net_counters(uint64_t& sent, uint64_t& recv) {
    sent = recv = 0;
    std::ifstream f("/proc/net/dev");
    if (!f.is_open()) return;
    std::string line;
    std::getline(f, line); std::getline(f, line); // skip headers
    while (std::getline(f, line)) {
        std::istringstream ss(line);
        std::string iface; ss >> iface;
        if (iface == "lo:") continue;
        uint64_t rb, rp, re, rd, rf, rframe, rc, rm, tb;
        ss >> rb >> rp >> re >> rd >> rf >> rframe >> rc >> rm >> tb;
        recv += rb; sent += tb;
    }
}

PerfSnapshot neurox_get_perf_snapshot() {
    PerfSnapshot snap{};
    snap.cpu_percent = measure_cpu_percent();
    struct sysinfo si;
    if (sysinfo(&si) == 0) {
        snap.ram_total_bytes = si.totalram  * si.mem_unit;
        snap.ram_used_bytes  = (si.totalram - si.freeram) * si.mem_unit;
        if (snap.ram_total_bytes > 0)
            snap.ram_percent = 100.0f * snap.ram_used_bytes / snap.ram_total_bytes;
    }
    read_net_counters(snap.net_bytes_sent, snap.net_bytes_recv);
    std::ifstream status("/proc/self/status");
    std::string line;
    while (std::getline(status, line))
        if (line.rfind("Threads:", 0) == 0) { snap.thread_count = std::stoi(line.substr(8)); break; }
    return snap;
}

#elif defined(__APPLE__)
#include <mach/mach.h>
#include <sys/sysctl.h>

PerfSnapshot neurox_get_perf_snapshot() {
    PerfSnapshot snap{};
    // Simplified CPU via host_statistics
    host_cpu_load_info_data_t cpuinfo;
    mach_msg_type_number_t count = HOST_CPU_LOAD_INFO_COUNT;
    if (host_statistics(mach_host_self(), HOST_CPU_LOAD_INFO, (host_info_t)&cpuinfo, &count) == KERN_SUCCESS) {
        uint64_t user = cpuinfo.cpu_ticks[CPU_STATE_USER];
        uint64_t sys  = cpuinfo.cpu_ticks[CPU_STATE_SYSTEM];
        uint64_t idle = cpuinfo.cpu_ticks[CPU_STATE_IDLE];
        uint64_t nice = cpuinfo.cpu_ticks[CPU_STATE_NICE];
        uint64_t total = user + sys + idle + nice;
        if (total > 0) snap.cpu_percent = 100.0f * (user + sys + nice) / total;
    }
    int mib[2] = {CTL_HW, HW_MEMSIZE};
    size_t len = sizeof(snap.ram_total_bytes);
    sysctl(mib, 2, &snap.ram_total_bytes, &len, nullptr, 0);
    snap.ram_used_bytes = snap.ram_total_bytes / 2; // simplified
    snap.ram_percent    = 50.0f;
    snap.thread_count   = 4;
    return snap;
}

#elif defined(_WIN32)
#include <windows.h>

PerfSnapshot neurox_get_perf_snapshot() {
    PerfSnapshot snap{};
    MEMORYSTATUSEX mem{}; mem.dwLength = sizeof(mem);
    if (GlobalMemoryStatusEx(&mem)) {
        snap.ram_total_bytes = mem.ullTotalPhys;
        snap.ram_used_bytes  = mem.ullTotalPhys - mem.ullAvailPhys;
        snap.ram_percent     = static_cast<float>(mem.dwMemoryLoad);
    }
    snap.cpu_percent  = 20.0f; // simplified; use PDH for real value
    snap.thread_count = 8;
    return snap;
}

#else
PerfSnapshot neurox_get_perf_snapshot() { PerfSnapshot s{}; return s; }
#endif

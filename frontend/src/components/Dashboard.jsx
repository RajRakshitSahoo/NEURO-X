// components/Dashboard.jsx
// Main overview dashboard with stat cards, charts, threat feed, and AI status

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import {
  LineChart, Line, AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, RadialBarChart, RadialBar,
} from 'recharts'

// ── Stat card
function StatCard({ label, value, unit, max = 100, color = '#00ff41', icon, sublabel }) {
  const pct = Math.min((value / max) * 100, 100)
  const isHigh = pct > 80
  const isMed = pct > 60

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`glass-card p-4 relative overflow-hidden border ${isHigh ? 'border-red-900/60' : isMed ? 'border-yellow-900/40' : 'border-cyber-border'}`}
    >
      {/* Background fill bar */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-green-950">
        <motion.div
          className="h-full"
          style={{ background: isHigh ? '#ff0040' : isMed ? '#ffd700' : color }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>

      <div className="flex items-start justify-between mb-2">
        <span className="text-green-700 text-lg">{icon}</span>
        <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded-sm border ${isHigh ? 'border-red-900/50 text-red-400' : 'border-green-900/40 text-green-700'}`}>
          {pct.toFixed(0)}%
        </span>
      </div>

      <div className="text-[9px] text-green-700 font-mono tracking-widest mb-1">{label}</div>
      <div className="flex items-baseline gap-1">
        <span
          className="text-2xl font-mono font-bold"
          style={{ color: isHigh ? '#ff0040' : isMed ? '#ffd700' : color, textShadow: `0 0 12px ${color}60` }}
        >
          {value}
        </span>
        <span className="text-xs text-green-700 font-mono">{unit}</span>
      </div>
      {sublabel && <div className="text-[9px] text-green-800 font-mono mt-0.5">{sublabel}</div>}
    </motion.div>
  )
}

// ── Threat level badge
function ThreatBadge({ level }) {
  const styles = {
    CRITICAL: 'bg-red-950/60 border-red-700 text-red-400 threat-blink',
    HIGH:     'bg-orange-950/40 border-orange-700 text-orange-400',
    MEDIUM:   'bg-yellow-950/40 border-yellow-700 text-yellow-400',
    LOW:      'bg-green-950/40 border-green-800 text-green-500',
  }
  return (
    <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-sm border ${styles[level] || styles.LOW}`}>
      {level}
    </span>
  )
}

// ── Active threat card
function ThreatCard({ threat, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`p-3 rounded-sm border font-mono text-xs space-y-1.5 ${
        threat.level === 'CRITICAL' ? 'border-red-900/60 bg-red-950/10' :
        threat.level === 'HIGH' ? 'border-orange-900/40 bg-orange-950/10' :
        'border-green-900/30 bg-green-950/5'}`}
    >
      <div className="flex items-center justify-between">
        <span className="text-green-300 font-semibold">{threat.type}</span>
        <ThreatBadge level={threat.level} />
      </div>
      <div className="flex items-center gap-4 text-green-700">
        <span>⟶ {threat.ip}:{threat.port}</span>
        <span className="ml-auto text-neon-cyan">{threat.confidence}% conf</span>
      </div>
      <div className="text-green-800 text-[9px]">
        {new Date(threat.timestamp).toLocaleTimeString('en', { hour12: false })}
      </div>
      {/* Confidence bar */}
      <div className="h-0.5 bg-green-950 rounded">
        <div
          className="h-full rounded"
          style={{
            width: `${threat.confidence}%`,
            background: threat.level === 'CRITICAL' ? '#ff0040' : threat.level === 'HIGH' ? '#f97316' : '#00ff41',
          }}
        />
      </div>
    </motion.div>
  )
}

// ── Custom chart tooltip
function CyberTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-cyber-panel border border-cyber-border rounded-sm px-2 py-1.5 text-xs font-mono">
      <div className="text-green-700 mb-1">{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color }}>{p.name}: {p.value}</div>
      ))}
    </div>
  )
}

export default function Dashboard({ systemStats, threats, allThreats, networkHistory }) {
  const s = systemStats || {}
  const recentThreats = (allThreats || []).slice(-8).reverse()

  // Build chart data from history
  const chartData = networkHistory.slice(-20).map((h, i) => ({
    t: h.time || i,
    cpu: h.cpu || 0,
    ram: h.ram || 0,
    net: (h.network_in || 0) + (h.network_out || 0),
  }))

  // Threat level distribution
  const threatDist = [
    { name: 'CRITICAL', value: allThreats.filter(t => t.level === 'CRITICAL').length, fill: '#ff0040' },
    { name: 'HIGH',     value: allThreats.filter(t => t.level === 'HIGH').length,     fill: '#f97316' },
    { name: 'MEDIUM',   value: allThreats.filter(t => t.level === 'MEDIUM').length,   fill: '#ffd700' },
    { name: 'LOW',      value: allThreats.filter(t => t.level === 'LOW').length,      fill: '#00ff41' },
  ]

  return (
    <div className="h-full overflow-y-auto p-4 space-y-4">

      {/* ── Row 1: Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="CPU USAGE"    value={s.cpu || 0}         unit="%" max={100} color="#00ff41" icon="⬡" sublabel={`${s.cpu > 80 ? 'HIGH LOAD' : 'nominal'}`} />
        <StatCard label="RAM USAGE"    value={s.ram || 0}         unit="%" max={100} color="#0080ff" icon="◈" sublabel="active memory" />
        <StatCard label="NET IN"       value={s.network_in || 0}  unit="KB/s" max={1000} color="#00ffff" icon="↓" sublabel="ingress" />
        <StatCard label="NET OUT"      value={s.network_out || 0} unit="KB/s" max={500}  color="#ffd700" icon="↑" sublabel="egress" />
      </div>

      {/* ── Row 2: Network timeline + Threat meter */}
      <div className="grid grid-cols-3 gap-3">

        {/* Network chart — 2/3 width */}
        <div className="col-span-2 glass-card p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-mono text-green-600 tracking-widest">NETWORK ACTIVITY (60s)</span>
            <div className="flex gap-3 text-[9px] font-mono">
              <span className="text-neon-green">▬ CPU</span>
              <span className="text-neon-blue">▬ RAM</span>
              <span className="text-neon-cyan">▬ NET</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={140}>
            <AreaChart data={chartData} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
              <defs>
                <linearGradient id="cgCPU" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00ff41" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#00ff41" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="cgRAM" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0080ff" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#0080ff" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="t" tick={{ fill: '#166534', fontSize: 9, fontFamily: 'monospace' }} />
              <YAxis tick={{ fill: '#166534', fontSize: 9, fontFamily: 'monospace' }} domain={[0, 100]} />
              <Tooltip content={<CyberTooltip />} />
              <Area type="monotone" dataKey="cpu" name="CPU" stroke="#00ff41" strokeWidth={1.5} fill="url(#cgCPU)" dot={false} />
              <Area type="monotone" dataKey="ram" name="RAM" stroke="#0080ff" strokeWidth={1.5} fill="url(#cgRAM)" dot={false} />
              <Line type="monotone" dataKey="net" name="NET" stroke="#00ffff" strokeWidth={1} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Threat distribution — 1/3 width */}
        <div className="glass-card p-4">
          <div className="text-[10px] font-mono text-green-600 tracking-widest mb-3">THREAT DISTRIBUTION</div>
          <ResponsiveContainer width="100%" height={100}>
            <RadialBarChart cx="50%" cy="50%" innerRadius="20%" outerRadius="90%" data={threatDist}>
              <RadialBar minAngle={5} dataKey="value" />
              <Tooltip content={<CyberTooltip />} />
            </RadialBarChart>
          </ResponsiveContainer>
          <div className="mt-2 space-y-1">
            {threatDist.map(d => (
              <div key={d.name} className="flex items-center justify-between text-[9px] font-mono">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: d.fill }} />
                  <span className="text-green-700">{d.name}</span>
                </div>
                <span style={{ color: d.fill }}>{d.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Row 3: Active threats + System info */}
      <div className="grid grid-cols-3 gap-3">

        {/* Active threats list — 2/3 width */}
        <div className="col-span-2 glass-card p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-mono text-green-600 tracking-widest">ACTIVE THREAT FEED</span>
            <span className="text-[9px] font-mono text-green-800">{allThreats.length} TOTAL LOGGED</span>
          </div>
          {recentThreats.length === 0 ? (
            <div className="text-center py-6 text-green-800 font-mono text-xs">
              <div className="text-2xl mb-2">◉</div>
              No active threats detected
            </div>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto terminal-scroll">
              {recentThreats.map((t, i) => <ThreatCard key={t.id || i} threat={t} index={i} />)}
            </div>
          )}
        </div>

        {/* System quick stats — 1/3 width */}
        <div className="glass-card p-4 space-y-3">
          <div className="text-[10px] font-mono text-green-600 tracking-widest">SYSTEM INTEL</div>
          {[
            { label: 'DISK USAGE', value: `${s.disk || 0}%` },
            { label: 'TEMPERATURE', value: `${s.temp || 0}°C` },
            { label: 'UPTIME', value: s.uptime || '00:00:00' },
            { label: 'THREATS TODAY', value: allThreats.length },
            { label: 'CRITICAL', value: allThreats.filter(t => t.level === 'CRITICAL').length, color: 'text-neon-red' },
          ].map(row => (
            <div key={row.label} className="flex justify-between items-center border-b border-green-900/20 pb-2 last:border-0 last:pb-0">
              <span className="text-[9px] text-green-800 font-mono">{row.label}</span>
              <span className={`text-xs font-mono font-bold ${row.color || 'text-neon-green'}`}>{row.value}</span>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}

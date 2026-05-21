// components/SystemMonitor.jsx
// System monitoring panel — CPU, RAM, disk, processes, open ports

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

// ── Demo process data generator
function genProcesses(count = 18) {
  const names = [
    'nginx', 'python3', 'node', 'chrome', 'sshd', 'postgres', 'redis-server',
    'docker', 'systemd', 'bash', 'curl', 'nc', 'nmap', 'tcpdump', 'wireshark',
    'elasticsearch', 'kafka', 'rabbitmq', 'prometheus', 'grafana',
  ]
  return Array.from({ length: count }, (_, i) => ({
    pid: 1000 + Math.floor(Math.random() * 9000),
    name: names[i % names.length],
    cpu: parseFloat((Math.random() * 25).toFixed(1)),
    ram: parseFloat((Math.random() * 512).toFixed(0)),
    status: Math.random() > 0.1 ? 'running' : 'sleeping',
    threat: Math.random() > 0.85 ? (Math.random() > 0.5 ? 'HIGH' : 'MEDIUM') : 'NONE',
    user: ['root', 'www-data', 'ubuntu', 'postgres'][Math.floor(Math.random() * 4)],
  })).sort((a, b) => b.cpu - a.cpu)
}

function genPorts() {
  const wellKnown = [
    { port: 22, service: 'SSH', state: 'OPEN', risk: 'MEDIUM' },
    { port: 80, service: 'HTTP', state: 'OPEN', risk: 'LOW' },
    { port: 443, service: 'HTTPS', state: 'OPEN', risk: 'LOW' },
    { port: 3306, service: 'MySQL', state: 'OPEN', risk: 'HIGH' },
    { port: 5432, service: 'Postgres', state: 'OPEN', risk: 'MEDIUM' },
    { port: 6379, service: 'Redis', state: 'OPEN', risk: 'HIGH' },
    { port: 8080, service: 'HTTP-alt', state: 'OPEN', risk: 'MEDIUM' },
    { port: 9200, service: 'Elastic', state: 'OPEN', risk: 'HIGH' },
    { port: 27017, service: 'MongoDB', state: 'OPEN', risk: 'HIGH' },
    { port: 4444, service: 'UNKNOWN', state: 'OPEN', risk: 'CRITICAL' },
  ]
  return wellKnown
}

// ── Radial gauge for a percentage metric
function Gauge({ value, label, color = '#00ff41', size = 80 }) {
  const r = (size / 2) - 8
  const circ = 2 * Math.PI * r
  const arc = 0.75 * circ  // 270° sweep
  const pct = Math.min(value / 100, 1)
  const offset = arc - pct * arc

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Background track */}
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#001100" strokeWidth="6"
          strokeDasharray={`${arc} ${circ - arc}`} strokeDashoffset={arc * -0.125}
          strokeLinecap="round" transform={`rotate(135, ${size/2}, ${size/2})`} />
        {/* Value arc */}
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="5"
          strokeDasharray={`${arc} ${circ - arc}`} strokeDashoffset={arc * -0.125 + offset}
          strokeLinecap="round" transform={`rotate(135, ${size/2}, ${size/2})`}
          style={{ filter: `drop-shadow(0 0 4px ${color})`, transition: 'stroke-dashoffset 0.8s ease' }}
        />
        {/* Center text */}
        <text x={size/2} y={size/2 + 2} textAnchor="middle" dominantBaseline="middle"
          fill={color} fontSize="14" fontFamily="JetBrains Mono, monospace" fontWeight="bold">
          {value}%
        </text>
      </svg>
      <span className="text-[9px] font-mono text-green-700 tracking-wider mt-1">{label}</span>
    </div>
  )
}

function CyberTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-cyber-panel border border-cyber-border px-2 py-1.5 text-xs font-mono">
      <div className="text-green-700 mb-1">{label}</div>
      {payload.map((p, i) => <div key={i} style={{ color: p.color }}>{p.name}: {p.value}</div>)}
    </div>
  )
}

export default function SystemMonitor({ systemStats }) {
  const [processes, setProcesses] = useState(() => genProcesses())
  const [ports] = useState(() => genPorts())
  const [procFilter, setProcFilter] = useState('')
  const [sortBy, setSortBy] = useState('cpu')
  const s = systemStats || {}

  useEffect(() => {
    const t = setInterval(() => setProcesses(genProcesses()), 5000)
    return () => clearInterval(t)
  }, [])

  const filteredProcs = processes
    .filter(p => !procFilter || p.name.includes(procFilter) || p.pid.toString().includes(procFilter))
    .sort((a, b) => b[sortBy] - a[sortBy])

  const riskColors = { CRITICAL: 'text-red-400 border-red-900/60', HIGH: 'text-orange-400 border-orange-900/40', MEDIUM: 'text-yellow-400 border-yellow-900/40', LOW: 'text-green-500 border-green-900/30' }
  const threatBg = { HIGH: 'bg-red-950/15', MEDIUM: 'bg-yellow-950/10', NONE: '' }

  // CPU core data for bar chart
  const coreData = Array.from({ length: 8 }, (_, i) => ({
    name: `C${i}`,
    usage: Math.floor(Math.random() * 80 + 5),
  }))

  return (
    <div className="h-full overflow-y-auto p-4 space-y-4">

      {/* ── Row 1: Gauges + core chart */}
      <div className="grid grid-cols-4 gap-3">
        {/* Gauges */}
        <div className="col-span-1 glass-card p-4 flex flex-col items-center justify-center gap-4">
          <Gauge value={s.cpu || 0} label="CPU" color="#00ff41" />
          <Gauge value={s.ram || 0} label="RAM" color="#0080ff" />
          <Gauge value={s.disk || 0} label="DISK" color="#00ffff" />
        </div>

        {/* CPU core usage */}
        <div className="col-span-2 glass-card p-4">
          <div className="text-[10px] font-mono text-green-600 tracking-widest mb-3">CPU CORE UTILIZATION</div>
          <ResponsiveContainer width="100%" height={140}>
            <BarChart data={coreData} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
              <XAxis dataKey="name" tick={{ fill: '#166534', fontSize: 9, fontFamily: 'monospace' }} />
              <YAxis domain={[0, 100]} tick={{ fill: '#166534', fontSize: 9, fontFamily: 'monospace' }} />
              <Tooltip content={<CyberTooltip />} />
              <Bar dataKey="usage" name="CPU %">
                {coreData.map((entry, i) => (
                  <Cell
                    key={i}
                    fill={entry.usage > 80 ? '#ff0040' : entry.usage > 60 ? '#ffd700' : '#00ff41'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Memory info */}
        <div className="col-span-1 glass-card p-4">
          <div className="text-[10px] font-mono text-green-600 tracking-widest mb-3">MEMORY MAP</div>
          <div className="space-y-2">
            {[
              { label: 'Used RAM', value: `${((s.ram || 0) / 100 * 16).toFixed(1)} GB`, color: '#0080ff' },
              { label: 'Free RAM', value: `${(16 - (s.ram || 0) / 100 * 16).toFixed(1)} GB`, color: '#00ff41' },
              { label: 'Swap Used', value: '0.8 GB', color: '#ffd700' },
              { label: 'Disk Used', value: `${s.disk || 0}%`, color: '#00ffff' },
              { label: 'Temp', value: `${s.temp || 0}°C`, color: (s.temp || 0) > 70 ? '#ff0040' : '#00ff41' },
              { label: 'Uptime', value: s.uptime || '00:00:00', color: '#00ff41' },
            ].map(r => (
              <div key={r.label} className="flex justify-between text-xs font-mono border-b border-green-900/20 pb-1">
                <span className="text-green-700">{r.label}</span>
                <span style={{ color: r.color }}>{r.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Row 2: Processes + Open ports */}
      <div className="grid grid-cols-3 gap-3">

        {/* Process list */}
        <div className="col-span-2 glass-card p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-mono text-green-600 tracking-widest">RUNNING PROCESSES ({filteredProcs.length})</span>
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="search..."
                value={procFilter}
                onChange={e => setProcFilter(e.target.value)}
                className="bg-black/40 border border-green-900/40 text-green-500 font-mono text-[10px] px-2 py-0.5 rounded-sm outline-none w-20 focus:border-neon-green"
              />
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
                className="bg-black/40 border border-green-900/40 text-green-600 font-mono text-[10px] px-1 py-0.5 rounded-sm outline-none"
              >
                <option value="cpu">CPU</option>
                <option value="ram">RAM</option>
              </select>
            </div>
          </div>

          <div className="overflow-y-auto max-h-64 terminal-scroll">
            <table className="w-full font-mono text-[10px]">
              <thead className="sticky top-0 bg-cyber-panel">
                <tr className="border-b border-green-900/40 text-green-700">
                  <th className="text-left pb-2 pr-2">PID</th>
                  <th className="text-left pb-2 pr-2">NAME</th>
                  <th className="text-left pb-2 pr-2">USER</th>
                  <th className="text-right pb-2 pr-2">CPU%</th>
                  <th className="text-right pb-2 pr-2">RAM</th>
                  <th className="text-center pb-2">RISK</th>
                </tr>
              </thead>
              <tbody>
                {filteredProcs.map((p) => (
                  <motion.tr
                    key={p.pid}
                    className={`border-b border-green-900/10 hover:bg-green-950/20 ${threatBg[p.threat]}`}
                  >
                    <td className="py-1 pr-2 text-green-700">{p.pid}</td>
                    <td className={`py-1 pr-2 font-semibold ${p.threat !== 'NONE' ? 'text-yellow-400' : 'text-green-400'}`}>{p.name}</td>
                    <td className="py-1 pr-2 text-green-700">{p.user}</td>
                    <td className={`py-1 pr-2 text-right ${p.cpu > 20 ? 'text-yellow-400' : p.cpu > 10 ? 'text-green-400' : 'text-green-700'}`}>{p.cpu}</td>
                    <td className="py-1 pr-2 text-right text-green-700">{p.ram}M</td>
                    <td className="py-1 text-center">
                      {p.threat !== 'NONE' && (
                        <span className={`text-[8px] px-1 border rounded-sm ${riskColors[p.threat]}`}>{p.threat}</span>
                      )}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Open ports */}
        <div className="col-span-1 glass-card p-4">
          <div className="text-[10px] font-mono text-green-600 tracking-widest mb-3">OPEN PORTS</div>
          <div className="space-y-1.5 max-h-72 overflow-y-auto terminal-scroll">
            {ports.map((p) => (
              <div
                key={p.port}
                className={`flex items-center justify-between p-2 rounded-sm border text-xs font-mono ${
                  p.risk === 'CRITICAL' ? 'border-red-900/60 bg-red-950/10' :
                  p.risk === 'HIGH' ? 'border-orange-900/40 bg-orange-950/5' :
                  'border-green-900/20'
                }`}
              >
                <div>
                  <span className="text-neon-cyan font-bold">{p.port}</span>
                  <span className="text-green-700 ml-2">{p.service}</span>
                </div>
                <span className={`text-[9px] px-1 border rounded-sm ${riskColors[p.risk]}`}>{p.risk}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

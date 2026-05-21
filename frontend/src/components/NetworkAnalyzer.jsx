// components/NetworkAnalyzer.jsx
// Live network analysis panel with packet visualization, connection table, threat detection

import React, { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'
import sounds from '../utils/soundEffects.js'

// ── Demo connection data generator
function genConnections(count = 12) {
  const protocols = ['TCP', 'UDP', 'ICMP', 'HTTP', 'HTTPS', 'SSH', 'DNS']
  const states = ['ESTABLISHED', 'LISTEN', 'TIME_WAIT', 'CLOSE_WAIT', 'SYN_SENT']
  const flags = ['NORMAL', 'NORMAL', 'NORMAL', 'SUSPICIOUS', 'THREAT']
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    protocol: protocols[Math.floor(Math.random() * protocols.length)],
    localIP: `192.168.1.${Math.floor(Math.random() * 255)}`,
    localPort: Math.floor(Math.random() * 65535),
    remoteIP: `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
    remotePort: Math.floor(Math.random() * 65535),
    state: states[Math.floor(Math.random() * states.length)],
    flag: flags[Math.floor(Math.random() * flags.length)],
    bytes: Math.floor(Math.random() * 1000000),
    pid: Math.floor(Math.random() * 9999) + 1000,
  }))
}

const SCAN_TYPES = [
  { name: 'Port Scan', desc: 'Sequential port probe targeting 1-1024', confidence: 87, icon: '⬡' },
  { name: 'Brute Force', desc: 'SSH login attempts: 847 in 60s', confidence: 94, icon: '⚡' },
  { name: 'DNS Exfil', desc: 'Abnormal DNS TXT record volume', confidence: 73, icon: '◈' },
  { name: 'ARP Poison', desc: 'ARP reply storm from 192.168.1.105', confidence: 65, icon: '☠' },
]

function CyberTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-cyber-panel border border-cyber-border px-2 py-1.5 text-xs font-mono">
      <div className="text-green-700 mb-1">{label}</div>
      {payload.map((p, i) => <div key={i} style={{ color: p.color }}>{p.name}: {p.value}</div>)}
    </div>
  )
}

// ── Live packet rate canvas
function PacketCanvas({ data }) {
  const canvasRef = useRef(null)
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    canvas.width = canvas.offsetWidth
    canvas.height = canvas.offsetHeight
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    if (!data.length) return
    const max = Math.max(...data.map(d => d.packets), 1)
    const w = canvas.width / (data.length - 1)

    // Grid lines
    ctx.strokeStyle = 'rgba(0,255,65,0.05)'
    ctx.lineWidth = 0.5
    for (let i = 0; i <= 4; i++) {
      const y = (i / 4) * canvas.height
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke()
    }

    // Gradient fill
    const grad = ctx.createLinearGradient(0, 0, 0, canvas.height)
    grad.addColorStop(0, 'rgba(0,255,65,0.3)')
    grad.addColorStop(1, 'rgba(0,255,65,0)')

    ctx.beginPath()
    data.forEach((d, i) => {
      const x = i * w
      const y = canvas.height - (d.packets / max) * canvas.height * 0.85
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
    })
    const lastX = (data.length - 1) * w
    const lastY = canvas.height - (data[data.length - 1].packets / max) * canvas.height * 0.85
    ctx.lineTo(lastX, canvas.height)
    ctx.lineTo(0, canvas.height)
    ctx.closePath()
    ctx.fillStyle = grad
    ctx.fill()

    // Line
    ctx.beginPath()
    data.forEach((d, i) => {
      const x = i * w
      const y = canvas.height - (d.packets / max) * canvas.height * 0.85
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
    })
    ctx.strokeStyle = '#00ff41'
    ctx.lineWidth = 1.5
    ctx.shadowColor = '#00ff41'
    ctx.shadowBlur = 6
    ctx.stroke()
    ctx.shadowBlur = 0
  }, [data])

  return <canvas ref={canvasRef} className="w-full h-full" />
}

export default function NetworkAnalyzer({ networkHistory, threats, sendMessage }) {
  const [connections, setConnections] = useState(() => genConnections())
  const [scanning, setScanning] = useState(false)
  const [scanProgress, setScanProgress] = useState(0)
  const [portFilter, setPortFilter] = useState('')
  const [flagFilter, setFlagFilter] = useState('ALL')

  // Packet rate data (30s window)
  const [packetData, setPacketData] = useState(
    Array.from({ length: 30 }, (_, i) => ({ t: i, packets: Math.floor(Math.random() * 500) + 100 }))
  )

  // Refresh connections every 4s
  useEffect(() => {
    const t = setInterval(() => {
      setConnections(genConnections(10 + Math.floor(Math.random() * 8)))
      setPacketData(prev => [...prev.slice(1), { t: Date.now(), packets: Math.floor(Math.random() * 800) + 100 }])
    }, 4000)
    return () => clearInterval(t)
  }, [])

  const runScan = () => {
    if (scanning) return
    setScanning(true)
    setScanProgress(0)
    sounds.scan()
    sendMessage?.({ type: 'command', action: 'scan_network' })
    const interval = setInterval(() => {
      setScanProgress(p => {
        if (p >= 100) { clearInterval(interval); setScanning(false); return 100 }
        return p + 2
      })
    }, 80)
  }

  const filteredConns = connections.filter(c => {
    const matchPort = !portFilter || c.remotePort.toString().includes(portFilter) || c.localPort.toString().includes(portFilter)
    const matchFlag = flagFilter === 'ALL' || c.flag === flagFilter
    return matchPort && matchFlag
  })

  const flagColors = { NORMAL: 'text-green-600', SUSPICIOUS: 'text-yellow-400', THREAT: 'text-red-400 threat-blink' }
  const stateColors = { ESTABLISHED: 'text-green-500', LISTEN: 'text-blue-400', TIME_WAIT: 'text-green-800', CLOSE_WAIT: 'text-orange-500', SYN_SENT: 'text-yellow-400' }

  return (
    <div className="h-full overflow-y-auto p-4 space-y-4">

      {/* ── Top row: Packet rate + scan controls */}
      <div className="grid grid-cols-3 gap-3">

        {/* Packet rate chart */}
        <div className="col-span-2 glass-card p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-mono text-green-600 tracking-widest">LIVE PACKET RATE (30s)</span>
            <span className="text-xs font-mono text-neon-green">
              {packetData[packetData.length - 1]?.packets} pkt/s
            </span>
          </div>
          <div className="h-28">
            <PacketCanvas data={packetData} />
          </div>
        </div>

        {/* Scan panel */}
        <div className="glass-card p-4 flex flex-col">
          <div className="text-[10px] font-mono text-green-600 tracking-widest mb-3">NETWORK SCAN</div>

          {scanning ? (
            <div className="flex-1 flex flex-col justify-center">
              <div className="text-xs font-mono text-neon-cyan mb-2 text-center">SCANNING...</div>
              <div className="h-2 bg-green-950 rounded-full overflow-hidden mb-1">
                <motion.div
                  className="h-full bg-neon-cyan"
                  animate={{ width: `${scanProgress}%` }}
                  transition={{ duration: 0.1 }}
                />
              </div>
              <div className="text-center text-xs font-mono text-green-700">{scanProgress}%</div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col justify-center gap-2">
              {[
                { label: 'QUICK SCAN', action: runScan },
                { label: 'DEEP SCAN', action: runScan },
                { label: 'PORT PROBE', action: runScan },
              ].map(b => (
                <button key={b.label}
                  onClick={b.action}
                  className="py-2 text-[10px] font-mono font-bold border border-green-900/60 text-green-600 hover:border-neon-green hover:text-neon-green rounded-sm transition-colors"
                >
                  {b.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Detected attack patterns */}
      <div className="glass-card p-4">
        <div className="text-[10px] font-mono text-green-600 tracking-widest mb-3">ATTACK PATTERN DETECTION</div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {SCAN_TYPES.map((s, i) => (
            <motion.div
              key={s.name}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.06 }}
              className={`p-3 border rounded-sm ${s.confidence > 85 ? 'border-red-900/60 bg-red-950/10' : s.confidence > 70 ? 'border-yellow-900/40 bg-yellow-950/5' : 'border-green-900/30'}`}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-sm">{s.icon}</span>
                <span className="font-mono text-xs font-bold text-green-300">{s.name}</span>
              </div>
              <p className="text-[9px] font-mono text-green-700 mb-2 leading-relaxed">{s.desc}</p>
              <div className="h-1 bg-green-950 rounded-full">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${s.confidence}%`,
                    background: s.confidence > 85 ? '#ff0040' : s.confidence > 70 ? '#ffd700' : '#00ff41'
                  }}
                />
              </div>
              <div className="text-[9px] font-mono text-right mt-1"
                style={{ color: s.confidence > 85 ? '#ff0040' : s.confidence > 70 ? '#ffd700' : '#00ff41' }}>
                {s.confidence}%
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ── Active connections table */}
      <div className="glass-card p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[10px] font-mono text-green-600 tracking-widest">
            ACTIVE CONNECTIONS ({filteredConns.length})
          </span>
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="filter port..."
              value={portFilter}
              onChange={e => setPortFilter(e.target.value)}
              className="bg-black/40 border border-green-900/40 text-green-500 font-mono text-[10px] px-2 py-1 rounded-sm outline-none w-24 focus:border-neon-green"
            />
            {['ALL', 'NORMAL', 'SUSPICIOUS', 'THREAT'].map(f => (
              <button key={f}
                onClick={() => setFlagFilter(f)}
                className={`text-[9px] font-mono px-1.5 py-0.5 border rounded-sm transition-colors ${flagFilter === f ? 'border-neon-green text-neon-green' : 'border-green-900/40 text-green-800'}`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full font-mono text-[10px]">
            <thead>
              <tr className="border-b border-green-900/40 text-green-700">
                <th className="text-left pb-2 pr-3">PROTO</th>
                <th className="text-left pb-2 pr-3">LOCAL</th>
                <th className="text-left pb-2 pr-3">REMOTE</th>
                <th className="text-left pb-2 pr-3">STATE</th>
                <th className="text-left pb-2 pr-3">FLAG</th>
                <th className="text-right pb-2">BYTES</th>
              </tr>
            </thead>
            <tbody>
              {filteredConns.slice(0, 15).map((c) => (
                <motion.tr
                  key={c.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="border-b border-green-900/10 hover:bg-green-950/20 transition-colors"
                >
                  <td className="py-1.5 pr-3 text-neon-cyan">{c.protocol}</td>
                  <td className="py-1.5 pr-3 text-green-600">{c.localIP}:{c.localPort}</td>
                  <td className="py-1.5 pr-3 text-green-500">{c.remoteIP}:{c.remotePort}</td>
                  <td className={`py-1.5 pr-3 ${stateColors[c.state] || 'text-green-600'}`}>{c.state}</td>
                  <td className={`py-1.5 pr-3 font-bold ${flagColors[c.flag] || 'text-green-600'}`}>{c.flag}</td>
                  <td className="py-1.5 text-right text-green-700">{(c.bytes / 1024).toFixed(1)}KB</td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

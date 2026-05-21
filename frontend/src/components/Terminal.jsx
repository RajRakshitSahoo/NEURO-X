// components/Terminal.jsx
// Live hacker terminal with streaming AI thoughts, typewriter effect, color-coded logs

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { motion } from 'framer-motion'
import sounds from '../utils/soundEffects.js'

// ── Log level config
const LOG_STYLES = {
  BOOT:     { color: 'text-green-600',  prefix: '◈' },
  INFO:     { color: 'text-green-500',  prefix: '▸' },
  WARN:     { color: 'text-yellow-400', prefix: '⚠' },
  ALERT:    { color: 'text-orange-400', prefix: '⚡' },
  CRITICAL: { color: 'text-red-400',    prefix: '☠' },
  AI:       { color: 'text-cyan-400',   prefix: '◆' },
  SUCCESS:  { color: 'text-green-300',  prefix: '✓' },
  CMD:      { color: 'text-neon-blue',  prefix: '$' },
}

// ── AI "thinking" message bank
const AI_THOUGHTS = [
  { level: 'AI', msg: 'Initializing neural pattern recognition engine...' },
  { level: 'AI', msg: 'Scanning network topology — 254 hosts discovered' },
  { level: 'AI', msg: 'Baseline behavior established. Monitoring deviations...' },
  { level: 'AI', msg: 'Packet entropy analysis: nominal (σ=0.23)' },
  { level: 'AI', msg: 'Cross-referencing CVE database — 47,832 signatures active' },
  { level: 'AI', msg: 'Behavioral model updated — new traffic pattern logged' },
  { level: 'INFO', msg: 'TCP handshake rate: 142/sec — within normal range' },
  { level: 'INFO', msg: 'Monitoring eth0 — packets/sec: 1,248' },
  { level: 'AI', msg: 'Anomaly scoring in progress... comparing time-series data' },
  { level: 'AI', msg: 'Deep packet inspection: 0 malformed headers detected' },
  { level: 'INFO', msg: 'DNS query volume: stable at 23 req/min' },
  { level: 'AI', msg: 'Connection graph: 18 active nodes, 42 edges' },
  { level: 'AI', msg: 'Port access frequency map updated' },
  { level: 'AI', msg: 'Analyzing ARP table for poisoning indicators...' },
  { level: 'SUCCESS', msg: 'Network integrity check passed' },
  { level: 'AI', msg: 'Lateral movement detection: scanning internal subnet...' },
  { level: 'INFO', msg: 'HTTP/S traffic: 94% encrypted — good hygiene' },
  { level: 'AI', msg: 'Memory dump analysis: no injected shellcode detected' },
  { level: 'AI', msg: 'Confidence interval: threat level LOW (CI: 95%)' },
  { level: 'AI', msg: 'Correlating geolocation data for active connections...' },
  { level: 'WARN', msg: 'Elevated SYN packet rate — potential scan in progress' },
  { level: 'AI', msg: 'Comparison against historical baselines: deviation +12%' },
  { level: 'AI', msg: 'OSINT lookup initiated for flagged IP ranges...' },
  { level: 'INFO', msg: 'SSH key exchange: all sessions using Ed25519 — secure' },
  { level: 'AI', msg: 'Running YARA rules against memory artifacts...' },
]

function genSystemMessage(stats) {
  if (!stats) return null
  const msgs = [
    { level: 'INFO', msg: `CPU usage: ${stats.cpu}% — ${stats.cpu > 80 ? 'HIGH LOAD detected' : 'nominal'}` },
    { level: stats.ram > 85 ? 'WARN' : 'INFO', msg: `RAM utilization: ${stats.ram}% of available memory` },
    { level: 'INFO', msg: `Network I/O: ↓${stats.network_in}KB/s ↑${stats.network_out}KB/s` },
    { level: stats.temp > 70 ? 'WARN' : 'INFO', msg: `System temperature: ${stats.temp}°C` },
  ]
  return msgs[Math.floor(Math.random() * msgs.length)]
}

function genThreatMessage(threat) {
  return {
    level: threat.level === 'CRITICAL' || threat.level === 'HIGH' ? threat.level : 'ALERT',
    msg: `${threat.type} detected — Source: ${threat.ip}:${threat.port} — Confidence: ${threat.confidence}%`,
  }
}

// ── Single terminal log line
function LogLine({ entry, index }) {
  const style = LOG_STYLES[entry.level] || LOG_STYLES.INFO
  return (
    <motion.div
      initial={{ opacity: 0, x: -6 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.12 }}
      className={`flex gap-2 font-mono text-xs leading-relaxed ${style.color} group`}
    >
      <span className="text-green-800 flex-shrink-0 w-20 text-right">{entry.time}</span>
      <span className="flex-shrink-0 opacity-70">{style.prefix}</span>
      {entry.level === 'AI' && (
        <span className="text-cyan-800 flex-shrink-0">[AI]</span>
      )}
      <span className="break-all">{entry.msg}</span>
    </motion.div>
  )
}

// ── Command input bar
function CommandInput({ onExecute }) {
  const [cmd, setCmd] = useState('')
  const [history, setHistory] = useState([])
  const [histIdx, setHistIdx] = useState(-1)

  const submit = () => {
    if (!cmd.trim()) return
    sounds.click()
    onExecute(cmd.trim())
    setHistory(h => [cmd.trim(), ...h.slice(0, 49)])
    setCmd('')
    setHistIdx(-1)
  }

  const onKey = (e) => {
    if (e.key === 'Enter') { submit(); return }
    if (e.key === 'ArrowUp') {
      const next = Math.min(histIdx + 1, history.length - 1)
      setHistIdx(next)
      setCmd(history[next] || '')
    }
    if (e.key === 'ArrowDown') {
      const prev = Math.max(histIdx - 1, -1)
      setHistIdx(prev)
      setCmd(prev === -1 ? '' : history[prev])
    }
  }

  return (
    <div className="flex items-center gap-2 px-4 py-2 border-t border-green-900/40 bg-black/30">
      <span className="text-neon-green font-mono text-xs font-bold flex-shrink-0">
        neuro-x@sys:~$
      </span>
      <input
        type="text"
        value={cmd}
        onChange={e => setCmd(e.target.value)}
        onKeyDown={onKey}
        className="flex-1 bg-transparent text-neon-green font-mono text-xs outline-none caret-neon-green placeholder-green-800"
        placeholder="type command... (help for list)"
        autoComplete="off"
        spellCheck={false}
      />
      <button
        onClick={submit}
        className="text-green-700 hover:text-neon-green text-xs font-mono transition-colors"
      >
        ⏎
      </button>
    </div>
  )
}

// ── Main Terminal
export default function Terminal({ threats, systemStats, isConnected }) {
  const [logs, setLogs] = useState([])
  const [paused, setPaused] = useState(false)
  const [filter, setFilter] = useState('ALL')
  const [aiActive, setAiActive] = useState(true)
  const bottomRef = useRef(null)
  const logsRef = useRef(logs)
  logsRef.current = logs

  const addLog = useCallback((level, msg) => {
    if (paused) return
    const entry = {
      id: Date.now() + Math.random(),
      level,
      msg,
      time: new Date().toLocaleTimeString('en', { hour12: false }),
    }
    setLogs(prev => [...prev.slice(-300), entry])
  }, [paused])

  // Boot sequence
  useEffect(() => {
    const bootMsgs = [
      { level: 'BOOT', msg: '══════════════ NEURO-X ACTIVE ══════════════' },
      { level: 'BOOT', msg: 'Neural monitoring system v2.1.0 initialized' },
      { level: 'INFO', msg: `Backend: ${isConnected ? 'CONNECTED (ws://localhost:8000)' : 'OFFLINE — running in demo mode'}` },
      { level: 'INFO', msg: 'Loading threat signature database...' },
      { level: 'SUCCESS', msg: '47,832 threat patterns loaded successfully' },
      { level: 'INFO', msg: 'Starting packet capture on all interfaces...' },
      { level: 'AI', msg: 'AI reasoning engine online — continuous analysis active' },
      { level: 'BOOT', msg: '══════════════════════════════════════════════' },
    ]
    bootMsgs.forEach((m, i) => setTimeout(() => addLog(m.level, m.msg), i * 180))
  }, [])

  // Stream AI thoughts
  useEffect(() => {
    if (!aiActive) return
    let idx = Math.floor(Math.random() * AI_THOUGHTS.length)
    const interval = setInterval(() => {
      const thought = AI_THOUGHTS[idx % AI_THOUGHTS.length]
      addLog(thought.level, thought.msg)
      if (Math.random() < 0.3) {
        const sysMsg = genSystemMessage(systemStats)
        if (sysMsg) setTimeout(() => addLog(sysMsg.level, sysMsg.msg), 600)
      }
      idx++
    }, 2200 + Math.random() * 1800)
    return () => clearInterval(interval)
  }, [aiActive, systemStats, addLog])

  // Inject threat events
  useEffect(() => {
    if (!threats || threats.length === 0) return
    threats.forEach((t, i) => {
      setTimeout(() => {
        const m = genThreatMessage(t)
        addLog(m.level, m.msg)
        if (t.level === 'CRITICAL') {
          setTimeout(() => addLog('AI', `Recommendation: Block ${t.ip} — initiate incident response`), 800)
        }
      }, i * 400)
    })
  }, [threats])

  // Auto-scroll
  useEffect(() => {
    if (!paused) bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [logs, paused])

  // Command handler
  const handleCommand = (cmd) => {
    addLog('CMD', cmd)
    const c = cmd.toLowerCase()
    if (c === 'help') {
      ['clear          — clear terminal', 'status         — system status', 'scan           — run network scan',
       'threats        — list active threats', 'ai on/off      — toggle AI stream', 'history        — command history',
       'version        — show version info',
      ].forEach((line, i) => setTimeout(() => addLog('INFO', line), i * 60))
    } else if (c === 'clear') {
      setLogs([])
    } else if (c === 'status') {
      addLog('INFO', `CPU: ${systemStats?.cpu || '?'}% | RAM: ${systemStats?.ram || '?'}% | Temp: ${systemStats?.temp || '?'}°C`)
    } else if (c === 'scan') {
      sounds.scan()
      addLog('AI', 'Initiating network scan...')
      setTimeout(() => addLog('SUCCESS', 'Scan complete — 254 hosts, 3 flagged'), 2000)
    } else if (c === 'threats') {
      addLog('INFO', `Active threats: ${threats.length}`)
      threats.forEach(t => addLog(t.level, `${t.type} | ${t.ip}:${t.port} | ${t.confidence}% confidence`))
    } else if (c === 'ai on') {
      setAiActive(true); addLog('SUCCESS', 'AI stream enabled')
    } else if (c === 'ai off') {
      setAiActive(false); addLog('WARN', 'AI stream paused')
    } else if (c === 'version') {
      addLog('INFO', 'NEURO-X v2.1.0 | React 18 + Python FastAPI + C++ Engine')
    } else {
      addLog('WARN', `Unknown command: "${cmd}" — type "help" for commands`)
    }
  }

  const FILTER_LEVELS = ['ALL', 'AI', 'WARN', 'ALERT', 'CRITICAL']
  const filteredLogs = filter === 'ALL' ? logs : logs.filter(l => l.level === filter)

  return (
    <div className="h-full flex flex-col bg-black/60 border-l border-cyber-border">
      {/* ── Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-green-900/40 bg-cyber-panel/60 flex-shrink-0">
        <div className="flex items-center gap-3">
          <span className="font-cyber text-xs font-bold text-glow-green tracking-wider">TERMINAL</span>
          <div className="flex items-center gap-1">
            <span className={`w-1.5 h-1.5 rounded-full ${aiActive ? 'bg-neon-cyan pulse-dot' : 'bg-green-900'}`} />
            <span className="text-[10px] text-green-700 font-mono">{aiActive ? 'AI ACTIVE' : 'AI PAUSED'}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Filter buttons */}
          {FILTER_LEVELS.map(f => (
            <button key={f}
              onClick={() => setFilter(f)}
              className={`text-[9px] font-mono px-2 py-0.5 rounded-sm border transition-colors ${filter === f ? 'border-neon-green text-neon-green bg-neon-green/10' : 'border-green-900/40 text-green-700 hover:border-green-700'}`}
            >
              {f}
            </button>
          ))}
          <div className="w-px h-4 bg-green-900/40 mx-1" />
          <button onClick={() => setPaused(p => !p)}
            className={`text-[9px] font-mono px-2 py-0.5 rounded-sm border transition-colors ${paused ? 'border-yellow-500 text-yellow-400' : 'border-green-900/40 text-green-700 hover:border-green-700'}`}
          >
            {paused ? 'RESUME' : 'PAUSE'}
          </button>
          <button onClick={() => setLogs([])}
            className="text-[9px] font-mono px-2 py-0.5 rounded-sm border border-green-900/40 text-green-700 hover:border-green-700 transition-colors">
            CLEAR
          </button>
        </div>
      </div>

      {/* ── Log area */}
      <div className="flex-1 overflow-y-auto terminal-scroll px-4 py-3 space-y-0.5">
        {filteredLogs.map((entry, i) => (
          <LogLine key={entry.id} entry={entry} index={i} />
        ))}
        <div ref={bottomRef} />
      </div>

      {/* ── Log count */}
      <div className="px-4 py-1 flex justify-between items-center text-[9px] text-green-800 font-mono flex-shrink-0 border-t border-green-900/20">
        <span>LINES: {filteredLogs.length} {filter !== 'ALL' ? `(filtered: ${filter})` : ''}</span>
        <span>{paused ? '⏸ PAUSED' : '● LIVE'}</span>
      </div>

      {/* ── Command input */}
      <CommandInput onExecute={handleCommand} />
    </div>
  )
}

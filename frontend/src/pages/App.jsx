// pages/App.jsx
// Root application component — manages auth state, global layout, keyboard shortcuts

import React, { useState, useEffect, useCallback } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import LoginScreen from '../components/LoginScreen.jsx'
import Sidebar from '../components/Sidebar.jsx'
import Terminal from '../components/Terminal.jsx'
import Dashboard from '../components/Dashboard.jsx'
import NetworkAnalyzer from '../components/NetworkAnalyzer.jsx'
import AIThinkingEngine from '../components/AIThinkingEngine.jsx'
import SystemMonitor from '../components/SystemMonitor.jsx'
import VoiceCommand from '../components/VoiceCommand.jsx'
import ParticleBackground from '../components/ParticleBackground.jsx'
import { useWebSocket } from '../hooks/useWebSocket.js'
import sounds from '../utils/soundEffects.js'

// ─────────────────────────────────────────────
// Demo data generators (used when backend is offline)
// ─────────────────────────────────────────────
function genSystemStats() {
  return {
    cpu: Math.round(15 + Math.random() * 60),
    ram: Math.round(40 + Math.random() * 40),
    disk: Math.round(30 + Math.random() * 20),
    network_in: Math.round(Math.random() * 500),
    network_out: Math.round(Math.random() * 200),
    temp: Math.round(45 + Math.random() * 30),
    uptime: '03:42:17',
  }
}

function genThreatData() {
  const levels = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']
  const types = ['Port Scan', 'Brute Force', 'DDoS Pattern', 'SQL Injection', 'Malware Beacon', 'Recon Activity']
  const count = Math.random() < 0.3 ? Math.floor(Math.random() * 3) + 1 : 0
  return Array.from({ length: count }, (_, i) => ({
    id: Date.now() + i,
    type: types[Math.floor(Math.random() * types.length)],
    level: levels[Math.floor(Math.random() * levels.length)],
    ip: `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
    port: Math.floor(Math.random() * 65535),
    confidence: Math.round(50 + Math.random() * 49),
    timestamp: new Date().toISOString(),
  }))
}

const VIEWS = ['dashboard', 'terminal', 'network', 'ai-engine', 'system']

export default function App() {
  const [authenticated, setAuthenticated] = useState(false)
  const [currentView, setCurrentView] = useState('dashboard')
  const [systemStats, setSystemStats] = useState(genSystemStats())
  const [threats, setThreats] = useState([])
  const [allThreats, setAllThreats] = useState([])
  const [networkHistory, setNetworkHistory] = useState([])
  const [showVoice, setShowVoice] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [theme, setTheme] = useState('green') // green | blue | red

  const { isConnected, lastMessage, sendMessage } = useWebSocket()

  // ── Keyboard shortcuts
  useEffect(() => {
    const handler = (e) => {
      if (!authenticated) return
      if (e.ctrlKey) {
        switch (e.key.toLowerCase()) {
          case 't': e.preventDefault(); setCurrentView('terminal'); sounds.navigate(); break
          case 'n': e.preventDefault(); setCurrentView('network'); sounds.navigate(); break
          case 's': e.preventDefault(); setCurrentView('system'); sounds.navigate(); break
          case 'a': e.preventDefault(); setCurrentView('ai-engine'); sounds.navigate(); break
          case 'v': e.preventDefault(); setShowVoice(v => !v); break
          case 'l': e.preventDefault(); exportLogs(); break
        }
      }
      if (e.key === 'Escape') setShowVoice(false)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [authenticated])

  // ── Process WebSocket messages from backend
  useEffect(() => {
    if (!lastMessage) return
    const { type, data } = lastMessage
    if (type === 'system_stats') setSystemStats(data)
    if (type === 'threat_detected') {
      setThreats(data)
      setAllThreats(prev => [...prev.slice(-100), ...data])
      if (data.length > 0 && soundEnabled) {
        data[0].level === 'CRITICAL' ? sounds.critical() : sounds.alert()
      }
      // Push notifications
      data.forEach(t => addNotification(`${t.level}: ${t.type} from ${t.ip}`, t.level))
    }
    if (type === 'network_stats') {
      setNetworkHistory(prev => [...prev.slice(-60), data])
    }
  }, [lastMessage])

  // ── Demo data simulation when backend is offline
  useEffect(() => {
    if (isConnected) return
    const sysInterval = setInterval(() => {
      const stats = genSystemStats()
      setSystemStats(stats)
      setNetworkHistory(prev => [
        ...prev.slice(-60),
        { time: new Date().toLocaleTimeString('en', { hour12: false }), ...stats }
      ])
    }, 2000)

    const threatInterval = setInterval(() => {
      const newThreats = genThreatData()
      if (newThreats.length > 0) {
        setThreats(newThreats)
        setAllThreats(prev => [...prev.slice(-100), ...newThreats])
        if (soundEnabled) {
          newThreats[0].level === 'CRITICAL' ? sounds.critical() : sounds.alert()
        }
        newThreats.forEach(t => addNotification(`${t.level}: ${t.type} from ${t.ip}`, t.level))
      }
    }, 5000)

    return () => { clearInterval(sysInterval); clearInterval(threatInterval) }
  }, [isConnected, soundEnabled])

  // ── Notifications system
  const addNotification = useCallback((msg, level = 'INFO') => {
    const id = Date.now() + Math.random()
    setNotifications(prev => [...prev.slice(-4), { id, msg, level, ts: new Date() }])
    setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== id)), 5000)
  }, [])

  // ── Log export
  const exportLogs = useCallback(() => {
    const data = allThreats.map(t =>
      `[${t.timestamp}] ${t.level} | ${t.type} | IP: ${t.ip}:${t.port} | Confidence: ${t.confidence}%`
    ).join('\n')
    const blob = new Blob([`NEURO-X THREAT LOG EXPORT\n${'='.repeat(60)}\n${data}`], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `neurox-logs-${Date.now()}.txt`
    a.click()
    URL.revokeObjectURL(url)
    addNotification('Logs exported successfully', 'INFO')
    if (soundEnabled) sounds.success()
  }, [allThreats, addNotification, soundEnabled])

  // ── Voice command handler
  const handleVoiceCommand = useCallback((cmd) => {
    const c = cmd.toLowerCase()
    if (c.includes('scan network')) {
      setCurrentView('network')
      sendMessage({ type: 'command', action: 'scan_network' })
      sounds.scan()
    } else if (c.includes('active ports') || c.includes('show ports')) {
      setCurrentView('system')
      addNotification('Displaying open ports...', 'INFO')
    } else if (c.includes('deep analysis')) {
      setCurrentView('ai-engine')
      sendMessage({ type: 'command', action: 'deep_analysis' })
      addNotification('AI Deep Analysis initiated', 'INFO')
    } else if (c.includes('stealth monitor')) {
      addNotification('Stealth Monitor ENABLED — passive mode active', 'INFO')
      sendMessage({ type: 'command', action: 'stealth_mode' })
    } else if (c.includes('show threats')) {
      setCurrentView('dashboard')
    } else if (c.includes('export logs')) {
      exportLogs()
    } else {
      addNotification(`Unknown command: "${cmd}"`, 'WARN')
    }
    setShowVoice(false)
  }, [sendMessage, addNotification, exportLogs])

  const themeColor = { green: '#00ff41', blue: '#0080ff', red: '#ff0040' }[theme]

  if (!authenticated) {
    return (
      <LoginScreen
        onLogin={(u, p) => {
          if (u === 'admin' && p === 'neuro-x2024') {
            sounds.startup()
            setAuthenticated(true)
          } else {
            sounds.alert()
            return false
          }
          return true
        }}
      />
    )
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-cyber-dark relative hex-bg scanlines">
      {/* Ambient background */}
      <ParticleBackground color={themeColor} />

      {/* Sidebar */}
      <Sidebar
        currentView={currentView}
        setCurrentView={(v) => { setCurrentView(v); sounds.navigate() }}
        isConnected={isConnected}
        threats={allThreats}
        soundEnabled={soundEnabled}
        setSoundEnabled={setSoundEnabled}
        theme={theme}
        setTheme={setTheme}
        onExportLogs={exportLogs}
        onVoiceToggle={() => setShowVoice(v => !v)}
      />

      {/* Main content area */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* Top status bar */}
        <TopBar
          isConnected={isConnected}
          threats={allThreats}
          theme={theme}
          onVoiceToggle={() => setShowVoice(v => !v)}
        />

        {/* Page views */}
        <div className="flex-1 overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentView}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              {currentView === 'dashboard' && (
                <Dashboard systemStats={systemStats} threats={threats} allThreats={allThreats} networkHistory={networkHistory} />
              )}
              {currentView === 'terminal' && (
                <Terminal threats={allThreats} systemStats={systemStats} isConnected={isConnected} />
              )}
              {currentView === 'network' && (
                <NetworkAnalyzer networkHistory={networkHistory} threats={allThreats} sendMessage={sendMessage} />
              )}
              {currentView === 'ai-engine' && (
                <AIThinkingEngine threats={allThreats} systemStats={systemStats} />
              )}
              {currentView === 'system' && (
                <SystemMonitor systemStats={systemStats} />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Notifications */}
      <NotificationStack notifications={notifications} />

      {/* Voice command overlay */}
      <AnimatePresence>
        {showVoice && (
          <VoiceCommand
            onCommand={handleVoiceCommand}
            onClose={() => setShowVoice(false)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

// ─────────────────────────────────────────────
// Top status bar component
// ─────────────────────────────────────────────
function TopBar({ isConnected, threats, theme, onVoiceToggle }) {
  const [time, setTime] = useState(new Date())
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  const criticalCount = threats.filter(t => t.level === 'CRITICAL').length

  return (
    <div className="h-10 flex items-center justify-between px-4 border-b border-cyber-border bg-cyber-panel/80 backdrop-blur-sm z-10 flex-shrink-0">
      {/* Left: Logo */}
      <div className="flex items-center gap-3">
        <span className="font-cyber text-sm font-black text-glow-green tracking-widest glitch-text">
          NEURO-X
        </span>
        <span className="text-xs text-green-700">v2.1.0</span>
        <span className="text-green-900 mx-1">|</span>
        <span className={`text-xs flex items-center gap-1 ${isConnected ? 'text-glow-green' : 'text-glow-red'}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-neon-green pulse-dot' : 'bg-neon-red'}`} />
          {isConnected ? 'BACKEND CONNECTED' : 'DEMO MODE'}
        </span>
      </div>

      {/* Center: System time */}
      <div className="font-mono text-xs text-green-500 tracking-widest">
        {time.toLocaleDateString('en', { weekday: 'short' }).toUpperCase()} &nbsp;
        <span className="text-glow-green font-bold">
          {time.toLocaleTimeString('en', { hour12: false })}
        </span>
      </div>

      {/* Right: Status indicators */}
      <div className="flex items-center gap-4 text-xs">
        {criticalCount > 0 && (
          <span className="text-glow-red threat-blink font-mono">
            ⚠ {criticalCount} CRITICAL
          </span>
        )}
        <button
          onClick={onVoiceToggle}
          className="text-green-600 hover:text-neon-green transition-colors font-mono tracking-wide"
          title="Voice Command (Ctrl+V)"
        >
          🎙 VOICE
        </button>
        <span className="text-green-700">SECURE SESSION</span>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// Floating notification stack
// ─────────────────────────────────────────────
function NotificationStack({ notifications }) {
  const colors = {
    CRITICAL: 'border-neon-red text-neon-red bg-red-950/30',
    HIGH: 'border-orange-500 text-orange-400 bg-orange-950/30',
    MEDIUM: 'border-yellow-500 text-yellow-400 bg-yellow-950/30',
    WARN: 'border-yellow-500 text-yellow-400 bg-yellow-950/30',
    INFO: 'border-neon-green text-neon-green bg-green-950/30',
    LOW: 'border-neon-blue text-neon-blue bg-blue-950/30',
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-xs">
      <AnimatePresence>
        {notifications.map((n) => (
          <motion.div
            key={n.id}
            initial={{ opacity: 0, x: 60, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 60, scale: 0.8 }}
            transition={{ duration: 0.2 }}
            className={`border rounded px-3 py-2 font-mono text-xs backdrop-blur-sm ${colors[n.level] || colors.INFO}`}
          >
            <div className="font-bold mb-0.5">[{n.level}]</div>
            <div className="leading-relaxed">{n.msg}</div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}

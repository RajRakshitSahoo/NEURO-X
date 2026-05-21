// components/LoginScreen.jsx
// Animated cyberpunk login screen with matrix rain background

import React, { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'

// ── Matrix rain canvas effect
function MatrixRain() {
  const canvasRef = useRef(null)
  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%^&*()ｦｧｨｩｪｫｬｭｮｯｰ'
    const fontSize = 13
    const cols = Math.floor(canvas.width / fontSize)
    const drops = Array(cols).fill(1)

    function draw() {
      ctx.fillStyle = 'rgba(0, 10, 0, 0.05)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.fillStyle = '#00ff41'
      ctx.font = `${fontSize}px JetBrains Mono, monospace`
      drops.forEach((y, i) => {
        const char = chars[Math.floor(Math.random() * chars.length)]
        const x = i * fontSize
        // Bright leading char
        ctx.fillStyle = i % 3 === 0 ? '#00ffff' : '#00ff41'
        ctx.globalAlpha = Math.random() > 0.95 ? 1 : 0.5
        ctx.fillText(char, x, y * fontSize)
        if (y * fontSize > canvas.height && Math.random() > 0.975) drops[i] = 0
        drops[i]++
      })
      ctx.globalAlpha = 1
    }

    const interval = setInterval(draw, 40)
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight }
    window.addEventListener('resize', resize)
    return () => { clearInterval(interval); window.removeEventListener('resize', resize) }
  }, [])

  return <canvas ref={canvasRef} className="absolute inset-0 z-0 opacity-30" />
}

// ── Typing text effect
function TypedText({ lines, speed = 40 }) {
  const [displayed, setDisplayed] = useState('')
  const [lineIdx, setLineIdx] = useState(0)
  const [charIdx, setCharIdx] = useState(0)

  useEffect(() => {
    if (lineIdx >= lines.length) return
    const line = lines[lineIdx]
    if (charIdx < line.length) {
      const t = setTimeout(() => {
        setDisplayed(prev => prev + line[charIdx])
        setCharIdx(c => c + 1)
      }, speed)
      return () => clearTimeout(t)
    } else {
      const t = setTimeout(() => {
        setDisplayed(prev => prev + '\n')
        setLineIdx(l => l + 1)
        setCharIdx(0)
      }, 300)
      return () => clearTimeout(t)
    }
  }, [lineIdx, charIdx, lines, speed])

  return (
    <pre className="text-xs text-green-600 font-mono whitespace-pre-wrap leading-relaxed">
      {displayed}
      <span className="text-neon-green animate-pulse">█</span>
    </pre>
  )
}

export default function LoginScreen({ onLogin }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [phase, setPhase] = useState('boot') // boot | login

  useEffect(() => {
    const t = setTimeout(() => setPhase('login'), 3200)
    return () => clearTimeout(t)
  }, [])

  const bootLines = [
    '> NEURO-X OS v2.1.0 — Initializing...',
    '> Loading neural threat modules...',
    '> Binding to network interfaces: eth0 wlan0',
    '> AI Engine: ONLINE',
    '> Threat database: 47,832 signatures loaded',
    '> WebSocket server: READY',
    '> All systems nominal — awaiting authentication',
  ]

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    await new Promise(r => setTimeout(r, 1200))
    const ok = onLogin(username, password)
    if (!ok) {
      setError('ACCESS DENIED — Invalid credentials')
      setLoading(false)
    }
  }

  return (
    <div className="relative w-screen h-screen bg-cyber-dark overflow-hidden flex items-center justify-center">
      <MatrixRain />

      {/* Radial glow behind card */}
      <div className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none">
        <div className="w-[600px] h-[600px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(0,255,65,0.06) 0%, transparent 70%)' }} />
      </div>

      {phase === 'boot' ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="z-10 w-[520px] p-6 cyber-panel rounded border border-cyber-border"
        >
          <div className="text-xs text-green-700 mb-1 font-mono">NEURO-X BOOT SEQUENCE</div>
          <div className="h-px bg-gradient-to-r from-neon-green via-transparent to-transparent mb-4 opacity-40" />
          <TypedText lines={bootLines} speed={35} />
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="z-10 w-[440px]"
        >
          {/* Logo */}
          <div className="text-center mb-8">
            {/* Animated hexagon ring */}
            <div className="relative inline-block mb-4">
              <svg width="80" height="80" viewBox="0 0 80 80" className="spin-slow">
                <polygon points="40,4 73,22 73,58 40,76 7,58 7,22"
                  fill="none" stroke="#00ff41" strokeWidth="1" strokeDasharray="6 3" opacity="0.5" />
              </svg>
              <svg width="80" height="80" viewBox="0 0 80 80" className="spin-reverse absolute inset-0">
                <polygon points="40,10 67,25 67,55 40,70 13,55 13,25"
                  fill="none" stroke="#00ffff" strokeWidth="0.5" opacity="0.4" />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="font-cyber text-xl font-black text-glow-green">NX</span>
              </div>
            </div>
            <h1 className="font-cyber text-3xl font-black text-glow-green tracking-[0.3em] glitch-text">
              NEURO-X
            </h1>
            <p className="text-xs text-green-700 tracking-[0.2em] mt-1 font-mono">
              AI CYBER INTELLIGENCE SYSTEM
            </p>
          </div>

          {/* Login card */}
          <div className="glass-card border border-cyber-border rounded-sm p-8 relative overflow-hidden">
            {/* Top scan line decoration */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-neon-green to-transparent opacity-60" />
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-neon-cyan to-transparent opacity-30" />

            <div className="text-xs text-green-700 font-mono mb-6 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-neon-green pulse-dot" />
              AUTHENTICATION REQUIRED
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs text-green-600 font-mono tracking-widest mb-2">
                  USER_ID
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  className="w-full bg-black/50 border border-green-900 focus:border-neon-green rounded-sm px-3 py-2.5 text-neon-green font-mono text-sm outline-none transition-all duration-200 focus:shadow-[0_0_8px_rgba(0,255,65,0.3)]"
                  placeholder="enter identifier..."
                  autoComplete="off"
                  spellCheck={false}
                />
              </div>

              <div>
                <label className="block text-xs text-green-600 font-mono tracking-widest mb-2">
                  CIPHER_KEY
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full bg-black/50 border border-green-900 focus:border-neon-green rounded-sm px-3 py-2.5 text-neon-green font-mono text-sm outline-none transition-all duration-200 focus:shadow-[0_0_8px_rgba(0,255,65,0.3)]"
                  placeholder="••••••••••"
                />
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-neon-red text-xs font-mono border border-red-900/50 bg-red-950/20 px-3 py-2 rounded-sm"
                >
                  ⚠ {error}
                </motion.div>
              )}

              <button
                type="submit"
                disabled={loading || !username || !password}
                className="w-full py-3 bg-transparent border border-neon-green text-neon-green font-cyber font-bold text-sm tracking-widest rounded-sm transition-all duration-300 hover:bg-neon-green hover:text-cyber-dark hover:shadow-neon-green disabled:opacity-40 disabled:cursor-not-allowed relative overflow-hidden group"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-3 h-3 border border-neon-green border-t-transparent rounded-full spin-fast" />
                    AUTHENTICATING...
                  </span>
                ) : (
                  'INITIATE ACCESS'
                )}
                <span className="absolute inset-0 bg-neon-green opacity-0 group-hover:opacity-5 transition-opacity" />
              </button>
            </form>

            <div className="mt-6 pt-4 border-t border-green-900/30 text-center">
              <p className="text-xs text-green-900 font-mono">
                DEFAULT: admin / neuro-x2024
              </p>
              <p className="text-xs text-green-900/50 font-mono mt-1">
                EDUCATIONAL USE ONLY — AUTHORIZED ACCESS
              </p>
            </div>
          </div>

          {/* Bottom warning */}
          <div className="mt-4 text-center">
            <p className="text-xs text-green-900 font-mono tracking-wide">
              ⚠ UNAUTHORIZED ACCESS IS PROHIBITED AND MONITORED
            </p>
          </div>
        </motion.div>
      )}
    </div>
  )
}

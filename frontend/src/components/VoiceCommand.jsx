// components/VoiceCommand.jsx
// Voice command overlay using Web Speech API

import React, { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import sounds from '../utils/soundEffects.js'

const COMMANDS = [
  { cmd: '"scan network"',        desc: 'Run full network scan' },
  { cmd: '"show active ports"',   desc: 'Display open ports' },
  { cmd: '"start deep analysis"', desc: 'AI deep analysis mode' },
  { cmd: '"enable stealth monitor"', desc: 'Switch to passive mode' },
  { cmd: '"show threats"',        desc: 'View threat dashboard' },
  { cmd: '"export logs"',         desc: 'Download log file' },
]

export default function VoiceCommand({ onCommand, onClose }) {
  const [listening, setListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [status, setStatus] = useState('READY')
  const [supported, setSupported] = useState(true)
  const recognitionRef = useRef(null)

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) { setSupported(false); return }

    const rec = new SpeechRecognition()
    rec.continuous = false
    rec.interimResults = true
    rec.lang = 'en-US'
    recognitionRef.current = rec

    rec.onstart = () => { setListening(true); setStatus('LISTENING...'); setTranscript('') }
    rec.onend = () => { setListening(false); setStatus('PROCESSING...') }
    rec.onerror = (e) => {
      setListening(false)
      setStatus(`ERROR: ${e.error.toUpperCase()}`)
      setTimeout(() => setStatus('READY'), 2000)
    }
    rec.onresult = (e) => {
      const t = Array.from(e.results).map(r => r[0].transcript).join('')
      setTranscript(t)
      if (e.results[e.results.length - 1].isFinal) {
        setStatus('COMMAND RECOGNIZED')
        sounds.success()
        setTimeout(() => { onCommand(t); }, 500)
      }
    }

    return () => { rec.abort() }
  }, [onCommand])

  const startListening = () => {
    if (!recognitionRef.current || listening) return
    sounds.voiceOn()
    recognitionRef.current.start()
  }

  const stopListening = () => {
    if (!recognitionRef.current) return
    recognitionRef.current.stop()
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.85, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.85, opacity: 0, y: 20 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        className="w-[480px] glass-card border border-cyber-border rounded-sm p-6"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-cyber text-sm font-bold text-glow-green tracking-widest">VOICE COMMAND</h2>
            <p className="text-[10px] text-green-700 font-mono mt-0.5">NEURO-X Voice Interface v1.0</p>
          </div>
          <button onClick={onClose} className="text-green-700 hover:text-neon-green text-xl transition-colors">×</button>
        </div>

        {!supported ? (
          <div className="text-center py-6">
            <div className="text-4xl mb-3">🎙</div>
            <p className="text-yellow-400 font-mono text-sm">Browser does not support Speech Recognition</p>
            <p className="text-green-700 font-mono text-xs mt-2">Use Chrome or Edge for voice commands</p>
            <p className="text-green-700 font-mono text-xs mt-4">You can still type commands in the Terminal panel</p>
          </div>
        ) : (
          <>
            {/* Mic button */}
            <div className="flex justify-center mb-6">
              <button
                onClick={listening ? stopListening : startListening}
                className={`relative w-20 h-20 rounded-full border-2 transition-all duration-300 flex items-center justify-center ${
                  listening
                    ? 'border-neon-red bg-red-950/30 shadow-[0_0_20px_rgba(255,0,64,0.4)]'
                    : 'border-neon-green bg-green-950/20 hover:shadow-[0_0_20px_rgba(0,255,65,0.3)]'
                }`}
              >
                {/* Ripple rings when listening */}
                {listening && (
                  <>
                    <span className="absolute inset-0 rounded-full border border-neon-red animate-ping opacity-30" />
                    <span className="absolute -inset-3 rounded-full border border-neon-red animate-ping opacity-20" style={{ animationDelay: '0.2s' }} />
                  </>
                )}
                <span className="text-3xl relative z-10">🎙</span>
              </button>
            </div>

            {/* Status */}
            <div className="text-center mb-5">
              <div className={`font-mono text-sm font-bold tracking-widest ${listening ? 'text-neon-red' : 'text-neon-green'}`}>
                {status}
              </div>
              {transcript && (
                <div className="mt-2 px-3 py-2 bg-black/40 border border-green-900/40 rounded-sm font-mono text-xs text-neon-cyan">
                  "{transcript}"
                </div>
              )}
              {!listening && status === 'READY' && (
                <p className="text-green-700 text-[10px] font-mono mt-2">Click microphone to activate</p>
              )}
            </div>

            {/* Command list */}
            <div className="border-t border-green-900/30 pt-4">
              <div className="text-[9px] text-green-700 font-mono tracking-widest mb-3">AVAILABLE COMMANDS</div>
              <div className="space-y-1.5">
                {COMMANDS.map((c) => (
                  <div key={c.cmd} className="flex items-center gap-3">
                    <code className="text-[10px] font-mono text-neon-cyan">{c.cmd}</code>
                    <span className="text-green-800 text-[9px]">—</span>
                    <span className="text-green-700 text-[10px] font-mono">{c.desc}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Keyboard shortcut hint */}
            <div className="mt-4 pt-3 border-t border-green-900/20 text-center text-[9px] text-green-800 font-mono">
              Press <kbd className="border border-green-900/40 px-1 rounded text-green-700">Ctrl+V</kbd> to toggle voice command
            </div>
          </>
        )}
      </motion.div>
    </motion.div>
  )
}

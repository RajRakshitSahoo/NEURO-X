// components/Sidebar.jsx
// Cyberpunk sidebar with navigation, status, theme switcher

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import sounds from '../utils/soundEffects.js'

const NAV_ITEMS = [
  { id: 'dashboard', label: 'DASHBOARD',  icon: '⬡', shortcut: 'D' },
  { id: 'terminal',  label: 'TERMINAL',   icon: '⌨', shortcut: 'T' },
  { id: 'network',   label: 'NETWORK',    icon: '⬡', shortcut: 'N' },
  { id: 'ai-engine', label: 'AI ENGINE',  icon: '◈', shortcut: 'A' },
  { id: 'system',    label: 'SYSTEM',     icon: '◉', shortcut: 'S' },
]

const THEMES = [
  { id: 'green', color: '#00ff41', label: 'GREEN' },
  { id: 'blue',  color: '#0080ff', label: 'BLUE'  },
  { id: 'red',   color: '#ff0040', label: 'RED'   },
]

export default function Sidebar({
  currentView, setCurrentView, isConnected, threats,
  soundEnabled, setSoundEnabled, theme, setTheme,
  onExportLogs, onVoiceToggle,
}) {
  const [collapsed, setCollapsed] = useState(false)
  const [showSettings, setShowSettings] = useState(false)

  const critCount   = threats.filter(t => t.level === 'CRITICAL').length
  const highCount   = threats.filter(t => t.level === 'HIGH').length
  const totalAlerts = critCount + highCount

  return (
    <motion.div
      animate={{ width: collapsed ? 52 : 200 }}
      transition={{ duration: 0.25, ease: 'easeInOut' }}
      className="h-full flex-shrink-0 bg-cyber-panel border-r border-cyber-border flex flex-col relative z-20 overflow-hidden"
    >
      {/* ── Collapse toggle */}
      <button
        onClick={() => { setCollapsed(c => !c); sounds.click() }}
        className="absolute -right-3 top-16 z-30 w-6 h-6 rounded-full bg-cyber-panel border border-cyber-border flex items-center justify-center text-green-600 hover:text-neon-green text-xs transition-colors"
      >
        {collapsed ? '›' : '‹'}
      </button>

      {/* ── Top logo area */}
      <div className="px-3 py-4 border-b border-cyber-border/50 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 flex-shrink-0 relative">
            <svg viewBox="0 0 28 28" className="w-full h-full spin-slow">
              <polygon points="14,2 25,8 25,20 14,26 3,20 3,8"
                fill="none" stroke="#00ff41" strokeWidth="1" strokeDasharray="4 2" opacity="0.7"/>
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="font-cyber text-[8px] font-black text-glow-green">NX</span>
            </div>
          </div>
          {!collapsed && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
              <div className="font-cyber text-sm font-black text-glow-green tracking-widest leading-none">NEURO-X</div>
              <div className="text-[8px] text-green-700 font-mono tracking-wider mt-0.5">AI INTEL SYS</div>
            </motion.div>
          )}
        </div>
      </div>

      {/* ── Navigation */}
      <nav className="flex-1 py-3 overflow-y-auto overflow-x-hidden">
        <div className={`mb-2 ${collapsed ? 'px-2' : 'px-3'}`}>
          {!collapsed && <div className="text-[9px] text-green-800 font-mono tracking-widest mb-2">NAVIGATION</div>}
          {NAV_ITEMS.map((item) => {
            const active = currentView === item.id
            return (
              <button
                key={item.id}
                onClick={() => { setCurrentView(item.id); sounds.click() }}
                title={collapsed ? `${item.label} (Ctrl+${item.shortcut})` : ''}
                className={`
                  w-full flex items-center gap-2.5 px-2 py-2.5 mb-1 rounded-sm transition-all duration-150 text-left relative group
                  ${active
                    ? 'bg-neon-green/10 border border-neon-green/30 text-glow-green'
                    : 'border border-transparent text-green-700 hover:text-green-400 hover:bg-white/5'}
                `}
              >
                {/* Active indicator bar */}
                {active && <span className="absolute left-0 top-1 bottom-1 w-0.5 bg-neon-green rounded-full" />}
                <span className={`text-base flex-shrink-0 ${active ? 'text-neon-green' : 'text-green-700 group-hover:text-green-400'}`}>
                  {item.icon}
                </span>
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="font-mono text-[11px] font-semibold tracking-widest whitespace-nowrap"
                  >
                    {item.label}
                  </motion.span>
                )}
                {/* Alert badge on Dashboard */}
                {item.id === 'dashboard' && totalAlerts > 0 && (
                  <span className={`${collapsed ? 'absolute -top-1 -right-1' : 'ml-auto'} min-w-[16px] h-4 rounded-full bg-neon-red text-black text-[9px] font-bold flex items-center justify-center px-1 threat-blink`}>
                    {totalAlerts}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* ── Divider */}
        <div className={`my-3 ${collapsed ? 'mx-2' : 'mx-3'} h-px bg-green-900/40`} />

        {/* ── Quick actions */}
        <div className={`${collapsed ? 'px-2' : 'px-3'}`}>
          {!collapsed && <div className="text-[9px] text-green-800 font-mono tracking-widest mb-2">QUICK ACTIONS</div>}
          <button
            onClick={() => { onVoiceToggle(); sounds.voiceOn() }}
            title={collapsed ? 'Voice Command (Ctrl+V)' : ''}
            className="w-full flex items-center gap-2.5 px-2 py-2 mb-1 rounded-sm text-green-700 hover:text-green-400 hover:bg-white/5 transition-colors border border-transparent"
          >
            <span className="text-base flex-shrink-0">🎙</span>
            {!collapsed && <span className="font-mono text-[11px] tracking-widest">VOICE CMD</span>}
          </button>
          <button
            onClick={() => { onExportLogs(); sounds.click() }}
            title={collapsed ? 'Export Logs (Ctrl+L)' : ''}
            className="w-full flex items-center gap-2.5 px-2 py-2 mb-1 rounded-sm text-green-700 hover:text-green-400 hover:bg-white/5 transition-colors border border-transparent"
          >
            <span className="text-base flex-shrink-0">↓</span>
            {!collapsed && <span className="font-mono text-[11px] tracking-widest">EXPORT LOGS</span>}
          </button>
          <button
            onClick={() => { setShowSettings(s => !s); sounds.click() }}
            className="w-full flex items-center gap-2.5 px-2 py-2 mb-1 rounded-sm text-green-700 hover:text-green-400 hover:bg-white/5 transition-colors border border-transparent"
          >
            <span className="text-base flex-shrink-0">⚙</span>
            {!collapsed && <span className="font-mono text-[11px] tracking-widest">SETTINGS</span>}
          </button>
        </div>

        {/* ── Settings panel */}
        <AnimatePresence>
          {showSettings && !collapsed && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden mx-3 mt-1"
            >
              <div className="bg-black/40 border border-green-900/30 rounded-sm p-3 space-y-3">
                {/* Sound toggle */}
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-green-700 font-mono">SOUND FX</span>
                  <button
                    onClick={() => { setSoundEnabled(s => !s); sounds.click() }}
                    className={`w-8 h-4 rounded-full relative transition-colors ${soundEnabled ? 'bg-neon-green/40' : 'bg-green-900/40'}`}
                  >
                    <span className={`absolute top-0.5 w-3 h-3 rounded-full transition-all ${soundEnabled ? 'right-0.5 bg-neon-green' : 'left-0.5 bg-green-800'}`} />
                  </button>
                </div>
                {/* Theme switcher */}
                <div>
                  <div className="text-[10px] text-green-700 font-mono mb-1.5">THEME COLOR</div>
                  <div className="flex gap-1.5">
                    {THEMES.map(t => (
                      <button
                        key={t.id}
                        onClick={() => { setTheme(t.id); sounds.click() }}
                        title={t.label}
                        className={`w-5 h-5 rounded-sm border-2 transition-all ${theme === t.id ? 'scale-110' : 'opacity-50 hover:opacity-80'}`}
                        style={{ backgroundColor: t.color + '30', borderColor: t.color }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* ── Bottom status */}
      <div className={`border-t border-cyber-border/50 p-3 flex-shrink-0 space-y-2`}>
        {/* Connection status */}
        <div className={`flex items-center gap-2 ${collapsed ? 'justify-center' : ''}`}>
          <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${isConnected ? 'bg-neon-green pulse-dot' : 'bg-neon-red'}`} />
          {!collapsed && (
            <span className="text-[9px] font-mono text-green-700 truncate">
              {isConnected ? 'WS CONNECTED' : 'DEMO MODE'}
            </span>
          )}
        </div>
        {/* Threat count */}
        {!collapsed && (
          <div className="text-[9px] font-mono text-green-800">
            THREATS: <span className={totalAlerts > 0 ? 'text-neon-red' : 'text-green-600'}>{totalAlerts}</span>
          </div>
        )}
      </div>
    </motion.div>
  )
}

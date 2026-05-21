// components/AIThinkingEngine.jsx
// Visual AI "brain" — continuous reasoning stream, confidence meter, recommendation cards

import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

// ── Deep reasoning patterns for the AI engine
const REASONING_CHAINS = [
  {
    title: 'BEHAVIORAL ANOMALY ANALYSIS',
    steps: [
      'Loading 72-hour behavioral baseline...',
      'Computing statistical deviation matrix...',
      'Identified 3 behavioral outliers in traffic pattern',
      'Correlating with MITRE ATT&CK framework...',
      'Pattern matches: T1046 (Network Service Discovery)',
      'Confidence: 78% — MEDIUM risk classification',
    ],
    confidence: 78, type: 'BEHAVIORAL', color: '#ffd700',
  },
  {
    title: 'PACKET ENTROPY ASSESSMENT',
    steps: [
      'Sampling 10,000 packets from eth0...',
      'Computing Shannon entropy per protocol layer...',
      'TCP payload entropy: 7.2 bits (normal: 4-6)',
      'Elevated entropy suggests encrypted tunneling',
      'DNS over HTTPS traffic spike detected (+340%)',
      'Possible data exfiltration channel — monitoring',
    ],
    confidence: 62, type: 'NETWORK', color: '#00ffff',
  },
  {
    title: 'THREAT ACTOR PROFILING',
    steps: [
      'Extracting IOC fingerprints from flagged IPs...',
      'Cross-referencing threat intelligence feeds...',
      'IP 185.220.101.* matches Tor exit node range',
      'Geolocation: Multiple jurisdictions (VPN chain)',
      'TTP correlation: APT-style persistence mechanisms',
      'Confidence: 91% — Sophisticated threat actor',
    ],
    confidence: 91, type: 'THREAT ACTOR', color: '#ff0040',
  },
  {
    title: 'LATERAL MOVEMENT DETECTION',
    steps: [
      'Scanning internal network for anomalous connections...',
      'Mapping SMB access patterns...',
      'Detected unusual authentication attempts: 47',
      'Source host 192.168.1.105 accessing 18 shares',
      'Pass-the-hash attack signature identified',
      'Recommendation: Isolate 192.168.1.105 immediately',
    ],
    confidence: 88, type: 'INTRUSION', color: '#ff0040',
  },
  {
    title: 'MALWARE SIGNATURE SCAN',
    steps: [
      'Loading YARA ruleset — 12,441 rules active...',
      'Scanning process memory dumps...',
      'Checking network signatures against 47,832 patterns',
      'PE header analysis on 3 suspicious processes...',
      'No malware signatures matched — clean scan',
      'Heuristic score: 0.12 / 10 — LOW risk',
    ],
    confidence: 12, type: 'MALWARE', color: '#00ff41',
  },
]

const RECOMMENDATIONS = [
  { icon: '🛡', title: 'Enable Rate Limiting', desc: 'Apply 100 req/min limit on SSH to block brute-force attempts', priority: 'HIGH' },
  { icon: '🔒', title: 'Update Firewall Rules', desc: 'Block outbound traffic to flagged Tor exit nodes (185.220.x.x)', priority: 'CRITICAL' },
  { icon: '⚙', title: 'Patch Vulnerable Service', desc: 'Apache 2.4.49 running — CVE-2021-41773 exploitable. Upgrade immediately', priority: 'CRITICAL' },
  { icon: '📊', title: 'Enable Full Packet Capture', desc: 'Suspicious traffic warrants deep packet inspection logging', priority: 'MEDIUM' },
  { icon: '🔑', title: 'Rotate Credentials', desc: 'Lateral movement detected — rotate all service account passwords', priority: 'HIGH' },
]

// ── Animated neural network visualization
function NeuralViz({ active }) {
  const canvasRef = useRef(null)
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    canvas.width = canvas.offsetWidth
    canvas.height = canvas.offsetHeight

    // Define network layers
    const layers = [
      { nodes: 4, x: 0.15 },
      { nodes: 6, x: 0.35 },
      { nodes: 8, x: 0.55 },
      { nodes: 6, x: 0.75 },
      { nodes: 3, x: 0.90 },
    ]

    const nodes = []
    layers.forEach((layer) => {
      for (let n = 0; n < layer.nodes; n++) {
        nodes.push({
          x: layer.x * canvas.width,
          y: ((n + 1) / (layer.nodes + 1)) * canvas.height,
          layer: layers.indexOf(layer),
          pulse: Math.random(),
          pulseSpeed: 0.02 + Math.random() * 0.04,
          active: Math.random() > 0.3,
        })
      }
    })

    let animId
    function draw(t) {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Draw connections
      nodes.forEach((n1) => {
        nodes.filter(n2 => n2.layer === n1.layer + 1).forEach((n2) => {
          if (Math.random() > 0.7) return
          const alpha = (n1.active && n2.active) ? (0.06 + Math.sin(t * 0.002 + n1.pulse) * 0.04) : 0.02
          ctx.globalAlpha = alpha
          ctx.strokeStyle = active ? '#00ff41' : '#004400'
          ctx.lineWidth = 0.5
          ctx.beginPath()
          ctx.moveTo(n1.x, n1.y)
          ctx.lineTo(n2.x, n2.y)
          ctx.stroke()
        })
      })

      // Draw nodes
      nodes.forEach((n) => {
        n.pulse += n.pulseSpeed
        const pulse = (Math.sin(n.pulse) + 1) / 2
        const r = n.active ? 3 + pulse * 2 : 2

        // Glow
        if (n.active && active) {
          ctx.globalAlpha = 0.15 * pulse
          ctx.fillStyle = '#00ff41'
          ctx.beginPath()
          ctx.arc(n.x, n.y, r * 3, 0, Math.PI * 2)
          ctx.fill()
        }

        ctx.globalAlpha = n.active ? 0.6 + pulse * 0.4 : 0.2
        ctx.fillStyle = n.active ? (active ? '#00ff41' : '#004400') : '#002200'
        ctx.beginPath()
        ctx.arc(n.x, n.y, r, 0, Math.PI * 2)
        ctx.fill()
      })

      ctx.globalAlpha = 1
      animId = requestAnimationFrame(draw)
    }
    animId = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(animId)
  }, [active])

  return <canvas ref={canvasRef} className="w-full h-full" />
}

// ── AI reasoning chain display
function ReasoningChain({ chain, onComplete }) {
  const [step, setStep] = useState(0)
  const [done, setDone] = useState(false)

  useEffect(() => {
    setStep(0); setDone(false)
  }, [chain])

  useEffect(() => {
    if (step >= chain.steps.length) { setDone(true); onComplete?.(); return }
    const t = setTimeout(() => setStep(s => s + 1), 700 + Math.random() * 500)
    return () => clearTimeout(t)
  }, [step, chain])

  return (
    <div className="space-y-1.5">
      {chain.steps.slice(0, step).map((s, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex gap-2 font-mono text-xs"
        >
          <span className="text-green-800 flex-shrink-0">{'  >>'}</span>
          <span className={i === step - 1 && !done ? 'text-neon-cyan' : 'text-green-500'}>{s}</span>
        </motion.div>
      ))}
      {!done && step < chain.steps.length && (
        <div className="flex gap-2 font-mono text-xs text-green-800">
          <span>  {'>'}</span>
          <span className="cursor-blink">processing</span>
        </div>
      )}
    </div>
  )
}

export default function AIThinkingEngine({ threats, systemStats }) {
  const [chainIdx, setChainIdx] = useState(0)
  const [analysisRunning, setAnalysisRunning] = useState(true)
  const [cycleCount, setCycleCount] = useState(0)
  const chain = REASONING_CHAINS[chainIdx % REASONING_CHAINS.length]

  const nextChain = () => {
    setChainIdx(i => i + 1)
    setCycleCount(c => c + 1)
  }

  // Auto-cycle chains
  useEffect(() => {
    if (!analysisRunning) return
    const t = setTimeout(() => nextChain(), 8000)
    return () => clearTimeout(t)
  }, [chainIdx, analysisRunning])

  const priorityColors = { CRITICAL: 'border-red-900/60 text-red-400', HIGH: 'border-orange-900/50 text-orange-400', MEDIUM: 'border-yellow-900/40 text-yellow-400' }

  return (
    <div className="h-full overflow-y-auto p-4 grid grid-cols-5 gap-4">

      {/* ── Left column: Neural viz + status */}
      <div className="col-span-2 flex flex-col gap-4">

        {/* Neural network visualization */}
        <div className="glass-card p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-mono text-green-600 tracking-widest">NEURAL NETWORK</span>
            <div className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${analysisRunning ? 'bg-neon-green pulse-dot' : 'bg-green-900'}`} />
              <span className="text-[9px] font-mono text-green-700">{analysisRunning ? 'ACTIVE' : 'IDLE'}</span>
            </div>
          </div>
          <div className="h-36 relative">
            <NeuralViz active={analysisRunning} />
          </div>
          <div className="mt-3 flex gap-2">
            <button
              onClick={() => setAnalysisRunning(a => !a)}
              className={`flex-1 py-1.5 text-[10px] font-mono font-bold border rounded-sm transition-colors ${analysisRunning ? 'border-neon-green text-neon-green hover:bg-neon-green/10' : 'border-green-900 text-green-700 hover:border-green-600'}`}
            >
              {analysisRunning ? '⏸ PAUSE' : '▶ RESUME'}
            </button>
            <button
              onClick={() => { setChainIdx(i => i + 1); setCycleCount(c => c + 1) }}
              className="flex-1 py-1.5 text-[10px] font-mono border border-green-900 text-green-700 hover:border-green-600 rounded-sm transition-colors"
            >
              ⏭ NEXT
            </button>
          </div>
        </div>

        {/* Confidence meter */}
        <div className="glass-card p-4">
          <div className="text-[10px] font-mono text-green-600 tracking-widest mb-3">CONFIDENCE METER</div>
          <div className="relative">
            <div className="text-5xl font-mono font-black text-center mb-2"
              style={{ color: chain.color, textShadow: `0 0 20px ${chain.color}60` }}>
              {chain.confidence}%
            </div>
            <div className="h-2 bg-green-950 rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ background: chain.color }}
                initial={{ width: 0 }}
                animate={{ width: `${chain.confidence}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
              />
            </div>
            <div className="flex justify-between text-[9px] font-mono text-green-800 mt-1">
              <span>LOW RISK</span><span>HIGH RISK</span>
            </div>
          </div>
          <div className="mt-3 text-center">
            <span className="text-[9px] font-mono px-2 py-1 border rounded-sm" style={{ borderColor: chain.color + '60', color: chain.color }}>
              {chain.type}
            </span>
          </div>
        </div>

        {/* Stats */}
        <div className="glass-card p-4">
          <div className="text-[10px] font-mono text-green-600 tracking-widest mb-3">AI STATS</div>
          <div className="space-y-2 text-xs font-mono">
            {[
              { l: 'ANALYSES RUN', v: 1248 + cycleCount },
              { l: 'THREATS FOUND', v: threats.length },
              { l: 'FALSE POSITIVES', v: 3 },
              { l: 'MODEL ACCURACY', v: '96.4%' },
              { l: 'SIGNATURES', v: '47,832' },
            ].map(r => (
              <div key={r.l} className="flex justify-between border-b border-green-900/20 pb-1.5">
                <span className="text-green-800">{r.l}</span>
                <span className="text-neon-green">{r.v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right column: Reasoning chain + recommendations */}
      <div className="col-span-3 flex flex-col gap-4">

        {/* Active reasoning */}
        <div className="glass-card p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-mono text-green-600 tracking-widest">ACTIVE REASONING</span>
            <span className="text-[9px] font-mono text-neon-cyan" style={{ color: chain.color }}>
              {chain.type}
            </span>
          </div>
          <div className="font-cyber text-sm font-bold mb-3" style={{ color: chain.color }}>
            {chain.title}
          </div>
          <div className="bg-black/40 rounded-sm p-3 font-mono text-xs min-h-[140px]">
            <div className="text-neon-green mb-2 font-bold">{'> AI Reasoning:'}</div>
            <ReasoningChain key={chainIdx} chain={chain} onComplete={() => {}} />
          </div>
        </div>

        {/* Recommendations */}
        <div className="glass-card p-4">
          <div className="text-[10px] font-mono text-green-600 tracking-widest mb-3">AI RECOMMENDATIONS</div>
          <div className="space-y-2">
            {RECOMMENDATIONS.map((r, i) => (
              <motion.div
                key={r.title}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className={`border rounded-sm p-3 flex gap-3 ${priorityColors[r.priority] || 'border-green-900/30 text-green-500'}`}
              >
                <span className="text-lg flex-shrink-0">{r.icon}</span>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-xs font-bold">{r.title}</span>
                    <span className={`text-[9px] font-mono px-1 border rounded-sm ${priorityColors[r.priority]}`}>{r.priority}</span>
                  </div>
                  <p className="text-[10px] font-mono text-green-700 leading-relaxed">{r.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

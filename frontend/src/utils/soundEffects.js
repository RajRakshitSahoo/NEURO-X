// utils/soundEffects.js
// Web Audio API sound effects for NEURO-X cyberpunk UI

let audioCtx = null

function getCtx() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)()
  }
  return audioCtx
}

// Beep tone generator
function beep(freq = 440, duration = 0.1, gain = 0.15, type = 'square') {
  try {
    const ctx = getCtx()
    const osc = ctx.createOscillator()
    const gainNode = ctx.createGain()
    osc.connect(gainNode)
    gainNode.connect(ctx.destination)
    osc.type = type
    osc.frequency.setValueAtTime(freq, ctx.currentTime)
    gainNode.gain.setValueAtTime(gain, ctx.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + duration)
  } catch (e) { /* Silent fail */ }
}

export const sounds = {
  // UI click
  click: () => beep(800, 0.05, 0.1, 'square'),

  // Navigation change
  navigate: () => {
    beep(600, 0.06, 0.08)
    setTimeout(() => beep(900, 0.06, 0.08), 60)
  },

  // Alert / threat detected
  alert: () => {
    beep(400, 0.15, 0.2, 'sawtooth')
    setTimeout(() => beep(300, 0.15, 0.2, 'sawtooth'), 200)
  },

  // Critical threat
  critical: () => {
    for (let i = 0; i < 3; i++) {
      setTimeout(() => beep(220, 0.2, 0.25, 'sawtooth'), i * 250)
    }
  },

  // Scan sweep sound
  scan: () => {
    const ctx = getCtx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.type = 'sine'
    osc.frequency.setValueAtTime(200, ctx.currentTime)
    osc.frequency.linearRampToValueAtTime(2000, ctx.currentTime + 1)
    gain.gain.setValueAtTime(0.1, ctx.currentTime)
    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 1)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 1)
  },

  // Keystroke for terminal
  keyStroke: () => beep(1200 + Math.random() * 200, 0.03, 0.05, 'square'),

  // Login success
  success: () => {
    beep(523, 0.1, 0.1) // C
    setTimeout(() => beep(659, 0.1, 0.1), 100) // E
    setTimeout(() => beep(784, 0.2, 0.15), 200) // G
  },

  // System start
  startup: () => {
    const freqs = [261, 329, 392, 523]
    freqs.forEach((f, i) => setTimeout(() => beep(f, 0.15, 0.12, 'sine'), i * 100))
  },

  // Voice command activated
  voiceOn: () => {
    beep(1000, 0.08, 0.15, 'sine')
    setTimeout(() => beep(1500, 0.08, 0.15, 'sine'), 80)
  },
}

export default sounds

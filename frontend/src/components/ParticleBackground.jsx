// components/ParticleBackground.jsx
// Animated particle system rendered on canvas

import React, { useEffect, useRef } from 'react'

export default function ParticleBackground({ color = '#00ff41' }) {
  const canvasRef = useRef(null)
  const colorRef = useRef(color)

  useEffect(() => { colorRef.current = color }, [color])

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    let animId

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    // Particle class
    class Particle {
      constructor() { this.reset() }
      reset() {
        this.x = Math.random() * canvas.width
        this.y = Math.random() * canvas.height
        this.vx = (Math.random() - 0.5) * 0.3
        this.vy = (Math.random() - 0.5) * 0.3
        this.size = Math.random() * 1.5 + 0.3
        this.alpha = Math.random() * 0.4 + 0.05
        this.life = Math.random() * 300 + 100
        this.maxLife = this.life
      }
      update() {
        this.x += this.vx
        this.y += this.vy
        this.life--
        if (this.life <= 0 || this.x < 0 || this.x > canvas.width ||
            this.y < 0 || this.y > canvas.height) this.reset()
      }
      draw() {
        const fadeRatio = this.life / this.maxLife
        ctx.globalAlpha = this.alpha * fadeRatio
        ctx.fillStyle = colorRef.current
        ctx.beginPath()
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    const NUM_PARTICLES = 80
    const particles = Array.from({ length: NUM_PARTICLES }, () => new Particle())

    // Connection lines between nearby particles
    function drawConnections() {
      const maxDist = 100
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x
          const dy = particles[i].y - particles[j].y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < maxDist) {
            ctx.globalAlpha = (1 - dist / maxDist) * 0.08
            ctx.strokeStyle = colorRef.current
            ctx.lineWidth = 0.5
            ctx.beginPath()
            ctx.moveTo(particles[i].x, particles[i].y)
            ctx.lineTo(particles[j].x, particles[j].y)
            ctx.stroke()
          }
        }
      }
    }

    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      particles.forEach(p => { p.update(); p.draw() })
      drawConnections()
      ctx.globalAlpha = 1
      animId = requestAnimationFrame(animate)
    }
    animate()

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 z-0 pointer-events-none"
      style={{ opacity: 0.6 }}
    />
  )
}

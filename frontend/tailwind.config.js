/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'neon-green': '#00ff41',
        'neon-blue': '#0080ff',
        'neon-cyan': '#00ffff',
        'neon-red': '#ff0040',
        'neon-yellow': '#ffff00',
        'cyber-dark': '#000a00',
        'cyber-panel': '#001100',
        'cyber-border': '#00ff4133',
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', '"Fira Code"', 'Consolas', 'monospace'],
        cyber: ['"Orbitron"', '"Rajdhani"', 'sans-serif'],
      },
      boxShadow: {
        'neon-green': '0 0 10px #00ff41, 0 0 20px #00ff4180, 0 0 40px #00ff4140',
        'neon-blue': '0 0 10px #0080ff, 0 0 20px #0080ff80, 0 0 40px #0080ff40',
        'neon-red': '0 0 10px #ff0040, 0 0 20px #ff004080',
        'neon-cyan': '0 0 10px #00ffff, 0 0 20px #00ffff80',
      },
      animation: {
        'pulse-fast': 'pulse 0.8s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'scan-line': 'scanLine 3s linear infinite',
        'matrix-fall': 'matrixFall 2s linear infinite',
        'glitch': 'glitch 0.3s infinite',
        'type-cursor': 'typeCursor 1s step-end infinite',
      },
      keyframes: {
        scanLine: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100vh)' },
        },
        glitch: {
          '0%, 100%': { transform: 'translate(0)' },
          '20%': { transform: 'translate(-2px, 2px)' },
          '40%': { transform: 'translate(-2px, -2px)' },
          '60%': { transform: 'translate(2px, 2px)' },
          '80%': { transform: 'translate(2px, -2px)' },
        },
        typeCursor: {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0 },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
}

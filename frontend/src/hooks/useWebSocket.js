// hooks/useWebSocket.js
// Manages real-time WebSocket connection to the NEURO-X Python backend

import { useState, useEffect, useRef, useCallback } from 'react'

const WS_URL = 'ws://localhost:8000/ws'
const RECONNECT_INTERVAL = 3000

export function useWebSocket() {
  const [isConnected, setIsConnected] = useState(false)
  const [lastMessage, setLastMessage] = useState(null)
  const [connectionAttempts, setConnectionAttempts] = useState(0)
  const wsRef = useRef(null)
  const reconnectTimer = useRef(null)

  const connect = useCallback(() => {
    try {
      const ws = new WebSocket(WS_URL)
      wsRef.current = ws

      ws.onopen = () => {
        console.log('[NEURO-X] WebSocket connected')
        setIsConnected(true)
        setConnectionAttempts(0)
        // Send initial handshake
        ws.send(JSON.stringify({ type: 'init', client: 'neuro-x-frontend' }))
      }

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          setLastMessage(data)
        } catch (e) {
          console.warn('[NEURO-X] Failed to parse WS message:', e)
        }
      }

      ws.onclose = () => {
        console.warn('[NEURO-X] WebSocket disconnected, retrying...')
        setIsConnected(false)
        // Auto-reconnect
        reconnectTimer.current = setTimeout(() => {
          setConnectionAttempts((a) => a + 1)
          connect()
        }, RECONNECT_INTERVAL)
      }

      ws.onerror = (err) => {
        console.error('[NEURO-X] WebSocket error:', err)
        ws.close()
      }
    } catch (e) {
      console.error('[NEURO-X] Failed to create WebSocket:', e)
      setIsConnected(false)
    }
  }, [])

  useEffect(() => {
    connect()
    return () => {
      clearTimeout(reconnectTimer.current)
      if (wsRef.current) wsRef.current.close()
    }
  }, [connect])

  const sendMessage = useCallback((data) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data))
    }
  }, [])

  return { isConnected, lastMessage, sendMessage, connectionAttempts }
}

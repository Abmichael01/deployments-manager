import { useEffect, useRef, useState, useCallback } from "react"
import type { PM2LogMessage, PM2WebSocketMessage } from "@/types"

interface UsePM2WebSocketOptions {
  serviceName: string
  baseUrl: string
  logType?: "both" | "out" | "error"
  enabled?: boolean
  maxLogs?: number
}

interface UsePM2WebSocketReturn {
  logs: PM2LogMessage[]
  isConnected: boolean
  error: string | null
  connect: () => void
  disconnect: () => void
  clearLogs: () => void
}

export function usePM2WebSocket({
  serviceName,
  baseUrl,
  logType = "both",
  enabled = true,
  maxLogs = 5000,
}: UsePM2WebSocketOptions): UsePM2WebSocketReturn {
  const [logs, setLogs] = useState<PM2LogMessage[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const reconnectAttemptsRef = useRef(0)
  const maxReconnectAttempts = 5

  const clearLogs = useCallback(() => {
    setLogs([])
  }, [])

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return
    }

    // Clean up any existing connection first
    if (wsRef.current) {
      try {
        wsRef.current.close()
      } catch (e) {
        // Ignore errors when closing
      }
      wsRef.current = null
    }

    if (!baseUrl || !serviceName) {
      setError("Missing base URL or service name")
      return
    }

    try {
      // Convert http/https to ws/wss
      const wsUrl = baseUrl
        .replace(/^http:/, "ws:")
        .replace(/^https:/, "wss:")
        .replace(/\/$/, "")
      const url = `${wsUrl}/pm2/${serviceName}?type=${logType}`

      const ws = new WebSocket(url)
      wsRef.current = ws

      ws.onopen = () => {
        setIsConnected(true)
        setError(null)
        reconnectAttemptsRef.current = 0

        // Set up ping interval only after connection is open
        if (pingIntervalRef.current) {
          clearInterval(pingIntervalRef.current)
        }
        pingIntervalRef.current = setInterval(() => {
          if (wsRef.current?.readyState === WebSocket.OPEN) {
            try {
              wsRef.current.send(JSON.stringify({ type: "ping" }))
            } catch (err) {
              console.error("Error sending ping:", err)
            }
          }
        }, 30000)
      }

      ws.onmessage = (event) => {
        try {
          const data: PM2WebSocketMessage = JSON.parse(event.data)

          switch (data.type) {
            case "connected":
              setIsConnected(true)
              setError(null)
              break

            case "log":
              setLogs((prev) => {
                const newLogs = [...prev, data]
                // Keep only last maxLogs entries
                return newLogs.slice(-maxLogs)
              })
              break

            case "error":
              setError(data.message)
              break

            case "pong":
              // Keep-alive response
              break
          }
        } catch (err) {
          console.error("Error parsing WebSocket message:", err)
        }
      }

      ws.onerror = (err) => {
        // WebSocket error event doesn't provide much detail, error will be in onclose
        // Only log if we have actual error details
        if (err && Object.keys(err).length > 0) {
          console.error("WebSocket error:", err)
        }
        setError("Connection error - check service name and URL")
        setIsConnected(false)
        // Clean up ping interval on error
        if (pingIntervalRef.current) {
          clearInterval(pingIntervalRef.current)
          pingIntervalRef.current = null
        }
      }

      ws.onclose = (event) => {
        setIsConnected(false)
        // Clean up ping interval on close
        if (pingIntervalRef.current) {
          clearInterval(pingIntervalRef.current)
          pingIntervalRef.current = null
        }

        // Set error message based on close code
        if (event.code !== 1000) {
          if (event.code === 1006) {
            setError("Connection closed abnormally")
          } else if (event.code === 1002) {
            setError("Protocol error")
          } else if (event.code === 1003) {
            setError("Unsupported data")
          } else {
            setError(`Connection closed (code: ${event.code})`)
          }
        }

        // Attempt to reconnect if not a normal closure and enabled
        if (
          event.code !== 1000 &&
          reconnectAttemptsRef.current < maxReconnectAttempts &&
          enabled
        ) {
          reconnectAttemptsRef.current += 1
          reconnectTimeoutRef.current = setTimeout(() => {
            connect()
          }, 2000 * reconnectAttemptsRef.current) // Exponential backoff
        }
      }
    } catch (err) {
      console.error("Error creating WebSocket:", err)
      setError("Failed to create WebSocket connection")
      setIsConnected(false)
    }
  }, [serviceName, baseUrl, logType])

  const disconnect = useCallback(() => {
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current)
      pingIntervalRef.current = null
    }

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }

    if (wsRef.current) {
      wsRef.current.close(1000, "User disconnected")
      wsRef.current = null
    }

    setIsConnected(false)
    reconnectAttemptsRef.current = 0
  }, [])

  useEffect(() => {
    if (enabled && serviceName && baseUrl) {
      connect()
    } else {
      disconnect()
    }

    return () => {
      disconnect()
    }
  }, [enabled, serviceName, baseUrl, logType, connect, disconnect])

  return {
    logs,
    isConnected,
    error,
    connect,
    disconnect,
    clearLogs,
  }
}


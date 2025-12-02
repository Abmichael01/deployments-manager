"use client"

import { useState, useRef, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { ArrowDown, Trash2, Play, Square } from "lucide-react"
import { usePM2WebSocket } from "@/hooks/use-pm2-websocket"

interface PM2RealtimeLogsProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  serviceName: string
  baseUrl: string
}

export function PM2RealtimeLogs({
  open,
  onOpenChange,
  serviceName,
  baseUrl,
}: PM2RealtimeLogsProps) {
  const [logType, setLogType] = useState<"both" | "out" | "error">("both")
  const [autoScroll, setAutoScroll] = useState(true)
  const logsContainerRef = useRef<HTMLDivElement>(null)

  const { logs, isConnected, error, connect, disconnect, clearLogs } = usePM2WebSocket({
    serviceName,
    baseUrl,
    logType,
    enabled: open,
    maxLogs: 5000,
  })

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    if (autoScroll && logs.length > 0 && logsContainerRef.current) {
      logsContainerRef.current.scrollTop = logsContainerRef.current.scrollHeight
    }
  }, [logs, autoScroll])

  const scrollToBottom = () => {
    if (logsContainerRef.current) {
      logsContainerRef.current.scrollTo({
        top: logsContainerRef.current.scrollHeight,
        behavior: "smooth",
      })
    }
  }

  const handleClose = () => {
    disconnect()
    onOpenChange(false)
  }

  // Filter logs based on selected type
  const filteredLogs =
    logType === "both"
      ? logs
      : logs.filter((log) => log.logType === logType)

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="!w-[95%] !sm:w-[80%] !max-w-[80vw] max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle>Real-time Logs: {serviceName}</DialogTitle>
              <DialogDescription>Stream logs in real-time via WebSocket</DialogDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={isConnected ? "default" : "secondary"}>
                {isConnected ? "Connected" : "Disconnected"}
              </Badge>
              {error && (
                <Badge variant="destructive" className="text-xs max-w-xs truncate" title={error}>
                  {error.length > 30 ? `${error.substring(0, 30)}...` : error}
                </Badge>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 flex flex-col min-h-0 px-6 pb-6 space-y-3">
          {/* Controls */}
          <div className="flex items-center justify-between">
            <Tabs value={logType} onValueChange={(v) => setLogType(v as "both" | "out" | "error")}>
              <TabsList>
                <TabsTrigger value="both">Both</TabsTrigger>
                <TabsTrigger value="out">Stdout</TabsTrigger>
                <TabsTrigger value="error">Stderr</TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAutoScroll(!autoScroll)}
                className={autoScroll ? "bg-muted" : ""}
              >
                Auto-scroll
              </Button>
              <Button variant="outline" size="sm" onClick={clearLogs}>
                <Trash2 className="h-4 w-4 mr-2" />
                Clear
              </Button>
              {isConnected ? (
                <Button variant="outline" size="sm" onClick={disconnect}>
                  <Square className="h-4 w-4 mr-2" />
                  Stop
                </Button>
              ) : (
                <Button variant="default" size="sm" onClick={connect}>
                  <Play className="h-4 w-4 mr-2" />
                  Start
                </Button>
              )}
            </div>
          </div>

          {/* Logs Display */}
          <div className="flex-1 min-h-0 relative border rounded-lg overflow-hidden">
            {filteredLogs.length > 0 ? (
              <>
                <div
                  ref={logsContainerRef}
                  className="h-full overflow-auto bg-black"
                  style={{ maxHeight: "calc(90vh - 250px)" }}
                >
                  <div className="flex font-mono text-sm">
                    {/* Line numbers */}
                    <div className="sticky left-0 bg-gray-900 px-3 py-2 border-r border-gray-800 text-gray-400 select-none">
                      {filteredLogs.map((_, index) => (
                        <div key={index} className="text-right leading-6 text-xs">
                          {index + 1}
                        </div>
                      ))}
                    </div>
                    {/* Log content */}
                    <div className="flex-1 min-w-0 bg-black text-gray-100">
                      <pre className="p-2 m-0 whitespace-pre overflow-visible">
                        {filteredLogs.map((log, index) => (
                          <div
                            key={index}
                            className={`leading-6 text-xs ${
                              log.logType === "error" ? "text-red-400" : ""
                            }`}
                          >
                            {log.message || " "}
                          </div>
                        ))}
                      </pre>
                    </div>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={scrollToBottom}
                  className="absolute bottom-4 right-4 h-9 w-9 rounded-full shadow-lg bg-background/80 backdrop-blur-sm"
                >
                  <ArrowDown className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <div className="rounded-lg border bg-background p-12 text-center text-muted-foreground h-full flex items-center justify-center">
                <div>
                  <p className="text-base mb-2">
                    {isConnected ? "Waiting for logs..." : "Not connected"}
                  </p>
                  <p className="text-sm">
                    {isConnected
                      ? "Logs will appear here as they are generated"
                      : "Click Start to begin streaming logs"}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="text-xs text-muted-foreground">
            Showing {filteredLogs.length} of {logs.length} log{logs.length !== 1 ? "s" : ""}
            {logType !== "both" && ` (filtered: ${logType})`}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}


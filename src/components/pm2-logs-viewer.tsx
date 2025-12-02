"use client"

import { useRef, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Loader2, ArrowDown, RotateCw } from "lucide-react"

interface PM2LogsViewerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  serviceName: string
  logs: string[]
  loading: boolean
  onRefresh: () => void
}

export function PM2LogsViewer({
  open,
  onOpenChange,
  serviceName,
  logs,
  loading,
  onRefresh,
}: PM2LogsViewerProps) {
  const logsContainerRef = useRef<HTMLDivElement>(null)

  // Scroll to bottom when logs update
  useEffect(() => {
    if (logs.length > 0 && logsContainerRef.current) {
      logsContainerRef.current.scrollTop = logsContainerRef.current.scrollHeight
    }
  }, [logs])

  const scrollToBottom = () => {
    if (logsContainerRef.current) {
      logsContainerRef.current.scrollTo({
        top: logsContainerRef.current.scrollHeight,
        behavior: "smooth",
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!w-[95%] !sm:w-[80%] !max-w-[80vw] max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4">
          <DialogTitle>Logs: {serviceName}</DialogTitle>
          <DialogDescription>Historical logs for PM2 service (last 1000 lines)</DialogDescription>
        </DialogHeader>

        <div className="flex-1 flex flex-col min-h-0 px-6 pb-6">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm text-muted-foreground">
              {logs.length} line{logs.length !== 1 ? "s" : ""}
            </div>
            <Button variant="outline" size="sm" onClick={onRefresh} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  <RotateCw className="h-4 w-4 mr-2" />
                  Refresh
                </>
              )}
            </Button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12 rounded-lg border bg-background flex-1">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : logs.length > 0 ? (
            <div className="relative flex-1 min-h-0 border rounded-lg overflow-hidden">
              <div
                ref={logsContainerRef}
                className="h-full overflow-auto bg-black"
                style={{ maxHeight: "calc(90vh - 200px)" }}
              >
                <div className="flex font-mono text-sm">
                  {/* Line numbers */}
                  <div className="sticky left-0 bg-gray-900 px-3 py-2 border-r border-gray-800 text-gray-400 select-none">
                    {logs.map((_, index) => (
                      <div key={index} className="text-right leading-6 text-xs">
                        {index + 1}
                      </div>
                    ))}
                  </div>
                  {/* Log content */}
                  <div className="flex-1 min-w-0 bg-black text-gray-100">
                    <pre className="p-2 m-0 whitespace-pre overflow-visible">
                      {logs.map((line, index) => (
                        <div key={index} className="leading-6 text-xs">
                          {typeof line === "string" ? line : String(line || " ")}
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
            </div>
          ) : (
            <div className="rounded-lg border bg-background p-12 text-center text-muted-foreground flex-1 flex items-center justify-center">
              <div>
                <p className="text-base mb-2">No logs available</p>
                <p className="text-sm">This service may not have generated any logs yet.</p>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}


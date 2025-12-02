"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, Play, Square, RotateCw, Info, FileText, Radio } from "lucide-react"
import type { PM2Service } from "@/types"

interface PM2ServiceListProps {
  baseUrl: string
  services: PM2Service[]
  loading: boolean
  actionLoading: string | null
  onFetchServices: () => void
  onServiceAction: (serviceName: string, action: "start" | "stop" | "restart") => void
  onViewDetails: (serviceName: string) => void
  onViewLogs: (serviceName: string) => void
  onStreamLogs: (serviceName: string) => void
}

export function PM2ServiceList({
  baseUrl,
  services,
  loading,
  actionLoading,
  onFetchServices,
  onServiceAction,
  onViewDetails,
  onViewLogs,
  onStreamLogs,
}: PM2ServiceListProps) {
  useEffect(() => {
    if (baseUrl && services.length === 0 && !loading) {
      onFetchServices()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [baseUrl])

  const formatMemory = (bytes: number) => {
    const mb = bytes / (1024 * 1024)
    return `${mb.toFixed(2)} MB`
  }

  const formatUptime = (ms: number) => {
    const seconds = Math.floor(ms / 1000)
    const days = Math.floor(seconds / 86400)
    const hours = Math.floor((seconds % 86400) / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    
    if (days > 0) return `${days}d ${hours}h`
    if (hours > 0) return `${hours}h ${minutes}m`
    return `${minutes}m`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (services.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground text-sm">
        <p>No PM2 services found</p>
        <Button
          variant="outline"
          size="sm"
          onClick={onFetchServices}
          className="mt-2"
        >
          Refresh
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          {services.length} service{services.length !== 1 ? "s" : ""} found
        </p>
        <Button variant="outline" size="sm" onClick={onFetchServices}>
          <RotateCw className="h-3 w-3 mr-2" />
          Refresh
        </Button>
      </div>
      <div className="space-y-2">
        {services.map((service) => {
          const isOnline = service.status === "online"
          const isRestartLoading = actionLoading === `${service.name}-restart`
          const isStopLoading = actionLoading === `${service.name}-stop`
          const isStartLoading = actionLoading === `${service.name}-start`
          
          return (
            <div
              key={service.name}
              className="p-3 rounded-lg border bg-card space-y-2"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm">{service.name}</span>
                    <Badge
                      variant={isOnline ? "default" : "secondary"}
                      className="text-xs"
                    >
                      {service.status}
                    </Badge>
                  </div>
                  {isOnline && (
                    <div className="text-xs text-muted-foreground space-y-1">
                      <p>Memory: {formatMemory(service.memory)} • CPU: {service.cpu.toFixed(1)}%</p>
                      <p>Uptime: {formatUptime(service.uptime)} • Restarts: {service.restarts} • PID: {service.pid}</p>
                    </div>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex gap-2">
                  {isOnline ? (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onServiceAction(service.name, "restart")}
                        disabled={isRestartLoading || isStopLoading}
                        className="flex-1"
                      >
                        {isRestartLoading ? (
                          <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                        ) : (
                          <RotateCw className="h-3 w-3 mr-2" />
                        )}
                        Restart
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onServiceAction(service.name, "stop")}
                        disabled={isRestartLoading || isStopLoading}
                        className="flex-1"
                      >
                        {isStopLoading ? (
                          <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                        ) : (
                          <Square className="h-3 w-3 mr-2" />
                        )}
                        Stop
                      </Button>
                    </>
                  ) : (
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => onServiceAction(service.name, "start")}
                      disabled={isStartLoading}
                      className="w-full"
                    >
                      {isStartLoading ? (
                        <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                      ) : (
                        <Play className="h-3 w-3 mr-2" />
                      )}
                      Start
                    </Button>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onViewDetails(service.name)}
                    className="flex-1"
                  >
                    <Info className="h-3 w-3 mr-2" />
                    Details
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onViewLogs(service.name)}
                    className="flex-1"
                  >
                    <FileText className="h-3 w-3 mr-2" />
                    Logs
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onStreamLogs(service.name)}
                    className="flex-1"
                  >
                    <Radio className="h-3 w-3 mr-2" />
                    Stream
                  </Button>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}


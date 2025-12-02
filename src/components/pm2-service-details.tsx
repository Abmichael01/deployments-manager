"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Loader2 } from "lucide-react"
import type { PM2ServiceDetails } from "@/types"

interface PM2ServiceDetailsProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  serviceDetails: PM2ServiceDetails | null
  loading: boolean
}

export function PM2ServiceDetails({
  open,
  onOpenChange,
  serviceDetails,
  loading,
}: PM2ServiceDetailsProps) {
  const formatMemory = (bytes: number) => {
    const mb = bytes / (1024 * 1024)
    return `${mb.toFixed(2)} MB`
  }

  const formatUptime = (ms: number) => {
    const seconds = Math.floor(ms / 1000)
    const days = Math.floor(seconds / 86400)
    const hours = Math.floor((seconds % 86400) / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    if (days > 0) return `${days}d ${hours}h ${minutes}m`
    if (hours > 0) return `${hours}h ${minutes}m ${secs}s`
    if (minutes > 0) return `${minutes}m ${secs}s`
    return `${secs}s`
  }

  const formatDate = (timestamp?: number) => {
    if (!timestamp) return "N/A"
    return new Date(timestamp).toLocaleString()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {serviceDetails ? `Service Details: ${serviceDetails.name}` : "Service Details"}
          </DialogTitle>
          <DialogDescription>Detailed information about the PM2 service</DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : serviceDetails ? (
          <div className="grid grid-cols-2 gap-4">
            {/* Status */}
            <div className="p-4 rounded-lg border border-white/10">
              <div className="text-xs text-muted-foreground mb-2">Status</div>
              <div>
                <Badge
                  variant={serviceDetails.status === "online" ? "default" : "secondary"}
                >
                  {serviceDetails.status}
                </Badge>
              </div>
            </div>

            {/* Mode */}
            <div className="p-4 rounded-lg border border-white/10">
              <div className="text-xs text-muted-foreground mb-2">Mode</div>
              <div className="text-sm font-medium">{serviceDetails.mode || "N/A"}</div>
            </div>

            {/* PID */}
            <div className="p-4 rounded-lg border border-white/10">
              <div className="text-xs text-muted-foreground mb-2">PID</div>
              <div className="text-sm font-medium">{serviceDetails.pid || "N/A"}</div>
            </div>

            {/* Restarts */}
            <div className="p-4 rounded-lg border border-white/10">
              <div className="text-xs text-muted-foreground mb-2">Restarts</div>
              <div className="text-sm font-medium">{serviceDetails.restarts || 0}</div>
            </div>

            {/* Uptime */}
            <div className="p-4 rounded-lg border border-white/10">
              <div className="text-xs text-muted-foreground mb-2">Uptime</div>
              <div className="text-sm font-medium">{formatUptime(serviceDetails.uptime)}</div>
            </div>

            {/* Unstable Restarts */}
            {serviceDetails.pm2_env?.unstable_restarts !== undefined && (
              <div className="p-4 rounded-lg border border-white/10">
                <div className="text-xs text-muted-foreground mb-2">Unstable Restarts</div>
                <div className="text-sm font-medium">{serviceDetails.pm2_env.unstable_restarts}</div>
              </div>
            )}

            {/* Memory */}
            <div className="p-4 rounded-lg border border-white/10">
              <div className="text-xs text-muted-foreground mb-2">Memory</div>
              <div className="text-sm font-medium">{formatMemory(serviceDetails.memory)}</div>
            </div>

            {/* CPU */}
            <div className="p-4 rounded-lg border border-white/10">
              <div className="text-xs text-muted-foreground mb-2">CPU</div>
              <div className="text-sm font-medium">{serviceDetails.cpu.toFixed(2)}%</div>
            </div>

            {/* PM2 Environment Fields */}
            {serviceDetails.pm2_env?.version && (
              <div className="p-4 rounded-lg border border-white/10">
                <div className="text-xs text-muted-foreground mb-2">Version</div>
                <div className="text-sm font-medium">{serviceDetails.pm2_env.version}</div>
              </div>
            )}

            {serviceDetails.pm2_env?.exec_mode && (
              <div className="p-4 rounded-lg border border-white/10">
                <div className="text-xs text-muted-foreground mb-2">Exec Mode</div>
                <div className="text-sm font-medium">{serviceDetails.pm2_env.exec_mode}</div>
              </div>
            )}

            {serviceDetails.pm2_env?.instances !== undefined && (
              <div className="p-4 rounded-lg border border-white/10">
                <div className="text-xs text-muted-foreground mb-2">Instances</div>
                <div className="text-sm font-medium">{serviceDetails.pm2_env.instances}</div>
              </div>
            )}

            {serviceDetails.pm2_env?.node_version && (
              <div className="p-4 rounded-lg border border-white/10">
                <div className="text-xs text-muted-foreground mb-2">Node Version</div>
                <div className="text-sm font-medium">{serviceDetails.pm2_env.node_version}</div>
              </div>
            )}

            {serviceDetails.pm2_env?.created_at && (
              <div className="p-4 rounded-lg border border-white/10">
                <div className="text-xs text-muted-foreground mb-2">Created At</div>
                <div className="text-sm font-medium">{formatDate(serviceDetails.pm2_env.created_at)}</div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            No service details available
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}


"use client"

import { useRef, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Loader2, ArrowDown } from "lucide-react"
import type { Project } from "@/types"

interface LogsSectionProps {
  projects: Project[]
  selectedProjectId: string
  selectedLogUrlId: string
  logs: string[]
  loadingLogs: boolean
  onProjectSelect: (projectId: string) => void
  onLogUrlSelect: (logUrlId: string) => void
  onRefresh: () => void
}

export function LogsSection({
  projects,
  selectedProjectId,
  selectedLogUrlId,
  logs,
  loadingLogs,
  onProjectSelect,
  onLogUrlSelect,
  onRefresh,
}: LogsSectionProps) {
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

  const project = projects.find((p) => p.id === selectedProjectId)
  const logUrls = project?.logUrls || []
  const allLogUrls = [
    { id: "default", name: "Deploy Logs", url: `${project?.baseUrl}/deploy-hook/logs` },
    ...logUrls
  ]

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Deploy Logs</CardTitle>
          <CardDescription>View deployment logs for your projects</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="project-select">Select Project</Label>
            <Select value={selectedProjectId} onValueChange={onProjectSelect}>
              <SelectTrigger id="project-select">
                <SelectValue placeholder="Select a project" />
              </SelectTrigger>
              <SelectContent>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedProjectId && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="log-url-select">Select Log Source</Label>
                <Select value={selectedLogUrlId} onValueChange={onLogUrlSelect}>
                  <SelectTrigger id="log-url-select">
                    <SelectValue placeholder="Select log source" />
                  </SelectTrigger>
                  <SelectContent>
                    {allLogUrls.map((logUrl) => (
                      <SelectItem key={logUrl.id} value={logUrl.id}>
                        {logUrl.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Logs</Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onRefresh}
                    disabled={loadingLogs || !selectedLogUrlId}
                  >
                    {loadingLogs ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      "Refresh"
                    )}
                  </Button>
                </div>
                {loadingLogs ? (
                  <div className="flex items-center justify-center py-8 rounded-lg border bg-background">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : logs.length > 0 ? (
                  <div className="relative">
                    <div
                      ref={logsContainerRef}
                      className="rounded-lg border bg-background overflow-auto"
                      style={{ height: "600px" }}
                    >
                      <div className="flex font-mono text-sm">
                        {/* Line numbers */}
                        <div className="sticky left-0 bg-black px-3 py-2 border-r text-muted-foreground select-none">
                          {logs.map((_, index) => (
                            <div key={index} className="text-right leading-6">
                              {index + 1}
                            </div>
                          ))}
                        </div>
                        {/* Log content */}
                        <div className="flex-1 min-w-0">
                          <pre className="p-2 m-0 whitespace-pre overflow-visible">
                            {logs.map((line, index) => (
                              <div key={index} className="leading-6">
                                {line || " "}
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
                      className="absolute bottom-4 right-4 h-9 w-9 rounded-full shadow-lg"
                    >
                      <ArrowDown className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="rounded-lg border bg-background p-8 text-center text-muted-foreground">
                    No logs available. Select a project to view logs.
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}


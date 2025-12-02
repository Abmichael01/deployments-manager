"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { DeployHookSection } from "@/components/deploy-hook-section"
import { PM2ServiceList } from "@/components/pm2-service-list"
import type { Project, Repo, PM2Service } from "@/types"

interface ProjectActionsPanelProps {
  project: Project | null
  loadingRepos: string | null
  deployingRepo: string | null
  pm2Services: PM2Service[]
  loadingPM2: boolean
  pm2ActionLoading: string | null
  onFetchRepos: (project: Project) => void
  onDeploy: (project: Project, repo: Repo) => void
  onViewLogs: (projectId: string) => void
  onFetchPM2Services: () => void
  onPM2ServiceAction: (serviceName: string, action: "start" | "stop" | "restart") => void
  onPM2ViewDetails: (serviceName: string) => void
  onPM2ViewLogs: (serviceName: string) => void
  onPM2StreamLogs: (serviceName: string) => void
}

export function ProjectActionsPanel({
  project,
  loadingRepos,
  deployingRepo,
  pm2Services,
  loadingPM2,
  pm2ActionLoading,
  onFetchRepos,
  onDeploy,
  onViewLogs,
  onFetchPM2Services,
  onPM2ServiceAction,
  onPM2ViewDetails,
  onPM2ViewLogs,
  onPM2StreamLogs,
}: ProjectActionsPanelProps) {
  const [activeTab, setActiveTab] = useState("deploy-hook")

  if (!project) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-16">
          <div className="text-center space-y-2">
            <p className="text-muted-foreground text-lg">No project selected</p>
            <p className="text-muted-foreground text-sm">
              Select a project from the list to view and manage its actions
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{project.name}</CardTitle>
        <CardDescription>{project.baseUrl}</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="deploy-hook">Deploy-Hook</TabsTrigger>
            <TabsTrigger value="pm2">PM2</TabsTrigger>
          </TabsList>
          <TabsContent value="deploy-hook">
            <DeployHookSection
              project={project}
              loadingRepos={loadingRepos}
              deployingRepo={deployingRepo}
              onFetchRepos={onFetchRepos}
              onDeploy={onDeploy}
              onViewLogs={onViewLogs}
            />
          </TabsContent>
          <TabsContent value="pm2">
            <PM2ServiceList
              baseUrl={project.baseUrl}
              services={pm2Services}
              loading={loadingPM2}
              actionLoading={pm2ActionLoading}
              onFetchServices={onFetchPM2Services}
              onServiceAction={onPM2ServiceAction}
              onViewDetails={onPM2ViewDetails}
              onViewLogs={onPM2ViewLogs}
              onStreamLogs={onPM2StreamLogs}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}


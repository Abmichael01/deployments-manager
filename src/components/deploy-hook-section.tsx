"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, Plus, GitBranch, Rocket, FileText } from "lucide-react"
import type { Project, Repo } from "@/types"

interface DeployHookSectionProps {
  project: Project
  loadingRepos: string | null
  deployingRepo: string | null
  onFetchRepos: (project: Project) => void
  onDeploy: (project: Project, repo: Repo) => void
  onViewLogs: (projectId: string) => void
}

export function DeployHookSection({
  project,
  loadingRepos,
  deployingRepo,
  onFetchRepos,
  onDeploy,
  onViewLogs,
}: DeployHookSectionProps) {
  return (
    <div className="space-y-4">
        {/* Fetch Repos */}
        <div className="space-y-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onFetchRepos(project)}
            disabled={loadingRepos === project.id}
            className="w-full"
          >
            {loadingRepos === project.id ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Loading...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                Fetch Repos
              </>
            )}
          </Button>
        </div>

        {/* Repos List */}
        {project.repos.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground font-medium">
              Repositories ({project.repos.length})
            </p>
            <div className="space-y-2">
              {project.repos.map((repo, index) => {
                const deployKey = `${project.id}-${repo.name}`
                const isDeploying = deployingRepo === deployKey
                return (
                  <div
                    key={index}
                    className="p-3 rounded border bg-background/50 text-sm space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium">{repo.name}</span>
                          <Badge variant="outline" className="text-xs">
                            <GitBranch className="h-3 w-3 mr-1" />
                            {repo.branch}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{repo.path}</p>
                      </div>
                    </div>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => onDeploy(project, repo)}
                      disabled={isDeploying}
                      className="w-full"
                    >
                      {isDeploying ? (
                        <>
                          <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                          Deploying...
                        </>
                      ) : (
                        <>
                          <Rocket className="h-3 w-3 mr-2" />
                          Deploy
                        </>
                      )}
                    </Button>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Deploy Hook Logs */}
        <div className="space-y-2 pt-2 border-t">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-muted-foreground font-medium">Deploy Logs</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onViewLogs(project.id)}
            >
              <FileText className="h-3 w-3 mr-2" />
              View Logs
            </Button>
          </div>
          <div className="p-2 rounded border bg-background/50 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-medium">Deploy Hook Logs</span>
              <Badge variant="outline" className="text-xs">Default</Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {project.baseUrl}/deploy-hook/logs
            </p>
          </div>
        </div>
    </div>
  )
}


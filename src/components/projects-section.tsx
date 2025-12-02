"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, Plus, ChevronRight } from "lucide-react"
import { AddProjectDialog } from "@/components/add-project-dialog"
import { ProjectActionsPanel } from "@/components/project-actions-panel"
import type { Project, Repo, PM2Service } from "@/types"

interface ProjectsSectionProps {
  projects: Project[]
  loading: boolean
  selectedProjectId: string
  newProjectName: string
  newProjectUrl: string
  loadingRepos: string | null
  deployingRepo: string | null
  pm2Services: PM2Service[]
  loadingPM2: boolean
  pm2ActionLoading: string | null
  onProjectSelect: (projectId: string) => void
  onProjectNameChange: (value: string) => void
  onProjectUrlChange: (value: string) => void
  onAddProject: (e: React.FormEvent) => void
  onFetchRepos: (project: Project) => void
  onDeploy: (project: Project, repo: Repo) => void
  onViewLogs: (projectId: string) => void
  onFetchPM2Services: () => void
  onPM2ServiceAction: (serviceName: string, action: "start" | "stop" | "restart") => void
  onPM2ViewDetails: (serviceName: string) => void
  onPM2ViewLogs: (serviceName: string) => void
  onPM2StreamLogs: (serviceName: string) => void
}

export function ProjectsSection({
  projects,
  loading,
  selectedProjectId,
  newProjectName,
  newProjectUrl,
  loadingRepos,
  deployingRepo,
  pm2Services,
  loadingPM2,
  pm2ActionLoading,
  onProjectSelect,
  onProjectNameChange,
  onProjectUrlChange,
  onAddProject,
  onFetchRepos,
  onDeploy,
  onViewLogs,
  onFetchPM2Services,
  onPM2ServiceAction,
  onPM2ViewDetails,
  onPM2ViewLogs,
  onPM2StreamLogs,
}: ProjectsSectionProps) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const selectedProject = projects.find((p) => p.id === selectedProjectId) || null
  const prevProjectsCount = useRef(projects.length)

  // Close dialog when a new project is successfully added
  useEffect(() => {
    if (projects.length > prevProjectsCount.current && dialogOpen) {
      setDialogOpen(false)
    }
    prevProjectsCount.current = projects.length
  }, [projects.length, dialogOpen])

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Left Section - Projects List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Projects</CardTitle>
              <CardDescription>Your saved projects</CardDescription>
            </div>
            <Button onClick={() => setDialogOpen(true)} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Project
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : projects.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No projects yet. Click "Add Project" to get started.
            </p>
          ) : (
            <div className="space-y-3">
              {projects.map((project) => {
                const isSelected = selectedProjectId === project.id
                return (
                  <div
                    key={project.id}
                    className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                      isSelected
                        ? "bg-white/10 border-white/30"
                        : "bg-card border-border hover:bg-accent/50"
                    }`}
                    onClick={() => onProjectSelect(project.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-base mb-1">{project.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {project.baseUrl}
                        </p>
                      </div>
                      <div
                        className={`p-2 rounded-md border transition-colors ${
                          isSelected
                            ? "bg-background border-white/30 text-primary"
                            : "bg-background/50 border-border text-muted-foreground"
                        }`}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Right Section - Project Actions */}
      <ProjectActionsPanel
        project={selectedProject}
        loadingRepos={loadingRepos}
        deployingRepo={deployingRepo}
        pm2Services={pm2Services}
        loadingPM2={loadingPM2}
        pm2ActionLoading={pm2ActionLoading}
        onFetchRepos={onFetchRepos}
        onDeploy={onDeploy}
        onViewLogs={onViewLogs}
        onFetchPM2Services={onFetchPM2Services}
        onPM2ServiceAction={onPM2ServiceAction}
        onPM2ViewDetails={onPM2ViewDetails}
        onPM2ViewLogs={onPM2ViewLogs}
        onPM2StreamLogs={onPM2StreamLogs}
      />

      {/* Add Project Dialog */}
      <AddProjectDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        projectName={newProjectName}
        projectUrl={newProjectUrl}
        onProjectNameChange={onProjectNameChange}
        onProjectUrlChange={onProjectUrlChange}
        onAddProject={onAddProject}
      />
    </div>
  )
}

"use client"

import { useState, useEffect, useRef, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import axios from "axios"
import { toast } from "sonner"
import { Navbar } from "@/components/navbar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Loader2, Plus, GitBranch, Rocket, ChevronDown, ChevronUp, FileText, ArrowDown, AlertCircle, X } from "lucide-react"

type NavSection = "projects" | "logs" | "errors"

interface Repo {
  name: string
  path: string
  branch: string
}

interface Project {
  id: string
  name: string
  baseUrl: string
  repos: Repo[]
}

function HomeContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [activeSection, setActiveSection] = useState<NavSection>("projects")
  const [projects, setProjects] = useState<Project[]>([])
  const [newProjectName, setNewProjectName] = useState("")
  const [newProjectUrl, setNewProjectUrl] = useState("")
  const [loadingRepos, setLoadingRepos] = useState<string | null>(null)
  const [deployingRepo, setDeployingRepo] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set())
  const [selectedProjectId, setSelectedProjectId] = useState<string>("")
  const [logs, setLogs] = useState<string[]>([])
  const [loadingLogs, setLoadingLogs] = useState(false)
  const logsContainerRef = useRef<HTMLDivElement>(null)
  const [errors, setErrors] = useState<Array<{ id: string; timestamp: Date; message: string; details?: string }>>([])
  const isUpdatingUrlRef = useRef(false)

  // Load projects on mount
  useEffect(() => {
    loadProjects()
    
    // Read initial URL params
    const section = searchParams.get("section") as NavSection | null
    const projectId = searchParams.get("project") || ""
    
    if (section === "logs" || section === "projects") {
      setActiveSection(section)
    }
    if (projectId && section === "logs") {
      setSelectedProjectId(projectId)
    }
  }, [])

  // Sync with URL params when URL changes (only on mount and when URL actually changes)
  const sectionParam = searchParams.get("section")
  const projectParam = searchParams.get("project")
  
  useEffect(() => {
    if (isUpdatingUrlRef.current) {
      isUpdatingUrlRef.current = false
      return
    }
    
    const section = sectionParam as NavSection | null
    const projectId = projectParam || ""
    
    if (section && (section === "logs" || section === "projects" || section === "errors") && section !== activeSection) {
      setActiveSection(section)
    }
    if (projectId && section === "logs" && projectId !== selectedProjectId) {
      setSelectedProjectId(projectId)
    } else if (section === "projects" && selectedProjectId) {
      setSelectedProjectId("")
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sectionParam, projectParam])

  // Update URL when section or project changes (debounced to prevent loops)
  useEffect(() => {
    if (typeof window === "undefined") return
    
    const params = new URLSearchParams()
    params.set("section", activeSection)
    
    // Only include project param if we're on logs tab
    if (selectedProjectId && activeSection === "logs") {
      params.set("project", selectedProjectId)
    }
    
    const newUrl = `?${params.toString()}`
    const currentUrl = window.location.search
    
    // Only update if URL actually changed
    if (newUrl !== currentUrl) {
      isUpdatingUrlRef.current = true
      router.replace(newUrl, { scroll: false })
    }
  }, [activeSection, selectedProjectId, router])
  
  // Error handler
  const addError = (message: string, details?: string) => {
    const error = {
      id: Date.now().toString(),
      timestamp: new Date(),
      message,
      details,
    }
    setErrors((prev) => [error, ...prev].slice(0, 100)) // Keep last 100 errors
  }
  
  const clearErrors = () => {
    setErrors([])
  }
  
  const removeError = (id: string) => {
    setErrors((prev) => prev.filter((e) => e.id !== id))
  }

  const loadProjects = async () => {
    try {
      const response = await axios.get("/api/projects")
      setProjects(response.data || [])
    } catch (error: any) {
      console.error("Error loading projects:", error)
      const errorMsg = error?.response?.data?.error || error?.message || "Failed to load projects"
      toast.error("Failed to load projects")
      addError("Failed to load projects", errorMsg)
    } finally {
      setLoading(false)
    }
  }

  const saveProjects = async (projectsToSave: Project[]) => {
    try {
      await axios.post("/api/projects", projectsToSave)
    } catch (error: any) {
      console.error("Error saving projects:", error)
      const errorMsg = error?.response?.data?.error || error?.message || "Failed to save projects"
      toast.error("Failed to save projects")
      addError("Failed to save projects", errorMsg)
      throw error
    }
  }

  const handleAddProject = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newProjectName.trim() && newProjectUrl.trim()) {
      const newProject: Project = {
        id: Date.now().toString(),
        name: newProjectName.trim(),
        baseUrl: newProjectUrl.trim(),
        repos: [],
      }
      const updatedProjects = [...projects, newProject]
      setProjects(updatedProjects)
      setNewProjectName("")
      setNewProjectUrl("")
      await saveProjects(updatedProjects)
      toast.success("Project added successfully")
    }
  }

  const handleFetchRepos = async (project: Project) => {
    setLoadingRepos(project.id)
    try {
      const baseUrl = project.baseUrl.endsWith("/") 
        ? project.baseUrl.slice(0, -1) 
        : project.baseUrl
      const response = await axios.get(`${baseUrl}/deploy`)
      
      if (response.data.status === "success" && response.data.availableRepos) {
        const updatedProjects = projects.map((p) =>
          p.id === project.id
            ? { ...p, repos: response.data.availableRepos }
            : p
        )
        setProjects(updatedProjects)
        await saveProjects(updatedProjects)
        toast.success(`Fetched ${response.data.availableRepos.length} repos`)
      } else {
        toast.error("Failed to fetch repos")
        addError("Failed to fetch repos", "Invalid response from server")
      }
    } catch (error: any) {
      console.error("Error fetching repos:", error)
      const errorMsg = error.response?.data?.message || error.message || "Failed to fetch repos"
      toast.error("Failed to fetch repos. Check the base URL and try again.")
      addError("Failed to fetch repos", errorMsg)
    } finally {
      setLoadingRepos(null)
    }
  }

  const handleDeploy = async (project: Project, repo: Repo) => {
    const deployKey = `${project.id}-${repo.name}`
    setDeployingRepo(deployKey)
    try {
      const baseUrl = project.baseUrl.endsWith("/") 
        ? project.baseUrl.slice(0, -1) 
        : project.baseUrl
      
      const response = await axios.post(`${baseUrl}/deploy?repo=${repo.name}`)
      
      if (response.data.status === "success") {
        toast.success(`Deployment triggered for ${repo.name}`, {
          description: response.data.message || "Deploy hook is running",
        })
      } else {
        const errorMsg = response.data.message || "Unknown error occurred"
        toast.error("Deployment failed", {
          description: errorMsg,
        })
        addError("Deployment failed", errorMsg)
      }
    } catch (error: any) {
      console.error("Error deploying:", error)
      const errorMessage = error.response?.data?.message || error.message || "Failed to trigger deployment"
      toast.error("Deployment failed", {
        description: errorMessage,
      })
      addError("Deployment failed", errorMessage)
    } finally {
      setDeployingRepo(null)
    }
  }

  const toggleProject = (projectId: string) => {
    const newExpanded = new Set(expandedProjects)
    if (newExpanded.has(projectId)) {
      newExpanded.delete(projectId)
    } else {
      newExpanded.add(projectId)
    }
    setExpandedProjects(newExpanded)
  }

  const handleViewLogs = (projectId: string) => {
    setSelectedProjectId(projectId)
    setActiveSection("logs")
  }

  const handleProjectSelect = (projectId: string) => {
    setSelectedProjectId(projectId)
    fetchLogs(projectId)
  }

  const fetchLogs = async (projectId: string) => {
    const project = projects.find((p) => p.id === projectId)
    if (!project) return

    setLoadingLogs(true)
    try {
      const baseUrl = project.baseUrl.endsWith("/") 
        ? project.baseUrl.slice(0, -1) 
        : project.baseUrl
      
      const response = await axios.get(`${baseUrl}/deploy/logs`)
      
      if (response.data && response.data.logs && Array.isArray(response.data.logs)) {
        setLogs(response.data.logs)
      } else if (response.data && response.data.logs && typeof response.data.logs === "string") {
        // If logs is a string, split by newlines
        setLogs(response.data.logs.split("\n"))
      } else {
        setLogs([])
      }
    } catch (error: any) {
      console.error("Error fetching logs:", error)
      const errorMsg = error.response?.data?.message || error.message || "Unknown error"
      setLogs([`Error fetching logs: ${errorMsg}`])
      toast.error("Failed to fetch logs")
      addError("Failed to fetch logs", errorMsg)
    } finally {
      setLoadingLogs(false)
    }
  }

  // Fetch logs when project is selected
  useEffect(() => {
    if (selectedProjectId && activeSection === "logs") {
      fetchLogs(selectedProjectId)
    }
  }, [selectedProjectId, activeSection])

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
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-8">
        <Navbar activeSection={activeSection} onSectionChange={setActiveSection} />
      </div>
      
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {activeSection === "logs" && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Deploy Logs</CardTitle>
                <CardDescription>
                  View deployment logs for your projects
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="project-select">Select Project</Label>
                  <Select
                    value={selectedProjectId}
                    onValueChange={handleProjectSelect}
                  >
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
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Logs</Label>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fetchLogs(selectedProjectId)}
                        disabled={loadingLogs}
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
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {activeSection === "errors" && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Errors</CardTitle>
                    <CardDescription>
                      View all application errors
                    </CardDescription>
                  </div>
                  {errors.length > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={clearErrors}
                    >
                      Clear All
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {errors.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No errors recorded</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {errors.map((error) => (
                      <div
                        key={error.id}
                        className="p-4 rounded-lg border bg-card space-y-2"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <AlertCircle className="h-4 w-4 text-destructive" />
                              <span className="font-medium text-sm">{error.message}</span>
                            </div>
                            {error.details && (
                              <p className="text-xs text-muted-foreground ml-6 font-mono">
                                {error.details}
                              </p>
                            )}
                            <p className="text-xs text-muted-foreground ml-6 mt-1">
                              {error.timestamp.toLocaleString()}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => removeError(error.id)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {activeSection === "projects" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Section - Projects List */}
            <Card>
              <CardHeader>
                <CardTitle>Projects</CardTitle>
                <CardDescription>
                  Your saved projects
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : projects.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    No projects yet. Add your first project using the form on the right.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {projects.map((project) => (
                      <div
                        key={project.id}
                        className="p-4 rounded-lg border bg-card space-y-3"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <p className="font-medium text-base">{project.name}</p>
                              {project.repos.length > 0 && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => toggleProject(project.id)}
                                  className="h-6 w-6 p-0"
                                >
                                  {expandedProjects.has(project.id) ? (
                                    <ChevronUp className="h-4 w-4" />
                                  ) : (
                                    <ChevronDown className="h-4 w-4" />
                                  )}
                                </Button>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mb-2">{project.baseUrl}</p>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleFetchRepos(project)}
                                disabled={loadingRepos === project.id}
                                className="mt-2"
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
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleViewLogs(project.id)}
                                className="mt-2"
                              >
                                <FileText className="h-4 w-4 mr-2" />
                                Logs
                              </Button>
                            </div>
                          </div>
                        </div>
                        
                        {project.repos.length > 0 && expandedProjects.has(project.id) && (
                          <div className="space-y-2 pt-2 border-t">
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
                                        <p className="text-xs text-muted-foreground">
                                          {repo.path}
          </p>
        </div>
                                    </div>
                                    <Button
                                      variant="default"
                                      size="sm"
                                      onClick={() => handleDeploy(project, repo)}
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
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Right Section - Add New Project Form */}
            <Card>
              <CardHeader>
                <CardTitle>Add New Project</CardTitle>
                <CardDescription>
                  Enter the base URL for your project
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAddProject} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="projectName">Project Name</Label>
                    <Input
                      id="projectName"
                      type="text"
                      placeholder="My Project"
                      value={newProjectName}
                      onChange={(e) => setNewProjectName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="baseUrl">Base URL</Label>
                    <Input
                      id="baseUrl"
                      type="url"
                      placeholder="https://example.com"
                      value={newProjectUrl}
                      onChange={(e) => setNewProjectUrl(e.target.value)}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full">
                    Add Project
                  </Button>
                </form>
              </CardContent>
            </Card>
        </div>
        )}
      </main>
    </div>
  )
}

export default function Home() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    }>
      <HomeContent />
    </Suspense>
  )
}

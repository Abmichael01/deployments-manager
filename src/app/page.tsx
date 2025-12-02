"use client"

import { useState, useEffect, useRef, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import axios from "axios"
import { toast } from "sonner"
import { Navbar } from "@/components/navbar"
import { ProjectsSection } from "@/components/projects-section"
import { LogsSection } from "@/components/logs-section"
import { ErrorsSection } from "@/components/errors-section"
import { PM2ServiceDetails as PM2ServiceDetailsComponent } from "@/components/pm2-service-details"
import { PM2LogsViewer } from "@/components/pm2-logs-viewer"
import { PM2RealtimeLogs } from "@/components/pm2-realtime-logs"
import { Loader2 } from "lucide-react"
import type {
  NavSection,
  Project,
  Repo,
  ErrorLog,
  LogUrl,
  PM2Service,
  PM2ServiceDetails,
} from "@/types"

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
  const [selectedProjectInProjects, setSelectedProjectInProjects] = useState<string>("")
  const [selectedLogUrlId, setSelectedLogUrlId] = useState<string>("")
  const [logs, setLogs] = useState<string[]>([])
  const [loadingLogs, setLoadingLogs] = useState(false)
  const [newLogUrlName, setNewLogUrlName] = useState<string>("")
  const [newLogUrl, setNewLogUrl] = useState<string>("")
  const [pm2Services, setPm2Services] = useState<PM2Service[]>([])
  const [loadingPM2, setLoadingPM2] = useState(false)
  const [pm2ActionLoading, setPm2ActionLoading] = useState<string | null>(null)
  const [pm2ServiceDetails, setPm2ServiceDetails] = useState<PM2ServiceDetails | null>(null)
  const [loadingPM2Details, setLoadingPM2Details] = useState(false)
  const [pm2ServiceDetailsOpen, setPm2ServiceDetailsOpen] = useState(false)
  const [pm2ServiceLogs, setPm2ServiceLogs] = useState<string[]>([])
  const [loadingPM2Logs, setLoadingPM2Logs] = useState(false)
  const [pm2ServiceLogsOpen, setPm2ServiceLogsOpen] = useState(false)
  const [selectedPM2ServiceForLogs, setSelectedPM2ServiceForLogs] = useState<string>("")
  const [pm2RealtimeLogsOpen, setPm2RealtimeLogsOpen] = useState(false)
  const [selectedPM2ServiceForStreaming, setSelectedPM2ServiceForStreaming] = useState<string>("")
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
        logUrls: [],
      }
      const updatedProjects = [...projects, newProject]
      setProjects(updatedProjects)
      setNewProjectName("")
      setNewProjectUrl("")
      try {
        await saveProjects(updatedProjects)
        toast.success("Project added successfully")
      } catch (error) {
        // Error already handled in saveProjects
      }
    }
  }

  const handleFetchRepos = async (project: Project) => {
    setLoadingRepos(project.id)
    try {
      const baseUrl = project.baseUrl.endsWith("/") 
        ? project.baseUrl.slice(0, -1) 
        : project.baseUrl
      const response = await axios.get(`${baseUrl}/deploy-hook`)
      
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
      
      const response = await axios.post(`${baseUrl}/deploy-hook?repo=${repo.name}`)
      
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
    const project = projects.find((p) => p.id === projectId)
    if (project) {
      // Set default to deploy logs if no log URLs exist, or first log URL
      if (!project.logUrls || project.logUrls.length === 0) {
        setSelectedLogUrlId("default")
      } else {
        setSelectedLogUrlId(project.logUrls[0].id)
      }
    }
  }

  const handleLogUrlSelect = (logUrlId: string) => {
    setSelectedLogUrlId(logUrlId)
  }

  const fetchLogs = async (projectId: string, logUrlId?: string) => {
    const project = projects.find((p) => p.id === projectId)
    if (!project) return

    setLoadingLogs(true)
    try {
      let logUrl = ""
      
      if (logUrlId === "default" || !logUrlId) {
        // Default deploy logs
        const baseUrl = project.baseUrl.endsWith("/") 
          ? project.baseUrl.slice(0, -1) 
          : project.baseUrl
        logUrl = `${baseUrl}/deploy-hook/logs`
      } else {
        // Custom log URL
        const customLogUrl = project.logUrls?.find((lu) => lu.id === logUrlId)
        if (!customLogUrl) {
          throw new Error("Log URL not found")
        }
        logUrl = customLogUrl.url
      }
      
      const response = await axios.get(logUrl)
      
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

  const handleAddLogUrl = async (projectId: string) => {
    const name = newLogUrlName.trim()
    const url = newLogUrl.trim()
    
    if (!name || !url) {
      toast.error("Please enter both name and URL")
      return
    }

    const project = projects.find((p) => p.id === projectId)
    if (!project) return

    const newLogUrlObj: LogUrl = {
      id: Date.now().toString(),
      name,
      url,
    }

    const updatedProjects = projects.map((p) =>
      p.id === projectId
        ? { ...p, logUrls: [...(p.logUrls || []), newLogUrlObj] }
        : p
    )

    setProjects(updatedProjects)
    await saveProjects(updatedProjects)
    setNewLogUrlName("")
    setNewLogUrl("")
    toast.success("Log URL added successfully")
  }

  const handleRemoveLogUrl = async (projectId: string, logUrlId: string) => {
    const updatedProjects = projects.map((p) =>
      p.id === projectId
        ? { ...p, logUrls: (p.logUrls || []).filter((lu) => lu.id !== logUrlId) }
        : p
    )

    setProjects(updatedProjects)
    await saveProjects(updatedProjects)
    
    // If removed log URL was selected, switch to default
    if (selectedLogUrlId === logUrlId) {
      setSelectedLogUrlId("default")
    }
    
    toast.success("Log URL removed")
  }

  // Fetch logs when project or log URL is selected
  useEffect(() => {
    if (selectedProjectId && activeSection === "logs" && selectedLogUrlId) {
      fetchLogs(selectedProjectId, selectedLogUrlId)
    }
  }, [selectedProjectId, selectedLogUrlId, activeSection])

  // PM2 handlers
  const fetchPM2Services = async () => {
    const project = projects.find((p) => p.id === selectedProjectInProjects)
    if (!project) return

    setLoadingPM2(true)
    try {
      const baseUrl = project.baseUrl.endsWith("/") 
        ? project.baseUrl.slice(0, -1) 
        : project.baseUrl
      const response = await axios.get(`${baseUrl}/pm2`)
      
      if (response.data.status === "success" && response.data.services) {
        setPm2Services(response.data.services)
      } else {
        toast.error("Failed to fetch PM2 services")
        addError("Failed to fetch PM2 services", "Invalid response from server")
        setPm2Services([])
      }
    } catch (error: any) {
      console.error("Error fetching PM2 services:", error)
      const errorMsg = error.response?.data?.message || error.message || "Failed to fetch PM2 services"
      toast.error("Failed to fetch PM2 services")
      addError("Failed to fetch PM2 services", errorMsg)
      setPm2Services([])
    } finally {
      setLoadingPM2(false)
    }
  }

  const handlePM2ServiceAction = async (serviceName: string, action: "start" | "stop" | "restart") => {
    const project = projects.find((p) => p.id === selectedProjectInProjects)
    if (!project) return

    const actionKey = `${serviceName}-${action}`
    setPm2ActionLoading(actionKey)
    try {
      const baseUrl = project.baseUrl.endsWith("/") 
        ? project.baseUrl.slice(0, -1) 
        : project.baseUrl
      
      const response = await axios.post(`${baseUrl}/pm2/${serviceName}/${action}`)
      
      if (response.data.status === "success") {
        toast.success(`${action} ${serviceName}`, {
          description: response.data.message || `Service ${action}ed successfully`,
        })
        // Refresh PM2 services after action
        await fetchPM2Services()
      } else {
        const errorMsg = response.data.message || "Unknown error occurred"
        toast.error(`Failed to ${action} service`, {
          description: errorMsg,
        })
        addError(`Failed to ${action} PM2 service`, errorMsg)
      }
    } catch (error: any) {
      console.error(`Error ${action}ing PM2 service:`, error)
      const errorMessage = error.response?.data?.message || error.message || `Failed to ${action} service`
      toast.error(`Failed to ${action} service`, {
        description: errorMessage,
      })
      addError(`Failed to ${action} PM2 service`, errorMessage)
    } finally {
      setPm2ActionLoading(null)
    }
  }

  // Reset PM2 services when project selection changes
  useEffect(() => {
    if (selectedProjectInProjects) {
      setPm2Services([])
      setPm2ServiceDetails(null)
      setPm2ServiceLogs([])
      setSelectedPM2ServiceForLogs("")
      setSelectedPM2ServiceForStreaming("")
      setPm2ServiceDetailsOpen(false)
      setPm2ServiceLogsOpen(false)
      setPm2RealtimeLogsOpen(false)
    }
  }, [selectedProjectInProjects])

  // PM2 Service Details handler
  const fetchPM2ServiceDetails = async (serviceName: string) => {
    const project = projects.find((p) => p.id === selectedProjectInProjects)
    if (!project) return

    setLoadingPM2Details(true)
    setPm2ServiceDetailsOpen(true)
    try {
      const baseUrl = project.baseUrl.endsWith("/")
        ? project.baseUrl.slice(0, -1)
        : project.baseUrl
      const response = await axios.get(`${baseUrl}/pm2/${serviceName}`)

      if (response.data.status === "success") {
        // Service details might be in response.data.service or response.data
        const serviceData = response.data.service || response.data
        setPm2ServiceDetails(serviceData)
      } else {
        toast.error("Failed to fetch service details")
        addError("Failed to fetch PM2 service details", "Invalid response from server")
        setPm2ServiceDetails(null)
      }
    } catch (error: any) {
      console.error("Error fetching PM2 service details:", error)
      const errorMsg =
        error.response?.data?.message || error.message || "Failed to fetch service details"
      toast.error("Failed to fetch service details")
      addError("Failed to fetch PM2 service details", errorMsg)
      setPm2ServiceDetails(null)
    } finally {
      setLoadingPM2Details(false)
    }
  }

  // PM2 Service Logs handler
  const fetchPM2ServiceLogs = async (serviceName: string) => {
    const project = projects.find((p) => p.id === selectedProjectInProjects)
    if (!project) return

    setLoadingPM2Logs(true)
    setSelectedPM2ServiceForLogs(serviceName)
    setPm2ServiceLogsOpen(true)
    try {
      const baseUrl = project.baseUrl.endsWith("/")
        ? project.baseUrl.slice(0, -1)
        : project.baseUrl
      const response = await axios.get(`${baseUrl}/pm2/${serviceName}/logs`)

      if (response.data.status === "success" && response.data.logs) {
        // Logs might be an array of strings, array of objects, or a string
        if (Array.isArray(response.data.logs)) {
          // Check if it's an array of objects with message property
          const logStrings = response.data.logs.map((log: any) => {
            if (typeof log === "string") {
              return log
            } else if (log && typeof log === "object" && log.message) {
              return log.message
            } else {
              return String(log)
            }
          })
          setPm2ServiceLogs(logStrings)
        } else if (typeof response.data.logs === "string") {
          setPm2ServiceLogs(response.data.logs.split("\n"))
        } else {
          setPm2ServiceLogs([])
        }
      } else {
        toast.error("Failed to fetch service logs")
        addError("Failed to fetch PM2 service logs", "Invalid response from server")
        setPm2ServiceLogs([])
      }
    } catch (error: any) {
      console.error("Error fetching PM2 service logs:", error)
      const errorMsg =
        error.response?.data?.message || error.message || "Failed to fetch service logs"
      toast.error("Failed to fetch service logs")
      addError("Failed to fetch PM2 service logs", errorMsg)
      setPm2ServiceLogs([])
    } finally {
      setLoadingPM2Logs(false)
    }
  }

  const handlePM2ViewDetails = (serviceName: string) => {
    fetchPM2ServiceDetails(serviceName)
  }

  const handlePM2ViewLogs = (serviceName: string) => {
    fetchPM2ServiceLogs(serviceName)
  }

  const handlePM2StreamLogs = (serviceName: string) => {
    setSelectedPM2ServiceForStreaming(serviceName)
    setPm2RealtimeLogsOpen(true)
  }


  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-8">
        <Navbar activeSection={activeSection} onSectionChange={setActiveSection} />
      </div>
      
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {activeSection === "logs" && (
          <LogsSection
            projects={projects}
            selectedProjectId={selectedProjectId}
            selectedLogUrlId={selectedLogUrlId}
            logs={logs}
            loadingLogs={loadingLogs}
            onProjectSelect={handleProjectSelect}
            onLogUrlSelect={handleLogUrlSelect}
            onRefresh={() => fetchLogs(selectedProjectId, selectedLogUrlId)}
          />
        )}

        {activeSection === "errors" && (
          <ErrorsSection
            errors={errors}
            onClearErrors={clearErrors}
            onRemoveError={removeError}
          />
        )}

        {activeSection === "projects" && (
          <ProjectsSection
            projects={projects}
            loading={loading}
            selectedProjectId={selectedProjectInProjects}
            newProjectName={newProjectName}
            newProjectUrl={newProjectUrl}
            loadingRepos={loadingRepos}
            deployingRepo={deployingRepo}
            pm2Services={pm2Services}
            loadingPM2={loadingPM2}
            pm2ActionLoading={pm2ActionLoading}
            onProjectSelect={setSelectedProjectInProjects}
            onProjectNameChange={setNewProjectName}
            onProjectUrlChange={setNewProjectUrl}
            onAddProject={handleAddProject}
            onFetchRepos={handleFetchRepos}
            onDeploy={handleDeploy}
            onViewLogs={handleViewLogs}
            onFetchPM2Services={fetchPM2Services}
            onPM2ServiceAction={handlePM2ServiceAction}
            onPM2ViewDetails={handlePM2ViewDetails}
            onPM2ViewLogs={handlePM2ViewLogs}
            onPM2StreamLogs={handlePM2StreamLogs}
          />
        )}
      </main>

      {/* PM2 Service Details Dialog */}
      {selectedProjectInProjects && (
        <>
          <PM2ServiceDetailsComponent
            open={pm2ServiceDetailsOpen}
            onOpenChange={setPm2ServiceDetailsOpen}
            serviceDetails={pm2ServiceDetails}
            loading={loadingPM2Details}
          />

          {/* PM2 Service Logs Dialog */}
          <PM2LogsViewer
            open={pm2ServiceLogsOpen}
            onOpenChange={setPm2ServiceLogsOpen}
            serviceName={selectedPM2ServiceForLogs}
            logs={pm2ServiceLogs}
            loading={loadingPM2Logs}
            onRefresh={() => fetchPM2ServiceLogs(selectedPM2ServiceForLogs)}
          />

          {/* PM2 Real-time Logs Dialog */}
          {selectedProjectInProjects && (
            <PM2RealtimeLogs
              open={pm2RealtimeLogsOpen}
              onOpenChange={setPm2RealtimeLogsOpen}
              serviceName={selectedPM2ServiceForStreaming}
              baseUrl={
                projects.find((p) => p.id === selectedProjectInProjects)?.baseUrl || ""
              }
            />
          )}
        </>
      )}
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

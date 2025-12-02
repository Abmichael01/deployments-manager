export type NavSection = "projects" | "logs" | "errors"

export interface Repo {
  name: string
  path: string
  branch: string
}

export interface LogUrl {
  id: string
  name: string
  url: string
}

export interface Project {
  id: string
  name: string
  baseUrl: string
  repos: Repo[]
  logUrls?: LogUrl[]
}

export interface ErrorLog {
  id: string
  timestamp: Date
  message: string
  details?: string
}

export interface PM2Service {
  name: string
  status: "online" | "offline" | "stopped"
  uptime: number
  memory: number
  cpu: number
  pid: number
  restarts: number
  mode: string
}

export interface PM2Response {
  status: string
  message: string
  services: PM2Service[]
  endpoints?: Record<string, string>
}

export interface PM2ServiceDetails extends PM2Service {
  pm2_env?: {
    version?: string
    exec_mode?: string
    instances?: number
    node_version?: string
    pm_uptime?: number
    status?: string
    pm_id?: number
    unstable_restarts?: number
    created_at?: number
  }
  monit?: {
    memory?: number
    cpu?: number
  }
}

export interface PM2LogMessage {
  type: "log"
  process: string
  logType: "out" | "error"
  message: string
  timestamp: string
}

export interface PM2WebSocketConnected {
  type: "connected"
  message: string
  process: string
  logType: "both" | "out" | "error"
}

export interface PM2WebSocketError {
  type: "error"
  message: string
}

export interface PM2WebSocketPong {
  type: "pong"
}

export type PM2WebSocketMessage =
  | PM2LogMessage
  | PM2WebSocketConnected
  | PM2WebSocketError
  | PM2WebSocketPong


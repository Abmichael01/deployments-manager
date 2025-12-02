"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"

interface AddProjectDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  projectName: string
  projectUrl: string
  onProjectNameChange: (value: string) => void
  onProjectUrlChange: (value: string) => void
  onAddProject: (e: React.FormEvent) => void
}

export function AddProjectDialog({
  open,
  onOpenChange,
  projectName,
  projectUrl,
  onProjectNameChange,
  onProjectUrlChange,
  onAddProject,
}: AddProjectDialogProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onAddProject(e)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Project</DialogTitle>
          <DialogDescription>
            Enter the name and base URL for your project
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="projectName">Project Name</Label>
            <Input
              id="projectName"
              type="text"
              placeholder="My Project"
              value={projectName}
              onChange={(e) => onProjectNameChange(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="baseUrl">Base URL</Label>
            <Input
              id="baseUrl"
              type="url"
              placeholder="https://example.com"
              value={projectUrl}
              onChange={(e) => onProjectUrlChange(e.target.value)}
              required
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Add Project</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}


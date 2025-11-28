"use client"

import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { cn } from "@/lib/utils"

type NavSection = "projects" | "logs" | "errors"

interface NavbarProps {
  activeSection: NavSection
  onSectionChange: (section: NavSection) => void
}

export function Navbar({ activeSection, onSectionChange }: NavbarProps) {
  return (
    <nav className="sticky top-0 z-50 w-full">
      <div className="flex overflow-hidden h-14 items-center justify-between rounded-lg border bg-card px-6">
        <div className="flex items-center h-full -mx-6 ">
          <Button
            variant="ghost"
            onClick={() => onSectionChange("projects")}
            className={cn(
              "h-full rounded-none rounded-tl-lg transition-colors px-10",
              activeSection === "projects" && "border-b border-white"
            )}
          >
            Projects
          </Button>
          <Button
            variant="ghost"
            onClick={() => onSectionChange("logs")}
            className={cn(
              "h-full rounded-none transition-colors px-10",
              activeSection === "logs" && "border-b border-white"
            )}
          >
            Deploy Logs
          </Button>
          <Button
            variant="ghost"
            onClick={() => onSectionChange("errors")}
            className={cn(
              "h-full rounded-none transition-colors px-10",
              activeSection === "errors" && "border-b border-white"
            )}
          >
            Errors
          </Button>
        </div>
        <ThemeToggle />
      </div>
    </nav>
  )
}


"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertCircle, X } from "lucide-react"
import type { ErrorLog } from "@/types"

interface ErrorsSectionProps {
  errors: ErrorLog[]
  onClearErrors: () => void
  onRemoveError: (id: string) => void
}

export function ErrorsSection({
  errors,
  onClearErrors,
  onRemoveError,
}: ErrorsSectionProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Errors</CardTitle>
              <CardDescription>View all application errors</CardDescription>
            </div>
            {errors.length > 0 && (
              <Button variant="outline" size="sm" onClick={onClearErrors}>
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
                <div key={error.id} className="p-4 rounded-lg border bg-card space-y-2">
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
                      onClick={() => onRemoveError(error.id)}
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
  )
}


"use client"

import { ReactNode } from "react"
import { cn } from "@/lib/utils"

interface GameTooltipProps {
  children: ReactNode
  votes: Array<{
    user: {
      id: string
      name: string | null
      email: string | null
    }
  }>
  className?: string
}

export function GameTooltip({ children, votes, className }: GameTooltipProps) {
  return (
    <div className={cn("relative group", className)}>
      {children}
      {votes.length > 0 && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50">
          <div className="bg-popover border border-border rounded-md shadow-lg p-3 min-w-[200px] max-w-[300px]">
            <div className="text-sm font-medium text-foreground mb-2">
              Abgestimmt von:
            </div>
            <div className="space-y-1">
              {votes.map((vote, index) => (
                <div key={vote.user.id} className="text-xs text-muted-foreground flex items-center gap-2">
                  <div className="w-2 h-2 bg-primary rounded-full" />
                  {vote.user.name || vote.user.email || 'Unbekannt'}
                </div>
              ))}
            </div>
            <div className="text-xs text-muted-foreground mt-2 pt-2 border-t border-border">
              {votes.length} {votes.length === 1 ? 'Stimme' : 'Stimmen'}
            </div>
          </div>
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 rotate-45 w-2 h-2 bg-popover border-r border-b border-border"></div>
        </div>
      )}
    </div>
  )
}

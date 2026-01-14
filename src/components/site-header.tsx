'use client'

import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Badge } from "@/components/ui/badge"

interface SiteHeaderProps {
  breadcrumb?: React.ReactNode
}

export function SiteHeader({ breadcrumb }: SiteHeaderProps) {

  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        {breadcrumb || <h1 className="text-base font-medium">Intelligent Document Processor</h1>}
        <div className="ml-auto flex items-center gap-2">
          <Badge variant="outline" className="hidden sm:flex items-center gap-1">
            <span className="text-xs">⌘K</span>
            <span className="text-xs">Open Command</span>
          </Badge>
        </div>
      </div>
    </header>
  )
}

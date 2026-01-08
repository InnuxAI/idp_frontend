"use client"

import { AppSidebar } from "@/components/app-sidebar"
import { ChatInteractive } from "@/components/chat-timeline" // Import from NEW file
import { SiteHeader } from "@/components/site-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { useDocumentContext } from "@/contexts/document-context"

export default function ChatPage() {
  const { selectedDocuments, removeDocument } = useDocumentContext()

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        {/* Full height container with no padding for the App Shell feel */}
        <div className="relative flex flex-1 flex-col overflow-hidden">
          <ChatInteractive
            selectedDocuments={selectedDocuments}
            onRemoveDocument={removeDocument}
          />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

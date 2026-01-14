"use client"

import { AppSidebar } from "@/components/app-sidebar"
import { ChatInteractive } from "@/components/chat-timeline" // Import from NEW file
import { motion } from "motion/react"
import { SiteHeader } from "@/components/site-header"
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator, BreadcrumbLink } from "@/components/ui/breadcrumb"
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
        <SiteHeader
          breadcrumb={
            <Breadcrumb>
              <BreadcrumbList>
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <BreadcrumbItem className="hidden md:block">
                    <BreadcrumbLink href="#" className="dark:text-zinc-400 dark:hover:text-zinc-200">
                      Platform
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.15 }}
                >
                  <BreadcrumbSeparator className="hidden md:block dark:text-zinc-600" />
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <BreadcrumbItem>
                    <BreadcrumbPage className="dark:text-zinc-100">Chat</BreadcrumbPage>
                  </BreadcrumbItem>
                </motion.div>
              </BreadcrumbList>
            </Breadcrumb>
          }
        />
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

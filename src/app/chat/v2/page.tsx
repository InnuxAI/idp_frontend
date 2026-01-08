"use client"

import React from 'react'
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import {
    SidebarInset,
    SidebarProvider,
} from "@/components/ui/sidebar"
import { useDocumentContext } from "@/contexts/document-context"
import { AssistantChat } from "@/components/chat"

export default function ChatV2Page() {
    const { selectedDocuments } = useDocumentContext()

    // Extract document IDs for the chat
    const documentIds = selectedDocuments.map(doc => doc.doc_id || doc.filename)

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
                {/* Full height container for the chat */}
                <div className="relative flex flex-1 flex-col overflow-hidden">
                    <AssistantChat
                        documentIds={documentIds}
                        showSidebar={true}
                    />
                </div>
            </SidebarInset>
        </SidebarProvider>
    )
}

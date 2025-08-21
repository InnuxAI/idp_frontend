"use client"

import { useEffect, useState } from "react"
import { CommandPalette } from "@/components/command-palette"
import { UploadModal } from "@/components/upload-modal"
import { DocumentsDialog } from "@/components/documents-dialog"
import { useDocumentContext } from "@/contexts/document-context"

export function GlobalKeyboardShortcuts() {
  const [commandOpen, setCommandOpen] = useState(false)
  const { 
    uploadModalOpen, 
    setUploadModalOpen, 
    docsModalOpen, 
    setDocsModalOpen,
    selectedDocuments,
    toggleDocument
  } = useDocumentContext()

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setCommandOpen((open) => !open)
      }
    }

    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  return (
    <>
      <CommandPalette open={commandOpen} onOpenChange={setCommandOpen} />
      <UploadModal 
        open={uploadModalOpen} 
        onOpenChange={setUploadModalOpen}
        onUploadSuccess={() => {
          console.log('Document uploaded successfully');
        }}
      />
      <DocumentsDialog
        open={docsModalOpen}
        onOpenChange={setDocsModalOpen}
        selectedDocuments={selectedDocuments}
        onDocumentToggle={toggleDocument}
      />
    </>
  )
}

"use client"

import React, { createContext, useContext, useState, useEffect } from 'react'
import { Document } from '@/services/api'

interface DocumentContextType {
  selectedDocuments: Document[]
  setSelectedDocuments: React.Dispatch<React.SetStateAction<Document[]>>
  toggleDocument: (document: Document) => void
  removeDocument: (docId: string) => void
  isDocumentSelected: (docId: string) => boolean
  uploadModalOpen: boolean
  setUploadModalOpen: (open: boolean) => void
  docsModalOpen: boolean
  setDocsModalOpen: (open: boolean) => void
}

const DocumentContext = createContext<DocumentContextType | undefined>(undefined)

export function DocumentProvider({ children }: { children: React.ReactNode }) {
  const [selectedDocuments, setSelectedDocuments] = useState<Document[]>([])
  const [uploadModalOpen, setUploadModalOpen] = useState(false)
  const [docsModalOpen, setDocsModalOpen] = useState(false)

  // Load selected documents from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('selectedDocuments')
      if (saved) {
        try {
          setSelectedDocuments(JSON.parse(saved))
        } catch (error) {
          console.error('Error loading selected documents:', error)
        }
      }
    }
  }, [])

  // Save selected documents to localStorage whenever they change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('selectedDocuments', JSON.stringify(selectedDocuments))
    }
  }, [selectedDocuments])

  const toggleDocument = (document: Document) => {
    setSelectedDocuments(prev => {
      const isAlreadySelected = prev.some(doc => doc.doc_id === document.doc_id)
      if (isAlreadySelected) {
        return prev.filter(doc => doc.doc_id !== document.doc_id)
      } else {
        return [...prev, document]
      }
    })
  }

  const removeDocument = (docId: string) => {
    setSelectedDocuments(prev => prev.filter(doc => doc.doc_id !== docId))
  }

  const isDocumentSelected = (docId: string) => {
    return selectedDocuments.some(doc => doc.doc_id === docId)
  }

  return (
    <DocumentContext.Provider
      value={{
        selectedDocuments,
        setSelectedDocuments,
        toggleDocument,
        removeDocument,
        isDocumentSelected,
        uploadModalOpen,
        setUploadModalOpen,
        docsModalOpen,
        setDocsModalOpen,
      }}
    >
      {children}
    </DocumentContext.Provider>
  )
}

export function useDocumentContext() {
  const context = useContext(DocumentContext)
  if (context === undefined) {
    throw new Error('useDocumentContext must be used within a DocumentProvider')
  }
  return context
}

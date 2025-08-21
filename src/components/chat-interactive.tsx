"use client"

import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Search, MessageCircle, X, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { CopyButton } from '@/components/ui/shadcn-io/copy-button';
import { DocumentsDialog } from '@/components/documents-dialog';
import { TextShimmerWave } from '@/components/ui/text-shimmer-wave';
import { apiService, Document, QueryResponse } from '@/services/api';

interface ChatInteractiveProps {
  selectedDocuments?: Document[];
  onRemoveDocument?: (docId: string) => void;
  onDocumentToggle?: (document: Document) => void;
}

export function ChatInteractive({ 
  selectedDocuments = [], 
  onRemoveDocument,
  onDocumentToggle 
}: ChatInteractiveProps) {
  const [query, setQuery] = useState('');
  const [queryResponse, setQueryResponse] = useState<QueryResponse | null>(null);
  const [isQuerying, setIsQuerying] = useState(false);
  const [documentsDialogOpen, setDocumentsDialogOpen] = useState(false);

  const handleQuery = async () => {
    if (!query.trim()) return;

    setIsQuerying(true);
    try {
      // Append selected document context to the query
      let contextualQuery = query;
      if (selectedDocuments.length > 0) {
        const contextInfo = selectedDocuments.map(doc => `[${doc.filename}:${doc.doc_id}]`).join(' ');
        contextualQuery = `${query} Context documents: ${contextInfo}`;
      }

      const filename = selectedDocuments.length > 0 
        ? selectedDocuments.map(doc => doc.filename).join(', ')
        : null;
      
      const response = await apiService.queryDocuments(contextualQuery, filename);
      setQueryResponse(response);
    } catch (error) {
      console.error('Query failed:', error);
    } finally {
      setIsQuerying(false);
    }
  };

  const handleDocumentToggle = (document: Document) => {
    onDocumentToggle?.(document);
  };

  return (
    <div className="h-full flex flex-col space-y-6 p-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <MessageCircle className="h-6 w-6" />
          <h1 className="text-2xl font-semibold">Chat with Documents</h1>
        </div>
        <p className="text-muted-foreground">
          Ask questions about your uploaded documents
        </p>
      </div>

      {/* Query Input */}
      <div className="flex space-x-2">
        <Input
          placeholder="Ask a question about your documents..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !isQuerying && handleQuery()}
          disabled={isQuerying}
          className="flex-1"
        />
        <Button 
          onClick={() => setDocumentsDialogOpen(true)}
          disabled={isQuerying}
          size="default"
          title="Add documents"
        >
          <Plus className="h-4 w-4" />
        </Button>
        <Button 
          onClick={handleQuery}
          disabled={isQuerying || !query.trim()}
          size="default"
        >
          <Search className="h-4 w-4" />
        </Button>
      </div>

      {/* Selected Documents for Context */}
      {selectedDocuments.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium">Context:</span>
            <Badge variant="secondary" className="text-xs">
              {selectedDocuments.length} document{selectedDocuments.length !== 1 ? 's' : ''} selected
            </Badge>
          </div>
          <div className="flex flex-wrap gap-2">
            {selectedDocuments.map((doc) => (
              <Badge 
                key={doc.doc_id} 
                variant="outline" 
                className="text-xs flex items-center space-x-1 pr-1"
              >
                <span className="truncate max-w-[120px]">{doc.filename}</span>
                {onRemoveDocument && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onRemoveDocument(doc.doc_id)}
                    className="h-4 w-4 p-0 hover:bg-destructive/20 ml-1"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* {selectedDocuments.length === 0 && (
        <div className="text-center py-8 border-2 border-dashed border-muted rounded-lg">
          <p className="text-muted-foreground">
            Select documents from the Docs section to start asking questions
          </p>
        </div>
      )} */}

      {isQuerying && (
        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center space-y-3">
            <TextShimmerWave
              className='[--base-color:#0D74CE] [--base-gradient-color:#5EB1EF]'
              duration={1}
              spread={1}
              zDistance={1}
              scaleDistance={1.1}
              rotateYDistance={20}
            >
              Analyzing documents...
            </TextShimmerWave>
          </div>
        </div>
      )}

      {queryResponse && !isQuerying && (
        <div className="flex-1 flex flex-col space-y-4 min-h-0">
          {/* Answer Section */}
          <div className="flex-1 flex flex-col space-y-3 min-h-0">
            <div className="flex items-center space-x-2">
              <h2 className="text-lg font-semibold">Answer</h2>
              <Badge variant="outline" className="text-xs">
                {queryResponse.method}
              </Badge>
            </div>
            <div className="relative flex-1 bg-background border rounded-lg p-6 shadow-sm overflow-y-auto min-h-0 max-h-[30vh]">
              {queryResponse.answer && (
                <CopyButton
                  content={queryResponse.answer}
                  variant="outline"
                  size="sm"
                  className="absolute top-3 right-3 z-10"
                />
              )}
              <ReactMarkdown 
                components={{
                  p: ({ children }) => <p className="mb-4 leading-relaxed text-foreground">{children}</p>,
                  ul: ({ children }) => <ul className="list-disc list-inside mb-4 space-y-1 text-foreground pl-2">{children}</ul>,
                  ol: ({ children }) => <ol className="list-decimal list-inside mb-4 space-y-1 text-foreground pl-2">{children}</ol>,
                  li: ({ children }) => <li className="text-foreground">{children}</li>,
                  strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
                  em: ({ children }) => <em className="italic text-foreground">{children}</em>,
                  h1: ({ children }) => <h1 className="text-xl font-semibold mb-3 text-foreground">{children}</h1>,
                  h2: ({ children }) => <h2 className="text-lg font-semibold mb-3 text-foreground">{children}</h2>,
                  h3: ({ children }) => <h3 className="text-base font-semibold mb-2 text-foreground">{children}</h3>,
                  code: ({ children }) => <code className="bg-muted px-2 py-1 rounded text-sm font-mono">{children}</code>,
                  blockquote: ({ children }) => <blockquote className="border-l-4 border-primary pl-4 italic text-muted-foreground mb-4">{children}</blockquote>,
                }}
              >
                {queryResponse.answer}
              </ReactMarkdown>
            </div>
          </div>
          
          {/* Sources Section */}
          <div className="flex-1 flex flex-col space-y-3 min-h-0">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Sources</h2>
              <Badge variant="secondary" className="text-xs">
                {queryResponse.sources.length} source{queryResponse.sources.length !== 1 ? 's' : ''}
              </Badge>
            </div>
            <div className="flex-1 overflow-y-auto pr-2 min-h-0 max-h-[30vh]">
              <div className="grid gap-4">
                {queryResponse.sources.map((source, index) => (
                  <div key={index} className="border rounded-lg p-4 bg-muted/30 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline">
                          {source.filename || `Document ${source.document_index}`}
                        </Badge>
                        <span className="text-xs text-muted-foreground">Source {index + 1}</span>
                      </div>
                      {source.relevance_score && (
                        <Badge variant="secondary" className="text-xs">
                          {Math.round(source.relevance_score * 100)}% match
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm leading-relaxed text-foreground">
                      {source.content_preview || source.content}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Documents Dialog */}
      <DocumentsDialog
        open={documentsDialogOpen}
        onOpenChange={setDocumentsDialogOpen}
        selectedDocuments={selectedDocuments}
        onDocumentToggle={handleDocumentToggle}
      />
    </div>
  );
}

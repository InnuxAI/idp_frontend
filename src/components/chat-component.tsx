"use client"

import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Search, MessageCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { apiService, Document, QueryResponse } from '@/services/api';

interface ChatComponentProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDocuments: Document[];
  onRemoveDocument: (docId: string) => void;
}

export function ChatComponent({ 
  open, 
  onOpenChange, 
  selectedDocuments, 
  onRemoveDocument 
}: ChatComponentProps) {
  const [query, setQuery] = useState('');
  const [queryResponse, setQueryResponse] = useState<QueryResponse | null>(null);
  const [isQuerying, setIsQuerying] = useState(false);

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] w-[90vw]">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <MessageCircle className="h-5 w-5" />
            <span>Chat with Documents</span>
          </DialogTitle>
        </DialogHeader>
        
        <Card className="max-h-[75vh] h-[75vh] flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <MessageCircle className="h-5 w-5" />
              <span>Chat with Documents</span>
            </CardTitle>
            <CardDescription>
              Ask questions about your uploaded documents
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 flex-1 overflow-hidden flex flex-col">
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
                onClick={handleQuery}
                disabled={isQuerying || !query.trim()}
              >
                <Search className="h-4 w-4" />
              </Button>
            </div>

            {/* Selected Documents for Context */}
            {selectedDocuments.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-muted-foreground">Context:</span>
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
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onRemoveDocument(doc.doc_id)}
                        className="h-4 w-4 p-0 hover:bg-destructive/20 ml-1"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {selectedDocuments.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                Select documents from the Docs section to start asking questions
              </p>
            )}

            {isQuerying && (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            )}

            {queryResponse && !isQuerying && (
              <div className="flex-1 overflow-y-auto pr-2">
                <Card className="bg-muted/50">
                  <CardHeader>
                    <CardTitle className="text-lg">Answer</CardTitle>
                    <CardDescription>
                      Query: "{queryResponse.query}"
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="min-h-[120px] bg-background border rounded-md p-4">
                      <ReactMarkdown 
                        components={{
                          // Custom styling for markdown elements
                          p: ({ children }) => <p className="mb-3 leading-relaxed text-foreground">{children}</p>,
                          ul: ({ children }) => <ul className="list-disc list-inside mb-3 space-y-1 text-foreground">{children}</ul>,
                          ol: ({ children }) => <ol className="list-decimal list-inside mb-3 space-y-1 text-foreground">{children}</ol>,
                          li: ({ children }) => <li className="text-foreground">{children}</li>,
                          strong: ({ children }) => <strong className="font-bold text-foreground">{children}</strong>,
                          em: ({ children }) => <em className="italic text-foreground">{children}</em>,
                          h1: ({ children }) => <h1 className="text-xl font-bold mb-2 text-foreground">{children}</h1>,
                          h2: ({ children }) => <h2 className="text-lg font-bold mb-2 text-foreground">{children}</h2>,
                          h3: ({ children }) => <h3 className="text-base font-bold mb-2 text-foreground">{children}</h3>,
                          code: ({ children }) => <code className="bg-muted px-1 py-0.5 rounded text-sm font-mono">{children}</code>,
                          blockquote: ({ children }) => <blockquote className="border-l-4 border-border pl-4 italic text-muted-foreground mb-3">{children}</blockquote>,
                        }}
                      >
                        {queryResponse.answer}
                      </ReactMarkdown>
                    </div>
                    
                    <div className="border-t border-border pt-4">
                      <h4 className="text-sm font-medium mb-3">Sources</h4>
                      <div className="space-y-3">
                        {queryResponse.sources.map((source, index) => (
                          <Card key={index} className="bg-background">
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between mb-2">
                                <Badge variant="outline" className='mt-2'>
                                  {source.filename || `Document ${source.document_index}`}
                                </Badge>
                                {source.relevance_score && (
                                  <Badge variant="secondary">
                                    {Math.round(source.relevance_score * 100)}% match
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {source.content_preview || source.content}
                              </p>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border">
                      <span>Method: {queryResponse.method}</span>
                      <span>{queryResponse.sources.length} source{queryResponse.sources.length !== 1 ? 's' : ''}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
}

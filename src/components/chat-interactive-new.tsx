"use client"

import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'motion/react';
import { Search, MessageCircle, X, Plus, Zap, Clock, FileText, MessageSquare, Files, Activity, Loader, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CopyButton } from '@/components/ui/shadcn-io/copy-button';
import { DocumentsDialog } from '@/components/documents-dialog';
import { TextShimmerWave } from '@/components/ui/text-shimmer-wave';
import { PromptInputBox } from '@/components/ui/ai-prompt-box';
import { apiService, Document, QueryResponse, StreamEvent } from '@/services/api';

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
  const [sourcesDialogOpen, setSourcesDialogOpen] = useState(false);
  const [streamingEvents, setStreamingEvents] = useState<StreamEvent[]>([]);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [useStreaming, setUseStreaming] = useState(true);
  const [selectedDocument, setSelectedDocument] = useState<any>(null);
  const [expandedEvents, setExpandedEvents] = useState<Set<number>>(new Set());
  const [activeTab, setActiveTab] = useState<string>("sources");

  // Derived values
  const relevantDocuments = queryResponse?.sources || [];

  const handleQuery = async (useStreamingOverride?: boolean) => {
    if (!query.trim()) return;

    const streamingToUse = useStreamingOverride !== undefined ? useStreamingOverride : useStreaming;

    setIsQuerying(true);
    setQueryResponse(null);
    setStreamingEvents([]);
    setCurrentAnswer('');
    setActiveTab("steps"); // Switch to Steps tab when query starts

    try {
      if (streamingToUse) {
        setIsStreaming(true);
        
        // Append selected document context to the query
        let contextualQuery = query;
        if (selectedDocuments.length > 0) {
          const contextInfo = selectedDocuments.map(doc => `[${doc.filename}:${doc.doc_id}]`).join(' ');
          contextualQuery = `${query} Context documents: ${contextInfo}`;
        }

        const filename = selectedDocuments.length > 0 
          ? selectedDocuments.map(doc => doc.filename).join(', ')
          : null;
        
        const events: StreamEvent[] = [];
        let answer = '';
        let sources: string[] = [];

        await apiService.queryDocumentsStream(
          contextualQuery,
          filename,
          3,
          (event: StreamEvent) => {
            // Handle response content separately - don't add to events array
            if (event.type === 'RunResponseContent') {
              answer += event.content;
              setCurrentAnswer(answer);
              return; // Don't add to events array
            } 
            
            // Add non-content events to the events array
            if (event.type !== 'RunResponseContent') {
              events.push(event);
              setStreamingEvents([...events]);
            }

            if (event.type === 'sources') {
              try {
                sources = JSON.parse(event.content);
              } catch (e) {
                sources = [event.content];
              }
            } else if (event.type === 'complete') {
              setQueryResponse({
                query: contextualQuery,
                answer: answer,
                sources: sources.map((source, index) => ({
                  document_index: index + 1,
                  content: typeof source === 'string' ? source : JSON.stringify(source)
                })),
                method: 'streaming'
              });
            }
          }
        );

        setIsStreaming(false);
      } else {
        // Use traditional non-streaming approach
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
      }
    } catch (error) {
      console.error('Query failed:', error);
      setQueryResponse({
        query: query,
        answer: 'Sorry, there was an error processing your query.',
        sources: [],
        method: 'error'
      });
    } finally {
      setIsQuerying(false);
      setIsStreaming(false);
    }
  };

  const handleDocumentToggle = (document: Document) => {
    onDocumentToggle?.(document);
  };

  const handleSendMessage = (message: string, files?: File[], useStreaming?: boolean) => {
    setQuery(message);
    if (useStreaming !== undefined) {
      handleQuery(useStreaming);
    } else {
      handleQuery();
    }
  };

  return (
    <div className="h-full flex flex-col relative">
      {/* Simple initial state - floating prompt in center */}
      {!queryResponse && !isQuerying && !isStreaming && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex-1 flex items-center justify-center p-6"
        >
          <div className="w-full max-w-2xl space-y-4">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-center space-y-2"
            >
              <h1 className="text-2xl font-semibold">Chat with Documents</h1>
              <p className="text-muted-foreground">
                Ask questions about your uploaded documents
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <PromptInputBox
                onSend={handleSendMessage}
                placeholder="Ask a question about your documents..."
                isLoading={isQuerying || isStreaming}
                defaultStreaming={useStreaming}
              />
            </motion.div>

            {/* Selected Documents for Context */}
            {selectedDocuments.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="space-y-3"
              >
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium">Context:</span>
                  <Badge variant="secondary" className="text-xs">
                    {selectedDocuments.length} document{selectedDocuments.length !== 1 ? 's' : ''} selected
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-2">
                  {selectedDocuments.map((doc, index) => (
                    <motion.div
                      key={doc.doc_id}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ 
                        delay: index * 0.05,
                        type: "spring", 
                        stiffness: 400, 
                        damping: 25 
                      }}
                      whileHover={{ scale: 1.05 }}
                    >
                      <Badge 
                        variant="outline" 
                        className="text-xs flex items-center space-x-1 pr-1"
                      >
                        <span className="truncate max-w-[120px]">{doc.filename}</span>
                        {onRemoveDocument && (
                          <button
                            onClick={() => onRemoveDocument(doc.doc_id)}
                            className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        )}
                      </Badge>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex justify-center"
            >
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
              >
                <Button 
                  onClick={() => setDocumentsDialogOpen(true)}
                  variant="outline"
                  size="sm"
                  className="text-sm"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Documents
                </Button>
              </motion.div>
            </motion.div>
          </div>
        </motion.div>
      )}

      {/* Expanded state - full interface after query */}
      {(queryResponse || isQuerying || isStreaming) && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex-1 flex flex-col space-y-6 p-6"
        >
          {/* Header with title */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between"
          >
            <div className="flex items-center space-x-2">
              <MessageCircle className="h-5 w-5" />
              <h1 className="text-lg font-semibold">Chat with Documents</h1>
            </div>
            <Button 
              onClick={() => setDocumentsDialogOpen(true)}
              variant="outline"
              size="sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              Documents
            </Button>
          </motion.div>

          {/* Main content area with tabs */}
          <div className="flex-1 flex space-x-6">
            {/* Main content - Answer section */}
            <div className="flex-1 space-y-4">
              {/* Query Response */}
              {(queryResponse || isStreaming) && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="bg-gray-100 dark:bg-gray-900 rounded-lg border p-6 space-y-4"
                >
                  <div className="flex items-center space-x-2">
                    <MessageSquare className="h-5 w-5" />
                    <h3 className="font-semibold">Answer</h3>
                  </div>
                  
                  {/* Loading state */}
                  {isQuerying && !isStreaming && (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex items-center space-x-2"
                    >
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      >
                        <Loader className="h-4 w-4" />
                      </motion.div>
                      <span className="text-sm text-muted-foreground">Searching documents...</span>
                    </motion.div>
                  )}

                  {/* Streaming content */}
                  {isStreaming && currentAnswer && (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="prose dark:prose-invert max-w-none"
                    >
                      <ReactMarkdown>{currentAnswer}</ReactMarkdown>
                    </motion.div>
                  )}

                  {/* Final response */}
                  {queryResponse && !isStreaming && (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="prose dark:prose-invert max-w-none"
                    >
                      <ReactMarkdown>{queryResponse.answer}</ReactMarkdown>
                    </motion.div>
                  )}

                  {/* Source cards within answer */}
                  {relevantDocuments.length > 0 && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 }}
                      className="mt-6 space-y-3"
                    >
                      <h4 className="text-sm font-medium text-muted-foreground">Sources</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {relevantDocuments.slice(0, 4).map((doc, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ 
                              delay: 0.1 * index,
                              type: "spring", 
                              stiffness: 300, 
                              damping: 25 
                            }}
                            whileHover={{ scale: 1.02 }}
                            className="p-3 bg-muted rounded-lg border text-sm space-y-2"
                          >
                            <div className="flex items-center justify-between">
                              <Badge variant="secondary" className="text-xs">
                                Source {doc.document_index}
                              </Badge>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 px-2 text-xs"
                                onClick={() => {
                                  setSelectedDocument(doc);
                                  setSourcesDialogOpen(true);
                                }}
                              >
                                View
                              </Button>
                            </div>
                            <div className="text-xs line-clamp-3 text-muted-foreground">
                              {doc.content?.slice(0, 150) || 'No content available'}...
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              )}
            </div>

            {/* Sidebar with tabs */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="w-80 space-y-4"
            >
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="sources">Sources</TabsTrigger>
                  <TabsTrigger value="steps">Steps</TabsTrigger>
                </TabsList>
                
                <TabsContent value="sources" className="space-y-3">
                  <div className="bg-gray-100 dark:bg-gray-900 rounded-lg border p-4">
                    <h3 className="font-semibold mb-3 flex items-center space-x-2">
                      <Files className="h-4 w-4" />
                      <span>Relevant Documents</span>
                    </h3>
                    
                    {relevantDocuments.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No sources found yet</p>
                    ) : (
                      <div className="space-y-2">
                        {relevantDocuments.map((doc, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ 
                              delay: 0.1 * index,
                              type: "spring", 
                              stiffness: 300, 
                              damping: 25 
                            }}
                            whileHover={{ scale: 1.02 }}
                            className="p-3 border rounded-lg bg-accent hover:bg-muted/50 cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedDocument(doc);
                              setSourcesDialogOpen(true);
                            }}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <Badge variant="secondary" className="text-xs">
                                Source {doc.document_index}
                              </Badge>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 px-2 text-xs"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedDocument(doc);
                                  setSourcesDialogOpen(true);
                                }}
                              >
                                <ExternalLink className="h-3 w-3" />
                              </Button>
                            </div>
                            <div className="text-xs line-clamp-3 text-muted-foreground">
                              {doc.content?.slice(0, 100) || 'No content available'}...
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </div>
                </TabsContent>
                
                <TabsContent value="steps" className="space-y-3">
                  <div className="bg-gray-100 dark:bg-gray-900 rounded-lg border p-4">
                    <h3 className="font-semibold mb-3 flex items-center space-x-2">
                      <Activity className="h-4 w-4" />
                      <span>Agent Activity</span>
                      <Badge variant="secondary" className="text-xs">
                        {streamingEvents.length} events
                      </Badge>
                    </h3>
                    
                    {streamingEvents.length === 0 && !isStreaming ? (
                      <p className="text-sm text-muted-foreground">No activity yet</p>
                    ) : (
                      <div className="border rounded-lg bg-card shadow-sm max-h-96 overflow-y-auto">
                        <div className="space-y-0">
                          {streamingEvents.map((event, index) => (
                            <motion.div
                              key={index}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.05 }}
                              className={`p-3 border-b last:border-b-0 ${
                                expandedEvents.has(index) ? 'bg-accent/30' : 'hover:bg-accent/10'
                              } transition-colors`}
                            >
                              <div 
                                className="flex items-center justify-between cursor-pointer"
                                onClick={() => {
                                  const newExpanded = new Set(expandedEvents);
                                  if (expandedEvents.has(index)) {
                                    newExpanded.delete(index);
                                  } else {
                                    newExpanded.add(index);
                                  }
                                  setExpandedEvents(newExpanded);
                                }}
                              >
                                <div className="flex items-center space-x-2">
                                  <Badge 
                                    variant={
                                      event.type === 'tool_call' ? 'default' :
                                      event.type === 'tool_result' ? 'secondary' :
                                      event.type === 'sources' ? 'outline' :
                                      'secondary'
                                    }
                                    className="text-xs"
                                  >
                                    {event.type}
                                  </Badge>
                                  <div className="flex items-center space-x-1">
                                    <Clock className="h-3 w-3 text-muted-foreground" />
                                    <span className="text-xs text-muted-foreground">
                                      {(event as any).timestamp ? new Date((event as any).timestamp).toLocaleTimeString() : 'Now'}
                                    </span>
                                  </div>
                                </div>
                                <motion.div
                                  animate={{ rotate: expandedEvents.has(index) ? 180 : 0 }}
                                  transition={{ duration: 0.2 }}
                                >
                                  <Zap className="h-3 w-3 text-muted-foreground" />
                                </motion.div>
                              </div>
                              
                              <AnimatePresence>
                                {expandedEvents.has(index) && (
                                  <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="mt-2 overflow-hidden"
                                  >
                                    <div className="text-xs p-2 bg-muted rounded text-muted-foreground whitespace-pre-wrap">
                                      {event.content}
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </motion.div>
          </div>

          {/* Floating prompt box at bottom */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="sticky bottom-0 bg-background/80 backdrop-blur-sm border-t pt-4"
          >
            <PromptInputBox
              onSend={handleSendMessage}
              placeholder="Ask a follow-up question..."
              isLoading={isQuerying || isStreaming}
              defaultStreaming={useStreaming}
            />
          </motion.div>
        </motion.div>
      )}

      {/* Documents Dialog */}
      <DocumentsDialog
        open={documentsDialogOpen}
        onOpenChange={setDocumentsDialogOpen}
        selectedDocuments={selectedDocuments}
        onDocumentToggle={handleDocumentToggle}
      />

      {/* Sources Floating Panel */}
      <AnimatePresence>
        {sourcesDialogOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={() => setSourcesDialogOpen(false)}
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ 
                type: "spring", 
                damping: 25, 
                stiffness: 300,
                duration: 0.3 
              }}
              className="w-[80vw] h-[80vh] bg-background border rounded-lg shadow-xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-4 border-b bg-card">
                <div className="flex items-center space-x-2">
                  <FileText className="h-5 w-5" />
                  <span className="text-lg font-semibold">Document Sources</span>
                  {queryResponse?.sources && (
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.2, type: "spring", stiffness: 400, damping: 25 }}
                    >
                      <Badge variant="secondary" className="text-xs">
                        {queryResponse.sources.length} source{queryResponse.sources.length !== 1 ? 's' : ''}
                      </Badge>
                    </motion.div>
                  )}
                </div>
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                >
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSourcesDialogOpen(false)}
                    className="h-8 w-8 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </motion.div>
              </div>
              <div className="overflow-y-auto p-4 space-y-4 h-[calc(80vh-4rem)]">
                {queryResponse?.sources?.map((source, index) => (
                  <motion.div 
                    key={index} 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ 
                      delay: index * 0.1, 
                      type: "spring", 
                      stiffness: 300, 
                      damping: 25 
                    }}
                    whileHover={{ scale: 1.02, y: -2 }}
                    className="border rounded-lg p-4 bg-muted/30 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <Badge variant="secondary" className="text-xs">
                          Source {source.document_index}
                        </Badge>
                        <CopyButton 
                          variant="ghost" 
                          size="sm" 
                          onCopy={() => navigator.clipboard.writeText(source.content || '')}
                        />
                      </div>
                    </div>
                    <div className="bg-background rounded p-3 border">
                      <p className="text-sm leading-relaxed text-foreground whitespace-pre-wrap">
                        {source.content}
                      </p>
                    </div>
                  </motion.div>
                ))}
                {(!queryResponse?.sources || queryResponse.sources.length === 0) && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="text-center py-8 text-muted-foreground"
                  >
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No sources available for this query.</p>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

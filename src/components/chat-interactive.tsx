"use client"

import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'motion/react';
import { Search, MessageCircle, X, Plus, Zap, Clock, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { CopyButton } from '@/components/ui/shadcn-io/copy-button';
import { DocumentsDialog } from '@/components/documents-dialog';
import { TextShimmerWave } from '@/components/ui/text-shimmer-wave';
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

  const handleQuery = async () => {
    if (!query.trim()) return;

    setIsQuerying(true);
    setQueryResponse(null);
    setStreamingEvents([]);
    setCurrentAnswer('');

    try {
      if (useStreaming) {
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
      <div className="space-y-3">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, type: "spring", stiffness: 300, damping: 25 }}
        >
          <Label className="hover:bg-accent/50 flex items-start gap-3 rounded-lg border p-3 has-[[aria-checked=true]]:border-blue-600 has-[[aria-checked=true]]:bg-blue-50 dark:has-[[aria-checked=true]]:border-blue-900 dark:has-[[aria-checked=true]]:bg-blue-950">
            <Checkbox
              id="streaming"
              checked={useStreaming}
              onCheckedChange={(checked) => setUseStreaming(checked as boolean)}
              className="data-[state=checked]:border-blue-600 data-[state=checked]:bg-blue-600 data-[state=checked]:text-white dark:data-[state=checked]:border-blue-700 dark:data-[state=checked]:bg-blue-700"
            />
            <div className="grid gap-1.5 font-normal">
              <p className="text-sm leading-none font-medium">
                Enable streaming
              </p>
              <p className="text-muted-foreground text-sm">
                See tool calls and thinking process in real-time
              </p>
            </div>
          </Label>
        </motion.div>
        
        <div className="flex space-x-2">
          <Input
            placeholder="Ask a question about your documents..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !isQuerying && handleQuery()}
            disabled={isQuerying}
            className="flex-1"
          />

          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
          >
            <Button 
              onClick={() => setDocumentsDialogOpen(true)}
              disabled={isQuerying}
              size="default"
              title="Add documents"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </motion.div>
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
          >
            <Button 
              onClick={handleQuery}
              disabled={isQuerying || !query.trim()}
              size="default"
            >
              <Search className="h-4 w-4" />
            </Button>
          </motion.div>
        </div>
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
                    <motion.div
                      whileHover={{ scale: 1.2 }}
                      whileTap={{ scale: 0.8 }}
                      transition={{ type: "spring", stiffness: 400, damping: 25 }}
                    >
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onRemoveDocument(doc.doc_id)}
                        className="h-4 w-4 p-0 hover:bg-destructive/20 ml-1"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </motion.div>
                  )}
                </Badge>
              </motion.div>
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

      {isStreaming && (
        <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary animate-pulse" />
              <TextShimmerWave
                className='[--base-color:#0D74CE] [--base-gradient-color:#5EB1EF]'
                duration={1}
                spread={1}
                zDistance={1}
                scaleDistance={1.1}
                rotateYDistance={20}
              >
                {isStreaming ? 'Streaming response...' : 'Analyzing documents...'}
              </TextShimmerWave>
        </div>
      )}

      {/* Streaming Events */}
      <AnimatePresence>
        {useStreaming && (streamingEvents.length > 0 || isStreaming) && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ 
              type: "spring", 
              stiffness: 300, 
              damping: 25,
              duration: 0.4 
            }}
            className="space-y-3"
          >
          <div className="flex items-center space-x-2">
            <Zap className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Agent Activity</h3>
            <Badge variant="secondary" className="text-xs">
              {streamingEvents.length} events
            </Badge>
          </div>
          <div className="border rounded-lg bg-card shadow-sm max-h-40 overflow-y-auto">
            <div className="space-y-0">
              {/* Show streaming content indicator when content is being generated */}
              {isStreaming && currentAnswer && (
                <div className="flex items-start space-x-3 p-3 border-b hover:bg-muted/50 transition-colors">
                  <div className="flex-shrink-0 mt-0.5">
                    <MessageCircle className="h-3 w-3 text-green-500 animate-pulse" />
                  </div>
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center space-x-2">
                      <Badge variant="default" className="text-xs font-medium animate-pulse">
                        <div className="flex items-center space-x-1">
                          <div className="h-1.5 w-1.5 bg-green-400 rounded-full animate-ping"></div>
                          <span>Streaming Content</span>
                        </div>
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-sm text-foreground leading-relaxed break-words">
                      Generating response... ({currentAnswer.length} characters)
                    </p>
                  </div>
                </div>
              )}
              
              {streamingEvents.slice(-15).map((event, index) => {
                const getEventIcon = (type: string) => {
                  switch (type) {
                    case 'status':
                      return <Clock className="h-3 w-3 text-blue-500" />;
                    case 'RunResponseContent':
                      return <MessageCircle className="h-3 w-3 text-green-500" />;
                    case 'ToolCallStarted':
                      return <Zap className="h-3 w-3 text-orange-500" />;
                    case 'ToolCallCompleted':
                      return <div className="h-3 w-3 rounded-full bg-green-500" />;
                    case 'ReasoningStep':
                      return <div className="h-3 w-3 rounded-full bg-purple-500" />;
                    case 'sources':
                      return <FileText className="h-3 w-3 text-blue-600" />;
                    case 'error':
                      return <div className="h-3 w-3 rounded-full bg-red-500" />;
                    case 'complete':
                      return <div className="h-3 w-3 rounded-full bg-green-500" />;
                    default:
                      return <div className="h-3 w-3 rounded-full bg-gray-400" />;
                  }
                };

                const getEventVariant = (type: string): "default" | "secondary" | "destructive" | "outline" => {
                  switch (type) {
                    case 'status':
                      return 'secondary';
                    case 'RunResponseContent':
                      return 'default';
                    case 'ToolCallStarted':
                    case 'ToolCallCompleted':
                      return 'outline';
                    case 'ReasoningStep':
                      return 'secondary';
                    case 'sources':
                      return 'secondary';
                    case 'error':
                      return 'destructive';
                    case 'complete':
                      return 'default';
                    default:
                      return 'outline';
                  }
                };

                return (
                  <div 
                    key={index} 
                    className="flex items-start space-x-3 p-3 border-b last:border-b-0 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center space-x-2">
                        <Badge variant={getEventVariant(event.type)} className="text-xs font-medium">
                          {getEventIcon(event.type)}
                          {event.type}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </span>
                      </div>
                      {event.content && event.type === 'sources' ? (
                        <div className="space-y-2">
                          <p className="text-sm text-foreground leading-relaxed">
                            Found relevant documents:
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {(() => {
                              try {
                                const sources = JSON.parse(event.content);
                                return sources.map((source: any, idx: number) => (
                                  <motion.div
                                    key={idx}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                                  >
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="h-6 px-2 text-xs"
                                      onClick={() => setSourcesDialogOpen(true)}
                                    >
                                      <FileText className="h-3 w-3 mr-1" />
                                      {source.filename || `Doc ${idx + 1}`}
                                    </Button>
                                  </motion.div>
                                ));
                              } catch {
                                return (
                                  <motion.div
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                                  >
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="h-6 px-2 text-xs"
                                      onClick={() => setSourcesDialogOpen(true)}
                                    >
                                      <FileText className="h-3 w-3 mr-1" />
                                      View Sources
                                    </Button>
                                  </motion.div>
                                );
                              }
                            })()}
                          </div>
                        </div>
                      ) : event.content ? (
                        <p className="text-sm text-foreground leading-relaxed break-words">
                          {event.content}
                        </p>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>

      {/* Current streaming answer */}
      <AnimatePresence>
        {isStreaming && currentAnswer && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ 
              type: "spring", 
              stiffness: 300, 
              damping: 25 
            }}
            className="space-y-3"
          >
          <div className="flex items-center space-x-2">
            <MessageCircle className="h-5 w-5 text-primary animate-pulse" />
            <h2 className="text-lg font-semibold text-foreground">Answer</h2>
            <Badge variant="outline" className="text-xs animate-pulse">
              <div className="flex items-center space-x-1">
                <div className="h-2 w-2 bg-green-500 rounded-full animate-ping"></div>
                <span>streaming</span>
              </div>
            </Badge>
          </div>
          <div className="bg-background border rounded-lg p-6 shadow-sm">
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
              {currentAnswer}
            </ReactMarkdown>
          </div>
        </motion.div>
      )}
    </AnimatePresence>

      <AnimatePresence>
        {queryResponse && !isQuerying && !isStreaming && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ 
              type: "spring", 
              stiffness: 300, 
              damping: 25,
              delay: 0.1 
            }}
            className="space-y-4"
          >
          {/* Answer Section */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <MessageCircle className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold text-foreground">Answer</h2>
              <Badge variant="outline" className="text-xs font-medium">
                {queryResponse.method}
              </Badge>
              {queryResponse.sources && queryResponse.sources.length > 0 && (
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                >
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSourcesDialogOpen(true)}
                    className="ml-auto"
                  >
                    <FileText className="h-4 w-4 mr-1" />
                    {queryResponse.sources.length} source{queryResponse.sources.length !== 1 ? 's' : ''}
                  </Button>
                </motion.div>
              )}
            </div>
            <div className="relative bg-background border rounded-lg p-6 shadow-sm overflow-y-auto max-h-[50vh]">
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
        </motion.div>
      )}
    </AnimatePresence>

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
                      <Badge variant="secondary" className="ml-2">
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
                  <div className="bg-background rounded p-3 border">
                    <p className="text-sm leading-relaxed text-foreground whitespace-pre-wrap">
                      {source.content_preview || source.content}
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

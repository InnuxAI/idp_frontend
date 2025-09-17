"use client"

import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { motion, AnimatePresence } from 'motion/react';
import { Search, MessageCircle, X, Plus, Zap, Clock, FileText, MessageSquare, Files, Activity, Loader, ExternalLink, ChevronUp, ChevronDown, FileImage } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CopyButton } from '@/components/ui/shadcn-io/copy-button';
import { DocumentsDialog } from '@/components/documents-dialog';
import { ImageDisplay } from '@/components/image-display';
import { TextShimmerWave } from '@/components/ui/text-shimmer-wave';
import { PromptInputBox } from '@/components/ui/ai-prompt-box';
import { apiService, Document, QueryResponse, StreamEvent } from '@/services/api';

// Collapsible Context Component
interface CollapsibleContextProps {
  selectedDocuments: Document[];
  onRemoveDocument?: (docId: string) => void;
  onAddDocuments: () => void;
}

const CollapsibleContext: React.FC<CollapsibleContextProps> = ({
  selectedDocuments,
  onRemoveDocument,
  onAddDocuments,
}) => {
  const [isExpanded, setIsExpanded] = React.useState(false);

  return (
    <div className="mb-3">
      {/* Floating Circle Toggle */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex justify-center mb-3"
      >
        <motion.button
          onClick={() => setIsExpanded(!isExpanded)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          transition={{
            type: "spring",
            stiffness: 300,
            damping: 30,
            duration: 0.15,
          }}
          className="bg-background/95 backdrop-blur-sm border shadow-lg rounded-full p-3 flex items-center space-x-2"
        >
          <Files className="h-4 w-4" />
          <Badge variant="secondary" className="text-xs">
            {selectedDocuments.length}
          </Badge>
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 30,
              duration: 0.2,
            }}
          >
            <ChevronUp className="h-4 w-4" />
          </motion.div>
        </motion.button>
      </motion.div>

      {/* Expandable Content */}
      <AnimatePresence mode="wait">
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 30,
              duration: 0.2,
            }}
            className="bg-background/95 backdrop-blur-sm rounded-2xl border shadow-lg p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium">Context Documents:</span>
                <Badge variant="secondary" className="text-xs">
                  {selectedDocuments.length} selected
                </Badge>
              </div>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
              >
                <Button
                  onClick={onAddDocuments}
                  variant="outline"
                  size="sm"
                  className="text-xs"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add More
                </Button>
              </motion.div>
            </div>

            <div className="flex flex-wrap gap-2">
              <AnimatePresence mode="popLayout">
                {selectedDocuments.map((doc, index) => (
                  <motion.div
                    key={doc.doc_id || doc.filename || `doc-${index}`}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    layout
                    transition={{
                      layout: { type: "spring", stiffness: 300, damping: 30 },
                      opacity: { duration: 0.2 },
                      scale: { duration: 0.2 },
                    }}
                    whileHover={{ scale: 1.02 }}
                  >
                    <Badge
                      variant="outline"
                      className="text-xs flex items-center space-x-1 pr-1"
                    >
                      <span className="truncate max-w-[120px]">
                        {doc.filename}
                      </span>
                      <Button
                        onClick={() =>
                          onRemoveDocument?.(doc.doc_id || doc.filename)
                        }
                        className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

interface ChatInteractiveProps {
  selectedDocuments?: Document[];
  onRemoveDocument?: (docId: string) => void;
  onDocumentToggle?: (document: Document) => void;
}

export function ChatInteractive({ 
  selectedDocuments: initialSelectedDocuments = [], 
  onRemoveDocument,
  onDocumentToggle 
}: ChatInteractiveProps) {
  const [internalSelectedDocuments, setInternalSelectedDocuments] = useState<Document[]>(initialSelectedDocuments);
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
  const [sourcesSubTab, setSourcesSubTab] = useState<'text' | 'images'>('text');

  // Sync internal state with props when they change
  React.useEffect(() => {
    setInternalSelectedDocuments(initialSelectedDocuments);
  }, [initialSelectedDocuments]);

  // Always use internal state for rendering
  const selectedDocuments = internalSelectedDocuments;

  // Derived values
  const relevantDocuments = queryResponse?.sources || [];

  const handleQuery = async (useStreamingOverride?: boolean, queryText?: string) => {
    const queryToUse = queryText || query; // Use provided query or current state
    if (!queryToUse.trim()) return;

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
        let contextualQuery = queryToUse;
        if (selectedDocuments.length > 0) {
          const contextInfo = selectedDocuments.map(doc => `[${doc.filename}:${doc.doc_id || doc.filename}]`).join(' ');
          contextualQuery = `${queryToUse} Context documents: ${contextInfo}`;
        }

        const filename = selectedDocuments.length > 0 
          ? selectedDocuments.map(doc => doc.filename).join(', ')
          : null;
        
        const events: StreamEvent[] = [];
        let answer = '';
        let sources: any[] = [];
        let imageSources: any[] = [];

        await apiService.queryDocumentsStream(
          contextualQuery,
          filename,
          3,
          async (event: StreamEvent) => {
            // Handle different event types
            if (event.type === 'response') {
              answer = event.content;
              setCurrentAnswer(answer);
              return;
            }
            
            // Add non-content events to the events array
            if (event.type !== 'response') {
              events.push(event);
              setStreamingEvents([...events]);
            }

            if (event.type === 'sources_file') {
              try {
                // Handle sources file - fetch it synchronously in the callback
                const fileData = typeof event.content === 'string' ? JSON.parse(event.content) : event.content;
                const fileUrl = fileData.url;
                
                // Fetch the sources file
                const sourcesResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}${fileUrl}`);
                if (sourcesResponse.ok) {
                  const sourcesData = await sourcesResponse.json();
                  sources = sourcesData.text_sources || [];
                  imageSources = sourcesData.image_sources || [];
                } else {
                  console.error('Failed to fetch sources file:', sourcesResponse.status);
                }
              } catch (e) {
                console.error('Failed to fetch sources from file:', e);
              }
            } else if (event.type === 'sources') {
              try {
                // Fallback for old sources format
                let parsedContent;
                if (typeof event.content === 'string') {
                  parsedContent = JSON.parse(event.content);
                } else {
                  parsedContent = event.content;
                }
                sources = parsedContent.text_sources || [];
                imageSources = parsedContent.image_sources || [];
              } catch (e) {
                console.error('Failed to parse sources:', e, 'Content:', event.content);
                sources = [event.content];
              }
            } else if (event.type === 'complete') {
              setQueryResponse({
                query: contextualQuery,
                answer: answer,
                sources: sources.map((source, index) => ({
                  document_index: index + 1,
                  type: source.type || 'text',
                  content: source.content || (typeof source === 'string' ? source : JSON.stringify(source)),
                  metadata: source.metadata || {}
                })),
                image_sources: imageSources,
                method: 'streaming'
              });
            }
          }
        );

        setIsStreaming(false);
      } else {
        // Use traditional non-streaming approach
        let contextualQuery = queryToUse;
        if (selectedDocuments.length > 0) {
          const contextInfo = selectedDocuments.map(doc => `[${doc.filename}:${doc.doc_id || doc.filename}]`).join(' ');
          contextualQuery = `${queryToUse} Context documents: ${contextInfo}`;
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
        query: queryToUse,
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
    if (onDocumentToggle) {
      // If parent provides handler, use it
      onDocumentToggle(document);
    } else {
      // Otherwise, manage internally
      setInternalSelectedDocuments(prev => {
        const docIdentifier = document.doc_id || document.filename;
        const isSelected = prev.some(doc => (doc.doc_id || doc.filename) === docIdentifier);
        if (isSelected) {
          // Remove document
          return prev.filter(doc => (doc.doc_id || doc.filename) !== docIdentifier);
        } else {
          // Add document
          return [...prev, document];
        }
      });
    }
  };

  const handleRemoveDocument = (docId: string) => {
    if (onRemoveDocument) {
      onRemoveDocument(docId);
    } else {
      setInternalSelectedDocuments(prev => prev.filter(doc => (doc.doc_id || doc.filename) !== docId));
    }
  };

  const handleSendMessage = (message: string, files?: File[], useStreaming?: boolean) => {
    setQuery(message); // Update state for display purposes
    if (useStreaming !== undefined) {
      handleQuery(useStreaming, message); // Pass message directly
    } else {
      handleQuery(undefined, message); // Pass message directly
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
              className="space-y-4"
            >
              <PromptInputBox
                onSend={handleSendMessage}
                placeholder="Ask a question about your documents..."
                isLoading={isQuerying || isStreaming}
                defaultStreaming={useStreaming}
              />
              
              {/* Add Documents button */}
              <div className="flex justify-center">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                >
                  <Button 
                    onClick={() => setDocumentsDialogOpen(true)}
                    variant="outline"
                    className="text-sm"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Documents for Context
                  </Button>
                </motion.div>
              </div>
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
                        <Button
                          onClick={() => handleRemoveDocument(doc.doc_id || doc.filename)}
                          className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </Badge>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      )}

      {/* Expanded state - full interface after query */}
      {(queryResponse || isQuerying || isStreaming) && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex-1 flex flex-col space-y-6 p-6 pb-32"
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
                  className="bg-gray-100 dark:bg-gray-900 rounded-lg border p-6 space-y-4 max-w-4xl max-h-[80vh] overflow-y-auto"
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
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{currentAnswer}</ReactMarkdown>
                    </motion.div>
                  )}

                  {/* Final response */}
                  {queryResponse && !isStreaming && (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="prose dark:prose-invert max-w-none"
                    >
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{queryResponse.answer}</ReactMarkdown>
                      {/* {queryResponse.answer} */}
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
                  <div className="bg-gray-100 dark:bg-gray-900 rounded-lg border p-4 max-h-[70vh] overflow-hidden flex flex-col">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold flex items-center space-x-2">
                        <Files className="h-4 w-4" />
                        <span>Sources</span>
                      </h3>
                      
                      {/* Sources sub-tab switcher */}
                      <div className="flex bg-muted rounded-md p-1">
                        <Button
                          onClick={() => setSourcesSubTab('text')}
                          className={`p-1.5 rounded-sm transition-colors ${
                            sourcesSubTab === 'text' 
                              ? 'bg-background shadow-sm' 
                              : 'hover:bg-background/50'
                          }`}
                        >
                          <FileText className="h-4 w-4" />
                        </Button>
                        <Button
                          onClick={() => setSourcesSubTab('images')}
                          className={`p-1.5 rounded-sm transition-colors ${
                            sourcesSubTab === 'images' 
                              ? 'bg-background shadow-sm' 
                              : 'hover:bg-background/50'
                          }`}
                        >
                          <FileImage className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    {/* Text Sources Content */}
                    {sourcesSubTab === 'text' && (
                      <div className="flex-1 overflow-y-auto">
                        {relevantDocuments.length === 0 ? (
                          <p className="text-sm text-muted-foreground">No text sources found yet</p>
                        ) : (
                          <div className="space-y-2 pr-2">
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
                                className="p-3 border rounded-lg bg-accent hover:bg-muted/50 cursor-pointer transition-colors"
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
                                <div className="text-xs line-clamp-3 text-muted-foreground mb-2">
                                  {doc.content?.slice(0, 120) || 'No content available'}...
                                </div>
                                {doc.metadata?.file_name && (
                                  <div className="flex items-center space-x-1">
                                    <Badge variant="outline" className="text-xs max-w-[180px] truncate">
                                      {doc.metadata.file_name.length > 25 
                                        ? `${doc.metadata.file_name.substring(0, 25)}...` 
                                        : doc.metadata.file_name.replace(/\.pdf.*$/, '.pdf')
                                      }
                                    </Badge>
                                    {doc.metadata?.page_label && (
                                      <Badge variant="outline" className="text-xs">
                                        P {doc.metadata.page_label}
                                      </Badge>
                                    )}
                                  </div>
                                )}
                              </motion.div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Image Sources Content */}
                    {sourcesSubTab === 'images' && (
                      <div className="flex-1 overflow-y-auto">
                        {(!queryResponse?.image_sources || queryResponse.image_sources.filter(img => img.filename).length === 0) ? (
                          <p className="text-sm text-muted-foreground">No image sources found yet</p>
                        ) : (
                          <div className="grid grid-cols-2 gap-2 pr-2">
                            {queryResponse.image_sources
                              .filter(imageSource => imageSource.filename)
                              .map((imageSource, index) => (
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
                                className="relative aspect-square bg-muted rounded border overflow-hidden cursor-pointer group"
                              >
                                {imageSource.image_path ? (
                                  <img
                                    src={apiService.getImageUrl(imageSource.image_path)}
                                    alt={imageSource.filename || `Image ${index + 1}`}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      const target = e.target as HTMLImageElement;
                                      target.style.display = 'none';
                                    }}
                                  />
                                ) : imageSource.filename ? (
                                  <img
                                    src={apiService.getImageUrl(imageSource.filename)}
                                    alt={imageSource.filename}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      const target = e.target as HTMLImageElement;
                                      target.style.display = 'none';
                                    }}
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <FileImage className="h-6 w-6 text-muted-foreground" />
                                  </div>
                                )}
                                
                                {/* Overlay with info */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                                  <div className="absolute bottom-0 left-0 right-0 p-2">
                                    <p className="text-white text-xs truncate font-medium">
                                      {imageSource.filename?.replace(/.*_p(\d+)_.*/, 'Page $1') || `Image ${index + 1}`}
                                    </p>
                                    {imageSource.metadata?.file_name && (
                                      <p className="text-white/70 text-xs truncate">
                                        {imageSource.metadata.file_name.length > 20 
                                          ? `${imageSource.metadata.file_name.substring(0, 20)}...` 
                                          : imageSource.metadata.file_name.replace(/\.pdf.*$/, '.pdf')
                                        }
                                      </p>
                                    )}
                                  </div>
                                </div>
                                
                                {/* Page badge */}
                                {imageSource.filename?.includes('_p') && (
                                  <div className="absolute top-2 right-2">
                                    <Badge variant="secondary" className="text-xs bg-black/50 text-white border-none">
                                      {imageSource.filename.replace(/.*_p(\d+)_.*/, 'P$1')}
                                    </Badge>
                                  </div>
                                )}
                              </motion.div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </TabsContent>
                
                <TabsContent value="steps" className="space-y-3">
                  <div className="bg-gray-100 dark:bg-gray-900 rounded-lg border p-4 max-h-[80vh] overflow-hidden flex flex-col">
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
                      <div className="border rounded-lg bg-card shadow-sm flex-1 overflow-y-auto">
                        {/* Live streaming indicator */}
                        {isStreaming && (
                          <div className="flex items-center space-x-3 p-3 border-b bg-blue-50 dark:bg-blue-950/30">
                            <div className="flex items-center space-x-2">
                              <motion.div
                                animate={{ scale: [1, 1.2, 1] }}
                                transition={{ duration: 1, repeat: Infinity }}
                                className="h-2 w-2 rounded-full bg-blue-500"
                              />
                              <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                                Live
                              </span>
                            </div>
                            <p className="text-sm text-foreground leading-relaxed break-words">
                              Generating response... ({currentAnswer.length} characters)
                            </p>
                          </div>
                        )}

                        <div className="space-y-0">
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

                            const eventKey = streamingEvents.length - 15 + index;
                            const isExpanded = expandedEvents.has(eventKey);

                            return (
                              <motion.div
                                key={`${event.type}-${index}`}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ 
                                  type: "spring", 
                                  stiffness: 300, 
                                  damping: 25,
                                  delay: index * 0.02
                                }}
                                className="flex items-start space-x-3 p-3 border-b last:border-b-0 hover:bg-muted/50 transition-colors cursor-pointer"
                                onClick={() => {
                                  const newExpanded = new Set(expandedEvents);
                                  if (isExpanded) {
                                    newExpanded.delete(eventKey);
                                  } else {
                                    newExpanded.add(eventKey);
                                  }
                                  setExpandedEvents(newExpanded);
                                }}
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
                                  
                                  {/* Special handling for sources event */}
                                  {event.content && event.type === 'sources' ? (
                                    <div className="space-y-2">
                                      <p className="text-sm text-foreground leading-relaxed">
                                        Found relevant sources:
                                      </p>
                                      <div className="flex flex-wrap gap-1">
                                        {(() => {
                                          try {
                                            const parsedContent = JSON.parse(event.content);
                                            const textSources = parsedContent.text_sources || [];
                                            const imageSources = parsedContent.image_sources || [];
                                            
                                            const allSources = [
                                              ...textSources.map((source: any, idx: number) => ({ ...source, sourceType: 'text', index: idx })),
                                              ...imageSources.map((source: any, idx: number) => ({ ...source, sourceType: 'image', index: idx }))
                                            ];
                                            
                                            return allSources.map((source: any, idx: number) => (
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
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSourcesDialogOpen(true);
                                                  }}
                                                >
                                                  {source.sourceType === 'image' ? (
                                                    <FileImage className="h-3 w-3 mr-1" />
                                                  ) : (
                                                    <FileText className="h-3 w-3 mr-1" />
                                                  )}
                                                  {source.filename || `${source.sourceType === 'image' ? 'Image' : 'Doc'} ${source.index + 1}`}
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
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSourcesDialogOpen(true);
                                                  }}
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
                                  ) : (
                                    /* Regular content display */
                                    isExpanded && event.content && (
                                      <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.2 }}
                                        className="overflow-hidden"
                                      >
                                        <div className="text-xs p-2 bg-muted rounded text-muted-foreground whitespace-pre-wrap break-words">
                                          {event.content}
                                        </div>
                                      </motion.div>
                                    )
                                  )}
                                </div>
                              </motion.div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </motion.div>
          </div>
        </motion.div>
      )}

      {/* Floating prompt box - only show when content exists */}
      {(queryResponse || isQuerying || isStreaming) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="fixed bottom-6 left-1/2 transform -translate-x-1/2 w-full max-w-2xl px-6 z-50"
        >
          {/* Context management with smooth transitions */}
          <AnimatePresence mode="wait">
            {selectedDocuments.length > 0 ? (
              <motion.div
                key="context-with-documents"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ 
                  type: "spring", 
                  stiffness: 300, 
                  damping: 30,
                  duration: 0.3
                }}
              >
                <CollapsibleContext 
                  selectedDocuments={selectedDocuments}
                  onRemoveDocument={handleRemoveDocument}
                  onAddDocuments={() => setDocumentsDialogOpen(true)}
                />
              </motion.div>
            ) : (
              <motion.div
                key="context-empty"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ 
                  type: "spring", 
                  stiffness: 300, 
                  damping: 30,
                  duration: 0.3
                }}
                className="flex justify-center mb-3"
              >
                <motion.button
                  onClick={() => setDocumentsDialogOpen(true)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  className="bg-background/95 backdrop-blur-sm border shadow-lg rounded-full p-3 flex items-center space-x-2 text-sm"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Documents</span>
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="bg-background/95 backdrop-blur-sm rounded-3xl border shadow-2xl p-1">
            <PromptInputBox
              onSend={handleSendMessage}
              placeholder="Ask a follow-up question..."
              isLoading={isQuerying || isStreaming}
              defaultStreaming={useStreaming}
            />
          </div>
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

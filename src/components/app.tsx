"use client"
import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Upload, Search, FileText, Trash2, MessageCircle, Moon, Sun, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { apiService } from '@/services/api';
import type { Document, QueryResponse } from '@/services/api';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

function App() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [query, setQuery] = useState('');
  const [documentSearch, setDocumentSearch] = useState('');
  const [selectedDocumentsForContext, setSelectedDocumentsForContext] = useState<Document[]>([]);
  const [queryResponse, setQueryResponse] = useState<QueryResponse | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isQuerying, setIsQuerying] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [healthStatus, setHealthStatus] = useState<any>(null);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; docId: string; filename: string }>({
    isOpen: false,
    docId: '',
    filename: '',
  });
  const [pdfViewerModal, setPdfViewerModal] = useState<{ isOpen: boolean; docId: string; filename: string }>({
    isOpen: false,
    docId: '',
    filename: '',
  });
  const [uploadModalOpen, setUploadModalOpen] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
  }, [isDarkMode]);

  useEffect(() => {
    loadDocuments();
    checkHealthStatus();
  }, []);

  const checkHealthStatus = async () => {
    try {
      const status = await apiService.healthCheck();
      setHealthStatus(status);
    } catch (error) {
      console.error('Health check failed:', error);
    }
  };

  const loadDocuments = async () => {
    try {
      const response = await apiService.listDocuments();
      setDocuments(response.documents || []);
    } catch (error) {
      console.error('Failed to load documents:', error);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const response = await apiService.uploadDocument(file);
      
      clearInterval(progressInterval);
      setUploadProgress(100);

      setTimeout(() => {
        setUploadProgress(0);
        setIsUploading(false);
        setUploadModalOpen(false);
        loadDocuments();
      }, 1000);

      console.log('Upload successful:', response);
    } catch (error) {
      console.error('Upload failed:', error);
      setIsUploading(false);
      setUploadProgress(0);
    }

    // Reset file input
    event.target.value = '';
  };

  const handleQuery = async () => {
    if (!query.trim()) return;

    setIsQuerying(true);
    try {
      // Append selected document context to the query
      let contextualQuery = query;
      if (selectedDocumentsForContext.length > 0) {
        const contextInfo = selectedDocumentsForContext.map(doc => `[${doc.filename}:${doc.doc_id}]`).join(' ');
        contextualQuery = `${query} Context documents: ${contextInfo}`;
      }

      const filename = selectedDocumentsForContext.length > 0 
        ? selectedDocumentsForContext.map(doc => doc.filename).join(', ')
        : null;
      
      const response = await apiService.queryDocuments(contextualQuery, filename);
      setQueryResponse(response);
    } catch (error) {
      console.error('Query failed:', error);
    } finally {
      setIsQuerying(false);
    }
  };

  const handleDeleteDocument = async () => {
    try {
      await apiService.deleteDocument(deleteModal.docId);
      loadDocuments();
      setDeleteModal({ isOpen: false, docId: '', filename: '' });
      // Remove from selected context if it was selected
      setSelectedDocumentsForContext(prev => prev.filter(doc => doc.doc_id !== deleteModal.docId));
    } catch (error) {
      console.error('Delete failed:', error);
    }
  };

  const toggleDocumentInContext = (document: Document) => {
    setSelectedDocumentsForContext(prev => {
      const isAlreadySelected = prev.some(doc => doc.doc_id === document.doc_id);
      if (isAlreadySelected) {
        return prev.filter(doc => doc.doc_id !== document.doc_id);
      } else {
        return [...prev, document];
      }
    });
  };

  const removeDocumentFromContext = (docId: string) => {
    setSelectedDocumentsForContext(prev => prev.filter(doc => doc.doc_id !== docId));
  };

  const isDocumentInContext = (docId: string) => {
    return selectedDocumentsForContext.some(doc => doc.doc_id === docId);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Filter documents based on search query
  const filteredDocuments = documents.filter(doc =>
    doc.filename.toLowerCase().includes(documentSearch.toLowerCase())
  );

  const handleViewPdf = (docId: string, filename: string) => {
    setPdfViewerModal({ isOpen: true, docId, filename });
  };

  const getPdfUrl = (docId: string) => {
    return `${API_BASE_URL}/view-document/${docId}`;
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <FileText className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-2xl font-bold">Intelligent Document Processor</h1>
                <p className="text-sm text-muted-foreground">AI-powered document analysis and chat</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {healthStatus && (
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${
                    healthStatus.gemini_available && healthStatus.embedder_available && healthStatus.chromadb_available
                      ? 'bg-green-500' : 'bg-yellow-500'
                  }`} />
                  <span className="text-sm text-muted-foreground">System Status</span>
                </div>
              )}
              
              <Button
                variant="outline"
                onClick={() => setUploadModalOpen(true)}
                className="flex items-center space-x-2"
              >
                <Upload className="h-4 w-4" />
                <span>Upload</span>
              </Button>
              
              <Button
                variant="outline"
                size="icon"
                onClick={() => setIsDarkMode(!isDarkMode)}
              >
                {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Documents List */}
          <div className="lg:col-span-1">
            <Card className="max-h-[80vh] h-[80vh] flex flex-col">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <FileText className="h-5 w-5" />
                    <span>Documents</span>
                  </div>
                  <Badge variant="secondary">
                    {documentSearch ? `${filteredDocuments.length} / ${documents.length}` : documents.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 flex-1 overflow-hidden flex flex-col">
                {/* Search Input */}
                {documents.length > 0 && (
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search documents..."
                      value={documentSearch}
                      onChange={(e) => setDocumentSearch(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                )}
                
                {/* Documents List */}
                {documents.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No documents uploaded yet
                  </p>
                ) : filteredDocuments.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No documents match your search
                  </p>
                ) : (
                  <div className="space-y-3 overflow-y-auto flex-1 pr-2">
                    {filteredDocuments.map((doc) => (
                      <div key={doc.doc_id} className="flex items-center justify-between p-3 border border-border rounded-lg">
                        <div 
                          className={`flex-1 min-w-0 ${doc.content_type.includes('pdf') ? 'cursor-pointer hover:bg-muted/50 rounded p-2 -m-2' : ''}`}
                          onClick={() => doc.content_type.includes('pdf') && handleViewPdf(doc.doc_id || '', doc.filename)}
                        >
                          <p className="text-sm font-medium truncate">{doc.filename}</p>
                          <div className="flex items-center space-x-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {doc.content_type.includes('pdf') ? 'PDF' : 'Word'}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {formatFileSize(doc.file_size)}
                            </span>
                            {doc.content_type.includes('pdf') && (
                              <span className="text-xs text-blue-500">Click to view</span>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          {/* Add to Context Button */}
                          <Button
                            variant={isDocumentInContext(doc.doc_id || '') ? "default" : "outline"}
                            size="sm"
                            onClick={() => toggleDocumentInContext(doc)}
                            className="text-xs"
                          >
                            {isDocumentInContext(doc.doc_id || '') ? (
                              <>
                                <X className="h-3 w-3 " />
                              </>
                            ) : (
                              <>
                                <Plus className="h-3 w-3" />
                              </>
                            )}
                          </Button>

                          {/* Delete Button */}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteModal({
                              isOpen: true,
                              docId: doc.doc_id || '',
                              filename: doc.filename,
                            })}
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Query Section */}
          <div className="lg:col-span-2">
            <Card className="max-h-[80vh] h-[80vh] flex flex-col">
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
                    disabled={isQuerying || documents.length === 0}
                    className="flex-1"
                  />
                  <Button 
                    onClick={handleQuery}
                    disabled={isQuerying || !query.trim() || documents.length === 0}
                  >
                    <Search className="h-4 w-4" />
                  </Button>
                </div>

                {/* Selected Documents for Context */}
                {selectedDocumentsForContext.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-muted-foreground">Context:</span>
                      <Badge variant="secondary" className="text-xs">
                        {selectedDocumentsForContext.length} document{selectedDocumentsForContext.length !== 1 ? 's' : ''} selected
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {selectedDocumentsForContext.map((doc) => (
                        <Badge 
                          key={doc.doc_id} 
                          variant="outline" 
                          className="text-xs flex items-center space-x-1 pr-1"
                        >
                          <span className="truncate max-w-[120px]">{doc.filename}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeDocumentFromContext(doc.doc_id || '')}
                            className="h-4 w-4 p-0 hover:bg-destructive/20 ml-1"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {documents.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Upload documents first to start asking questions
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
          </div>
        </div>
      </main>

      {/* Upload Documents Dialog */}
      <Dialog open={uploadModalOpen} onOpenChange={(open) => !open && setUploadModalOpen(false)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Upload className="h-5 w-5" />
              <span>Upload Documents</span>
            </DialogTitle>
            <DialogDescription>
              Upload PDF or Word documents for AI analysis
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer">
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload-dialog"
                disabled={isUploading}
              />
              <label htmlFor="file-upload-dialog" className="cursor-pointer block">
                <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-sm text-muted-foreground">
                  Click to upload or drag and drop
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  PDF, DOC, DOCX files supported
                </p>
              </label>
            </div>

            {isUploading && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Uploading...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} className="h-2" />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setUploadModalOpen(false)}
              disabled={isUploading}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteModal.isOpen} onOpenChange={(open) => !open && setDeleteModal({ isOpen: false, docId: '', filename: '' })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Document</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{deleteModal.filename}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteModal({ isOpen: false, docId: '', filename: '' })}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteDocument}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* PDF Viewer Dialog */}
      <Dialog open={pdfViewerModal.isOpen} onOpenChange={(open) => !open && setPdfViewerModal({ isOpen: false, docId: '', filename: '' })}>
        <DialogContent className="!max-w-[95vw] !max-h-[95vh] !w-[95vw] !h-[95vh] p-0 gap-0 sm:!max-w-[95vw]">
          <DialogTitle className="flex items-center justify-between p-4 border-b">
            Document: {pdfViewerModal.filename}
          </DialogTitle>
          <div className="flex-1 h-full">
            {pdfViewerModal.docId && (
              <iframe
                src={getPdfUrl(pdfViewerModal.docId)}
                className="w-full h-full border-0"
                title={`PDF Viewer - ${pdfViewerModal.filename}`}
                style={{ height: 'calc(95vh - 60px)' }}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default App;

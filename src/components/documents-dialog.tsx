"use client"

import React, { useState, useEffect } from 'react';
import { Search, FileText, Plus, X, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { apiService, Document } from '@/services/api';

interface DocumentsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDocuments: Document[];
  onDocumentToggle: (document: Document) => void;
  onDocumentDeleted?: () => void; // Callback when a document is deleted
}

export function DocumentsDialog({
  open,
  onOpenChange,
  selectedDocuments = [],
  onDocumentToggle,
  onDocumentDeleted
}: DocumentsDialogProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [documentSearch, setDocumentSearch] = useState('');
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; docId: string; filename: string }>({
    isOpen: false,
    docId: '',
    filename: '',
  });

  useEffect(() => {
    if (open) {
      loadDocuments();
    }
  }, [open]);

  const loadDocuments = async () => {
    try {
      const response = await apiService.listDocuments();
      setDocuments(response.documents || []);
    } catch (error) {
      console.error('Failed to load documents:', error);
    }
  };

  const isDocumentSelected = (docId: string | undefined) => {
    if (!docId) return false;
    return selectedDocuments.some(doc => doc.doc_id === docId);
  };

  const handleDeleteDocument = async () => {
    try {
      await apiService.deleteDocument(deleteModal.docId);
      loadDocuments();
      setDeleteModal({ isOpen: false, docId: '', filename: '' });
      // Notify parent component that a document was deleted
      onDocumentDeleted?.();
    } catch (error) {
      console.error('Delete failed:', error);
    }
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[85vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span>Select Documents for Context</span>
          </DialogTitle>
        </DialogHeader>

        <Card className="h-[500px] flex flex-col">
          <CardHeader className="flex-shrink-0">
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
          <CardContent className="flex-1 flex flex-col min-h-0 space-y-4">
            {/* Search Input */}
            {documents.length > 0 && (
              <div className="relative flex-shrink-0">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search documents..."
                  value={documentSearch}
                  onChange={(e) => setDocumentSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
            )}

            {/* Selected Documents Summary */}
            {selectedDocuments.length > 0 && (
              <div className="border rounded-lg p-3 bg-muted/30 flex-shrink-0 max-h-24">
                <div className="flex items-center space-x-2 mb-2">
                  <span className="text-sm font-medium">Selected:</span>
                  <Badge variant="secondary" className="text-xs">
                    {selectedDocuments.length} document{selectedDocuments.length !== 1 ? 's' : ''}
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-1 max-h-16 overflow-y-auto">
                  {selectedDocuments.map((doc, index) => (
                    <Badge
                      key={doc.doc_id || doc.filename || `selected-doc-${index}`}
                      variant="outline"
                      className="text-xs"
                    >
                      {doc.filename.substring(9)}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Documents List - Fixed height container */}
            <div className="flex-1 min-h-0 min-h-[250px]">
              {documents.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-center text-muted-foreground">
                    No documents uploaded yet
                  </p>
                </div>
              ) : filteredDocuments.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-center text-muted-foreground">
                    No documents match your search
                  </p>
                </div>
              ) : (
                <div className="h-full overflow-y-auto space-y-3 pr-2">
                  {filteredDocuments.map((doc, index) => (
                    <div key={doc.doc_id || `doc-${index}-${doc.filename}`} className="flex items-center justify-between p-3 border border-border rounded-lg">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{doc.filename.substring(9)}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {doc.content_type.includes('pdf') ? 'PDF' : 'Word'}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {formatFileSize(doc.file_size)}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Button
                          variant={isDocumentSelected(doc.doc_id) ? "default" : "outline"}
                          size="sm"
                          onClick={() => onDocumentToggle(doc)}
                          className="text-xs flex-shrink-0"
                          disabled={!doc.doc_id}
                        >
                          {isDocumentSelected(doc.doc_id) ? (
                            <>
                              <X className="h-3 w-3 mr-1" />
                              Remove
                            </>
                          ) : (
                            <>
                              <Plus className="h-3 w-3 mr-1" />
                              Add
                            </>
                          )}
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => doc.doc_id && setDeleteModal({
                            isOpen: true,
                            docId: doc.doc_id,
                            filename: doc.filename,
                          })}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          disabled={!doc.doc_id}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </DialogContent>

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
    </Dialog>
  );
}

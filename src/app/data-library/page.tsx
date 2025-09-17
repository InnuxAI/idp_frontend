"use client"

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, FileText, Filter, Grid, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { CategoryBadge } from '@/components/ui/category-badge';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { DocumentsDataTable } from '@/components/documents-data-table';
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar";
import { apiService, Document } from '@/services/api';
import { documentCategories, categorizeDocument, getCategoryColor, getCategoryById } from '@/lib/document-categories';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function DataLibraryPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [pdfViewerModal, setPdfViewerModal] = useState<{ isOpen: boolean; docId: string; filename: string }>({
    isOpen: false,
    docId: '',
    filename: '',
  });

  useEffect(() => {
    loadDocuments();
    // Check for category parameter in URL
    const urlParams = new URLSearchParams(window.location.search);
    const categoryParam = urlParams.get('category');
    if (categoryParam) {
      setSelectedCategory(categoryParam);
    }
  }, []);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const response = await apiService.listDocuments();
      setDocuments(response.documents || []);
    } catch (error) {
      console.error('Failed to load documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Filter documents based on search and category
  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.filename.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || categorizeDocument(doc.filename) === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Group documents by category
  const documentsByCategory = documentCategories.reduce((acc, category) => {
    acc[category.id] = filteredDocuments.filter(doc => categorizeDocument(doc.filename) === category.id);
    return acc;
  }, {} as Record<string, Document[]>);

  // Get filtered documents for the current category
  const getCurrentCategoryDocuments = (categoryId: string) => {
    return filteredDocuments.filter(doc => categorizeDocument(doc.filename) === categoryId);
  };

  const handleViewPdf = (docId: string, filename: string) => {
    setPdfViewerModal({ isOpen: true, docId, filename });
  };

  const getPdfUrl = (docId: string) => {
    return `${API_BASE_URL}/view-document/${docId}`;
  };

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
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <div className="px-4 lg:px-6">
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                  className="flex items-center justify-between mb-6"
                >
                  <div>
                    <motion.h1 
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1, type: "spring", stiffness: 300, damping: 25 }}
                      className="text-3xl font-bold"
                    >
                      Data Library
                    </motion.h1>
                    <motion.p 
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2, type: "spring", stiffness: 300, damping: 25 }}
                      className="text-muted-foreground"
                    >
                      Manage and browse your document collection
                    </motion.p>
                  </div>
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3, type: "spring", stiffness: 400, damping: 25 }}
                    className="flex items-center space-x-2"
                  >
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      transition={{ type: "spring", stiffness: 400, damping: 25 }}
                    >
                      <Button
                        variant={viewMode === 'grid' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setViewMode('grid')}
                      >
                        <Grid className="h-4 w-4" />
                      </Button>
                    </motion.div>
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      transition={{ type: "spring", stiffness: 400, damping: 25 }}
                    >
                      <Button
                        variant={viewMode === 'list' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setViewMode('list')}
                      >
                        <List className="h-4 w-4" />
                      </Button>
                    </motion.div>
                  </motion.div>
                </motion.div>

                {/* Search and Filter */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4, type: "spring", stiffness: 300, damping: 25 }}
                  className="flex items-center space-x-4 mb-6"
                >
                  <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5, type: "spring", stiffness: 300, damping: 25 }}
                    className="relative flex-1 max-w-md"
                  >
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search documents..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </motion.div>
                  <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6, type: "spring", stiffness: 300, damping: 25 }}
                    className="flex items-center space-x-2"
                  >
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      transition={{ type: "spring", stiffness: 400, damping: 25 }}
                    >
                      <Button
                        variant={!selectedCategory ? 'default' : 'outline'}
                        onClick={() => setSelectedCategory(null)}
                      >
                        <Filter className="h-4 w-4 mr-2" />
                        All Categories
                      </Button>
                    </motion.div>
                    {documentCategories.map((category, index) => (
                      <motion.div
                        key={category.id}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ 
                          delay: 0.7 + index * 0.05, 
                          type: "spring", 
                          stiffness: 400, 
                          damping: 25 
                        }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Button
                          variant={selectedCategory === category.id ? 'default' : 'outline'}
                          onClick={() => setSelectedCategory(category.id)}
                          className="flex items-center space-x-2"
                        >
                          <div 
                            className="h-2 w-2 rounded-full" 
                            style={{ backgroundColor: category.color }}
                          />
                          <span>{category.name}</span>
                        </Button>
                      </motion.div>
                    ))}
                  </motion.div>
                </motion.div>

                {/* Search Results Indicator */}
                <AnimatePresence>
                  {searchQuery && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ type: "spring", stiffness: 300, damping: 25 }}
                      className="mb-4 p-3 bg-muted/50 rounded-lg"
                    >
                      <p className="text-sm text-muted-foreground">
                        Found {filteredDocuments.length} document{filteredDocuments.length !== 1 ? 's' : ''} matching "{searchQuery}"
                        {selectedCategory && (
                          <span> in {documentCategories.find(cat => cat.id === selectedCategory)?.name}</span>
                        )}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Content based on selected category */}
                <AnimatePresence mode="wait">
                  {!selectedCategory ? (
                    // Overview Content
                    <motion.div 
                      key="overview"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-6"
                    >
                      {/* Category Overview Cards */}
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
                      >
                        {documentCategories.map((category, index) => (
                          <motion.div
                            key={category.id}
                            initial={{ opacity: 0, y: 20, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            transition={{ 
                              delay: index * 0.1, 
                              type: "spring", 
                              stiffness: 300, 
                              damping: 25 
                            }}
                            whileHover={{ 
                              scale: 1.02, 
                              y: -4,
                              transition: { type: "spring", stiffness: 400, damping: 25 }
                            }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <Card 
                              className="cursor-pointer hover:shadow-lg transition-shadow duration-200"
                              onClick={() => setSelectedCategory(category.id)}
                            >
                              <CardHeader>
                                <CardTitle className="flex items-center space-x-2">
                                  <span className="text-2xl">{category.icon}</span>
                                  <span className="text-lg">{category.name}</span>
                                </CardTitle>
                              </CardHeader>
                              <CardContent>
                                <p className="text-sm text-muted-foreground mb-2">{category.description}</p>
                                <CategoryBadge color={category.color}>
                                  {loading ? '...' : (documentsByCategory[category.id]?.length || 0)} documents
                                </CategoryBadge>
                              </CardContent>
                            </Card>
                          </motion.div>
                        ))}
                      </motion.div>

                      {/* Recent Documents */}
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6, type: "spring", stiffness: 300, damping: 25 }}
                      >
                        <Card>
                          <CardHeader>
                            <CardTitle>Recent Documents</CardTitle>
                          </CardHeader>
                          <CardContent>
                            {documents.length === 0 ? (
                              <motion.p 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.8 }}
                                className="text-center text-muted-foreground py-8"
                              >
                                No documents uploaded yet
                              </motion.p>
                            ) : viewMode === 'list' ? (
                              <DocumentsDataTable 
                                documents={searchQuery ? filteredDocuments.slice(0, 10) : documents.slice(0, 10)} 
                                onDocumentDeleted={loadDocuments}
                              />
                            ) : (
                              <div className="space-y-3">
                                {(searchQuery ? filteredDocuments : documents).slice(0, 5).map((doc, index) => (
                                  <motion.div
                                    key={doc.doc_id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ 
                                      delay: 0.8 + index * 0.1, 
                                      type: "spring", 
                                      stiffness: 300, 
                                      damping: 25 
                                    }}
                                    whileHover={{ scale: 1.02, x: 4 }}
                                    whileTap={{ scale: 0.98 }}
                                    className="flex items-center justify-between p-3 border border-border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                                    onClick={() => handleViewPdf(doc.doc_id ?? '', doc.filename ?? 'Unknown')}
                                  >
                                    <div className="flex items-center space-x-3">
                                      <FileText className="h-5 w-5 text-muted-foreground" />
                                      <div>
                                        <p className="text-sm font-medium">{doc.filename}</p>
                                        <div className="flex items-center space-x-2 mt-1">
                                          <Badge variant="outline" className="text-xs">
                                            {doc.content_type.includes('pdf') ? 'PDF' : 'Word'}
                                          </Badge>
                                          <span className="text-xs text-muted-foreground">
                                            {formatFileSize(doc.file_size)}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                    <CategoryBadge color={getCategoryColor(categorizeDocument(doc.filename))}>
                                      {documentCategories.find(cat => cat.id === categorizeDocument(doc.filename))?.name || 'Other'}
                                    </CategoryBadge>
                                  </motion.div>
                                ))}
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      </motion.div>
                    </motion.div>
                  ) : (
                    // Category-specific Content
                    <motion.div 
                      key="category"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-4"
                    >
                      {(() => {
                        const category = documentCategories.find(cat => cat.id === selectedCategory);
                        if (!category) return null;
                        
                        return (
                          <>
                            <motion.div 
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ type: "spring", stiffness: 300, damping: 25 }}
                              className="flex items-center justify-between"
                            >
                              <div>
                                <h2 className="text-2xl font-bold flex items-center space-x-2">
                                  <span>{category.icon}</span>
                                  <span>{category.name}</span>
                                </h2>
                                <p className="text-muted-foreground">{category.description}</p>
                              </div>
                              <CategoryBadge color={category.color}>
                                {getCurrentCategoryDocuments(category.id).length} documents
                              </CategoryBadge>
                            </motion.div>

                            {/* Documents Grid/List */}
                            {getCurrentCategoryDocuments(category.id).length === 0 ? (
                              <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.2, type: "spring", stiffness: 300, damping: 25 }}
                              >
                                <Card>
                                  <CardContent className="text-center py-12">
                                    <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                    <p className="text-muted-foreground">No {category.name.toLowerCase()} documents found</p>
                                  </CardContent>
                                </Card>
                              </motion.div>
                            ) : viewMode === 'list' ? (
                              <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2, type: "spring", stiffness: 300, damping: 25 }}
                              >
                                <DocumentsDataTable 
                                  documents={getCurrentCategoryDocuments(category.id)} 
                                  onDocumentDeleted={loadDocuments}
                                />
                              </motion.div>
                            ) : (
                              <motion.div 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.2 }}
                                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                              >
                                {getCurrentCategoryDocuments(category.id).map((doc, index) => (
                                  <motion.div
                                    key={doc.doc_id}
                                    initial={{ opacity: 0, y: 20, scale: 0.9 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    transition={{ 
                                      delay: 0.3 + index * 0.05, 
                                      type: "spring", 
                                      stiffness: 300, 
                                      damping: 25 
                                    }}
                                    whileHover={{ 
                                      scale: 1.02, 
                                      y: -4,
                                      transition: { type: "spring", stiffness: 400, damping: 25 }
                                    }}
                                    whileTap={{ scale: 0.98 }}
                                  >
                                    <Card 
                                      className="hover:shadow-md transition-shadow cursor-pointer"
                                      onClick={() => handleViewPdf(doc.doc_id ?? '', doc.filename ?? 'Unknown')}
                                    >
                                      <CardContent className="p-4">
                                        <div className="space-y-2">
                                          <FileText className="h-5 w-5 text-muted-foreground" />
                                          <div>
                                            <p className="text-sm font-medium truncate">{doc.filename}</p>
                                            <div className="flex items-center space-x-2 mt-1">
                                              <Badge variant="outline" className="text-xs">
                                                {doc.content_type.includes('pdf') ? 'PDF' : 'Word'}
                                              </Badge>
                                              <span className="text-xs text-muted-foreground">
                                                {formatFileSize(doc.file_size)}
                                              </span>
                                            </div>
                                          </div>
                                        </div>
                                      </CardContent>
                                    </Card>
                                  </motion.div>
                                ))}
                              </motion.div>
                            )}
                          </>
                        );
                      })()}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>

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
    </SidebarProvider>
  );
}

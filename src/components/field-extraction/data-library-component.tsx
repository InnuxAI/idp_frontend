"use client"

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Library,
  FileText,
  Eye,
  Download,
  Trash2,
  Search,
  Filter,
  Calendar,
  CheckCircle,
  AlertCircle,
  FileJson
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { apiService, DataLibraryEntry, DataLibraryResponse } from '@/services/api';
import { ExtractionViewerModal } from './extraction-viewer-modal';

export function DataLibraryComponent() {
  const [entries, setEntries] = useState<DataLibraryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSchema, setFilterSchema] = useState<string>('all');
  const [selectedEntry, setSelectedEntry] = useState<DataLibraryEntry | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletingEntry, setDeletingEntry] = useState<DataLibraryEntry | null>(null);
  const [viewingExtractionId, setViewingExtractionId] = useState<number | null>(null);

  useEffect(() => {
    loadDataLibrary();
  }, []);

  const loadDataLibrary = async () => {
    try {
      setLoading(true);
      const response: DataLibraryResponse = await apiService.getDataLibrary();
      setEntries(response.entries);
    } catch (error) {
      console.error('Error loading data library:', error);
      toast.error('Failed to load data library');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (entry: DataLibraryEntry) => {
    setDeletingEntry(entry);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!deletingEntry) return;

    try {
      await apiService.deleteExtraction(deletingEntry.id);
      toast.success('Extraction deleted successfully');
      setEntries(entries.filter(e => e.id !== deletingEntry.id));
      setShowDeleteDialog(false);
      setDeletingEntry(null);
    } catch (error) {
      console.error('Error deleting extraction:', error);
      toast.error('Failed to delete extraction');
    }
  };

  const handleViewPdf = (entry: DataLibraryEntry) => {
    const pdfUrl = apiService.getPdfUrl(entry.id);
    window.open(pdfUrl, '_blank');
  };

  const filteredEntries = entries.filter(entry => {
    const matchesSearch = entry.filename.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.schema_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSchema = filterSchema === 'all' || entry.schema_name === filterSchema;
    return matchesSearch && matchesSchema;
  });

  const uniqueSchemas = Array.from(new Set(entries.map(e => e.schema_name)));

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const exportData = (entry: DataLibraryEntry) => {
    const dataStr = JSON.stringify(entry.extracted_data, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${entry.filename.replace('.pdf', '')}_extracted_data.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading data library...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Library className="h-5 w-5" />
            Data Library
          </CardTitle>
          <div className="flex items-center gap-4 mt-4">
            <div className="flex-1">
              <Input
                placeholder="Search by filename or schema..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>
            <Select value={filterSchema} onValueChange={setFilterSchema}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by schema" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Schemas</SelectItem>
                {uniqueSchemas.map(schema => (
                  <SelectItem key={schema} value={schema}>
                    {schema}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {filteredEntries.length === 0 ? (
            <div className="text-center py-8">
              <Library className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-lg font-medium">No extractions found</p>
              <p className="text-muted-foreground">
                {entries.length === 0
                  ? "Start by creating a schema and extracting data from PDFs."
                  : "Try adjusting your search or filter criteria."
                }
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>File</TableHead>
                    <TableHead>Schema</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Updated</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEntries.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{entry.filename}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{entry.schema_name}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="default"
                          className={entry.is_approved ? "bg-green-500 text-black" : "bg-blue-500 text-black"}
                        >
                          {entry.is_approved ? (
                            <>
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Approved
                            </>
                          ) : (
                            <>
                              <AlertCircle className="h-3 w-3 mr-1" />
                              Draft
                            </>
                          )}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(entry.created_at)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(entry.updated_at)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewPdf(entry)}
                            title="View PDF"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setViewingExtractionId(entry.id)}
                            title="View Extracted Data"
                          >
                            <FileJson className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => exportData(entry)}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(entry)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Delete Extraction
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the extraction for "{deletingEntry?.filename}"?
              This action cannot be undone and will permanently remove the PDF file and all extracted data.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ExtractionViewerModal
        isOpen={!!viewingExtractionId}
        onClose={() => setViewingExtractionId(null)}
        extractionId={viewingExtractionId}
        onUpdate={loadDataLibrary}
      />
    </div>
  );
}

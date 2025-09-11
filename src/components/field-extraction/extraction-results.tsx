"use client"

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Download, 
  FileText, 
  Eye, 
  Copy, 
  Check, 
  Filter, 
  Search, 
  ExternalLink,
  Type,
  Hash,
  Calendar,
  ToggleLeft,
  Mail,
  Link,
  ChevronDown,
  Table as TableIcon,
  CheckSquare
} from 'lucide-react';
import { FieldDefinition, ExtractionResult } from './field-extraction-component';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface UploadedFile {
  file: File;
  id: string;
  progress: number;
  status: 'uploading' | 'completed' | 'error';
  results?: ExtractionResult;
}

interface ExtractionResultsProps {
  files: UploadedFile[];
  fieldDefinitions: FieldDefinition[];
}

const getFieldTypeIcon = (type: FieldDefinition['type']) => {
  switch (type) {
    case 'text':
      return Type;
    case 'number':
      return Hash;
    case 'date':
      return Calendar;
    case 'boolean':
      return ToggleLeft;
    case 'email':
      return Mail;
    case 'url':
      return Link;
    case 'dropdown':
      return ChevronDown;
    case 'table':
      return TableIcon;
    default:
      return Type;
  }
};

export function ExtractionResults({ files, fieldDefinitions }: ExtractionResultsProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterField, setFilterField] = useState<string>('all');
  const [copiedValue, setCopiedValue] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<UploadedFile | null>(null);

  const completedFiles = files.filter(f => f.status === 'completed' && f.results);

  const copyToClipboard = async (text: string, identifier: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedValue(identifier);
      setTimeout(() => setCopiedValue(null), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const exportToCSV = () => {
    if (completedFiles.length === 0) return;

    const headers = ['File Name', ...fieldDefinitions.map(f => f.label)];
    const rows = completedFiles.map(file => [
      file.file.name,
      ...fieldDefinitions.map(field => {
        const value = file.results?.[field.name];
        return formatValueForExport(value);
      })
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `field_extraction_results_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToJSON = () => {
    const data = completedFiles.map(file => ({
      fileName: file.file.name,
      extractedFields: file.results,
      fieldDefinitions: fieldDefinitions.reduce((acc, field) => {
        acc[field.name] = {
          label: field.label,
          type: field.type,
          required: field.required
        };
        return acc;
      }, {} as Record<string, any>)
    }));

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `field_extraction_results_${new Date().toISOString().split('T')[0]}.json`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatValueForExport = (value: any): string => {
    if (value === null || value === undefined) return '';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  };

  const formatValue = (value: any, fieldType: FieldDefinition['type']): React.ReactNode => {
    if (value === null || value === undefined) {
      return <span className="text-muted-foreground italic">Not found</span>;
    }

    switch (fieldType) {
      case 'boolean':
        return (
          <Badge variant={value ? 'default' : 'secondary'}>
            {value ? 'Yes' : 'No'}
          </Badge>
        );
      case 'email':
        return (
          <a 
            href={`mailto:${value}`} 
            className="text-blue-600 hover:underline flex items-center space-x-1"
          >
            <span>{value}</span>
            <ExternalLink className="h-3 w-3" />
          </a>
        );
      case 'url':
        return (
          <a 
            href={value} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline flex items-center space-x-1"
          >
            <span className="truncate max-w-[200px]">{value}</span>
            <ExternalLink className="h-3 w-3" />
          </a>
        );
      case 'date':
        return (
          <span className="font-mono">
            {new Date(value).toLocaleDateString()}
          </span>
        );
      case 'number':
        return (
          <span className="font-mono">
            {Number(value).toLocaleString()}
          </span>
        );
      default:
        return <span>{String(value)}</span>;
    }
  };

  const filteredFiles = completedFiles.filter(file => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    const fileNameMatch = file.file.name.toLowerCase().includes(searchLower);
    
    if (filterField === 'all') {
      // Search in all fields
      const fieldMatch = fieldDefinitions.some(field => {
        const value = file.results?.[field.name];
        return String(value || '').toLowerCase().includes(searchLower);
      });
      return fileNameMatch || fieldMatch;
    } else {
      // Search in specific field
      const value = file.results?.[filterField];
      return String(value || '').toLowerCase().includes(searchLower);
    }
  });

  if (completedFiles.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="text-lg font-semibold mb-2">No Results Yet</h3>
          <p className="text-muted-foreground">
            Upload and process documents to see extraction results here.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-lg font-semibold">Extraction Results</h3>
          <p className="text-muted-foreground">
            {completedFiles.length} file{completedFiles.length !== 1 ? 's' : ''} processed successfully
          </p>
        </div>
        
        <div className="flex space-x-2">
          <Button variant="outline" onClick={exportToCSV}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button variant="outline" onClick={exportToJSON}>
            <Download className="h-4 w-4 mr-2" />
            Export JSON
          </Button>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search in results..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterField} onValueChange={setFilterField}>
          <SelectTrigger className="w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All fields</SelectItem>
            {fieldDefinitions.map(field => (
              <SelectItem key={field.name} value={field.name}>
                {field.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Results Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[200px]">File</TableHead>
                  {fieldDefinitions.map(field => (
                    <TableHead key={field.name} className="min-w-[150px]">
                      <div className="flex items-center space-x-2">
                        {(() => {
                          const IconComponent = getFieldTypeIcon(field.type);
                          return <IconComponent className="h-4 w-4 text-muted-foreground" />;
                        })()}
                        <span>{field.label}</span>
                        {field.required && (
                          <Badge variant="destructive" className="text-xs">
                            Required
                          </Badge>
                        )}
                      </div>
                    </TableHead>
                  ))}
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFiles.map((file, index) => (
                  <motion.tr
                    key={file.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="group"
                  >
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{file.file.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {(file.file.size / 1024).toFixed(1)} KB
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    {fieldDefinitions.map(field => {
                      const value = file.results?.[field.name];
                      const cellId = `${file.id}-${field.name}`;
                      
                      return (
                        <TableCell key={field.name} className="relative group/cell">
                          <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                              {formatValue(value, field.type)}
                            </div>
                            {value !== null && value !== undefined && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="opacity-0 group-hover/cell:opacity-100 transition-opacity ml-2"
                                onClick={() => copyToClipboard(String(value), cellId)}
                              >
                                {copiedValue === cellId ? (
                                  <Check className="h-3 w-3 text-green-500" />
                                ) : (
                                  <Copy className="h-3 w-3" />
                                )}
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      );
                    })}
                    <TableCell>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => setSelectedFile(file)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Extraction Details</DialogTitle>
                            <DialogDescription>
                              Complete extraction results for {file.file.name}
                            </DialogDescription>
                          </DialogHeader>
                          {selectedFile && (
                            <FileDetailsView 
                              file={selectedFile} 
                              fieldDefinitions={fieldDefinitions}
                              onCopy={copyToClipboard}
                              copiedValue={copiedValue}
                            />
                          )}
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </motion.tr>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Summary Statistics */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{completedFiles.length}</p>
            <p className="text-sm text-muted-foreground">Files Processed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{fieldDefinitions.length}</p>
            <p className="text-sm text-muted-foreground">Fields Extracted</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">
              {Math.round((completedFiles.reduce((acc, file) => {
                const extractedCount = fieldDefinitions.filter(field => 
                  file.results?.[field.name] !== null && file.results?.[field.name] !== undefined
                ).length;
                return acc + (extractedCount / fieldDefinitions.length) * 100;
              }, 0) / completedFiles.length) || 0)}%
            </p>
            <p className="text-sm text-muted-foreground">Avg Success Rate</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">
              {fieldDefinitions.filter(f => f.required).length}
            </p>
            <p className="text-sm text-muted-foreground">Required Fields</p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

// Helper component for detailed file view
interface FileDetailsViewProps {
  file: UploadedFile;
  fieldDefinitions: FieldDefinition[];
  onCopy: (text: string, id: string) => void;
  copiedValue: string | null;
}

function FileDetailsView({ file, fieldDefinitions, onCopy, copiedValue }: FileDetailsViewProps) {
  return (
    <div className="space-y-4 max-h-[60vh] overflow-y-auto">
      <div className="grid gap-4">
        {fieldDefinitions.map(field => {
          const value = file.results?.[field.name];
          const cellId = `details-${file.id}-${field.name}`;
          
          return (
            <div key={field.name} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <h4 className="font-semibold">{field.label}</h4>
                  <Badge variant="outline" className="text-xs">
                    {field.type}
                  </Badge>
                  {field.required && (
                    <Badge variant="destructive" className="text-xs">
                      Required
                    </Badge>
                  )}
                </div>
                {value !== null && value !== undefined && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onCopy(String(value), cellId)}
                  >
                    {copiedValue === cellId ? (
                      <Check className="h-3 w-3 text-green-500" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </Button>
                )}
              </div>
              
              {field.description && (
                <p className="text-sm text-muted-foreground mb-2">
                  {field.description}
                </p>
              )}
              
              <div className="bg-muted rounded p-3">
                {value !== null && value !== undefined ? (
                  <span className="font-mono text-sm">{String(value)}</span>
                ) : (
                  <span className="text-muted-foreground italic text-sm">Not found</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

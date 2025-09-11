"use client"

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Save, 
  Edit3, 
  Check, 
  X, 
  FileText, 
  Eye,
  Download,
  Trash2,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { apiService, DataLibraryEntry } from '@/services/api';
import { FieldDefinition } from './field-extraction-component';
import { DynamicJsonRenderer } from '@/components/ui/dynamic-json-renderer';

interface ExtractionEditorProps {
  extractionId: number;
  initialData: Record<string, any>;
  fieldDefinitions: FieldDefinition[];
  filename: string;
  onUpdate?: (updatedData: Record<string, any>) => void;
  onApprove?: () => void;
  onDelete?: () => void;
}

export function ExtractionEditor({
  extractionId,
  initialData,
  fieldDefinitions,
  filename,
  onUpdate,
  onApprove,
  onDelete
}: ExtractionEditorProps) {
  const [extractedData, setExtractedData] = useState<Record<string, any>>(initialData);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showPdfViewer, setShowPdfViewer] = useState(false);

  useEffect(() => {
    setExtractedData(initialData);
  }, [initialData]);

  const handleFieldChange = (fieldName: string, value: any) => {
    setExtractedData(prev => ({
      ...prev,
      [fieldName]: value
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updatedEntry = await apiService.updateExtraction(extractionId, {
        extracted_data: extractedData,
        is_approved: false
      });
      toast.success('Extraction data updated successfully');
      setIsEditing(false);
      onUpdate?.(extractedData);
    } catch (error) {
      console.error('Error updating extraction:', error);
      toast.error('Failed to update extraction data');
    } finally {
      setIsSaving(false);
    }
  };

  const handleApprove = async () => {
    setIsApproving(true);
    try {
      await apiService.updateExtraction(extractionId, {
        extracted_data: extractedData,
        is_approved: true
      });
      toast.success('Extraction approved and saved to data library');
      onApprove?.();
    } catch (error) {
      console.error('Error approving extraction:', error);
      toast.error('Failed to approve extraction');
    } finally {
      setIsApproving(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await apiService.deleteExtraction(extractionId);
      toast.success('Extraction deleted successfully');
      setShowDeleteDialog(false);
      onDelete?.();
    } catch (error) {
      console.error('Error deleting extraction:', error);
      toast.error('Failed to delete extraction');
    } finally {
      setIsDeleting(false);
    }
  };

  const renderField = (field: FieldDefinition) => {
    const value = extractedData[field.name];
    
    if (!isEditing) {
      return (
        <div key={field.name} className="space-y-2">
          <Label className="text-sm font-medium">
            {field.label}
            {field.required && <span className="text-red-500 ml-1">*</span>}
          </Label>
          <div className="p-3 bg-gray-50 rounded-md border min-h-[40px]">
            {value !== null && value !== undefined ? (
              <span className="text-sm">
                {field.type === 'boolean' ? (value ? 'Yes' : 'No') : String(value)}
              </span>
            ) : (
              <span className="text-gray-400 text-sm italic">No data extracted</span>
            )}
          </div>
        </div>
      );
    }

    // Editing mode - render appropriate input component
    switch (field.type) {
      case 'text':
      case 'email':
      case 'url':
        return (
          <div key={field.name} className="space-y-2">
            <Label htmlFor={field.name} className="text-sm font-medium">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              id={field.name}
              value={value || ''}
              onChange={(e) => handleFieldChange(field.name, e.target.value)}
              placeholder={field.description || `Enter ${field.label.toLowerCase()}`}
              type={field.type === 'email' ? 'email' : field.type === 'url' ? 'url' : 'text'}
            />
          </div>
        );

      case 'number':
        return (
          <div key={field.name} className="space-y-2">
            <Label htmlFor={field.name} className="text-sm font-medium">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              id={field.name}
              type="number"
              value={value || ''}
              onChange={(e) => handleFieldChange(field.name, parseFloat(e.target.value) || 0)}
              placeholder={field.description || `Enter ${field.label.toLowerCase()}`}
            />
          </div>
        );

      case 'date':
        return (
          <div key={field.name} className="space-y-2">
            <Label htmlFor={field.name} className="text-sm font-medium">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              id={field.name}
              type="date"
              value={value || ''}
              onChange={(e) => handleFieldChange(field.name, e.target.value)}
            />
          </div>
        );

      case 'boolean':
        return (
          <div key={field.name} className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id={field.name}
                checked={Boolean(value)}
                onCheckedChange={(checked) => handleFieldChange(field.name, checked)}
              />
              <Label htmlFor={field.name} className="text-sm font-medium">
                {field.label}
                {field.required && <span className="text-red-500 ml-1">*</span>}
              </Label>
            </div>
          </div>
        );

      case 'dropdown':
        return (
          <div key={field.name} className="space-y-2">
            <Label htmlFor={field.name} className="text-sm font-medium">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Select value={value || ''} onValueChange={(newValue) => handleFieldChange(field.name, newValue)}>
              <SelectTrigger>
                <SelectValue placeholder={`Select ${field.label.toLowerCase()}`} />
              </SelectTrigger>
              <SelectContent>
                {field.options?.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );

      default:
        return (
          <div key={field.name} className="space-y-2">
            <Label htmlFor={field.name} className="text-sm font-medium">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Textarea
              id={field.name}
              value={value || ''}
              onChange={(e) => handleFieldChange(field.name, e.target.value)}
              placeholder={field.description || `Enter ${field.label.toLowerCase()}`}
              rows={3}
            />
          </div>
        );
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {filename}
            </CardTitle>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="outline">
                {fieldDefinitions.length} fields
              </Badge>
              <Badge variant="outline">
                Extraction ID: {extractionId}
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPdfViewer(true)}
            >
              <Eye className="h-4 w-4 mr-2" />
              View PDF
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(!isEditing)}
            >
              <Edit3 className="h-4 w-4 mr-2" />
              {isEditing ? 'Cancel' : 'Edit'}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Form fields - only shown when editing */}
          {isEditing && (
            <div className="grid gap-4 md:grid-cols-2">
              {fieldDefinitions.map(renderField)}
            </div>
          )}
          
          {/* Complete Extracted Data Viewer */}
          <div className={isEditing ? "pt-4 border-t" : ""}>
            <DynamicJsonRenderer 
              data={extractedData}
              title="Complete Extracted Data"
              className="w-full"
            />
          </div>
          
          {isEditing && (
            <div className="flex items-center justify-between pt-4 border-t">
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setShowDeleteDialog(true)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => setIsEditing(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={isSaving}
                >
                  <Save className="h-4 w-4 mr-2" />
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </div>
          )}
          
          {!isEditing && (
            <div className="flex items-center justify-end pt-4 border-t">
              <Button
                onClick={handleApprove}
                disabled={isApproving}
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                {isApproving ? 'Approving...' : 'Approve & Save to Data Library'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* PDF Viewer Dialog */}
      <Dialog open={showPdfViewer} onOpenChange={setShowPdfViewer}>
        <DialogContent className="!max-w-[95vw] !max-h-[95vh] !w-[95vw] !h-[95vh] p-0 gap-0 sm:!max-w-[95vw]">
          <DialogHeader className="p-4 border-b">
            <DialogTitle>PDF Viewer - {filename}</DialogTitle>
          </DialogHeader>
          <div className="flex-1 h-full">
            <iframe
              src={apiService.getPdfUrl(extractionId)}
              className="w-full h-full border-0"
              title={`PDF Viewer - ${filename}`}
              style={{ height: 'calc(95vh - 60px)' }}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              Delete Extraction
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this extraction? This action cannot be undone.
              The PDF file and all extracted data will be permanently removed.
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
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}

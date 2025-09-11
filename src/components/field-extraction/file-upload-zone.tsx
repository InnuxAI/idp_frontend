"use client"

import React, { useCallback, useState } from 'react';
import { motion } from 'motion/react';
import { Upload, FileText, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { validateFile, validateFileClientSide } from '@/services/fileValidation';

interface FileUploadZoneProps {
  onFilesSelected: (files: File[]) => void;
  disabled?: boolean;
  acceptedTypes?: string;
  maxFileSize?: number; // in bytes
  maxFiles?: number;
}

export function FileUploadZone({
  onFilesSelected,
  disabled = false,
  acceptedTypes = ".pdf,.doc,.docx,.txt",
  maxFileSize = 5 * 1024 * 1024, // 5MB default - aligned with server validation
  maxFiles = 10
}: FileUploadZoneProps) {
  const [dragOver, setDragOver] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) {
      setDragOver(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    if (disabled) return;

    const files = Array.from(e.dataTransfer.files);
    await handleFiles(files);
  }, [disabled]);

  const handleFileInput = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      await handleFiles(files);
    }
  }, []);

  const handleFiles = async (files: File[]) => {
    // First, run client-side validation for all files
    const clientValidatedFiles = files.filter(file => {
      const validation = validateFileClientSide(file);
      if (!validation.valid) {
        toast.error(`${file.name}: ${validation.message}`);
        return false;
      }
      return true;
    });

    if (clientValidatedFiles.length === 0) return;

    // Check max files limit
    const totalFiles = selectedFiles.length + clientValidatedFiles.length;
    if (totalFiles > maxFiles) {
      toast.error(`Maximum ${maxFiles} files allowed. Please remove some files first.`);
      return;
    }

    // Server-side validation for each file
    const validatedFiles: File[] = [];
    
    for (const file of clientValidatedFiles) {
      const validation = await validateFile(file);
      if (validation.valid) {
        validatedFiles.push(file);
      }
      // Error messages are already shown by the validateFile function
    }

    if (validatedFiles.length > 0) {
      setSelectedFiles(prev => [...prev, ...validatedFiles]);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const uploadFiles = () => {
    if (selectedFiles.length > 0) {
      onFilesSelected(selectedFiles);
      setSelectedFiles([]);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <motion.div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        whileHover={disabled ? {} : { scale: 1.02 }}
        whileTap={disabled ? {} : { scale: 0.98 }}
        className={`
          relative border-2 border-dashed rounded-lg p-8 text-center transition-colors
          ${dragOver && !disabled
            ? 'border-primary bg-primary/5'
            : 'border-muted-foreground/25 hover:border-muted-foreground/50'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
      >
        <input
          type="file"
          multiple
          accept={acceptedTypes}
          onChange={handleFileInput}
          disabled={disabled}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        
        <div className="space-y-4">
          <motion.div
            animate={dragOver ? { scale: 1.1 } : { scale: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
          >
            <Upload className="h-12 w-12 mx-auto text-muted-foreground" />
          </motion.div>
          
          <div>
            <h3 className="text-lg font-semibold">
              {dragOver ? 'Drop files here' : 'Upload Documents'}
            </h3>
            <p className="text-muted-foreground mt-2">
              Drag and drop files here, or click to browse
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Supported formats: {acceptedTypes} • Max size: {formatFileSize(maxFileSize)} • Max files: {maxFiles}
            </p>
          </div>
          
          {!disabled && (
            <Button variant="outline" type="button">
              Browse Files
            </Button>
          )}
        </div>
      </motion.div>

      {/* Selected Files */}
      {selectedFiles.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-3"
        >
          <div className="flex items-center justify-between">
            <h4 className="font-semibold">Selected Files ({selectedFiles.length})</h4>
            <Button onClick={uploadFiles} disabled={disabled}>
              <Upload className="h-4 w-4 mr-2" />
              Upload & Process
            </Button>
          </div>
          
          <div className="space-y-2">
            {selectedFiles.map((file, index) => (
              <motion.div
                key={`${file.name}-${index}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center justify-between p-3 border rounded-lg bg-card"
              >
                <div className="flex items-center space-x-3">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{file.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatFileSize(file.size)} • {file.type || 'Unknown type'}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile(index)}
                  disabled={disabled}
                >
                  <X className="h-4 w-4" />
                </Button>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}

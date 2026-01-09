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
        whileHover={disabled ? {} : { scale: 1.01 }}
        whileTap={disabled ? {} : { scale: 0.99 }}
        className={`
          relative border border-dashed rounded-xl p-10 text-center transition-all duration-300
          ${dragOver && !disabled
            ? 'border-primary bg-primary/5'
            : 'border-border/50 hover:border-primary/50 bg-muted/20 dark:bg-muted/30 hover:bg-muted/35 dark:hover:bg-muted/45'
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

        <div className="space-y-5">
          <motion.div
            animate={dragOver ? { scale: 1.1, rotate: 10 } : { scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="w-16 h-16 mx-auto bg-background rounded-full flex items-center justify-center border border-border/50"
          >
            <Upload className={`h-8 w-8 ${dragOver ? 'text-primary' : 'text-muted-foreground'}`} />
          </motion.div>

          <div className="space-y-2">
            <h3 className="text-xl font-semibold tracking-tight text-foreground">
              {dragOver ? 'Drop files here' : 'Upload Documents'}
            </h3>
            <p className="font-inter text-muted-foreground">
              Drag and drop files here, or click to browse
            </p>
            <div className="flex items-center justify-center gap-3 text-xs font-inter text-muted-foreground/80 mt-2">
              <span className="bg-secondary/50 px-2 py-1 rounded text-foreground/80 font-medium">PDF, DOC, DOCX, TXT</span>
              <span>•</span>
              <span>Max {Math.floor(maxFileSize / 1024 / 1024)}MB</span>
            </div>
          </div>

          {!disabled && (
            <div className="pt-2">
              <Button variant="secondary" type="button" className="font-inter text-xs">
                Select Files
              </Button>
            </div>
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
                className="flex items-center justify-between p-3 border border-border/40 rounded-lg bg-muted/30 dark:bg-muted/45 hover:bg-muted/45 dark:hover:bg-muted/55 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-muted/55 dark:bg-muted/60 rounded-md border border-border/40">
                    <FileText className="h-5 w-5 text-primary/80" />
                  </div>
                  <div>
                    <p className="font-medium text-sm text-foreground">{file.name}</p>
                    <p className="text-xs text-muted-foreground font-inter mt-0.5">
                      {formatFileSize(file.size)} • {file.type || 'Unknown type'}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile(index)}
                  disabled={disabled}
                  className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-8 w-8 p-0"
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

import { toast } from "sonner"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface FileValidationResult {
  valid: boolean;
  error?: string;
  message: string;
  file_size_mb?: number;
  page_count?: number;
  max_size_mb?: number;
  max_pages?: number;
}

export async function validateFile(file: File): Promise<FileValidationResult> {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE_URL}/validate-file`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result: FileValidationResult = await response.json();
    
    // Show appropriate toast messages
    if (!result.valid) {
      if (result.error === 'file_size') {
        toast.error(`File Too Large`, {
          description: `File size (${result.file_size_mb}MB) exceeds the ${result.max_size_mb}MB limit. Please choose a smaller file.`,
          duration: 5000,
        });
      } else if (result.error === 'page_count') {
        toast.error(`Too Many Pages`, {
          description: `PDF has ${result.page_count} pages, which exceeds the ${result.max_pages} page limit. Please use a shorter document.`,
          duration: 5000,
        });
      } else if (result.error === 'pdf_processing') {
        toast.error(`PDF Processing Error`, {
          description: result.message,
          duration: 5000,
        });
      } else {
        toast.error(`Validation Error`, {
          description: result.message,
          duration: 5000,
        });
      }
    } else {
      // Success message
      const sizeInfo = result.file_size_mb ? ` (${result.file_size_mb}MB` : '';
      const pageInfo = result.page_count ? `, ${result.page_count} pages` : '';
      const info = sizeInfo && pageInfo ? `${sizeInfo}${pageInfo})` : sizeInfo ? `${sizeInfo})` : '';
      
      toast.success(`File Validated Successfully`, {
        description: `File is ready for processing${info}`,
        duration: 3000,
      });
    }

    return result;
  } catch (error) {
    console.error('File validation failed:', error);
    
    toast.error(`Validation Failed`, {
      description: 'Unable to validate file. Please try again.',
      duration: 5000,
    });

    return {
      valid: false,
      error: 'network_error',
      message: 'Network error during validation'
    };
  }
}

export function validateFileClientSide(file: File): { valid: boolean; message?: string } {
  // Client-side basic validations
  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      message: `File size (${(file.size / 1024 / 1024).toFixed(1)}MB) exceeds 5MB limit`
    };
  }

  // Check file type
  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'image/jpeg',
    'image/png',
    'image/gif'
  ];

  if (!allowedTypes.includes(file.type) && !file.name.toLowerCase().match(/\.(pdf|doc|docx|txt|jpg|jpeg|png|gif)$/)) {
    return {
      valid: false,
      message: 'Unsupported file type. Please use PDF, Word, Text, or Image files.'
    };
  }

  return { valid: true };
}

import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
});

export interface Document {
  doc_id?: string;
  filename: string;
  content_type: string;
  extraction_method?: string;
  file_size: number;
  created_at?: number;
}

export interface StreamEvent {
  type: string;
  content: string | any;
}

export interface QueryResponse {
  query: string;
  answer: string;
  sources: Array<{
    type?: string;
    document_index?: number;
    filename?: string;
    relevance_score?: number;
    content_preview?: string;
    content?: string;
    metadata?: any;
  }>;
  image_sources?: Array<{
    type: string;
    content: string;
    image_path?: string;
    filename?: string;
    metadata?: any;
  }>;
  metadata?: any;
  method: string;
}

export interface UploadResponse {
  message: string;
  doc_id: string;
  extracted_images?: number;
  total_documents?: number;
  extraction_method?: string;
  text_length?: number;
  status: string;
}

// Extraction interfaces
export interface FieldDefinition {
  name: string;
  type: 'text' | 'number' | 'date' | 'boolean' | 'email' | 'url' | 'dropdown' | 'table';
  label: string;
  required?: boolean;
  options?: string[];
  description?: string;
  tableColumns?: TableColumn[];
}

export interface TableColumn {
  name: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'boolean';
}

export interface Schema {
  id: number;
  json_name: string;
  json_description?: string;
  json_string: {
    field_definitions: FieldDefinition[];
  };
  created_at: string;
  field_count?: number;
  required_field_count?: number;
}

export interface ExtractionResponse {
  extraction_id: number;
  extracted_data: Record<string, any>;
  confidence_scores?: Record<string, number>;
  processing_time?: number;
}

// Extraction status enum
export type ExtractionStatus = 'PENDING' | 'PROCESSING' | 'AWAITING_APPROVAL' | 'APPROVED' | 'FAILED';

export interface DataLibraryEntry {
  id: number;
  schema_id: number;
  schema_name: string;
  filename: string;
  pdf_path: string;
  extracted_data: Record<string, any>;
  schema_definition?: {
    field_definitions: FieldDefinition[];
  };
  is_approved: boolean;  // Keep for backward compat
  status: ExtractionStatus;
  error_message?: string;
  created_at: string;
  updated_at: string;
}

export interface DataLibraryResponse {
  entries: DataLibraryEntry[];
  total: number;
}

export interface MatchResult {
  item_in_inv: string;
  matched_item_in_po: string;
  confidence_score: number;
  reasoning: string;
}

export interface TwoWayMatchResponse {
  po_filename: string;
  invoice_filename: string;
  match_results: MatchResult[];
  total_invoice_items: number;
  matched_items: number;
  unmatched_items: number;
  processing_time?: number;
}

export interface ExtractionForMatching {
  id: number;
  filename: string;
  schema_name: string;
  created_at: string;
  updated_at: string;
}

export const apiService = {
  healthCheck: async () => {
    const response = await api.get('/health');
    return response.data;
  },

  uploadDocument: async (file: File): Promise<UploadResponse> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post('/upload-document/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  queryDocuments: async (
    query: string,
    filename: string | null,
    topK: number = 3,
    useLlm: boolean = true
  ): Promise<QueryResponse> => {
    const response = await api.post('/query-documents', {
      query: query,
      filename: filename,
      top_k: topK,
      use_llm_for_answer: useLlm,
    });
    return response.data;
  },

  queryDocumentsStream: async (
    query: string,
    filename: string | null = null,
    topK: number = 3,
    onEvent: (event: StreamEvent) => Promise<void> | void
  ): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/query-documents-stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: query,
        filename: filename,
        top_k: topK,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    if (!reader) {
      throw new Error('Response body is not readable');
    }

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const eventData = JSON.parse(line.slice(6));
              await onEvent(eventData);
            } catch (e) {
              console.warn('Failed to parse SSE data:', line);
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  },

  listDocuments: async () => {
    const response = await api.get('/list-documents/');
    return response.data;
  },

  deleteDocument: async (docId: string) => {
    const response = await api.delete(`/delete-document/${docId}`);
    return response.data;
  },

  getImageUrl: (imagePath: string): string => {
    return `${API_BASE_URL}/get-image/${imagePath}`;
  },

  // Get temporary sources file
  getTempSources: async (fileId: string) => {
    const response = await api.get(`/get-temp-sources/${fileId}`);
    return response.data;
  },

  // Schema management
  getSchemas: async () => {
    const response = await api.get('/api/schemas/');
    // Transform backend response to frontend format
    return response.data.schemas.map((schema: any) => ({
      id: schema.id,
      name: schema.json_name,
      description: schema.json_description,
      fields: schema.json_string.field_definitions,
      created_at: schema.created_at
    }));
  },

  createSchema: async (schemaData: {
    name: string;
    description?: string;
    field_definitions: FieldDefinition[];
  }) => {
    const response = await api.post('/api/schemas/', schemaData);
    return response.data;
  },

  // Extraction methods
  extractFieldsFromPdf: async (file: File, schemaId: number): Promise<ExtractionResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('schema_id', schemaId.toString());

    const response = await api.post('/api/extraction/json-extraction', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  getDataLibrary: async (schemaId?: number) => {
    const params = schemaId ? { schema_id: schemaId } : {};
    const response = await api.get('/api/extraction/data-library', { params });
    return response.data;
  },

  getExtraction: async (extractionId: number): Promise<DataLibraryEntry> => {
    const response = await api.get(`/api/extraction/data-library/${extractionId}`);
    return response.data;
  },

  updateExtraction: async (extractionId: number, data: {
    extracted_data: Record<string, any>;
    is_approved?: boolean;
  }): Promise<DataLibraryEntry> => {
    const response = await api.put(`/api/extraction/data-library/${extractionId}`, data);
    return response.data;
  },

  deleteExtraction: async (extractionId: number) => {
    const response = await api.delete(`/api/extraction/data-library/${extractionId}`);
    return response.data;
  },

  getPdfUrl: (extractionId: number): string => {
    return `${API_BASE_URL}/api/extraction/pdf/${extractionId}`;
  },

  // Two-way match endpoints
  getExtractionsForMatching: async () => {
    const response = await api.get('/api/extractions/list');
    return response.data;
  },

  performTwoWayMatch: async (poExtractionId: number, invoiceExtractionId: number) => {
    const response = await api.post('/api/two-way-match', {
      po_extraction_id: poExtractionId,
      invoice_extraction_id: invoiceExtractionId
    });
    return response.data;
  },
};


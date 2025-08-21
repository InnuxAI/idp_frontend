import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
});

export interface Document {
  doc_id: string;
  filename: string;
  content_type: string;
  extraction_method: string;
  file_size: number;
}

export interface QueryResponse {
  query: string;
  answer: string;
  sources: Array<{
    document_index?: number;
    filename?: string;
    relevance_score?: number;
    content_preview?: string;
    content?: string;
  }>;
  method: string;
}

export interface UploadResponse {
  message: string;
  doc_id: string;
  extraction_method: string;
  text_length: number;
  status: string;
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
    const response = await api.post('/query-documents/', {
      query: query,
      filename: filename,
      top_k: topK,
      use_llm_for_answer: useLlm,
    });
    return response.data;
  },

  listDocuments: async () => {
    const response = await api.get('/list-documents/');
    return response.data;
  },

  deleteDocument: async (docId: string) => {
    const response = await api.delete(`/delete-document/${docId}`);
    return response.data;
  },
};


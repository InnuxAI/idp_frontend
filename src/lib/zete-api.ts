import axios from 'axios';
import { GraphData, DocumentDetails, DocumentMetadata, SummaryResponse, ReconciliationResult, QueryResponse } from '@/types/zete-types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface UploadResponse {
    success: boolean;
    doc_id?: string;
    document_type?: string;
    parent?: string;
    relationship?: string;
    metadata?: Record<string, any>;
    errors: string[];
    warnings: string[];
}

export interface UploadProgress {
    file: File;
    progress: number;
    status: 'pending' | 'uploading' | 'success' | 'error';
    error?: string;
    response?: UploadResponse;
}

export const zeteApi = {
    getGraphData: async (): Promise<GraphData> => {
        const response = await axios.get(`${API_BASE_URL}/api/zete/graph`);
        return response.data;
    },

    getDocuments: async (): Promise<DocumentMetadata[]> => {
        const response = await axios.get(`${API_BASE_URL}/api/zete/documents`);
        return response.data;
    },

    getDocument: async (docId: string): Promise<DocumentDetails> => {
        const response = await axios.get(`${API_BASE_URL}/api/zete/documents/${docId}`);
        return response.data;
    },

    summarizeDocument: async (docId: string): Promise<SummaryResponse> => {
        const response = await axios.post(`${API_BASE_URL}/api/zete/summarize/${docId}`);
        return response.data;
    },

    reconcileDocument: async (docId: string): Promise<ReconciliationResult> => {
        const response = await axios.post(`${API_BASE_URL}/api/zete/reconcile/${docId}`);
        return response.data;
    },

    query: async (question: string): Promise<QueryResponse> => {
        const response = await axios.post(`${API_BASE_URL}/api/zete/query`, { question });
        return response.data;
    },

    ingestDocument: async (fileDetails: { file_path: string }) => {
        const response = await axios.post(`${API_BASE_URL}/api/zete/documents/ingest`, fileDetails);
        return response.data;
    },

    /**
     * Upload a document with optional user context.
     * @param file - The file to upload
     * @param context - Optional user context (e.g., "Met person X at venue Y on date Z")
     * @param onProgress - Optional progress callback
     */
    uploadDocument: async (
        file: File,
        context?: string,
        onProgress?: (progress: number) => void
    ): Promise<UploadResponse> => {
        const formData = new FormData();
        formData.append('file', file);
        if (context && context.trim()) {
            formData.append('context', context);
        }

        const response = await axios.post(
            `${API_BASE_URL}/api/zete/documents/upload`,
            formData,
            {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
                onUploadProgress: (progressEvent) => {
                    if (progressEvent.total && onProgress) {
                        const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                        onProgress(progress);
                    }
                },
            }
        );
        return response.data;
    },

    deleteDocument: async (docId: string): Promise<{ success: boolean; doc_id: string; message: string; file_deleted: boolean }> => {
        const response = await axios.delete(`${API_BASE_URL}/api/zete/documents/${docId}`);
        return response.data;
    },

    getNodeMetadata: async (docId: string): Promise<Record<string, any>> => {
        const response = await axios.get(`${API_BASE_URL}/api/zete/graph/node/${docId}/metadata`);
        return response.data;
    }
};

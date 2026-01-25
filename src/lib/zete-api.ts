import axios from 'axios';
import { GraphData, DocumentDetails, DocumentMetadata, SummaryResponse, ReconciliationResult, QueryResponse, TaskStatusResponse, TaskCreateResponse } from '@/types/zete-types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Helper to get auth headers
const getAuthHeaders = () => {
    const token = typeof window !== 'undefined'
        ? (sessionStorage.getItem('auth_token') || localStorage.getItem('auth_token'))
        : null;
    return token ? { Authorization: `Bearer ${token}` } : {};
};

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
        const response = await axios.get(`${API_BASE_URL}/api/zete/graph`, {
            headers: getAuthHeaders()
        });
        return response.data;
    },

    getDocuments: async (): Promise<DocumentMetadata[]> => {
        const response = await axios.get(`${API_BASE_URL}/api/zete/documents`, {
            headers: getAuthHeaders()
        });
        return response.data;
    },

    getDocument: async (docId: string): Promise<DocumentDetails> => {
        const response = await axios.get(`${API_BASE_URL}/api/zete/documents/${docId}`, {
            headers: getAuthHeaders()
        });
        return response.data;
    },

    summarizeDocument: async (docId: string): Promise<SummaryResponse> => {
        const response = await axios.post(`${API_BASE_URL}/api/zete/summarize/${docId}`, {}, {
            headers: getAuthHeaders()
        });
        return response.data;
    },

    reconcileDocument: async (docId: string): Promise<ReconciliationResult> => {
        const response = await axios.post(`${API_BASE_URL}/api/zete/reconcile/${docId}`, {}, {
            headers: getAuthHeaders()
        });
        return response.data;
    },

    query: async (question: string, documentTypes?: string[]): Promise<QueryResponse> => {
        const response = await axios.post(`${API_BASE_URL}/api/zete/query`, {
            question,
            document_types: documentTypes?.length ? documentTypes : undefined
        }, {
            headers: getAuthHeaders()
        });
        return response.data;
    },

    ingestDocument: async (fileDetails: { file_path: string }) => {
        const response = await axios.post(`${API_BASE_URL}/api/zete/documents/ingest`, fileDetails, {
            headers: getAuthHeaders()
        });
        return response.data;
    },

    /**
     * Upload a document with optional user context.
     * Returns a TaskCreateResponse for async processing (default) or UploadResponse for sync.
     * 
     * @param file - The file to upload
     * @param context - Optional user context (e.g., "Met person X at venue Y on date Z")
     * @param onProgress - Optional progress callback for upload progress
     * @param sync - If true, wait for processing to complete (legacy behavior)
     */
    uploadDocument: async (
        file: File,
        context?: string,
        onProgress?: (progress: number) => void,
        sync: boolean = false
    ): Promise<TaskCreateResponse | UploadResponse> => {
        const formData = new FormData();
        formData.append('file', file);
        if (context && context.trim()) {
            formData.append('context', context);
        }
        if (sync) {
            formData.append('sync', 'true');
        }

        const response = await axios.post(
            `${API_BASE_URL}/api/zete/documents/upload`,
            formData,
            {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    ...getAuthHeaders()
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

    /**
     * Get the current status of an async document processing task.
     * Poll this every 2-3 seconds to get real-time updates.
     */
    getTaskStatus: async (taskId: string): Promise<TaskStatusResponse> => {
        const response = await axios.get(`${API_BASE_URL}/api/zete/tasks/${taskId}/status`, {
            headers: getAuthHeaders()
        });
        return response.data;
    },

    /**
     * Poll task status until completion or failure.
     * Returns a cleanup function to stop polling.
     * 
     * @param taskId - The task ID to poll
     * @param onUpdate - Callback for each status update
     * @param interval - Polling interval in ms (default: 2000)
     */
    pollTaskStatus: (
        taskId: string,
        onUpdate: (status: TaskStatusResponse) => void,
        interval: number = 2000
    ): (() => void) => {
        let active = true;

        const poll = async () => {
            if (!active) return;

            try {
                const status = await zeteApi.getTaskStatus(taskId);
                onUpdate(status);

                // Stop polling if terminal state
                if (status.status === 'completed' || status.status === 'failed' || status.status === 'cancelled') {
                    active = false;
                    return;
                }

                // Schedule next poll
                if (active) {
                    setTimeout(poll, interval);
                }
            } catch (error) {
                console.error('Task polling error:', error);
                // Retry on error
                if (active) {
                    setTimeout(poll, interval * 2);
                }
            }
        };

        // Start polling
        poll();

        // Return cleanup function
        return () => {
            active = false;
        };
    },

    /**
     * Cancel a pending or processing task.
     */
    cancelTask: async (taskId: string): Promise<{ success: boolean; message: string }> => {
        const response = await axios.delete(`${API_BASE_URL}/api/zete/tasks/${taskId}`, {
            headers: getAuthHeaders()
        });
        return response.data;
    },

    deleteDocument: async (docId: string): Promise<{ success: boolean; doc_id: string; message: string; file_deleted: boolean }> => {
        const response = await axios.delete(`${API_BASE_URL}/api/zete/documents/${docId}`, {
            headers: getAuthHeaders()
        });
        return response.data;
    },

    getNodeMetadata: async (docId: string): Promise<Record<string, any>> => {
        const response = await axios.get(`${API_BASE_URL}/api/zete/graph/node/${docId}/metadata`, {
            headers: getAuthHeaders()
        });
        return response.data;
    }
};

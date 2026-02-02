import axios from 'axios';
import { GraphData, DocumentDetails, DocumentMetadata, SummaryResponse, ReconciliationResult, QueryResponse, TaskStatusResponse, TaskCreateResponse, ConversationMessage, SearchResponse } from '@/types/zete-types';

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

    /**
     * Query documents using natural language.
     * 
     * @param question - The question to ask
     * @param documentTypes - Optional list of document types to filter by
     * @param conversationHistory - Optional previous messages for conversational context (max 5 Q&A pairs)
     */
    query: async (
        question: string,
        documentTypes?: string[],
        conversationHistory?: ConversationMessage[]
    ): Promise<QueryResponse> => {
        const response = await axios.post(`${API_BASE_URL}/api/zete/query`, {
            question,
            document_types: documentTypes?.length ? documentTypes : undefined,
            conversation_history: conversationHistory?.length ? conversationHistory : undefined
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
    },

    /**
     * Search documents by filename and metadata.
     * Uses filesystem-based search with Neo4j metadata.
     * Future: Will be upgraded to Meilisearch for full-text search.
     * 
     * @param query - Search query string
     * @param options - Optional filters and pagination
     */
    search: async (
        query: string,
        options?: {
            docTypes?: string[];
            organization?: string;
            limit?: number;
            offset?: number;
        }
    ): Promise<SearchResponse> => {
        const params = new URLSearchParams({ q: query });

        if (options?.docTypes?.length) {
            options.docTypes.forEach(t => params.append('doc_type', t));
        }
        if (options?.organization) {
            params.append('organization', options.organization);
        }
        if (options?.limit) {
            params.append('limit', options.limit.toString());
        }
        if (options?.offset) {
            params.append('offset', options.offset.toString());
        }

        const response = await axios.get(`${API_BASE_URL}/api/zete/search?${params}`, {
            headers: getAuthHeaders()
        });
        return response.data;
    }
};

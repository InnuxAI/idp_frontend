import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const AGRO_BASE = `${API_BASE_URL}/api/agro`;

// Helper to get auth headers (same pattern as rag-api.ts)
const getAuthHeaders = () => {
    const token = typeof window !== 'undefined'
        ? (sessionStorage.getItem('auth_token') || localStorage.getItem('auth_token'))
        : null;
    return token ? { Authorization: `Bearer ${token}` } : {};
};

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface AgroDocument {
    id: string;
    title: string;
    source: string;
    content?: string;
    summary?: string;
    customMetadata?: Record<string, unknown>;
    metadata?: Record<string, unknown>;
    created_at?: string;
}

export interface AgroLibraryDocument {
    id?: string;
    source_file: string;
    source_stem: string;
    doc_hash: string;
    document_type: string;
    brand: string;
    summary?: string;
    custom_metadata?: Record<string, unknown>;
    chunk_count: number;
    page_count: number;
    created_at?: string;
    updated_at?: string;
}

export interface AgroSource {
    document_id: string;
    title?: string;
    source?: string;
}

export interface AgroChatMessage {
    role: 'user' | 'assistant';
    content: string;
    timestamp?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// API client — adapted for healthy_food_rag session-based API
// ─────────────────────────────────────────────────────────────────────────────

export const agroApi = {
    /**
     * Create a new chat session.
     * healthy_food_rag requires explicit session creation before chatting.
     */
    createSession: async (llmProvider: string = 'gemini'): Promise<{ session_id: string; llm_provider: string }> => {
        const response = await axios.post(
            `${AGRO_BASE}/api/session/new`,
            { llm_provider: llmProvider },
            { headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' } }
        );
        return response.data;
    },

    /**
     * Send a non-streaming chat message.
     */
    chat: async (
        sessionId: string,
        query: string,
        topK: number = 10,
    ): Promise<Record<string, unknown>> => {
        const response = await axios.post(
            `${AGRO_BASE}/api/chat`,
            { session_id: sessionId, query, top_k: topK, compute_faithfulness: true },
            { headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' } }
        );
        return response.data;
    },

    /**
     * Stream chat via SSE (Server-Sent Events).
     *
     * healthy_food_rag's /api/chat/stream is a GET endpoint with query parameters.
     * SSE format:
     *   data: {"type": "retrieval", "data": { documents, ontology_expansion }}
     *   data: {"type": "token", "token": "Hello"}
     *   data: {"type": "done", "data": { model, faithfulness, tiers }}
     *   data: {"type": "error", "message": "..."}
     */
    chatStream: async (
        query: string,
        sessionId: string,
        onToken: (token: string) => void,
        onDone: (data?: Record<string, unknown>) => void,
        onError?: (error: Error) => void,
        onRetrieval?: (data: Record<string, unknown>) => void,
        docTypes?: string[],
    ): Promise<void> => {
        const token =
            typeof window !== 'undefined'
                ? sessionStorage.getItem('auth_token') || localStorage.getItem('auth_token')
                : null;

        const params = new URLSearchParams({
            session_id: sessionId,
            query,
            top_k: '10',
        });

        // Only send doc_types when filtering a subset (< all 3),
        // omitting it entirely = no filter on the backend.
        if (docTypes && docTypes.length > 0) {
            params.set('doc_types', docTypes.join(','));
        }

        let response: globalThis.Response;
        try {
            response = await fetch(`${AGRO_BASE}/api/chat/stream?${params.toString()}`, {
                method: 'GET',
                headers: {
                    'Accept': 'text/event-stream',
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
            });
        } catch (err) {
            onError?.(err instanceof Error ? err : new Error(String(err)));
            return;
        }

        if (!response.ok) {
            const errText = await response.text().catch(() => response.statusText);
            onError?.(new Error(`Chat stream error ${response.status}: ${errText}`));
            return;
        }

        const reader = response.body?.getReader();
        if (!reader) {
            onError?.(new Error('No response body'));
            return;
        }

        const decoder = new TextDecoder();
        let buffer = '';

        try {
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });

                const lines = buffer.split('\n');
                buffer = lines.pop() ?? '';

                for (const line of lines) {
                    const trimmed = line.trim();
                    if (!trimmed.startsWith('data:')) continue;

                    const raw = trimmed.slice(5).trim();
                    if (!raw || raw === '[DONE]') continue;

                    try {
                        const event = JSON.parse(raw) as {
                            type: string;
                            token?: string;
                            data?: Record<string, unknown>;
                            message?: string;
                        };

                        switch (event.type) {
                            case 'token':
                                if (event.token) onToken(event.token);
                                break;
                            case 'retrieval':
                                if (event.data) onRetrieval?.(event.data);
                                break;
                            case 'done':
                                onDone(event.data);
                                return;
                            case 'error':
                                onError?.(new Error(event.message ?? 'Stream error'));
                                return;
                        }
                    } catch {
                        // Non-JSON — ignore
                    }
                }
            }
        } finally {
            reader.releaseLock();
        }

        // If we exit the loop without a done event, still notify
        onDone();
    },

    /**
     * Get chat history for a session.
     */
    getHistory: async (sessionId: string): Promise<{ session_id: string; turns: AgroChatMessage[] }> => {
        const response = await axios.get(`${AGRO_BASE}/api/chat/${sessionId}/history`, {
            headers: getAuthHeaders(),
        });
        return response.data;
    },

    /**
     * Upload multiple files to Azure Blob Storage and dispatch Celery ingestion tasks.
     * Returns a list of task_ids for SSE tracking.
     */
    uploadDocuments: async (
        files: File[],
        onProgress?: (progressEvent: any) => void
    ): Promise<{ tasks: Array<{ task_id: string; filename: string; blob_name: string; status: string; error?: string }> }> => {
        const formData = new FormData();
        files.forEach((file) => formData.append('files', file));

        const response = await axios.post(`${AGRO_BASE}/api/upload`, formData, {
            headers: {
                ...getAuthHeaders(),
                'Content-Type': 'multipart/form-data',
            },
            onUploadProgress: onProgress,
        });
        return response.data;
    },

    /**
     * Stream task status via SSE (Server-Sent Events).
     * Returns an EventSource that emits status/complete/error events.
     */
    streamTaskStatus: (
        taskId: string,
        onStatus: (data: {
            task_id: string;
            status: string;
            progress: number;
            current_step: string;
            step_message: string;
            file_name: string;
            chunks?: number;
            error?: string;
        }) => void,
        onComplete: (data: any) => void,
        onError?: (data: any) => void,
    ): EventSource => {
        const token = typeof window !== 'undefined'
            ? (sessionStorage.getItem('auth_token') || localStorage.getItem('auth_token'))
            : null;

        // SSE connects directly to the agro backend (proxied through idp_backend)
        const url = `${AGRO_BASE}/api/tasks/${taskId}/stream`;
        const eventSource = new EventSource(url);

        eventSource.addEventListener('status', (event: MessageEvent) => {
            try {
                onStatus(JSON.parse(event.data));
            } catch { /* ignore */ }
        });

        eventSource.addEventListener('complete', (event: MessageEvent) => {
            try {
                onComplete(JSON.parse(event.data));
            } catch { /* ignore */ }
            eventSource.close();
        });

        eventSource.addEventListener('error', (event: Event) => {
            if (event instanceof MessageEvent) {
                try {
                    onError?.(JSON.parse(event.data));
                } catch { /* ignore */ }
            } else {
                onError?.({ error: 'SSE connection failed' });
            }
            eventSource.close();
        });

        return eventSource;
    },

    /**
     * Fetch the LlamaParse-generated markdown for a document.
     * Returns the full markdown content from Azure Blob 'procatalogmd' container.
     */
    getDocumentMarkdown: async (
        sourceStem: string
    ): Promise<{ source_stem: string; markdown: string; size: number } | null> => {
        try {
            const response = await axios.get(
                `${AGRO_BASE}/api/markdown/${encodeURIComponent(sourceStem)}`,
                { headers: getAuthHeaders() }
            );
            return response.data;
        } catch (error: any) {
            if (error?.response?.status === 404) return null;
            throw error;
        }
    },

    /**
     * List all unique documents in the collection.
     * Groups chunks by source_file and returns per-document metadata.
     */
    listDocuments: async (
        type?: string
    ): Promise<{ documents: AgroLibraryDocument[]; total: number }> => {
        const params = type ? `?type=${encodeURIComponent(type)}` : '';
        const response = await axios.get(
            `${AGRO_BASE}/api/documents${params}`,
            { headers: getAuthHeaders() }
        );
        return response.data;
    },

    /**
     * Delete a document and all its chunks by doc_hash.
     */
    deleteDocument: async (
        docHash: string
    ): Promise<{ deleted_chunks: number; doc_hash: string; source_file: string }> => {
        const response = await axios.delete(
            `${AGRO_BASE}/api/documents/${encodeURIComponent(docHash)}`,
            { headers: getAuthHeaders() }
        );
        return response.data;
    },

    /**
     * Update document type for a given doc_hash.
     */
    updateDocumentType: async (
        docHash: string,
        documentType: string
    ): Promise<any> => {
        const response = await axios.put(
            `${AGRO_BASE}/api/documents/${encodeURIComponent(docHash)}/type`,
            { document_type: documentType },
            { headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' } }
        );
        return response.data;
    },

    /**
     * Trigger document ingestion (from local data directory).
     */
    triggerIngest: async (reset: boolean = false, parallel: boolean = true): Promise<{ status: string }> => {
        const response = await axios.post(
            `${AGRO_BASE}/api/ingest`,
            { reset, parallel },
            { headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' } }
        );
        return response.data;
    },

    /**
     * Trigger Azure Blob ingestion.
     */
    triggerAzureIngest: async (
        reset: boolean = false,
        includeOntology: boolean = true,
    ): Promise<Record<string, unknown>> => {
        const response = await axios.post(
            `${AGRO_BASE}/api/ingest/azure`,
            { reset, include_ontology: includeOntology },
            { headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' } }
        );
        return response.data;
    },

    /**
     * List blobs from Azure Blob Storage.
     */
    listAzureBlobs: async (): Promise<{ blobs: string[]; blob_count: number }> => {
        const response = await axios.get(`${AGRO_BASE}/api/ingest/azure/list`, {
            headers: getAuthHeaders(),
        });
        return response.data;
    },

    /**
     * Get collection stats (chunk count, etc.).
     */
    getCollectionStats: async (): Promise<{ collection: string; total_chunks: number }> => {
        const response = await axios.get(`${AGRO_BASE}/api/collection/stats`, {
            headers: getAuthHeaders(),
        });
        return response.data;
    },

    /**
     * Health check.
     */
    health: async (): Promise<{ status: string }> => {
        const response = await axios.get(`${AGRO_BASE}/api/health`);
        return response.data;
    },
};

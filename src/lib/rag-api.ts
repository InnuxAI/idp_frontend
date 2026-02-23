import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const RAG_BASE = `${API_BASE_URL}/api/rag`;

// Helper to get auth headers (same pattern as zete-api.ts)
const getAuthHeaders = () => {
    const token = typeof window !== 'undefined'
        ? (sessionStorage.getItem('auth_token') || localStorage.getItem('auth_token'))
        : null;
    return token ? { Authorization: `Bearer ${token}` } : {};
};

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface RagUploadResponse {
    task_id: string;
    filename: string;
    raw_blob: string;
    markdown_blob: string;
    build_graph: boolean;
    status: 'queued' | 'processing' | 'completed' | 'failed';
}

export interface RagTaskStatus {
    task_id: string;
    filename: string;
    build_graph: boolean;
    user_id: string;
    status: 'pending' | 'converting' | 'vector_indexing' | 'graph_building' | 'completed' | 'failed';
    step: string;
    created_at: string;
    updated_at: string;
    error: string;
    document_id: string;
}

export interface RagDocument {
    id: string;
    title: string;
    source: string;
    content?: string;
    metadata?: Record<string, unknown>;
    created_at?: string;
}

export interface RagSearchResult {
    id: string;
    content: string;
    score: number;
    metadata?: Record<string, unknown>;
    document_title?: string;
}

export interface RagSearchResponse {
    results: RagSearchResult[];
    query: string;
    search_type: string;
    total: number;
}

export interface RagSource {
    document_id: string;
    title?: string;
    source?: string;
}

export interface RagChatMessage {
    role: 'user' | 'assistant';
    content: string;
    timestamp?: string;
}

export interface RagChatRequest {
    message: string;
    session_id?: string;
    stream?: boolean;
}

export interface RagChatResponse {
    response: string;
    session_id: string;
    tool_calls?: Array<{ tool: string; result: unknown }>;
}

// ─────────────────────────────────────────────────────────────────────────────
// API client
// ─────────────────────────────────────────────────────────────────────────────

export const ragApi = {
    /**
     * Upload a document for RAG ingestion.
     * Returns immediately with a task_id for polling.
     */
    uploadDocument: async (
        file: File,
        buildGraph: boolean = false,
        onProgress?: (progress: number) => void
    ): Promise<RagUploadResponse> => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('build_graph', String(buildGraph));

        const response = await axios.post(`${RAG_BASE}/upload`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
                ...getAuthHeaders(),
            },
            onUploadProgress: (progressEvent) => {
                if (progressEvent.total && onProgress) {
                    const progress = Math.round(
                        (progressEvent.loaded * 100) / progressEvent.total
                    );
                    onProgress(progress);
                }
            },
        });
        return response.data;
    },

    /**
     * Poll status of a RAG ingestion task.
     */
    getTaskStatus: async (taskId: string): Promise<RagTaskStatus> => {
        const response = await axios.get(`${RAG_BASE}/tasks/${taskId}/status`, {
            headers: getAuthHeaders(),
        });
        return response.data;
    },

    /**
     * Poll until completed or failed. Returns cleanup function.
     */
    pollTaskStatus: (
        taskId: string,
        onUpdate: (status: RagTaskStatus) => void,
        interval: number = 2500
    ): (() => void) => {
        let active = true;

        const poll = async () => {
            if (!active) return;
            try {
                const status = await ragApi.getTaskStatus(taskId);
                onUpdate(status);
                if (status.status === 'completed' || status.status === 'failed') {
                    active = false;
                    return;
                }
                if (active) setTimeout(poll, interval);
            } catch (err) {
                console.error('[ragApi] pollTaskStatus error:', err);
                if (active) setTimeout(poll, interval * 2);
            }
        };

        poll();
        return () => { active = false; };
    },

    /**
     * List all ingested documents in the RAG index.
     */
    listDocuments: async (): Promise<RagDocument[]> => {
        const response = await axios.get(`${RAG_BASE}/documents`, {
            headers: getAuthHeaders(),
        });
        // agentic-rag returns { documents: [...] }
        return response.data?.documents ?? response.data ?? [];
    },

    /**
     * Delete a document from the RAG index (Postgres + Azure Blobs).
     */
    deleteDocument: async (documentId: string): Promise<{ success: boolean; document_id: string }> => {
        const response = await axios.delete(`${RAG_BASE}/documents/${documentId}`, {
            headers: getAuthHeaders(),
        });
        return response.data;
    },

    /**
     * Send a chat message (non-streaming).
     */
    chat: async (
        message: string,
        sessionId?: string
    ): Promise<RagChatResponse> => {
        const response = await axios.post(
            `${RAG_BASE}/chat`,
            { message, session_id: sessionId } as RagChatRequest,
            { headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' } }
        );
        return response.data;
    },

    /**
     * Send a chat message and stream the response via Server-Sent Events.
     *
     * agentic-rag SSE format (one JSON object per `data:` line):
     *   { type: "session",  session_id: "..." }       — first event
     *   { type: "text",     content: "..." }           — token delta (many)
     *   { type: "replace",  content: "..." }           — final clean text (strip SOURCES_JSON)
     *   { type: "sources",  sources: RagSource[] }     — structured source list
     *   { type: "tools",    tools: [...] }             — tool calls (optional)
     *   { type: "end" }                                — stream finished
     *   { type: "error",    content: "..." }           — error
     */
    chatStream: async (
        message: string,
        sessionId: string | undefined,
        onChunk: (text: string) => void,
        onDone: (sessionId: string) => void,
        onError?: (error: Error) => void,
        onReplace?: (text: string) => void,
        onSources?: (sources: RagSource[]) => void,
    ): Promise<void> => {
        const token =
            typeof window !== 'undefined'
                ? sessionStorage.getItem('auth_token') || localStorage.getItem('auth_token')
                : null;

        let response: globalThis.Response;
        try {
            response = await fetch(`${RAG_BASE}/chat/stream`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify({ message, session_id: sessionId, stream: true }),
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
        let resolvedSessionId = sessionId ?? '';
        let buffer = '';

        try {
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });

                // Process all complete SSE lines in the buffer
                const lines = buffer.split('\n');
                // Keep the last (possibly incomplete) line in the buffer
                buffer = lines.pop() ?? '';

                for (const line of lines) {
                    const trimmed = line.trim();
                    if (!trimmed.startsWith('data:')) continue;

                    const raw = trimmed.slice(5).trim();
                    if (!raw || raw === '[DONE]') continue;

                    try {
                        const event = JSON.parse(raw) as {
                            type: string;
                            content?: string;
                            session_id?: string;
                            tools?: unknown[];
                            sources?: RagSource[];
                        };

                        switch (event.type) {
                            case 'session':
                                if (event.session_id) resolvedSessionId = event.session_id;
                                break;
                            case 'text':
                                if (event.content) onChunk(event.content);
                                break;
                            case 'replace':
                                // Backend sent clean text — replace the whole message
                                if (event.content !== undefined) onReplace?.(event.content);
                                break;
                            case 'sources':
                                if (Array.isArray(event.sources)) onSources?.(event.sources as RagSource[]);
                                break;
                            case 'error':
                                onError?.(new Error(event.content ?? 'Stream error'));
                                break;
                            case 'end':
                                break;
                            // 'tools' — ignored for now
                        }
                    } catch {
                        // Non-JSON comment lines — ignore
                    }
                }
            }
        } finally {
            reader.releaseLock();
        }

        onDone(resolvedSessionId);
    },

    /**
     * Hybrid (vector + graph) search.
     */
    hybridSearch: async (query: string, limit: number = 10): Promise<RagSearchResponse> => {
        const response = await axios.post(
            `${RAG_BASE}/search/hybrid`,
            { query, limit },
            { headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' } }
        );
        return response.data;
    },

    /**
     * Vector-only search.
     */
    vectorSearch: async (query: string, limit: number = 10): Promise<RagSearchResponse> => {
        const response = await axios.post(
            `${RAG_BASE}/search/vector`,
            { query, limit },
            { headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' } }
        );
        return response.data;
    },

    /**
     * Check if the RAG service is reachable.
     */
    health: async (): Promise<{ status: string }> => {
        const response = await axios.get(`${RAG_BASE}/health`);
        return response.data;
    },
};

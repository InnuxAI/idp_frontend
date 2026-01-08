/**
 * Chat API client for thread and chat operations.
 * Centralized API calls following DRY principle.
 */
import {
    Thread,
    ThreadWithMessages,
    ThreadCreate,
    ThreadUpdate,
    ChatRequest,
    ChatResponse,
    StreamChunk
} from '@/types/chat';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

/**
 * Get auth token from storage.
 * Uses same keys as authAPI for consistency.
 */
function getAuthToken(): string | null {
    if (typeof window === 'undefined') return null;

    const TOKEN_KEY = 'auth_token';
    const REMEMBER_KEY = 'auth_remember';

    // First check session storage
    const sessionToken = sessionStorage.getItem(TOKEN_KEY);
    if (sessionToken) return sessionToken;

    // Then check localStorage if remember me was used
    const rememberMe = localStorage.getItem(REMEMBER_KEY);
    if (rememberMe === 'true') {
        const localToken = localStorage.getItem(TOKEN_KEY);
        if (localToken) return localToken;
    }

    return null;
}

/**
 * Create authenticated fetch headers.
 */
function getHeaders(): HeadersInit {
    const token = getAuthToken();
    const headers: HeadersInit = {
        'Content-Type': 'application/json',
    };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
}

// ============ Thread API ============

export async function listThreads(limit = 50, offset = 0): Promise<Thread[]> {
    const response = await fetch(
        `${API_BASE_URL}/api/threads?limit=${limit}&offset=${offset}`,
        { headers: getHeaders() }
    );
    if (!response.ok) throw new Error('Failed to list threads');
    return response.json();
}

export async function createThread(data: ThreadCreate = {}): Promise<Thread> {
    const response = await fetch(`${API_BASE_URL}/api/threads`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to create thread');
    return response.json();
}

export async function getThread(threadId: string): Promise<ThreadWithMessages> {
    const response = await fetch(`${API_BASE_URL}/api/threads/${threadId}`, {
        headers: getHeaders(),
    });
    if (!response.ok) throw new Error('Thread not found');
    return response.json();
}

export async function updateThread(threadId: string, data: ThreadUpdate): Promise<Thread> {
    const response = await fetch(`${API_BASE_URL}/api/threads/${threadId}`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to update thread');
    return response.json();
}

export async function deleteThread(threadId: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/api/threads/${threadId}`, {
        method: 'DELETE',
        headers: getHeaders(),
    });
    if (!response.ok) throw new Error('Failed to delete thread');
}

// ============ Chat API ============

export async function chatNonStreaming(request: ChatRequest): Promise<ChatResponse> {
    const response = await fetch(`${API_BASE_URL}/api/chat/`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(request),
    });
    if (!response.ok) throw new Error('Chat request failed');
    return response.json();
}

/**
 * Stream chat response via SSE.
 * Returns async generator for processing chunks.
 */
export async function* chatStream(
    request: ChatRequest,
    signal?: AbortSignal
): AsyncGenerator<StreamChunk> {
    const response = await fetch(`${API_BASE_URL}/api/chat/stream`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(request),
        signal,
    });

    if (!response.ok) {
        throw new Error(`Chat stream failed: ${response.statusText}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
        throw new Error('No response body');
    }

    const decoder = new TextDecoder();
    let buffer = '';

    try {
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || ''; // Keep incomplete line in buffer

            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    try {
                        const data = JSON.parse(line.slice(6)) as StreamChunk;
                        yield data;
                    } catch (e) {
                        console.error('Failed to parse SSE data:', e);
                    }
                }
            }
        }
    } finally {
        reader.releaseLock();
    }
}

// ============ Graph API ============

export async function getGraphData(datasetName: string): Promise<{
    nodes: unknown[];
    edges: unknown[];
    html?: string;
}> {
    const response = await fetch(`${API_BASE_URL}/api/graph/${datasetName}`, {
        headers: getHeaders(),
    });
    if (!response.ok) throw new Error('Failed to get graph data');
    return response.json();
}

export function getGraphHtmlUrl(datasetName: string): string {
    return `${API_BASE_URL}/api/graph/${datasetName}/html`;
}

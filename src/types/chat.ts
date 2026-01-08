/**
 * TypeScript types for chat functionality.
 * Matches backend Pydantic schemas for type safety.
 */

// ============ Enums ============

export type MessageRole = 'user' | 'assistant' | 'system';

export type ToolCallStatus = 'running' | 'complete' | 'requires-action' | 'incomplete';

// ============ Tool Call Types ============

export interface ToolCall {
    name: string;
    args: Record<string, unknown>;
    result?: Record<string, unknown>;
    status: ToolCallStatus;
}

export interface ExecutionStep {
    type: string;
    content: string;
    timestamp?: string;
}

export interface Source {
    type: 'text' | 'image' | 'graph';
    content: string;
    metadata: Record<string, unknown>;
    score?: number;
    name?: string;
    id?: string;
}

// ============ Message Types ============

export interface Message {
    id: string;
    thread_id: string;
    role: MessageRole;
    content: string;
    tool_calls: ToolCall[];
    sources: Source[];
    execution_steps: ExecutionStep[];
    created_at: string;
}

export interface MessageCreate {
    role: MessageRole;
    content: string;
    tool_calls?: ToolCall[];
    sources?: Source[];
    execution_steps?: ExecutionStep[];
}

// ============ Thread Types ============

export interface Thread {
    id: string;
    user_id: string;
    title: string;
    cognee_session_id?: string;
    metadata: Record<string, unknown>;
    created_at: string;
    updated_at: string;
    message_count: number;
}

export interface ThreadWithMessages extends Thread {
    messages: Message[];
}

export interface ThreadCreate {
    title?: string;
    metadata?: Record<string, unknown>;
}

export interface ThreadUpdate {
    title?: string;
    metadata?: Record<string, unknown>;
}

// ============ Chat Request/Response Types ============

export interface ChatMessage {
    role: MessageRole;
    content: string;
}

export interface ChatRequest {
    messages: ChatMessage[];
    thread_id?: string;
    document_ids?: string[];
}

export interface StreamChunk {
    type: 'text' | 'tool_call' | 'step' | 'sources' | 'complete' | 'error';
    content: string | Record<string, unknown>;
    name?: string;
    args?: Record<string, unknown>;
    result?: Record<string, unknown>;
    status?: ToolCallStatus;
}

// ============ API Response Types ============

export interface ThreadListResponse {
    threads: Thread[];
    total: number;
}

export interface ChatResponse {
    answer: string;
    sources: Source[];
    graph_context?: Record<string, unknown>;
}

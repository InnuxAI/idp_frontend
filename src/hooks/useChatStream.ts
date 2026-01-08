/**
 * Custom hook for chat streaming with the backend.
 * Handles SSE streaming, message state, and error handling.
 */
"use client";

import { useState, useCallback, useRef } from 'react';
import { ChatMessage, StreamChunk, Source, ExecutionStep, Message } from '@/types/chat';
import * as chatApi from '@/lib/chat-api';

interface UseChatStreamReturn {
    messages: Message[];
    isStreaming: boolean;
    error: Error | null;
    currentAnswer: string;
    sources: Source[];
    steps: ExecutionStep[];

    // Actions
    sendMessage: (content: string, threadId?: string, documentIds?: string[]) => Promise<void>;
    clearMessages: () => void;
    setMessages: (messages: Message[]) => void;
    cancelStream: () => void;
}

export function useChatStream(): UseChatStreamReturn {
    const [messages, setMessages] = useState<Message[]>([]);
    const [isStreaming, setIsStreaming] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const [currentAnswer, setCurrentAnswer] = useState('');
    const [sources, setSources] = useState<Source[]>([]);
    const [steps, setSteps] = useState<ExecutionStep[]>([]);

    const abortControllerRef = useRef<AbortController | null>(null);

    const sendMessage = useCallback(async (
        content: string,
        threadId?: string,
        documentIds?: string[]
    ): Promise<void> => {
        // Cancel any existing stream
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        // Create new abort controller
        abortControllerRef.current = new AbortController();

        // Reset streaming state
        setIsStreaming(true);
        setError(null);
        setCurrentAnswer('');
        setSources([]);
        setSteps([]);

        // Add user message to local state
        const userMessage: Message = {
            id: `temp-${Date.now()}`,
            thread_id: threadId || '',
            role: 'user',
            content,
            tool_calls: [],
            sources: [],
            execution_steps: [],
            created_at: new Date().toISOString(),
        };
        setMessages(prev => [...prev, userMessage]);

        try {
            // Build message history for context
            const chatMessages: ChatMessage[] = [
                ...messages.map(m => ({ role: m.role, content: m.content })),
                { role: 'user' as const, content }
            ];

            // Accumulate answer
            let fullAnswer = '';
            const allSources: Source[] = [];
            const allSteps: ExecutionStep[] = [];

            // Stream response
            for await (const chunk of chatApi.chatStream(
                { messages: chatMessages, thread_id: threadId, document_ids: documentIds },
                abortControllerRef.current.signal
            )) {
                switch (chunk.type) {
                    case 'text':
                        fullAnswer += chunk.content as string;
                        setCurrentAnswer(fullAnswer);
                        break;

                    case 'step':
                        const step: ExecutionStep = {
                            type: 'status',
                            content: chunk.content as string,
                            timestamp: new Date().toISOString(),
                        };
                        allSteps.push(step);
                        setSteps([...allSteps]);
                        break;

                    case 'tool_call':
                        // Handle tool calls (like cognee_search)
                        if (chunk.name === 'cognee_search' && chunk.result) {
                            const result = chunk.result as { sources?: Source[] };
                            if (result.sources) {
                                allSources.push(...result.sources);
                                setSources([...allSources]);
                            }
                        }
                        break;

                    case 'complete':
                        // Create assistant message
                        const assistantMessage: Message = {
                            id: `temp-${Date.now()}-assistant`,
                            thread_id: threadId || '',
                            role: 'assistant',
                            content: fullAnswer,
                            tool_calls: [],
                            sources: allSources,
                            execution_steps: allSteps,
                            created_at: new Date().toISOString(),
                        };
                        setMessages(prev => [...prev, assistantMessage]);
                        break;

                    case 'error':
                        throw new Error(chunk.content as string);
                }
            }
        } catch (e) {
            if (e instanceof Error && e.name === 'AbortError') {
                // Intentional cancellation, not an error
                return;
            }
            setError(e instanceof Error ? e : new Error('Stream failed'));
        } finally {
            setIsStreaming(false);
            abortControllerRef.current = null;
        }
    }, [messages]);

    const clearMessages = useCallback(() => {
        setMessages([]);
        setCurrentAnswer('');
        setSources([]);
        setSteps([]);
        setError(null);
    }, []);

    const cancelStream = useCallback(() => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
        }
        setIsStreaming(false);
    }, []);

    return {
        messages,
        isStreaming,
        error,
        currentAnswer,
        sources,
        steps,
        sendMessage,
        clearMessages,
        setMessages,
        cancelStream,
    };
}

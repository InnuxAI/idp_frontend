/**
 * Custom hook for thread management.
 * Handles list, create, select, delete operations.
 */
"use client";

import { useState, useEffect, useCallback } from 'react';
import { Thread, ThreadWithMessages } from '@/types/chat';
import * as chatApi from '@/lib/chat-api';

interface UseThreadsReturn {
    threads: Thread[];
    currentThread: ThreadWithMessages | null;
    isLoading: boolean;
    error: Error | null;

    // Actions
    loadThreads: () => Promise<void>;
    createThread: (title?: string) => Promise<Thread>;
    selectThread: (threadId: string) => Promise<void>;
    deleteThread: (threadId: string) => Promise<void>;
    updateTitle: (threadId: string, title: string) => Promise<void>;
    clearCurrentThread: () => void;
}

export function useThreads(): UseThreadsReturn {
    const [threads, setThreads] = useState<Thread[]>([]);
    const [currentThread, setCurrentThread] = useState<ThreadWithMessages | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const loadThreads = useCallback(async () => {
        try {
            setIsLoading(true);
            setError(null);
            const data = await chatApi.listThreads();
            setThreads(data);
        } catch (e) {
            setError(e instanceof Error ? e : new Error('Failed to load threads'));
        } finally {
            setIsLoading(false);
        }
    }, []);

    const createThread = useCallback(async (title?: string): Promise<Thread> => {
        try {
            const thread = await chatApi.createThread({ title });
            setThreads(prev => [thread, ...prev]);
            return thread;
        } catch (e) {
            throw e instanceof Error ? e : new Error('Failed to create thread');
        }
    }, []);

    const selectThread = useCallback(async (threadId: string): Promise<void> => {
        try {
            setIsLoading(true);
            const thread = await chatApi.getThread(threadId);
            setCurrentThread(thread);
        } catch (e) {
            setError(e instanceof Error ? e : new Error('Failed to load thread'));
        } finally {
            setIsLoading(false);
        }
    }, []);

    const deleteThread = useCallback(async (threadId: string): Promise<void> => {
        try {
            await chatApi.deleteThread(threadId);
            setThreads(prev => prev.filter(t => t.id !== threadId));
            if (currentThread?.id === threadId) {
                setCurrentThread(null);
            }
        } catch (e) {
            throw e instanceof Error ? e : new Error('Failed to delete thread');
        }
    }, [currentThread]);

    const updateTitle = useCallback(async (threadId: string, title: string): Promise<void> => {
        try {
            const updated = await chatApi.updateThread(threadId, { title });
            setThreads(prev => prev.map(t => t.id === threadId ? updated : t));
            if (currentThread?.id === threadId) {
                setCurrentThread(prev => prev ? { ...prev, title } : null);
            }
        } catch (e) {
            throw e instanceof Error ? e : new Error('Failed to update thread');
        }
    }, [currentThread]);

    const clearCurrentThread = useCallback(() => {
        setCurrentThread(null);
    }, []);

    // Load threads on mount
    useEffect(() => {
        loadThreads();
    }, [loadThreads]);

    return {
        threads,
        currentThread,
        isLoading,
        error,
        loadThreads,
        createThread,
        selectThread,
        deleteThread,
        updateTitle,
        clearCurrentThread,
    };
}

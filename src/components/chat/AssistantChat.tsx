/**
 * Main AssistantChat Component.
 * Integrates ThreadList, chat messages, and Tool UIs.
 * This is the main wrapper component for the new chat interface.
 */
"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, Loader2, PanelLeftClose, PanelLeftOpen, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useThreads } from '@/hooks/useThreads';
import { useChatStream } from '@/hooks/useChatStream';
import { ThreadList } from './ThreadList';
import { SourcesToolUI, StepsToolUI, GraphToolUI, ToolCallsToolUI } from './tool-uis';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface AssistantChatProps {
    /** Optional document IDs for context filtering */
    documentIds?: string[];
    /** Optional callback when thread changes */
    onThreadChange?: (threadId: string | null) => void;
    /** Show/hide sidebar */
    showSidebar?: boolean;
}

export function AssistantChat({
    documentIds = [],
    onThreadChange,
    showSidebar: initialShowSidebar = true
}: AssistantChatProps) {
    const [showSidebar, setShowSidebar] = useState(initialShowSidebar);
    const [input, setInput] = useState('');
    const scrollRef = useRef<HTMLDivElement>(null);

    // Thread management
    const {
        threads,
        currentThread,
        isLoading: threadsLoading,
        createThread,
        selectThread,
        deleteThread,
        updateTitle,
        clearCurrentThread,
    } = useThreads();

    // Chat streaming
    const {
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
    } = useChatStream();

    // Load messages when thread changes
    useEffect(() => {
        if (currentThread) {
            setMessages(currentThread.messages);
            onThreadChange?.(currentThread.id);
        } else {
            clearMessages();
            onThreadChange?.(null);
        }
    }, [currentThread, setMessages, clearMessages, onThreadChange]);

    // Auto-scroll on new content
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, currentAnswer, steps]);

    // Handle send message
    const handleSend = useCallback(async () => {
        if (!input.trim() || isStreaming) return;

        const messageContent = input.trim();
        setInput('');

        // Create thread if none selected
        let threadId = currentThread?.id;
        if (!threadId) {
            const newThread = await createThread(
                messageContent.slice(0, 50) + (messageContent.length > 50 ? '...' : '')
            );
            threadId = newThread.id;
            await selectThread(newThread.id);
        }

        await sendMessage(messageContent, threadId, documentIds);
    }, [input, isStreaming, currentThread, createThread, selectThread, sendMessage, documentIds]);

    // Handle keyboard submit
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    // Handle new chat
    const handleNewChat = useCallback(async () => {
        clearCurrentThread();
        clearMessages();
    }, [clearCurrentThread, clearMessages]);

    return (
        <div className="flex h-full bg-background">
            {/* Sidebar Toggle for Mobile */}
            <Button
                variant="ghost"
                size="icon"
                className="absolute top-4 left-4 z-50 md:hidden"
                onClick={() => setShowSidebar(!showSidebar)}
            >
                {showSidebar ? <PanelLeftClose className="h-5 w-5" /> : <PanelLeftOpen className="h-5 w-5" />}
            </Button>

            {/* Thread List Sidebar */}
            <AnimatePresence>
                {showSidebar && (
                    <motion.div
                        initial={{ width: 0, opacity: 0 }}
                        animate={{ width: 280, opacity: 1 }}
                        exit={{ width: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="border-r h-full overflow-hidden flex-shrink-0"
                    >
                        <ThreadList
                            threads={threads}
                            currentThreadId={currentThread?.id}
                            isLoading={threadsLoading}
                            onSelectThread={selectThread}
                            onCreateThread={handleNewChat}
                            onDeleteThread={deleteThread}
                            onEditTitle={(id, title) => {
                                const newTitle = prompt('Enter new title:', title);
                                if (newTitle) updateTitle(id, newTitle);
                            }}
                        />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b">
                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setShowSidebar(!showSidebar)}
                            className="hidden md:flex"
                        >
                            {showSidebar ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeftOpen className="h-4 w-4" />}
                        </Button>
                        <h2 className="font-semibold truncate">
                            {currentThread?.title || 'New Chat'}
                        </h2>
                    </div>
                    {isStreaming && (
                        <Button variant="ghost" size="sm" onClick={cancelStream}>
                            Cancel
                        </Button>
                    )}
                </div>

                {/* Messages Area */}
                <ScrollArea ref={scrollRef} className="flex-1 p-4">
                    <div className="max-w-3xl mx-auto space-y-6">
                        {/* Welcome State */}
                        {messages.length === 0 && !isStreaming && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-center py-20"
                            >
                                <h3 className="text-2xl font-semibold mb-2">How can I help you?</h3>
                                <p className="text-muted-foreground">
                                    Ask questions about your documents using AI-powered search.
                                </p>
                            </motion.div>
                        )}

                        {/* Messages */}
                        {messages.map((message, index) => (
                            <motion.div
                                key={message.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                <div
                                    className={`max-w-[85%] rounded-lg p-4 ${message.role === 'user'
                                        ? 'bg-primary text-primary-foreground'
                                        : 'bg-muted'
                                        }`}
                                >
                                    {/* Message Content */}
                                    <div className="prose prose-sm dark:prose-invert max-w-none">
                                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                            {message.content}
                                        </ReactMarkdown>
                                    </div>

                                    {/* Tool Calls (for assistant messages) */}
                                    {message.role === 'assistant' && message.tool_calls && message.tool_calls.length > 0 && (
                                        <div className="mt-4">
                                            <ToolCallsToolUI toolCalls={message.tool_calls} />
                                        </div>
                                    )}

                                    {/* Sources (for assistant messages) */}
                                    {message.role === 'assistant' && message.sources.length > 0 && (
                                        <>
                                            <div className="mt-4">
                                                <SourcesToolUI sources={message.sources} />
                                            </div>
                                            {/* Graph Visualization */}
                                            {message.sources[0]?.name && (
                                                <div className="mt-4">
                                                    <GraphToolUI datasetName={message.sources[0].name} />
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            </motion.div>
                        ))}

                        {/* Streaming Response */}
                        {isStreaming && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="flex justify-start"
                            >
                                <div className="max-w-[85%] rounded-lg p-4 bg-muted space-y-4">
                                    {/* Execution Steps */}
                                    {steps.length > 0 && (
                                        <StepsToolUI steps={steps} isStreaming={true} />
                                    )}

                                    {/* Sources */}
                                    {sources.length > 0 && (
                                        <>
                                            <SourcesToolUI sources={sources} />
                                            {/* Graph Visualization */}
                                            {sources[0]?.name && (
                                                <GraphToolUI datasetName={sources[0].name} />
                                            )}
                                        </>
                                    )}

                                    {/* Streaming Text */}
                                    {currentAnswer && (
                                        <div className="prose prose-sm dark:prose-invert max-w-none">
                                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                {currentAnswer}
                                            </ReactMarkdown>
                                        </div>
                                    )}

                                    {/* Typing Indicator */}
                                    {!currentAnswer && (
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            <span className="text-sm">Thinking...</span>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}

                        {/* Error Display */}
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="bg-destructive/10 border border-destructive/20 text-destructive rounded-lg p-4"
                            >
                                <p className="text-sm font-medium">Error</p>
                                <p className="text-xs">{error.message}</p>
                            </motion.div>
                        )}
                    </div>
                </ScrollArea>

                {/* Input Area */}
                <div className="border-t p-4">
                    <div className="max-w-3xl mx-auto">
                        <div className="relative flex items-end gap-2">
                            <Textarea
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Ask a question..."
                                className="min-h-[60px] max-h-[200px] resize-none pr-12"
                                disabled={isStreaming}
                            />
                            <Button
                                onClick={handleSend}
                                disabled={!input.trim() || isStreaming}
                                size="icon"
                                className="absolute right-2 bottom-2"
                            >
                                {isStreaming ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Send className="h-4 w-4" />
                                )}
                            </Button>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2 text-center">
                            Press Enter to send, Shift+Enter for new line
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

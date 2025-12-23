"use client"

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
    MessageCircle,
    Plus,
    Files,
    X,
    PanelRightClose,
    PanelRightOpen,
    Loader
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DocumentsDialog } from '@/components/documents-dialog';
import { PromptInputBox } from '@/components/ui/ai-prompt-box';
import { apiService, Document, StreamEvent } from '@/services/api';
import { ChatMessage } from './chat/chat-message';
import { SourcePanel } from './chat/source-panel';
import { Message } from './chat/types';
import { cn } from '@/lib/utils';
import { v4 as uuidv4 } from 'uuid';

// Context Toolbar Component
interface ContextToolbarProps {
    selectedDocuments: Document[];
    onRemoveDocument?: (docId: string) => void;
    onAddDocuments: () => void;
}

const ContextToolbar: React.FC<ContextToolbarProps> = ({
    selectedDocuments,
    onRemoveDocument,
    onAddDocuments,
}) => {
    if (selectedDocuments.length === 0) return null;

    return (
        <div className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b p-2 flex items-center gap-4 z-10 sticky top-0">
            <div className="flex items-center gap-2 text-sm text-muted-foreground pl-2">
                <Files className="h-4 w-4" />
                <span className="font-medium text-xs">Active Context</span>
                <Badge variant="secondary" className="h-5 text-[10px] px-1.5">
                    {selectedDocuments.length}
                </Badge>
            </div>
            <div className="h-4 w-px bg-border" />
            <div className="flex-1 overflow-x-auto no-scrollbar flex items-center gap-2">
                {selectedDocuments.map((doc, index) => (
                    <Badge
                        key={doc.doc_id || doc.filename || index}
                        variant="outline"
                        className="h-6 gap-1 pr-1 font-normal bg-muted/50 whitespace-nowrap"
                    >
                        <span className="truncate max-w-[150px]">{doc.filename}</span>
                        <Button
                            onClick={() => onRemoveDocument?.(doc.doc_id || doc.filename)}
                            variant="ghost"
                            size="icon"
                            className="h-4 w-4 hover:bg-destructive/10 hover:text-destructive rounded-full"
                        >
                            <X className="h-3 w-3" />
                        </Button>
                    </Badge>
                ))}
            </div>
            <Button
                onClick={onAddDocuments}
                variant="ghost"
                size="sm"
                className="h-7 text-xs ml-auto"
            >
                <Plus className="h-3 w-3 mr-1" />
                Add
            </Button>
        </div>
    );
};

interface ChatInteractiveProps {
    selectedDocuments?: Document[];
    onRemoveDocument?: (docId: string) => void;
    onDocumentToggle?: (document: Document) => void;
}

export function ChatInteractive({
    selectedDocuments: initialSelectedDocuments = [],
    onRemoveDocument,
    onDocumentToggle
}: ChatInteractiveProps) {
    // State
    const [internalSelectedDocuments, setInternalSelectedDocuments] = useState<Document[]>(initialSelectedDocuments);
    const [messages, setMessages] = useState<Message[]>([]);
    const [isQuerying, setIsQuerying] = useState(false);
    const [documentsDialogOpen, setDocumentsDialogOpen] = useState(false);
    const [showSidebar, setShowSidebar] = useState(true);
    const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);

    // Keep track of the AbortController for the current stream
    const abortControllerRef = useRef<AbortController | null>(null);
    const scrollAreaRef = useRef<HTMLDivElement>(null);

    // Sync internal state with props
    React.useEffect(() => {
        setInternalSelectedDocuments(initialSelectedDocuments);
    }, [initialSelectedDocuments]);

    // Derived
    const selectedDocuments = internalSelectedDocuments;
    const selectedMessage = messages.find(m => m.id === selectedMessageId) || messages[messages.length - 1];

    // Helper to scroll to bottom
    const scrollToBottom = () => {
        if (scrollAreaRef.current) {
            const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
            if (scrollContainer) {
                scrollContainer.scrollTop = scrollContainer.scrollHeight;
            }
        }
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages.length, messages[messages.length - 1]?.content]);

    // Handlers
    const handleRemoveDocument = (docId: string) => {
        if (onRemoveDocument) {
            onRemoveDocument(docId);
        } else {
            setInternalSelectedDocuments(prev => prev.filter(doc => (doc.doc_id || doc.filename) !== docId));
        }
    };

    const handleSendMessage = async (text: string, files?: File[], useStreaming: boolean = true) => {
        if (!text.trim()) return;

        // 1. Add User Message
        const userMessage: Message = {
            id: uuidv4(),
            role: 'user',
            content: text,
            timestamp: new Date(),
        };

        // 2. Add Placeholder Assistant Message
        const botMessageId = uuidv4();
        const botMessage: Message = {
            id: botMessageId,
            role: 'assistant',
            content: '',
            timestamp: new Date(),
            isStreaming: true,
            sources: [],
            imageSources: [],
            steps: []
        };

        setMessages(prev => [...prev, userMessage, botMessage]);
        setSelectedMessageId(botMessageId); // Auto-select the new message
        setIsQuerying(true);

        try {
            // Prepare Context
            let contextualQuery = text;
            if (selectedDocuments.length > 0) {
                const contextInfo = selectedDocuments.map(doc => `[${doc.filename}:${doc.doc_id || doc.filename}]`).join(' ');
                contextualQuery = `${text} Context documents: ${contextInfo}`;
            }
            const filename = selectedDocuments.length > 0 ? selectedDocuments.map(doc => doc.filename).join(', ') : null;

            // Start Stream
            await apiService.queryDocumentsStream(
                contextualQuery,
                filename,
                3,
                async (event: StreamEvent) => {
                    setMessages(prev => prev.map(msg => {
                        if (msg.id !== botMessageId) return msg;

                        // Clone message to avoid mutation
                        const updated = { ...msg };

                        if (event.type === 'response') {
                            updated.content = event.content;
                        } else if (event.type === 'sources') {
                            // Handle sources parsing
                            try {
                                const parsed = typeof event.content === 'string' ? JSON.parse(event.content) : event.content;
                                updated.sources = parsed.text_sources || [];
                                updated.imageSources = parsed.image_sources || [];
                            } catch (e) {
                                console.error("Error parsing sources", e);
                            }
                        } else if (event.type === 'sources_file') {
                            try {
                                const fileData = typeof event.content === 'string' ? JSON.parse(event.content) : event.content;
                                fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}${fileData.url}`)
                                    .then(res => res.json())
                                    .then(data => {
                                        setMessages(currentMessages => currentMessages.map(m => {
                                            if (m.id !== botMessageId) return m;
                                            return {
                                                ...m,
                                                sources: data.text_sources || [],
                                                imageSources: data.image_sources || []
                                            };
                                        }));
                                    });
                            } catch (e) { console.error(e); }
                        } else if (event.type !== 'response') {
                            // Add to steps
                            updated.steps = [...(updated.steps || []), event];
                        }

                        if (event.type === 'complete') {
                            updated.isStreaming = false;
                        }

                        return updated;
                    }));
                }
            );

        } catch (error) {
            console.error("Query Error", error);
            setMessages(prev => prev.map(msg => {
                if (msg.id !== botMessageId) return msg;
                return { ...msg, content: "Sorry, an error occurred while processing your request.", isStreaming: false };
            }));
        } finally {
            setIsQuerying(false);
            setMessages(prev => prev.map(msg => {
                if (msg.id !== botMessageId) return msg;
                return { ...msg, isStreaming: false };
            }));
        }
    };

    // Source Click Handler (Placeholder for now)
    const handleSourceClick = (source: any) => {
        // Open dialog or preview
        console.log("Source clicked", source);
        // Ideally we reuse a dialog here
    };

    // --- RENDER ---

    // Initial Empty State
    if (messages.length === 0 && !isQuerying) {
        return (
            <div className="h-full flex flex-col items-center justify-center p-6 bg-background">
                <div className="w-full max-w-2xl text-center space-y-8">
                    <div className="inline-flex items-center justify-center p-6 rounded-3xl bg-primary/5 text-primary ring-1 ring-primary/10">
                        <MessageCircle className="h-10 w-10" />
                    </div>
                    <div className="space-y-2">
                        <h1 className="text-3xl font-semibold tracking-tight">Enterprise Chat</h1>
                        <p className="text-muted-foreground text-lg">
                            Select documents and start a conversation.
                        </p>
                    </div>

                    <div className="bg-card border shadow-lg rounded-xl p-1 overflow-hidden">
                        <PromptInputBox
                            onSend={handleSendMessage}
                            placeholder="Start typing your query..."
                            isLoading={false}
                        />
                    </div>

                    <div className="flex justify-center flex-wrap gap-2">
                        <Button variant="outline" onClick={() => setDocumentsDialogOpen(true)}>
                            <Plus className="h-4 w-4 mr-2" />
                            Add Context
                        </Button>
                        {selectedDocuments.length > 0 && (
                            <div className="w-full pt-4">
                                <p className="text-xs text-muted-foreground mb-2">Active Context:</p>
                                <div className="flex flex-wrap justify-center gap-2">
                                    {selectedDocuments.map((doc, i) => (
                                        <Badge key={i} variant="secondary" className="font-normal border">
                                            {doc.filename}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Dialogs */}
                <DocumentsDialog
                    open={documentsDialogOpen}
                    onOpenChange={setDocumentsDialogOpen}
                    selectedDocuments={internalSelectedDocuments}
                    onDocumentToggle={(doc) => {
                        if (internalSelectedDocuments.find(d => d.doc_id === doc.doc_id)) {
                            setInternalSelectedDocuments(prev => prev.filter(d => d.doc_id !== doc.doc_id));
                        } else {
                            setInternalSelectedDocuments(prev => [...prev, doc]);
                        }
                    }}
                />
            </div>
        );
    }

    return (
        <div className="absolute inset-0 flex flex-col bg-background overflow-hidden">
            {/* Header */}
            <header className="h-14 flex-none border-b flex items-center justify-between px-4 bg-background z-20">
                <div className="flex items-center gap-3">
                    <div className="h-8 w-8 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
                        <MessageCircle className="h-4 w-4" />
                    </div>
                    <div>
                        <h2 className="text-sm font-semibold">Chat Session</h2>
                        <p className="text-[10px] text-muted-foreground">{messages.length} messages</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setShowSidebar(!showSidebar)}
                        title="Toggle Details"
                    >
                        {showSidebar ? <PanelRightClose className="h-4 w-4" /> : <PanelRightOpen className="h-4 w-4" />}
                    </Button>
                </div>
            </header>

            <div className="flex-1 flex min-h-0">
                {/* Main Content */}
                <div className="flex-1 flex flex-col min-w-0">
                    {/* Context Bar */}
                    <ContextToolbar
                        selectedDocuments={selectedDocuments}
                        onRemoveDocument={handleRemoveDocument}
                        onAddDocuments={() => setDocumentsDialogOpen(true)}
                    />

                    {/* Messages Scroll Area */}
                    <div className="flex-1 overflow-hidden relative" ref={scrollAreaRef}>
                        <ScrollArea className="h-full w-full">
                            <div className="flex flex-col py-6">
                                {messages.map((msg, index) => (
                                    <div
                                        key={msg.id}
                                        onClick={() => setSelectedMessageId(msg.id)}
                                        className={cn(
                                            "cursor-pointer transition-colors",
                                            selectedMessageId === msg.id ? "bg-muted/20" : ""
                                        )}
                                    >
                                        <ChatMessage
                                            message={msg}
                                            isLast={index === messages.length - 1}
                                        />
                                    </div>
                                ))}
                                {/* Invisible spacer for scrolling */}
                                <div className="h-4" />
                            </div>
                        </ScrollArea>
                    </div>

                    {/* Input Area */}
                    <div className="flex-none p-4 border-t bg-background">
                        <div className="max-w-3xl mx-auto">
                            <PromptInputBox
                                onSend={handleSendMessage}
                                placeholder="Message..."
                                isLoading={isQuerying}
                                autoFocus
                            />
                            <p className="text-[10px] text-center text-muted-foreground mt-2">
                                AI can make mistakes. Please verify important information.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Right Sidebar (Details) */}
                <AnimatePresence>
                    {showSidebar && (
                        <motion.div
                            initial={{ width: 0, opacity: 0 }}
                            animate={{ width: 320, opacity: 1 }}
                            exit={{ width: 0, opacity: 0 }}
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            className="flex-none border-l bg-muted/5 overflow-hidden"
                        >
                            <div className="w-[320px] h-full">
                                <SourcePanel
                                    message={selectedMessage}
                                    isLoading={isQuerying && selectedMessage?.id === messages[messages.length - 1]?.id}
                                    onSourceClick={handleSourceClick}
                                />
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Selection Dialog */}
            <DocumentsDialog
                open={documentsDialogOpen}
                onOpenChange={setDocumentsDialogOpen}
                selectedDocuments={internalSelectedDocuments}
                onDocumentToggle={(doc) => {
                    if (internalSelectedDocuments.find(d => d.doc_id === doc.doc_id)) {
                        setInternalSelectedDocuments(prev => prev.filter(d => d.doc_id !== doc.doc_id));
                    } else {
                        setInternalSelectedDocuments(prev => [...prev, doc]);
                    }
                }}
            />
        </div>
    );
}

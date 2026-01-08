/**
 * Thread List Component for chat history sidebar.
 * Displays list of threads with create, select, delete actions.
 */
"use client";

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, MessageSquare, Trash2, Edit2, MoreVertical, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Thread } from '@/types/chat';
import { formatDistanceToNow } from 'date-fns';

interface ThreadListProps {
    threads: Thread[];
    currentThreadId?: string;
    isLoading?: boolean;
    onSelectThread: (threadId: string) => void;
    onCreateThread: () => void;
    onDeleteThread: (threadId: string) => void;
    onEditTitle?: (threadId: string, currentTitle: string) => void;
}

export function ThreadList({
    threads,
    currentThreadId,
    isLoading = false,
    onSelectThread,
    onCreateThread,
    onDeleteThread,
    onEditTitle,
}: ThreadListProps) {
    return (
        <div className="flex flex-col h-full">
            {/* Header with New Chat button */}
            <div className="p-4 border-b">
                <Button
                    onClick={onCreateThread}
                    className="w-full justify-start gap-2"
                    variant="outline"
                >
                    <Plus className="h-4 w-4" />
                    New Chat
                </Button>
            </div>

            {/* Thread List */}
            <ScrollArea className="flex-1">
                <div className="p-2 space-y-1">
                    <AnimatePresence mode="popLayout">
                        {threads.map((thread, index) => {
                            const isActive = thread.id === currentThreadId;

                            return (
                                <motion.div
                                    key={thread.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    transition={{ delay: index * 0.02 }}
                                    className={`
                    group relative flex items-center gap-2 p-3 rounded-lg cursor-pointer
                    transition-colors
                    ${isActive
                                            ? 'bg-primary/10 border border-primary/20'
                                            : 'hover:bg-muted/50'
                                        }
                  `}
                                    onClick={() => onSelectThread(thread.id)}
                                >
                                    {/* Thread Icon */}
                                    <MessageSquare
                                        className={`h-4 w-4 flex-shrink-0 ${isActive ? 'text-primary' : 'text-muted-foreground'
                                            }`}
                                    />

                                    {/* Thread Info */}
                                    <div className="flex-1 min-w-0">
                                        <p className={`text-sm font-medium truncate ${isActive ? 'text-primary' : ''
                                            }`}>
                                            {thread.title || 'New Chat'}
                                        </p>
                                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                            <Clock className="h-3 w-3" />
                                            <span>
                                                {formatDistanceToNow(new Date(thread.updated_at), { addSuffix: true })}
                                            </span>
                                            {thread.message_count > 0 && (
                                                <span>• {thread.message_count} messages</span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Actions Menu */}
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <MoreVertical className="h-3 w-3" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            {onEditTitle && (
                                                <DropdownMenuItem
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onEditTitle(thread.id, thread.title);
                                                    }}
                                                >
                                                    <Edit2 className="h-3 w-3 mr-2" />
                                                    Rename
                                                </DropdownMenuItem>
                                            )}
                                            <DropdownMenuItem
                                                className="text-destructive focus:text-destructive"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onDeleteThread(thread.id);
                                                }}
                                            >
                                                <Trash2 className="h-3 w-3 mr-2" />
                                                Delete
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>

                    {/* Empty State */}
                    {threads.length === 0 && !isLoading && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-center py-8 text-muted-foreground"
                        >
                            <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">No conversations yet</p>
                            <p className="text-xs">Start a new chat to begin</p>
                        </motion.div>
                    )}

                    {/* Loading State */}
                    {isLoading && (
                        <div className="space-y-2 p-2">
                            {[1, 2, 3].map((i) => (
                                <div
                                    key={i}
                                    className="h-16 rounded-lg bg-muted animate-pulse"
                                />
                            ))}
                        </div>
                    )}
                </div>
            </ScrollArea>
        </div>
    );
}

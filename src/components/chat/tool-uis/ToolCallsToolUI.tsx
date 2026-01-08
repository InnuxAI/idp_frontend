/**
 * Tool Calls UI Component.
 * Displays function/tool calls made by the LLM assistant.
 */
"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, ChevronRight, Wrench, CheckCircle2, Loader2, AlertCircle, Code } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ToolCall } from '@/types/chat';

interface ToolCallsToolUIProps {
    toolCalls: ToolCall[];
    isStreaming?: boolean;
}

export function ToolCallsToolUI({ toolCalls, isStreaming = false }: ToolCallsToolUIProps) {
    const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

    if (!toolCalls || toolCalls.length === 0) {
        return null;
    }

    const getStatusIcon = (status: string, isLast: boolean) => {
        const isRunning = isLast && isStreaming && status === 'running';

        if (status === 'running' || isRunning) {
            return <Loader2 className="h-3 w-3 animate-spin text-blue-500" />;
        }
        if (status === 'complete') {
            return <CheckCircle2 className="h-3 w-3 text-green-500" />;
        }
        if (status === 'incomplete' || status === 'requires-action') {
            return <AlertCircle className="h-3 w-3 text-yellow-500" />;
        }
        return <Wrench className="h-3 w-3 text-muted-foreground" />;
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'running':
                return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
            case 'complete':
                return 'bg-green-500/10 text-green-500 border-green-500/20';
            case 'incomplete':
            case 'requires-action':
                return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
            default:
                return 'bg-muted text-muted-foreground';
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-lg border bg-card overflow-hidden"
        >
            {/* Header */}
            <div className="flex items-center gap-2 p-3 border-b bg-muted/30">
                <Wrench className="h-4 w-4 text-primary" />
                <span className="font-medium text-sm">Tool Calls</span>
                <Badge variant="secondary" className="text-xs">
                    {toolCalls.length}
                </Badge>
            </div>

            {/* Tool Calls List */}
            <div className="divide-y">
                {toolCalls.map((tool, index) => {
                    const isExpanded = expandedIndex === index;
                    const isLast = index === toolCalls.length - 1;

                    return (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: index * 0.05 }}
                            className="p-3"
                        >
                            {/* Tool Header */}
                            <button
                                onClick={() => setExpandedIndex(isExpanded ? null : index)}
                                className="w-full flex items-center justify-between text-left hover:bg-muted/20 rounded p-1 -m-1"
                            >
                                <div className="flex items-center gap-2">
                                    {getStatusIcon(tool.status, isLast)}
                                    <code className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded">
                                        {tool.name}
                                    </code>
                                    <Badge
                                        variant="outline"
                                        className={`text-xs ${getStatusColor(tool.status)}`}
                                    >
                                        {tool.status}
                                    </Badge>
                                </div>
                                {isExpanded ? (
                                    <ChevronDown className="h-3 w-3 text-muted-foreground" />
                                ) : (
                                    <ChevronRight className="h-3 w-3 text-muted-foreground" />
                                )}
                            </button>

                            {/* Expanded Content */}
                            <AnimatePresence>
                                {isExpanded && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.2 }}
                                        className="overflow-hidden"
                                    >
                                        <div className="mt-3 space-y-3">
                                            {/* Arguments */}
                                            {tool.args && Object.keys(tool.args).length > 0 && (
                                                <div>
                                                    <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                                                        <Code className="h-3 w-3" />
                                                        Arguments
                                                    </div>
                                                    <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
                                                        {JSON.stringify(tool.args, null, 2)}
                                                    </pre>
                                                </div>
                                            )}

                                            {/* Result */}
                                            {tool.result && (
                                                <div>
                                                    <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                                                        <CheckCircle2 className="h-3 w-3" />
                                                        Result
                                                    </div>
                                                    <pre className="text-xs bg-muted p-2 rounded overflow-x-auto max-h-40">
                                                        {JSON.stringify(tool.result, null, 2)}
                                                    </pre>
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    );
                })}
            </div>
        </motion.div>
    );
}

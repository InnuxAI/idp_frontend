/**
 * Sources Tool UI Component.
 * Displays search sources/evidence used to generate answer.
 * Designed as standalone component (assistant-ui pattern without library dependency).
 */
"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, ChevronRight, FileText, Image, Loader2, ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Source } from '@/types/chat';

interface SourcesToolUIProps {
    sources: Source[];
    isLoading?: boolean;
    query?: string;
}

export function SourcesToolUI({ sources, isLoading = false, query }: SourcesToolUIProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [expandedSource, setExpandedSource] = useState<number | null>(null);

    if (isLoading) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg border"
            >
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                <span className="text-sm text-muted-foreground">
                    Searching{query ? ` for "${query}"` : ''}...
                </span>
            </motion.div>
        );
    }

    if (!sources || sources.length === 0) {
        return null;
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-lg border bg-card overflow-hidden"
        >
            {/* Header - Collapsible Toggle */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full flex items-center justify-between p-3 hover:bg-muted/50 transition-colors"
            >
                <div className="flex items-center gap-2">
                    {isExpanded ? (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    ) : (
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    )}
                    <FileText className="h-4 w-4 text-primary" />
                    <span className="font-medium text-sm">Sources</span>
                    <Badge variant="secondary" className="text-xs">
                        {sources.length}
                    </Badge>
                </div>
            </button>

            {/* Expanded Content */}
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="border-t"
                    >
                        <div className="p-3 space-y-2 max-h-64 overflow-y-auto">
                            {sources.map((source, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    className="rounded-lg border p-3 hover:bg-muted/30 transition-colors cursor-pointer"
                                    onClick={() => setExpandedSource(expandedSource === index ? null : index)}
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            {source.type === 'image' ? (
                                                <Image className="h-3 w-3 text-blue-500" />
                                            ) : (
                                                <FileText className="h-3 w-3 text-green-500" />
                                            )}
                                            <Badge variant="outline" className="text-xs">
                                                Source {index + 1}
                                            </Badge>
                                            {source.score && (
                                                <Badge variant="secondary" className="text-xs">
                                                    {Math.round(source.score * 100)}% match
                                                </Badge>
                                            )}
                                        </div>
                                        {typeof source.metadata?.filename === 'string' && (
                                            <span className="text-xs text-muted-foreground truncate max-w-32">
                                                {source.metadata.filename}
                                            </span>
                                        )}
                                    </div>

                                    {/* Content Preview */}
                                    <p className="text-xs text-muted-foreground line-clamp-2">
                                        {source.content.slice(0, 150)}
                                        {source.content.length > 150 ? '...' : ''}
                                    </p>

                                    {/* Expanded Full Content */}
                                    <AnimatePresence>
                                        {expandedSource === index && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                className="mt-3 pt-3 border-t"
                                            >
                                                <p className="text-xs whitespace-pre-wrap">
                                                    {source.content}
                                                </p>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

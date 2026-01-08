/**
 * Graph Visualization Tool UI Component.
 * Displays knowledge graph from Cognee.
 */
"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Network, Maximize2, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getGraphData } from '@/lib/chat-api';

interface GraphToolUIProps {
    datasetName?: string;
    isLoading?: boolean;
}

export function GraphToolUI({ datasetName, isLoading = false }: GraphToolUIProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [showFullscreen, setShowFullscreen] = useState(false);
    const [htmlContent, setHtmlContent] = useState<string>('');
    const [isGraphLoading, setIsGraphLoading] = useState(false);

    React.useEffect(() => {
        const fetchGraph = async () => {
            if (!datasetName) return;
            try {
                setIsGraphLoading(true);
                const data = await getGraphData(datasetName);
                if (data.html) {
                    setHtmlContent(data.html);
                }
            } catch (e) {
                console.error("Failed to load graph", e);
            } finally {
                setIsGraphLoading(false);
            }
        };
        fetchGraph();
    }, [datasetName]);

    if (!datasetName && !isLoading) {
        return null;
    }

    if (isLoading || isGraphLoading) {
        return (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg border"
            >
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm text-muted-foreground">Loading knowledge graph...</span>
            </motion.div>
        );
    }

    return (
        <>
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-lg border bg-card overflow-hidden"
            >
                {/* Header */}
                <div className="flex items-center justify-between p-3 border-b bg-muted/30">
                    <div className="flex items-center gap-2">
                        <Network className="h-4 w-4 text-primary" />
                        <span className="font-medium text-sm">Knowledge Graph</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setIsExpanded(!isExpanded)}
                            className="h-7 px-2"
                        >
                            {isExpanded ? 'Collapse' : 'Expand'}
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowFullscreen(true)}
                            className="h-7 px-2"
                        >
                            <Maximize2 className="h-3 w-3" />
                        </Button>
                    </div>
                </div>

                {/* Graph Preview */}
                <AnimatePresence>
                    {isExpanded && (
                        <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: 300 }}
                            exit={{ height: 0 }}
                            transition={{ duration: 0.3 }}
                            className="overflow-hidden"
                        >
                            <iframe
                                srcDoc={htmlContent}
                                className="w-full h-full border-0"
                                title="Knowledge Graph"
                                sandbox="allow-scripts allow-same-origin"
                            />
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Collapsed Preview */}
                {!isExpanded && (
                    <div
                        className="p-4 text-center text-sm text-muted-foreground cursor-pointer hover:bg-muted/20"
                        onClick={() => setIsExpanded(true)}
                    >
                        Click to view knowledge graph visualization
                    </div>
                )}
            </motion.div>

            {/* Fullscreen Modal */}
            <AnimatePresence>
                {showFullscreen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
                        onClick={() => setShowFullscreen(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0.9 }}
                            className="relative w-full max-w-6xl h-[80vh] bg-background rounded-lg overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between p-4 border-b">
                                <div className="flex items-center gap-2">
                                    <Network className="h-5 w-5 text-primary" />
                                    <span className="font-semibold">Knowledge Graph - {datasetName}</span>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setShowFullscreen(false)}
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>

                            {/* Full Graph */}
                            <iframe
                                srcDoc={htmlContent}
                                className="w-full h-[calc(100%-64px)] border-0"
                                title="Knowledge Graph Fullscreen"
                                sandbox="allow-scripts allow-same-origin"
                            />
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}

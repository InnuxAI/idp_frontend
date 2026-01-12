"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { KnowledgeGraph } from "@/components/zete/KnowledgeGraph";
import { DocumentPanel } from "@/components/zete/DocumentPanel";
import { ChatPanel } from "@/components/zete/ChatPanel";
import { zeteApi } from "@/lib/zete-api";
import { GraphData, GraphNode, DocumentDetails } from "@/types/zete-types";
import { JsonTable } from "@/components/ui/json-table";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { IconMessageChatbot, IconFileDescription, IconGraph } from "@tabler/icons-react";

export default function ZetePage() {
    const [graphData, setGraphData] = useState<GraphData>({ nodes: [], links: [] });
    const [selectedDocument, setSelectedDocument] = useState<DocumentDetails | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Panel visibility state
    const [showChat, setShowChat] = useState(false);
    const [showDocument, setShowDocument] = useState(true);

    // Metadata Tooltip State
    const [tooltipData, setTooltipData] = useState<{ x: number, y: number, content: any, isLoading: boolean } | null>(null);

    // Initial data fetch
    useEffect(() => {
        const fetchGraph = async () => {
            try {
                setIsLoading(true);
                setError(null);
                const data = await zeteApi.getGraphData();
                setGraphData(data);
            } catch (error: any) {
                console.error("Failed to fetch graph data:", error);
                if (error.response?.status === 500) {
                    setError("Knowledge Graph service is unavailable. Please check database connection.");
                } else {
                    setError("Failed to load Knowledge Graph. Please try again later.");
                }
            } finally {
                setIsLoading(false);
            }
        };

        fetchGraph();
    }, []);

    // Close tooltip on click outside or regular click
    useEffect(() => {
        const handleClick = () => setTooltipData(null);
        window.addEventListener('click', handleClick);
        return () => window.removeEventListener('click', handleClick);
    }, []);

    const handleNodeClick = async (node: GraphNode) => {
        try {
            const doc = await zeteApi.getDocument(node.id);
            setSelectedDocument(doc);
            // Auto-show document panel when a node is clicked
            setShowDocument(true);
        } catch (error) {
            console.error("Failed to fetch document details:", error);
        }
    };

    const handleNodeRightClick = async (node: GraphNode, x: number, y: number) => {
        // Set initial loading state at position
        setTooltipData({
            x,
            y,
            content: null,
            isLoading: true
        });

        try {
            // Fetch metadata
            // Using fetch directly since zeteApi might not have this method yet, or I should update zeteApi. 
            // For now I'll use fetch to be self-contained in this change, 
            // or better yet, I should check zete-api.ts but I don't want to switch files right now.
            // Assuming relative path proxy or direct URL.
            const response = await fetch(`http://localhost:8000/api/zete/graph/node/${node.id}/metadata`);
            if (!response.ok) throw new Error("Failed to fetch metadata");

            const metadata = await response.json();

            setTooltipData(prev => prev ? {
                ...prev,
                isLoading: false,
                content: metadata
            } : null);
        } catch (error) {
            console.error("Failed to fetch node metadata:", error);
            setTooltipData(prev => prev ? {
                ...prev,
                isLoading: false,
                content: { error: "Failed to load metadata" }
            } : null);
        }
    };

    // Animation variants for panels
    const panelVariants = {
        hidden: {
            opacity: 0,
            scale: 0.95,
            transition: { type: "spring" as const, stiffness: 400, damping: 30 }
        },
        visible: {
            opacity: 1,
            scale: 1,
            transition: { type: "spring" as const, stiffness: 400, damping: 30 }
        },
        exit: {
            opacity: 0,
            scale: 0.95,
            transition: { type: "spring" as const, stiffness: 400, damping: 30 }
        }
    };

    // Spring transition for layout animations
    const springTransition = {
        type: "spring" as const,
        stiffness: 300,
        damping: 30
    };

    return (
        <SidebarProvider
            style={
                {
                    "--sidebar-width": "calc(var(--spacing) * 72)",
                    "--header-height": "calc(var(--spacing) * 12)",
                } as React.CSSProperties
            }
        >
            <AppSidebar variant="inset" />
            <SidebarInset className="flex flex-col h-screen overflow-hidden dark:bg-zinc-950 dark:text-zinc-100 relative">
                <header className="h-14 shrink-0 flex items-center justify-between gap-2 px-4 dark:border-zinc-800">
                    <div className="flex items-center gap-2">
                        <SidebarTrigger className="-ml-1 dark:text-zinc-400 dark:hover:text-zinc-100" />
                        <Separator orientation="vertical" className="mr-2 h-4 dark:bg-zinc-700" />
                        <Breadcrumb>
                            <BreadcrumbList>
                                <BreadcrumbItem className="hidden md:block">
                                    <BreadcrumbLink href="#" className="dark:text-zinc-400 dark:hover:text-zinc-200">
                                        Knowledge Intelligence
                                    </BreadcrumbLink>
                                </BreadcrumbItem>
                                <BreadcrumbSeparator className="hidden md:block dark:text-zinc-600" />
                                <BreadcrumbItem>
                                    <BreadcrumbPage className="dark:text-zinc-100">Zete Graph</BreadcrumbPage>
                                </BreadcrumbItem>
                            </BreadcrumbList>
                        </Breadcrumb>
                    </div>

                    {/* Panel Toggle Buttons */}
                    <div className="flex items-center gap-1 bg-gray-200 dark:bg-zinc-800 p-1 rounded-lg transition-colors">
                        <button
                            onClick={() => setShowChat(!showChat)}
                            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 ${showChat
                                ? 'bg-white shadow text-gray-900 dark:bg-zinc-700 dark:text-zinc-100'
                                : 'text-gray-500 hover:text-gray-700 dark:text-zinc-400 dark:hover:text-zinc-200'
                                }`}
                        >
                            <IconMessageChatbot size={14} />
                            <span className="hidden sm:inline">Chat</span>
                        </button>
                        <button
                            onClick={() => setShowDocument(!showDocument)}
                            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 ${showDocument
                                ? 'bg-white shadow text-gray-900 dark:bg-zinc-700 dark:text-zinc-100'
                                : 'text-gray-500 hover:text-gray-700 dark:text-zinc-400 dark:hover:text-zinc-200'
                                }`}
                        >
                            <IconFileDescription size={14} />
                            <span className="hidden sm:inline">Document</span>
                        </button>
                    </div>
                </header>

                {/* Main content area with layout animation */}
                <motion.div
                    className="flex-1 flex gap-4 p-4 overflow-hidden"
                    layout
                    transition={springTransition}
                >
                    {/* Left: Chat & Search */}
                    <AnimatePresence mode="popLayout">
                        {showChat && (
                            <motion.div
                                key="chat-panel"
                                layout
                                variants={panelVariants}
                                initial="hidden"
                                animate="visible"
                                exit="exit"
                                style={{ width: showDocument ? 320 : 400 }}
                                className="shrink-0 rounded-xl border border-gray-200 bg-white dark:bg-zinc-900 dark:border-zinc-800 overflow-hidden shadow-sm flex flex-col"
                            >
                                <ChatPanel />
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Middle: Graph Visualization (Main) - always visible */}
                    <motion.div
                        layout
                        transition={springTransition}
                        className="flex-1 min-w-[400px] rounded-xl border border-gray-200 bg-slate-50 dark:bg-zinc-900/50 dark:border-zinc-800 overflow-hidden shadow-sm relative"
                    >
                        {isLoading ? (
                            <div className="flex h-full items-center justify-center text-gray-400 dark:text-zinc-500">
                                <div className="flex flex-col items-center gap-2">
                                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-indigo-500 dark:border-zinc-700 dark:border-t-indigo-400" />
                                    <p className="text-sm">Loading graph...</p>
                                </div>
                            </div>
                        ) : error ? (
                            <div className="flex h-full items-center justify-center text-gray-400 dark:text-zinc-500">
                                <div className="flex flex-col items-center gap-4 max-w-sm text-center p-6">
                                    <div className="h-12 w-12 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center text-red-500 dark:text-red-400">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                                    </div>
                                    <div className="space-y-1">
                                        <h3 className="font-medium text-gray-900 dark:text-zinc-100">Connection Error</h3>
                                        <p className="text-sm text-gray-500 dark:text-zinc-400">{error}</p>
                                    </div>
                                    <button
                                        onClick={() => window.location.reload()}
                                        className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-white border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 shadow-sm transition-colors dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-700"
                                    >
                                        Retry Connection
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <KnowledgeGraph
                                data={graphData}
                                onNodeClick={handleNodeClick}
                                onNodeRightClick={handleNodeRightClick}
                            />
                        )}
                    </motion.div>

                    {/* Right: Document Details */}
                    <AnimatePresence mode="popLayout">
                        {showDocument && (
                            <motion.div
                                key="document-panel"
                                layout
                                variants={panelVariants}
                                initial="hidden"
                                animate="visible"
                                exit="exit"
                                style={{ width: showChat ? 350 : 420 }}
                                className="shrink-0 rounded-xl border border-gray-200 bg-white dark:bg-zinc-900 dark:border-zinc-800 overflow-hidden shadow-sm flex flex-col"
                            >
                                <DocumentPanel document={selectedDocument} />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>

                {/* Metadata Tooltip */}
                {tooltipData && (
                    <div
                        className="fixed z-50 p-4 rounded-lg shadow-xl bg-white/95 dark:bg-zinc-900/95 backdrop-blur border border-gray-200 dark:border-zinc-700 max-w-md w-full text-sm overflow-hidden"
                        style={{
                            top: Math.min(tooltipData.y + 10, window.innerHeight - 300),
                            left: Math.min(tooltipData.x + 10, window.innerWidth - 320),
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {tooltipData.isLoading ? (
                            <div className="flex items-center gap-2 text-gray-500">
                                <span className="animate-spin">⏳</span> Loading metadata...
                            </div>
                        ) : (
                            <div className="flex flex-col gap-2">
                                <h4 className="font-medium text-gray-900 dark:text-zinc-100 border-b pb-2 mb-1">
                                    Node Metadata
                                </h4>
                                <JsonTable data={tooltipData.content} maxHeight="300px" />
                            </div>
                        )}
                    </div>
                )}
            </SidebarInset>
        </SidebarProvider>
    );
}
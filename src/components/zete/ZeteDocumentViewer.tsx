"use client";

import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { X, FileText, Database, Code2 } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import UniversalDocumentViewer from "./UniversalDocumentViewer";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface ZeteDocumentViewerProps {
    isOpen: boolean;
    onClose: () => void;
    docId: string;
    filename: string;
}

interface DocumentDetail {
    id: string;
    content: string;
    metadata: {
        id: string;
        parent: string | null;
        type: string;
        file_path: string;
        title: string;
    };
    extracted_fields: Record<string, any>;
    markdown_content: string;
}

export default function ZeteDocumentViewer({
    isOpen,
    onClose,
    docId,
    filename,
}: ZeteDocumentViewerProps) {
    const [documentDetail, setDocumentDetail] = useState<DocumentDetail | null>(
        null
    );
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen && docId) {
            fetchDocumentDetail();
        } else {
            setDocumentDetail(null);
        }
    }, [isOpen, docId]);

    const fetchDocumentDetail = async () => {
        setLoading(true);
        try {
            const token = sessionStorage.getItem("auth_token") || localStorage.getItem("auth_token");
            const response = await fetch(
                `${API_BASE_URL}/api/zete/documents/${docId}`,
                {
                    headers: token ? {
                        Authorization: `Bearer ${token}`,
                    } : {},
                }
            );
            if (!response.ok) throw new Error("Failed to fetch document");
            const data = await response.json();
            setDocumentDetail(data);
        } catch (error) {
            console.error("Failed to fetch document detail:", error);
        } finally {
            setLoading(false);
        }
    };

    const formatFieldName = (key: string) => {
        return key
            .replace(/_/g, " ")
            .replace(/\b\w/g, (c) => c.toUpperCase());
    };

    const renderFieldValue = (value: any): string => {
        if (value === null || value === undefined) return "—";
        if (typeof value === "object") return JSON.stringify(value, null, 2);
        return String(value);
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="!max-w-[95vw] !max-h-[95vh] !w-[95vw] !h-[95vh] p-0 gap-0 sm:!max-w-[95vw]">
                <DialogTitle className="flex items-center justify-between px-6 py-4 border-b bg-muted/30">
                    <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-primary" />
                        <span className="font-semibold text-lg truncate max-w-[500px]">
                            {documentDetail?.metadata?.title || filename}
                        </span>
                        {documentDetail?.metadata?.type && (
                            <Badge variant="outline" className="text-xs">
                                {documentDetail.metadata.type}
                            </Badge>
                        )}
                    </div>
                </DialogTitle>

                <div className="flex flex-1 min-h-0 h-[calc(95vh-65px)]">
                    {/* Left Panel — File Viewer */}
                    <div className="w-1/2 border-r flex flex-col min-h-0">
                        <div className="px-4 py-2 border-b bg-muted/20">
                            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                                Document Preview
                            </p>
                        </div>
                        <div className="flex-1 min-h-0">
                            {docId && (
                                <UniversalDocumentViewer
                                    fileUrl={`${API_BASE_URL}/api/zete/documents/${docId}/raw`}
                                    fileName={filename}
                                    title={documentDetail?.metadata?.title || filename}
                                />
                            )}
                        </div>
                    </div>

                    {/* Right Panel — Tabs */}
                    <div className="w-1/2 flex flex-col min-h-0">
                        <Tabs defaultValue="metadata" className="flex flex-col h-full">
                            <div className="px-4 py-2 border-b bg-muted/20">
                                <TabsList className="w-full">
                                    <TabsTrigger value="metadata" className="flex-1 gap-1.5">
                                        <Database className="h-3.5 w-3.5" />
                                        Node Metadata
                                    </TabsTrigger>
                                    <TabsTrigger value="extracted" className="flex-1 gap-1.5">
                                        <Code2 className="h-3.5 w-3.5" />
                                        Extracted Data
                                    </TabsTrigger>
                                </TabsList>
                            </div>

                            {/* Metadata Tab */}
                            <TabsContent
                                value="metadata"
                                className="flex-1 overflow-auto m-0 p-0"
                            >
                                {loading ? (
                                    <div className="flex items-center justify-center h-full">
                                        <div className="animate-pulse text-muted-foreground">
                                            Loading metadata...
                                        </div>
                                    </div>
                                ) : documentDetail?.extracted_fields ? (
                                    <div className="p-4 space-y-1">
                                        {Object.entries(documentDetail.extracted_fields).map(
                                            ([key, value], index) => (
                                                <motion.div
                                                    key={key}
                                                    initial={{ opacity: 0, x: 10 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: index * 0.03 }}
                                                    className="flex items-start gap-3 py-2.5 px-3 rounded-md hover:bg-muted/50 transition-colors"
                                                >
                                                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider min-w-[140px] pt-0.5">
                                                        {formatFieldName(key)}
                                                    </span>
                                                    <span className="text-sm text-foreground flex-1 break-words">
                                                        {renderFieldValue(value)}
                                                    </span>
                                                </motion.div>
                                            )
                                        )}
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-center h-full text-muted-foreground">
                                        No metadata available
                                    </div>
                                )}
                            </TabsContent>

                            {/* Extracted Data Tab */}
                            <TabsContent
                                value="extracted"
                                className="flex-1 overflow-auto m-0 p-0"
                            >
                                {loading ? (
                                    <div className="flex items-center justify-center h-full">
                                        <div className="animate-pulse text-muted-foreground">
                                            Loading extracted data...
                                        </div>
                                    </div>
                                ) : documentDetail?.markdown_content ? (
                                    <div className="p-6 prose prose-sm dark:prose-invert max-w-none">
                                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                            {documentDetail.markdown_content}
                                        </ReactMarkdown>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-2">
                                        <Code2 className="h-8 w-8 opacity-40" />
                                        <p>No extracted data available</p>
                                        <p className="text-xs">
                                            Re-ingest this document to generate markdown extraction
                                        </p>
                                    </div>
                                )}
                            </TabsContent>
                        </Tabs>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

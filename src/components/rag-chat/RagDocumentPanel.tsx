"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { IconFileText, IconTrash, IconExternalLink, IconClock } from "@tabler/icons-react";
import { ragApi, RagDocument } from "../../lib/rag-api";

interface RagDocumentPanelProps {
    document: RagDocument | null;
    onDelete?: () => void;
}

function formatDate(iso?: string) {
    if (!iso) return null;
    try {
        return new Date(iso).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
        });
    } catch {
        return null;
    }
}

export function RagDocumentPanel({ document, onDelete }: RagDocumentPanelProps) {
    const [deleting, setDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState<string | null>(null);

    const handleDelete = async () => {
        if (!document || !window.confirm(`Delete "${document.title}"? This will remove the document from the RAG index and Azure Blob storage.`)) return;
        setDeleting(true);
        setDeleteError(null);
        try {
            await ragApi.deleteDocument(document.id);
            onDelete?.();
        } catch (err: any) {
            setDeleteError(err?.response?.data?.detail || "Deletion failed. Please try again.");
        } finally {
            setDeleting(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-white dark:bg-zinc-900 relative overflow-hidden">
            {/* Header */}
            <div className="flex-none px-4 py-3 border-b border-gray-100 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md z-10 sticky top-0 flex items-center gap-3 rounded-t-xl">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gray-100 to-white dark:from-zinc-800 dark:to-zinc-700 flex items-center justify-center">
                    <IconFileText size={16} className="text-gray-600 dark:text-zinc-400" />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-zinc-100 truncate leading-tight">
                        Document Details
                    </p>
                    <p className="text-[10px] uppercase tracking-wider text-gray-400 dark:text-zinc-500 font-medium">
                        RAG Index
                    </p>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                <AnimatePresence mode="wait">
                    {!document ? (
                        <motion.div
                            key="empty"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="h-full flex flex-col items-center justify-center text-center p-8 text-gray-400 dark:text-zinc-500"
                        >
                            <div className="w-14 h-14 rounded-2xl bg-gray-50 dark:bg-zinc-800 flex items-center justify-center mb-4">
                                <IconFileText size={28} className="opacity-30" />
                            </div>
                            <p className="text-sm font-medium opacity-60">No document selected</p>
                            <p className="text-xs mt-1 opacity-40">
                                Use search to find and preview documents
                            </p>
                        </motion.div>
                    ) : (
                        <motion.div
                            key={document.id}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            className="p-4 space-y-4"
                        >
                            {/* Title */}
                            <div className="p-3 bg-gray-50 dark:bg-zinc-800/50 rounded-xl border border-gray-100 dark:border-zinc-700">
                                <h3 className="text-sm font-semibold text-gray-900 dark:text-zinc-100 leading-tight mb-1 line-clamp-3">
                                    {document.title}
                                </h3>
                                {document.source && (
                                    <p className="text-[11px] text-gray-400 dark:text-zinc-500 truncate flex items-center gap-1">
                                        <IconExternalLink size={10} />
                                        {document.source}
                                    </p>
                                )}
                            </div>

                            {/* Metadata */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between text-xs">
                                    <span className="text-gray-400 dark:text-zinc-500">Document ID</span>
                                    <span className="text-gray-700 dark:text-zinc-300 font-mono text-[10px] truncate max-w-[140px]">
                                        {document.id}
                                    </span>
                                </div>
                                {document.created_at && (
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="text-gray-400 dark:text-zinc-500 flex items-center gap-1">
                                            <IconClock size={11} /> Indexed
                                        </span>
                                        <span className="text-gray-700 dark:text-zinc-300">
                                            {formatDate(document.created_at)}
                                        </span>
                                    </div>
                                )}
                                {document.metadata &&
                                    Object.entries(document.metadata)
                                        .filter(([, v]) => v !== null && v !== undefined && v !== "")
                                        .slice(0, 4)
                                        .map(([k, v]) => (
                                            <div key={k} className="flex items-center justify-between text-xs">
                                                <span className="text-gray-400 dark:text-zinc-500 capitalize">{k.replace(/_/g, " ")}</span>
                                                <span className="text-gray-700 dark:text-zinc-300 truncate max-w-[140px]">
                                                    {String(v)}
                                                </span>
                                            </div>
                                        ))
                                }
                            </div>

                            {/* Content preview */}
                            {document.content && (
                                <div>
                                    <p className="text-[10px] uppercase tracking-wider text-gray-400 dark:text-zinc-600 font-semibold mb-2">
                                        Content Preview
                                    </p>
                                    <p className="text-xs text-gray-600 dark:text-zinc-400 leading-relaxed line-clamp-8 bg-gray-50 dark:bg-zinc-800/50 rounded-lg p-3 border border-gray-100 dark:border-zinc-700">
                                        {document.content.slice(0, 500)}
                                        {document.content.length > 500 ? "…" : ""}
                                    </p>
                                </div>
                            )}

                            {/* Delete error */}
                            {deleteError && (
                                <p className="text-xs text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg p-2">
                                    {deleteError}
                                </p>
                            )}

                            {/* Delete button */}
                            <motion.button
                                onClick={handleDelete}
                                disabled={deleting}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-red-200 dark:border-red-900/40 text-red-600 dark:text-red-400 text-xs font-medium hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50 transition-colors"
                            >
                                <IconTrash size={14} />
                                {deleting ? "Deleting…" : "Delete from RAG index"}
                            </motion.button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}

"use client";

import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    IconX, IconUpload, IconCheck, IconLoader2, IconAlertCircle,
    IconFile, IconLeaf, IconTrash, IconFileTypePdf, IconPhoto,
    IconFileText, IconCloudUpload,
} from "@tabler/icons-react";
import { agroApi } from "../../lib/agro-api";
import { agroNotificationBus } from "./AgroUploadNotifications";

// ============================================================================
// Types
// ============================================================================

interface FileItem {
    id: string;
    file: File;
    status: "pending" | "uploading" | "done" | "error";
    error?: string;
}

interface AgroUploadModalProps {
    isOpen: boolean;
    onClose: () => void;
    onUploadComplete?: () => void;
}

const ACCEPTED = ".pdf,.txt,.md,.docx,.png,.jpg,.jpeg,.webp";
const MAX_SIZE_MB = 50;

// ============================================================================
// Utilities
// ============================================================================

const generateId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

function getFileIcon(name: string) {
    const ext = name.split(".").pop()?.toLowerCase() ?? "";
    if (ext === "pdf") return <IconFileTypePdf size={18} className="text-red-500" />;
    if (["png", "jpg", "jpeg", "webp"].includes(ext)) return <IconPhoto size={18} className="text-blue-500" />;
    if (["md", "txt"].includes(ext)) return <IconFileText size={18} className="text-gray-500" />;
    return <IconFile size={18} className="text-gray-400" />;
}

function formatSize(bytes: number) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ============================================================================
// Component
// ============================================================================

export function AgroUploadModal({ isOpen, onClose, onUploadComplete }: AgroUploadModalProps) {
    const [files, setFiles] = useState<FileItem[]>([]);
    const [isDragging, setIsDragging] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [azureIngesting, setAzureIngesting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // ── Add files ───────────────────────────────────────────────────
    const addFiles = useCallback((newFiles: FileList | File[]) => {
        const items: FileItem[] = Array.from(newFiles)
            .filter((f) => f.size <= MAX_SIZE_MB * 1024 * 1024)
            .map((file) => ({
                id: generateId(),
                file,
                status: "pending" as const,
            }));
        setFiles((prev) => [...prev, ...items]);
    }, []);

    // ── Drag handlers ───────────────────────────────────────────────
    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
    }, [addFiles]);

    // ── Remove a file ───────────────────────────────────────────────
    const removeFile = (id: string) => {
        setFiles((prev) => prev.filter((f) => f.id !== id));
    };

    // ── Upload all pending ──────────────────────────────────────────
    const handleUploadAll = async () => {
        const pending = files.filter((f) => f.status === "pending");
        if (!pending.length) return;

        setIsUploading(true);
        setFiles((prev) =>
            prev.map((f) => (f.status === "pending" ? { ...f, status: "uploading" as const } : f))
        );

        try {
            const resp = await agroApi.uploadDocuments(pending.map((f) => f.file));

            // Update file statuses and dispatch to notification bus
            const taskResults = resp.tasks || [];
            setFiles((prev) =>
                prev.map((f) => {
                    const result = taskResults.find((t: any) => t.filename === f.file.name);
                    if (!result) return f;

                    if (result.task_id) {
                        // Defer notification bus call to avoid setState-during-render
                        setTimeout(() => {
                            agroNotificationBus.addIngestTask(
                                result.task_id,
                                result.filename,
                            );
                        }, 0);
                        return { ...f, status: "done" as const };
                    }
                    return { ...f, status: "error" as const, error: result.error || "Upload failed" };
                })
            );

            onUploadComplete?.();
        } catch (err: any) {
            setFiles((prev) =>
                prev.map((f) =>
                    f.status === "uploading"
                        ? { ...f, status: "error" as const, error: err?.message || "Upload failed" }
                        : f
                )
            );
        } finally {
            setIsUploading(false);
        }
    };

    // ── Azure Ingest ────────────────────────────────────────────────
    const handleAzureIngest = async () => {
        setAzureIngesting(true);
        try {
            const resp = await agroApi.triggerAzureIngest(false, true);
            setTimeout(() => {
                agroNotificationBus.addIngestTask(
                    `azure-${Date.now()}`,
                    "Azure Blob Ingestion",
                );
            }, 0);
            onUploadComplete?.();
        } catch (err: any) {
            console.error("Azure ingest failed:", err);
        } finally {
            setAzureIngesting(false);
        }
    };

    // ── Close ───────────────────────────────────────────────────────
    const handleClose = () => {
        if (!isUploading) {
            setFiles([]);
        }
        onClose();
    };

    if (!isOpen) return null;

    const pendingCount = files.filter((f) => f.status === "pending").length;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                onClick={(e) => e.target === e.currentTarget && handleClose()}
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.92, y: 30 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.92, y: 30 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    className="relative w-full max-w-xl bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl overflow-hidden border border-gray-100 dark:border-zinc-800"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-zinc-800">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                                <IconCloudUpload size={16} className="text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <div>
                                <h2 className="text-sm font-semibold text-gray-900 dark:text-zinc-100">
                                    Ingest to Agro Chat
                                </h2>
                                <p className="text-[10px] text-gray-400 dark:text-zinc-500">
                                    Upload files or ingest from Azure Blob Storage
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={handleClose}
                            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-400 transition-colors"
                        >
                            <IconX size={18} />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="px-6 py-5 space-y-4">
                        {/* Drop zone */}
                        <div
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            onClick={() => fileInputRef.current?.click()}
                            className={`relative p-6 rounded-xl border-2 border-dashed transition-all cursor-pointer text-center
                                ${isDragging
                                    ? "border-emerald-400 bg-emerald-50/50 dark:bg-emerald-900/10 scale-[1.01]"
                                    : "border-gray-200 dark:border-zinc-700 hover:border-emerald-300 dark:hover:border-emerald-700 bg-gray-50 dark:bg-zinc-800/50"
                                }`}
                        >
                            <input
                                ref={fileInputRef}
                                type="file"
                                multiple
                                accept={ACCEPTED}
                                className="hidden"
                                onChange={(e) => {
                                    if (e.target.files?.length) addFiles(e.target.files);
                                    e.target.value = "";
                                }}
                            />
                            <IconUpload size={28} className="mx-auto text-gray-400 dark:text-zinc-500 mb-2" />
                            <p className="text-sm font-medium text-gray-700 dark:text-zinc-300">
                                Drop files here or click to browse
                            </p>
                            <p className="text-[11px] text-gray-400 dark:text-zinc-500 mt-1">
                                PDF, TXT, MD, DOCX, PNG, JPG — max {MAX_SIZE_MB}MB each
                            </p>
                        </div>

                        {/* File list */}
                        {files.length > 0 && (
                            <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                                {files.map((item) => (
                                    <motion.div
                                        key={item.id}
                                        initial={{ opacity: 0, y: 4 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-gray-50 dark:bg-zinc-800/60 border border-gray-100 dark:border-zinc-700"
                                    >
                                        <div className="shrink-0">{getFileIcon(item.file.name)}</div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-medium text-gray-800 dark:text-zinc-200 truncate">
                                                {item.file.name}
                                            </p>
                                            <p className="text-[10px] text-gray-400 dark:text-zinc-500">
                                                {formatSize(item.file.size)}
                                                {item.error && (
                                                    <span className="text-red-500 ml-2">{item.error}</span>
                                                )}
                                            </p>
                                        </div>
                                        <div className="shrink-0 flex items-center gap-1">
                                            {item.status === "uploading" && (
                                                <IconLoader2 size={14} className="text-emerald-500 animate-spin" />
                                            )}
                                            {item.status === "done" && (
                                                <IconCheck size={14} className="text-emerald-500" />
                                            )}
                                            {item.status === "error" && (
                                                <IconAlertCircle size={14} className="text-red-500" />
                                            )}
                                            {item.status === "pending" && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        removeFile(item.id);
                                                    }}
                                                    className="p-1 rounded hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-400 transition-colors"
                                                >
                                                    <IconTrash size={13} />
                                                </button>
                                            )}
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}

                        {/* Upload button */}
                        {pendingCount > 0 && (
                            <motion.button
                                onClick={handleUploadAll}
                                disabled={isUploading}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-500/20 disabled:opacity-50 transition-colors"
                            >
                                {isUploading ? (
                                    <>
                                        <IconLoader2 size={14} className="animate-spin" />
                                        Uploading {pendingCount} file{pendingCount > 1 ? "s" : ""}…
                                    </>
                                ) : (
                                    <>
                                        <IconUpload size={14} />
                                        Upload {pendingCount} file{pendingCount > 1 ? "s" : ""}
                                    </>
                                )}
                            </motion.button>
                        )}

                        {/* Divider */}
                        <div className="flex items-center gap-3">
                            <div className="flex-1 h-px bg-gray-200 dark:bg-zinc-700" />
                            <span className="text-[10px] text-gray-400 dark:text-zinc-500 uppercase tracking-wider font-medium">
                                or
                            </span>
                            <div className="flex-1 h-px bg-gray-200 dark:bg-zinc-700" />
                        </div>

                        {/* Azure Ingest */}
                        <div className="p-4 rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800/50">
                            <div className="flex items-center gap-2 mb-2">
                                <IconLeaf size={16} className="text-emerald-500" />
                                <h3 className="text-sm font-medium text-gray-900 dark:text-zinc-100">
                                    Azure Blob Storage
                                </h3>
                            </div>
                            <p className="text-xs text-gray-500 dark:text-zinc-400 mb-3">
                                Ingest all documents from the configured Azure container.
                            </p>
                            <motion.button
                                onClick={handleAzureIngest}
                                disabled={azureIngesting}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium bg-sky-600 hover:bg-sky-700 text-white shadow-md shadow-sky-500/20 disabled:opacity-50 transition-colors"
                            >
                                {azureIngesting ? (
                                    <>
                                        <IconLoader2 size={14} className="animate-spin" />
                                        Starting Azure ingestion…
                                    </>
                                ) : (
                                    <>
                                        <IconUpload size={14} />
                                        Ingest from Azure
                                    </>
                                )}
                            </motion.button>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-end px-6 py-4 border-t border-gray-100 dark:border-zinc-800">
                        <button
                            onClick={handleClose}
                            className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
                        >
                            Close
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}

"use client";

import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    IconX, IconUpload, IconCheck, IconLoader2, IconAlertCircle,
    IconFile, IconGraph
} from "@tabler/icons-react";
import { ragApi } from "../../lib/rag-api";

interface RagUploadModalProps {
    isOpen: boolean;
    onClose: () => void;
    onUploadComplete?: () => void;
}

const ACCEPTED_TYPES = ".pdf,.txt,.md,.docx,.png,.jpg,.jpeg,.webp";

type UploadState = "idle" | "uploading" | "queued" | "error";

interface FileItem {
    file: File;
    state: UploadState;
    progress: number;
    taskId?: string;
    error?: string;
}

export function RagUploadModal({ isOpen, onClose, onUploadComplete }: RagUploadModalProps) {
    const [files, setFiles] = useState<FileItem[]>([]);
    const [buildGraph, setBuildGraph] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const addFiles = useCallback((incoming: File[]) => {
        const items: FileItem[] = incoming.map((f) => ({
            file: f,
            state: "idle",
            progress: 0,
        }));
        setFiles((prev) => [...prev, ...items]);
    }, []);

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const dropped = Array.from(e.dataTransfer.files);
        addFiles(dropped);
    };

    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) addFiles(Array.from(e.target.files));
    };

    const removeFile = (idx: number) => {
        setFiles((prev) => prev.filter((_, i) => i !== idx));
    };

    const uploadAll = async () => {
        const toUpload = files.filter((f) => f.state === "idle" || f.state === "error");
        if (!toUpload.length) return;

        for (let i = 0; i < files.length; i++) {
            const item = files[i];
            if (item.state !== "idle" && item.state !== "error") continue;

            setFiles((prev) =>
                prev.map((f, idx) => (idx === i ? { ...f, state: "uploading", progress: 0 } : f))
            );

            try {
                const resp = await ragApi.uploadDocument(item.file, buildGraph, (pct) => {
                    setFiles((prev) =>
                        prev.map((f, idx) => (idx === i ? { ...f, progress: pct } : f))
                    );
                });

                setFiles((prev) =>
                    prev.map((f, idx) =>
                        idx === i
                            ? { ...f, state: "queued", progress: 100, taskId: resp.task_id }
                            : f
                    )
                );
            } catch (err: any) {
                const msg = err?.response?.data?.detail || err?.message || "Upload failed";
                setFiles((prev) =>
                    prev.map((f, idx) => (idx === i ? { ...f, state: "error", error: msg } : f))
                );
            }
        }

        const allDone = files.every((f) => f.state === "queued" || f.state === "error");
        if (allDone) {
            onUploadComplete?.();
            setTimeout(() => {
                setFiles([]);
                onClose();
            }, 1500);
        }
    };

    const stateIcon = (item: FileItem) => {
        switch (item.state) {
            case "uploading": return <IconLoader2 size={14} className="animate-spin text-violet-500" />;
            case "queued": return <IconCheck size={14} className="text-emerald-500" />;
            case "error": return <IconAlertCircle size={14} className="text-red-500" />;
            default: return <IconFile size={14} className="text-gray-400" />;
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                onClick={(e) => e.target === e.currentTarget && onClose()}
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.92, y: 30 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.92, y: 30 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    className="relative w-full max-w-lg bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl overflow-hidden border border-gray-100 dark:border-zinc-800"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-zinc-800">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
                                <IconUpload size={16} className="text-violet-600 dark:text-violet-400" />
                            </div>
                            <div>
                                <h2 className="text-sm font-semibold text-gray-900 dark:text-zinc-100">
                                    Upload to RAG Chat
                                </h2>
                                <p className="text-[10px] text-gray-400 dark:text-zinc-500">
                                    PDF, DOCX, TXT, MD, Images
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-400 transition-colors"
                        >
                            <IconX size={18} />
                        </button>
                    </div>

                    {/* Drop Zone */}
                    <div className="px-6 pt-4">
                        <div
                            onDrop={handleDrop}
                            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                            onDragLeave={() => setIsDragging(false)}
                            onClick={() => fileInputRef.current?.click()}
                            className={`relative flex flex-col items-center justify-center gap-3 p-8 rounded-xl border-2 border-dashed cursor-pointer transition-all ${isDragging
                                ? "border-violet-400 bg-violet-50 dark:bg-violet-900/10"
                                : "border-gray-200 dark:border-zinc-700 hover:border-violet-300 dark:hover:border-violet-700 hover:bg-gray-50 dark:hover:bg-zinc-800/50"
                                }`}
                        >
                            <div className="w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-900/20 flex items-center justify-center">
                                <IconUpload size={20} className="text-violet-500" />
                            </div>
                            <div className="text-center">
                                <p className="text-sm font-medium text-gray-900 dark:text-zinc-100">
                                    Drop files here or click to browse
                                </p>
                                <p className="text-xs text-gray-400 dark:text-zinc-500 mt-1">
                                    PDF, DOCX, TXT, MD, PNG, JPG, WEBP
                                </p>
                            </div>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept={ACCEPTED_TYPES}
                                multiple
                                className="hidden"
                                onChange={handleFileInput}
                            />
                        </div>
                    </div>

                    {/* Build Graph toggle */}
                    <div className="px-6 pt-3 pb-1 flex items-center gap-3">
                        <button
                            onClick={() => setBuildGraph((v) => !v)}
                            className={`relative w-9 h-5 rounded-full transition-colors ${buildGraph ? "bg-violet-600" : "bg-gray-200 dark:bg-zinc-700"}`}
                        >
                            <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${buildGraph ? "translate-x-4" : ""}`} />
                        </button>
                        <div className="flex items-center gap-1.5">
                            <IconGraph size={14} className="text-gray-400" />
                            <span className="text-xs text-gray-600 dark:text-zinc-400">
                                Build knowledge graph{" "}
                                <span className="text-gray-400 dark:text-zinc-500">(optional, slower)</span>
                            </span>
                        </div>
                    </div>

                    {/* File List */}
                    {files.length > 0 && (
                        <div className="mx-6 mt-3 space-y-1.5 max-h-[180px] overflow-y-auto">
                            {files.map((item, i) => (
                                <div
                                    key={i}
                                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-gray-50 dark:bg-zinc-800/50 border border-gray-100 dark:border-zinc-700"
                                >
                                    {stateIcon(item)}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-medium text-gray-800 dark:text-zinc-200 truncate">
                                            {item.file.name}
                                        </p>
                                        {item.state === "uploading" && (
                                            <div className="w-full h-1 bg-gray-200 dark:bg-zinc-700 rounded-full mt-1">
                                                <div
                                                    className="h-full bg-violet-500 rounded-full transition-all duration-300"
                                                    style={{ width: `${item.progress}%` }}
                                                />
                                            </div>
                                        )}
                                        {item.state === "queued" && item.taskId && (
                                            <p className="text-[10px] text-emerald-600 dark:text-emerald-400">
                                                Queued · task {item.taskId.slice(0, 8)}…
                                            </p>
                                        )}
                                        {item.error && (
                                            <p className="text-[10px] text-red-500">{item.error}</p>
                                        )}
                                    </div>
                                    {item.state === "idle" && (
                                        <button
                                            onClick={() => removeFile(i)}
                                            className="p-1 rounded hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-400"
                                        >
                                            <IconX size={12} />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-3 px-6 py-4 mt-2">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
                        >
                            Cancel
                        </button>
                        <motion.button
                            onClick={uploadAll}
                            disabled={files.length === 0 || files.every((f) => f.state === "queued")}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="px-5 py-2 rounded-lg text-sm font-semibold bg-violet-600 hover:bg-violet-700 text-white shadow-md shadow-violet-500/20 disabled:opacity-50 transition-colors"
                        >
                            {files.some((f) => f.state === "uploading") ? "Uploading…" : "Upload & Ingest"}
                        </motion.button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}

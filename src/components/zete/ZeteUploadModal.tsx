"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
    IconUpload,
    IconX,
    IconFile,
    IconFileTypePdf,
    IconPhoto,
    IconFileText,
    IconTrash,
    IconCheck,
    IconAlertCircle,
    IconLoader2,
} from "@tabler/icons-react";
import { zeteApi, UploadResponse } from "@/lib/zete-api";
import { ProcessingStep, STEP_LABELS } from "@/types/zete-types";
import { useUploadContext } from "@/contexts/upload-context";
import { cn } from "@/lib/utils";

// ============================================================================
// Types
// ============================================================================

interface FileWithContext {
    id: string;
    file: File;
    context: string;
    preview?: string;
    status: "pending" | "uploading" | "processing" | "success" | "error";
    progress: number;
    error?: string;
    docId?: string;
    taskId?: string;
    currentStep?: ProcessingStep;
    stepMessage?: string;
}

interface ZeteUploadModalProps {
    isOpen: boolean;
    onClose: () => void;
    onUploadComplete?: () => void;
}

// ============================================================================
// Utility Functions
// ============================================================================

const generateId = () => Math.random().toString(36).slice(2, 11);

const getFileIcon = (file: File) => {
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (["pdf"].includes(ext || "")) return IconFileTypePdf;
    if (["png", "jpg", "jpeg", "webp", "gif"].includes(ext || "")) return IconPhoto;
    if (["md", "txt", "doc", "docx"].includes(ext || "")) return IconFileText;
    return IconFile;
};

const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

const isImageFile = (file: File): boolean => {
    return file.type.startsWith("image/");
};

// ============================================================================
// File Preview Component
// ============================================================================

interface FilePreviewProps {
    file: File;
    preview?: string;
}

const FilePreview: React.FC<FilePreviewProps> = ({ file, preview }) => {
    const FileIcon = getFileIcon(file);

    if (isImageFile(file) && preview) {
        return (
            <div className="relative w-full h-32 bg-zinc-100 dark:bg-zinc-800 rounded-lg overflow-hidden">
                <img
                    src={preview}
                    alt={file.name}
                    className="w-full h-full object-contain"
                />
            </div>
        );
    }

    return (
        <div className="w-full h-32 bg-zinc-100 dark:bg-zinc-800 rounded-lg flex flex-col items-center justify-center gap-2">
            <FileIcon size={32} className="text-zinc-400 dark:text-zinc-500" />
            <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium uppercase">
                {file.name.split(".").pop()}
            </span>
        </div>
    );
};

// ============================================================================
// File Item Component (Two-Column Layout: Preview | Context)
// ============================================================================

interface FileItemProps {
    item: FileWithContext;
    onContextChange: (id: string, context: string) => void;
    onRemove: (id: string) => void;
    disabled?: boolean;
}

const FileItem: React.FC<FileItemProps> = ({
    item,
    onContextChange,
    onRemove,
    disabled = false,
}) => {
    const statusColors = {
        pending: "border-zinc-200 dark:border-zinc-700",
        uploading: "border-orange-400 dark:border-orange-500",
        processing: "border-blue-400 dark:border-blue-500",
        success: "border-emerald-400 dark:border-emerald-500",
        error: "border-red-400 dark:border-red-500",
    };

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className={cn(
                "relative flex flex-row gap-4 p-4 rounded-xl border-2 bg-white dark:bg-zinc-900 transition-colors shadow-sm",
                statusColors[item.status],
                disabled && "opacity-60 pointer-events-none"
            )}
        >
            {/* Remove Button */}
            {item.status === "pending" && !disabled && (
                <motion.button
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    onClick={() => onRemove(item.id)}
                    className="absolute -top-2 -right-2 p-1 rounded-full bg-red-500 text-white shadow-lg hover:bg-red-600 transition-colors z-10"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                >
                    <IconX size={14} />
                </motion.button>
            )}

            {/* Left Column: Preview (fixed width) */}
            <div className="flex flex-col gap-2 w-48 shrink-0">
                <FilePreview file={item.file} preview={item.preview} />
                <div className="flex flex-col gap-1 min-w-0">
                    <span className="text-sm font-medium text-zinc-700 dark:text-zinc-200 truncate">
                        {item.file.name}
                    </span>
                    <span className="text-xs text-zinc-400 dark:text-zinc-500">
                        {formatFileSize(item.file.size)}
                    </span>
                </div>

                {/* Progress Bar */}
                {(item.status === "uploading" || item.status === "processing") && (
                    <div className="w-full">
                        <div className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                            <motion.div
                                className={cn(
                                    "h-full",
                                    item.status === "uploading" ? "bg-orange-500" : "bg-blue-500"
                                )}
                                initial={{ width: 0 }}
                                animate={{ width: `${item.progress}%` }}
                                transition={{ ease: "easeOut" }}
                            />
                        </div>
                        {item.status === "processing" && item.stepMessage && (
                            <p className="text-xs text-blue-500 dark:text-blue-400 mt-1 truncate">
                                {item.stepMessage}
                            </p>
                        )}
                    </div>
                )}

                {/* Status Badges */}
                {item.status === "success" && (
                    <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 text-xs font-medium">
                        <IconCheck size={14} />
                        <span>Added to Knowledge Graph</span>
                    </div>
                )}
                {item.status === "error" && (
                    <div className="flex items-center gap-1.5 text-red-500 dark:text-red-400 text-xs font-medium">
                        <IconAlertCircle size={14} />
                        <span className="truncate">{item.error || "Failed"}</span>
                    </div>
                )}
            </div>

            {/* Right Column: Context Input (flexible) */}
            <div className="flex flex-col gap-2 flex-1 min-w-0">
                <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                    Context (optional)
                </label>
                <textarea
                    value={item.context}
                    onChange={(e) => onContextChange(item.id, e.target.value)}
                    placeholder="e.g., Met John at TechConf 2024 on January 15th in San Francisco..."
                    disabled={item.status !== "pending" || disabled}
                    className={cn(
                        "flex-1 min-h-[100px] p-3 rounded-lg border text-sm resize-none",
                        "bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700",
                        "placeholder:text-zinc-400 dark:placeholder:text-zinc-500",
                        "text-zinc-700 dark:text-zinc-200",
                        "focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500",
                        "transition-all",
                        item.status !== "pending" && "opacity-60"
                    )}
                />
                <p className="text-xs text-zinc-400 dark:text-zinc-500">
                    Add details like meeting venue, date, person met, etc.
                </p>
            </div>
        </motion.div>
    );
};

// ============================================================================
// Dropzone Component
// ============================================================================

interface DropzoneProps {
    onFilesAdded: (files: File[]) => void;
    disabled?: boolean;
}

const Dropzone: React.FC<DropzoneProps> = ({ onFilesAdded, disabled }) => {
    const [isDragActive, setIsDragActive] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!disabled) setIsDragActive(true);
    }, [disabled]);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragActive(false);
    }, []);

    const handleDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault();
            e.stopPropagation();
            setIsDragActive(false);

            if (disabled) return;

            const files = Array.from(e.dataTransfer.files);
            if (files.length > 0) {
                onFilesAdded(files);
            }
        },
        [disabled, onFilesAdded]
    );

    const handleClick = () => {
        if (!disabled) inputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length > 0) {
            onFilesAdded(files);
        }
        // Reset input
        if (inputRef.current) inputRef.current.value = "";
    };

    return (
        <motion.div
            onClick={handleClick}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            animate={{
                scale: isDragActive ? 1.02 : 1,
                borderColor: isDragActive ? "#f97316" : undefined,
            }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className={cn(
                "relative flex flex-col items-center justify-center gap-4 p-10",
                "rounded-2xl border-2 border-dashed cursor-pointer",
                "bg-zinc-50/50 dark:bg-zinc-900/50",
                "border-zinc-300 dark:border-zinc-700",
                "hover:border-orange-400 hover:bg-orange-50/30 dark:hover:bg-orange-950/10",
                "transition-colors",
                disabled && "opacity-50 cursor-not-allowed",
                isDragActive && "border-orange-500 bg-orange-50/50 dark:bg-orange-950/20"
            )}
        >
            <input
                ref={inputRef}
                type="file"
                multiple
                accept=".pdf,.png,.jpg,.jpeg,.webp,.md,.txt,.docx,.yaml,.yml,.json"
                onChange={handleFileChange}
                className="hidden"
                disabled={disabled}
            />

            <motion.div
                animate={{
                    y: isDragActive ? -5 : 0,
                    scale: isDragActive ? 1.1 : 1,
                }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
            >
                <div className="p-4 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-500">
                    <IconUpload size={32} strokeWidth={1.5} />
                </div>
            </motion.div>

            <div className="text-center">
                <p className="text-base font-medium text-zinc-700 dark:text-zinc-200">
                    {isDragActive ? "Drop files here" : "Drop files or click to upload"}
                </p>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                    PDF, Images, Markdown, Text, DOCX, YAML, JSON
                </p>
            </div>
        </motion.div>
    );
};

// ============================================================================
// Main Modal Component
// ============================================================================

export const ZeteUploadModal: React.FC<ZeteUploadModalProps> = ({
    isOpen,
    onClose,
    onUploadComplete,
}) => {
    const [files, setFiles] = useState<FileWithContext[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const { addUpload, startSSE } = useUploadContext();

    // Clear local files when modal closes (context persists active uploads)
    useEffect(() => {
        if (!isOpen) {
            const timer = setTimeout(() => {
                setFiles([]);
                setIsUploading(false);
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    // Handle adding files
    const handleFilesAdded = useCallback((newFiles: File[]) => {
        const filesWithContext: FileWithContext[] = newFiles.map((file) => ({
            id: generateId(),
            file,
            context: "",
            preview: isImageFile(file) ? URL.createObjectURL(file) : undefined,
            status: "pending",
            progress: 0,
        }));

        setFiles((prev) => [...prev, ...filesWithContext]);
    }, []);

    // Handle context change
    const handleContextChange = useCallback((id: string, context: string) => {
        setFiles((prev) =>
            prev.map((f) => (f.id === id ? { ...f, context } : f))
        );
    }, []);

    // Handle file removal
    const handleRemoveFile = useCallback((id: string) => {
        setFiles((prev) => {
            const file = prev.find((f) => f.id === id);
            if (file?.preview) {
                URL.revokeObjectURL(file.preview);
            }
            return prev.filter((f) => f.id !== id);
        });
    }, []);

    // Handle upload - async with polling
    const handleUpload = async () => {
        const pendingFiles = files.filter((f) => f.status === "pending");
        if (pendingFiles.length === 0) {
            toast.warning("No files to upload");
            return;
        }

        setIsUploading(true);

        // Process all files in parallel (non-blocking)
        const uploadPromises = pendingFiles.map(async (fileItem) => {
            // Update status to uploading
            setFiles((prev) =>
                prev.map((f) =>
                    f.id === fileItem.id ? { ...f, status: "uploading", progress: 0 } : f
                )
            );

            try {
                // Upload file and get task_id
                const response = await zeteApi.uploadDocument(
                    fileItem.file,
                    fileItem.context || undefined,
                    (progress) => {
                        setFiles((prev) =>
                            prev.map((f) =>
                                f.id === fileItem.id ? { ...f, progress } : f
                            )
                        );
                    }
                );

                // Check if we got a task_id (async mode) or immediate success (sync mode)
                if ('task_id' in response) {
                    const taskId = response.task_id;

                    // Update to processing status
                    setFiles((prev) =>
                        prev.map((f) =>
                            f.id === fileItem.id
                                ? {
                                    ...f,
                                    status: "processing",
                                    taskId,
                                    progress: 5,
                                    stepMessage: "Queued for processing..."
                                }
                                : f
                        )
                    );

                    // Add to context and start SSE (context will handle updates)
                    addUpload({
                        id: fileItem.id,
                        fileName: fileItem.file.name,
                        file: fileItem.file,
                        status: "processing",
                        progress: 5,
                        taskId,
                        stepMessage: "Queued for processing...",
                    });
                    startSSE(fileItem.id, taskId);

                    return { success: true, fileId: fileItem.id, async: true };
                } else {
                    // Sync mode response (legacy)
                    const syncResponse = response as UploadResponse;
                    if (syncResponse.success) {
                        setFiles((prev) =>
                            prev.map((f) =>
                                f.id === fileItem.id
                                    ? { ...f, status: "success", progress: 100, docId: syncResponse.doc_id }
                                    : f
                            )
                        );
                        return { success: true, fileId: fileItem.id };
                    } else {
                        setFiles((prev) =>
                            prev.map((f) =>
                                f.id === fileItem.id
                                    ? { ...f, status: "error", error: syncResponse.errors?.join(", ") || "Upload failed" }
                                    : f
                            )
                        );
                        return { success: false, fileId: fileItem.id };
                    }
                }
            } catch (err: any) {
                console.error("Upload error:", err);
                setFiles((prev) =>
                    prev.map((f) =>
                        f.id === fileItem.id
                            ? {
                                ...f,
                                status: "error",
                                error: err?.response?.data?.detail || err?.message || "Upload failed",
                            }
                            : f
                    )
                );
                return { success: false, fileId: fileItem.id };
            }
        });

        // Wait for all uploads to be dispatched
        const results = await Promise.all(uploadPromises);

        const asyncCount = results.filter((r: any) => r.async).length;
        const syncSuccessCount = results.filter((r: any) => r.success && !r.async).length;
        const errorCount = results.filter((r: any) => !r.success).length;

        setIsUploading(false);

        // Show appropriate toast
        if (asyncCount > 0) {
            toast.info(`${asyncCount} file${asyncCount > 1 ? "s" : ""} processing in background`);
        }
        if (syncSuccessCount > 0) {
            toast.success(`${syncSuccessCount} file${syncSuccessCount > 1 ? "s" : ""} processed`);
            onUploadComplete?.();
        }
        if (errorCount > 0) {
            toast.error(`${errorCount} file${errorCount > 1 ? "s" : ""} failed`);
        }
    };

    // Handle close - allow closing even if uploading (background processing)
    const handleClose = () => {
        onClose();
    };

    // Clear all completed
    const handleClearCompleted = () => {
        setFiles((prev) => prev.filter((f) => f.status === "pending"));
    };

    const pendingCount = files.filter((f) => f.status === "pending").length;
    const hasCompleted = files.some((f) => f.status === "success" || f.status === "error");

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        onClick={handleClose}
                        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                        className="fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl max-h-[90vh] overflow-hidden"
                    >
                        <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 flex flex-col max-h-[90vh]">
                            {/* Header */}
                            <div className="flex items-center justify-between p-5 border-b border-zinc-200 dark:border-zinc-800 shrink-0">
                                <div>
                                    <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                                        Upload to Emami Library
                                    </h2>
                                    <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
                                        Add documents with optional context for better results
                                    </p>
                                </div>
                                <motion.button
                                    onClick={handleClose}
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    className="p-2 rounded-lg text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-800 dark:hover:text-zinc-200 transition-colors"
                                >
                                    <IconX size={20} />
                                </motion.button>
                            </div>

                            {/* Content */}
                            <div className="flex-1 overflow-y-auto p-5">
                                <AnimatePresence mode="popLayout">
                                    {files.length === 0 ? (
                                        <motion.div
                                            key="dropzone"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                        >
                                            <Dropzone
                                                onFilesAdded={handleFilesAdded}
                                                disabled={isUploading}
                                            />
                                        </motion.div>
                                    ) : (
                                        <motion.div
                                            key="file-list"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            className="space-y-4"
                                        >
                                            {/* Add More Files Button */}
                                            <Dropzone
                                                onFilesAdded={handleFilesAdded}
                                                disabled={isUploading}
                                            />

                                            {/* File List */}
                                            <div className="space-y-4">
                                                <AnimatePresence mode="popLayout">
                                                    {files.map((item) => (
                                                        <FileItem
                                                            key={item.id}
                                                            item={item}
                                                            onContextChange={handleContextChange}
                                                            onRemove={handleRemoveFile}
                                                            disabled={isUploading}
                                                        />
                                                    ))}
                                                </AnimatePresence>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Footer */}
                            {files.length > 0 && (
                                <div className="flex items-center justify-between p-5 border-t border-zinc-200 dark:border-zinc-800 shrink-0 bg-zinc-50 dark:bg-zinc-900/50">
                                    <div className="flex items-center gap-3">
                                        {hasCompleted && !isUploading && (
                                            <motion.button
                                                initial={{ opacity: 0, scale: 0.9 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                onClick={handleClearCompleted}
                                                className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
                                            >
                                                <IconTrash size={16} />
                                                Clear completed
                                            </motion.button>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <motion.button
                                            onClick={handleClose}
                                            disabled={isUploading}
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            className="px-4 py-2 rounded-lg text-sm font-medium text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50"
                                        >
                                            {hasCompleted && !isUploading ? "Done" : "Cancel"}
                                        </motion.button>

                                        {pendingCount > 0 && (
                                            <motion.button
                                                onClick={handleUpload}
                                                disabled={isUploading}
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                className={cn(
                                                    "flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-all",
                                                    "bg-orange-500 hover:bg-orange-600 text-white shadow-lg shadow-orange-500/20",
                                                    "disabled:opacity-50 disabled:cursor-not-allowed"
                                                )}
                                            >
                                                {isUploading ? (
                                                    <>
                                                        <IconLoader2 size={16} className="animate-spin" />
                                                        Uploading...
                                                    </>
                                                ) : (
                                                    <>
                                                        <IconUpload size={16} />
                                                        Upload {pendingCount} file{pendingCount > 1 ? "s" : ""}
                                                    </>
                                                )}
                                            </motion.button>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default ZeteUploadModal;

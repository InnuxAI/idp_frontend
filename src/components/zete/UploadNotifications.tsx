"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    IconFileTypePdf,
    IconPhoto,
    IconFileText,
    IconFile,
    IconCheck,
    IconAlertCircle,
    IconLoader2,
    IconChevronDown,
    IconChevronUp,
    IconX,
} from "@tabler/icons-react";
import { ProcessingStep, STEP_LABELS } from "@/types/zete-types";
import { useUploadContext, UploadItem } from "@/contexts/upload-context";
import { cn } from "@/lib/utils";

// ============================================================================
// Utility Functions
// ============================================================================

const getFileIcon = (fileName: string) => {
    const ext = fileName.split(".").pop()?.toLowerCase();
    if (["pdf"].includes(ext || "")) return IconFileTypePdf;
    if (["png", "jpg", "jpeg", "webp", "gif"].includes(ext || "")) return IconPhoto;
    if (["md", "txt", "doc", "docx"].includes(ext || "")) return IconFileText;
    return IconFile;
};

// ============================================================================
// Upload Notification Dropdown Component
// ============================================================================

interface UploadNotificationsProps {
    onAllComplete?: () => void;
}

export const UploadNotifications: React.FC<UploadNotificationsProps> = ({
    onAllComplete,
}) => {
    const { uploads, removeUpload, clearCompleted } = useUploadContext();
    const [isOpen, setIsOpen] = useState(false);
    const [hasNew, setHasNew] = useState(false);
    const [prevActiveCount, setPrevActiveCount] = useState(0);

    const activeUploads = uploads.filter(
        (u) => u.status === "uploading" || u.status === "processing" || u.status === "pending"
    );
    const completedUploads = uploads.filter((u) => u.status === "success" || u.status === "error");

    // Auto-open when new uploads start
    useEffect(() => {
        if (activeUploads.length > 0) {
            setIsOpen(true);
            setHasNew(true);
        }
    }, [activeUploads.length]);

    // Clear "new" badge when opened
    useEffect(() => {
        if (isOpen) {
            const timer = setTimeout(() => setHasNew(false), 500);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    // Detect when all uploads complete and trigger callback
    useEffect(() => {
        if (prevActiveCount > 0 && activeUploads.length === 0 && onAllComplete) {
            console.log("[UploadNotifications] All uploads complete, triggering refresh");
            onAllComplete();
        }
        setPrevActiveCount(activeUploads.length);
    }, [activeUploads.length, onAllComplete, prevActiveCount]);

    if (uploads.length === 0) return null;

    const totalActiveCount = activeUploads.length;
    const showBadge = totalActiveCount > 0;

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
            {/* Dropdown Panel */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                        className="w-96 max-h-[32rem] bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 flex flex-col overflow-hidden"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
                            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                                Upload Queue
                            </h3>
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-zinc-500 dark:text-zinc-400">
                                    {totalActiveCount} active
                                </span>
                                {completedUploads.length > 0 && (
                                    <button
                                        onClick={clearCompleted}
                                        className="text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
                                    >
                                        Clear done
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Upload List */}
                        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2">
                            {/* Active Uploads */}
                            {activeUploads.map((item) => (
                                <UploadNotificationItem key={item.id} item={item} />
                            ))}

                            {/* Completed Uploads */}
                            {completedUploads.length > 0 && (
                                <div className="pt-2">
                                    <div className="text-xs text-zinc-400 dark:text-zinc-500 px-2 pb-1">
                                        Completed
                                    </div>
                                    {completedUploads.slice(0, 5).map((item) => (
                                        <UploadNotificationItem
                                            key={item.id}
                                            item={item}
                                            onClear={() => removeUpload(item.id)}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Toggle Button */}
            <motion.button
                onClick={() => setIsOpen(!isOpen)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={cn(
                    "relative flex items-center gap-2 px-4 py-3 rounded-full shadow-lg transition-colors",
                    showBadge
                        ? "bg-blue-500 text-white hover:bg-blue-600"
                        : "bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700"
                )}
            >
                {/* New uploads pulse */}
                {hasNew && showBadge && (
                    <motion.div
                        className="absolute inset-0 rounded-full bg-blue-400"
                        initial={{ scale: 1, opacity: 0.6 }}
                        animate={{ scale: 1.5, opacity: 0 }}
                        transition={{ duration: 1, repeat: Infinity }}
                    />
                )}

                <IconLoader2
                    size={18}
                    className={cn(showBadge && "animate-spin")}
                />
                <span className="text-sm font-medium">
                    {showBadge ? `${totalActiveCount} uploading` : "Uploads"}
                </span>
                {isOpen ? <IconChevronDown size={16} /> : <IconChevronUp size={16} />}

                {/* Badge */}
                {showBadge && (
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-1 -right-1 w-5 h-5 bg-orange-500 text-white text-xs font-bold rounded-full flex items-center justify-center"
                    >
                        {totalActiveCount}
                    </motion.div>
                )}
            </motion.button>
        </div>
    );
};

// ============================================================================
// Individual Upload Item Component
// ============================================================================

interface UploadNotificationItemProps {
    item: UploadItem;
    onClear?: () => void;
}

const UploadNotificationItem: React.FC<UploadNotificationItemProps> = ({ item, onClear }) => {
    const FileIcon = getFileIcon(item.fileName);

    const isActive = item.status === "uploading" || item.status === "processing";
    const isComplete = item.status === "success";
    const isError = item.status === "error";

    return (
        <motion.div
            layout
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className={cn(
                "flex items-start gap-3 p-3 rounded-lg transition-colors",
                isActive && "bg-blue-50 dark:bg-blue-950/20",
                isComplete && "bg-emerald-50 dark:bg-emerald-950/20",
                isError && "bg-red-50 dark:bg-red-950/20",
                !isActive && !isComplete && !isError && "bg-zinc-50 dark:bg-zinc-800/50"
            )}
        >
            {/* File Icon */}
            <div className={cn(
                "shrink-0 p-2 rounded-lg",
                isActive && "bg-blue-100 dark:bg-blue-900/30",
                isComplete && "bg-emerald-100 dark:bg-emerald-900/30",
                isError && "bg-red-100 dark:bg-red-900/30"
            )}>
                <FileIcon size={16} className={cn(
                    isActive && "text-blue-600 dark:text-blue-400",
                    isComplete && "text-emerald-600 dark:text-emerald-400",
                    isError && "text-red-600 dark:text-red-400"
                )} />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">
                    {item.fileName}
                </p>

                {/* Progress/Status */}
                {isActive && (
                    <div className="mt-1">
                        <div className="flex items-center justify-between text-xs mb-1">
                            <span className="text-blue-600 dark:text-blue-400 truncate">
                                {item.stepMessage || "Processing..."}
                            </span>
                            <span className="text-blue-600 dark:text-blue-400 font-medium ml-2">
                                {item.progress}%
                            </span>
                        </div>
                        <div className="h-1 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                            <motion.div
                                className="h-full bg-blue-500"
                                initial={{ width: 0 }}
                                animate={{ width: `${item.progress}%` }}
                                transition={{ ease: "easeOut" }}
                            />
                        </div>
                    </div>
                )}

                {isComplete && (
                    <div className="flex items-center gap-1 mt-1 text-xs text-emerald-600 dark:text-emerald-400">
                        <IconCheck size={12} />
                        <span>Added to Knowledge Graph</span>
                    </div>
                )}

                {isError && (
                    <div className="flex items-center gap-1 mt-1 text-xs text-red-600 dark:text-red-400">
                        <IconAlertCircle size={12} />
                        <span className="truncate">{item.error || "Failed"}</span>
                    </div>
                )}
            </div>

            {/* Clear button for completed items */}
            {(isComplete || isError) && onClear && (
                <button
                    onClick={onClear}
                    className="shrink-0 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
                >
                    <IconX size={14} />
                </button>
            )}
        </motion.div>
    );
};

// Re-export UploadItem type for backwards compatibility
export type { UploadItem };

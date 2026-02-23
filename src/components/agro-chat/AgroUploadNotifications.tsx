"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    IconCheck, IconAlertCircle, IconLoader2,
    IconChevronDown, IconChevronUp, IconLeaf,
} from "@tabler/icons-react";
import { agroApi } from "../../lib/agro-api";

// ============================================================================
// Types
// ============================================================================

interface AgroUploadNotificationsProps {
    onAllComplete?: () => void;
}

interface IngestStatus {
    id: string;          // task_id from backend
    label: string;       // filename
    status: "running" | "completed" | "failed";
    progress: number;    // 0-100
    step?: string;       // current_step from SSE
    detail?: string;     // step_message
    chunks?: number;
    startedAt: number;
}

// ============================================================================
// Notification Bus — shared between modal and notification widget
// ============================================================================

export const agroNotificationBus = {
    _listeners: new Set<(items: IngestStatus[]) => void>(),
    _items: [] as IngestStatus[],
    _sseConnections: new Map<string, EventSource>(),

    /**
     * Add a new ingestion task and start SSE tracking.
     * Called from the upload modal after files are dispatched.
     */
    addIngestTask(taskId: string, label: string) {
        // Don't add duplicates
        if (this._items.some((x) => x.id === taskId)) return;

        this._items = [
            ...this._items,
            {
                id: taskId,
                label,
                status: "running",
                progress: 0,
                detail: "Queued for processing…",
                startedAt: Date.now(),
            },
        ];
        this._emit();

        // Start SSE streaming for this task
        this._startSSE(taskId);
    },

    _startSSE(taskId: string) {
        // Close existing connection if any
        if (this._sseConnections.has(taskId)) {
            this._sseConnections.get(taskId)?.close();
        }

        const eventSource = agroApi.streamTaskStatus(
            taskId,
            // onStatus
            (data) => {
                this._items = this._items.map((x) =>
                    x.id === taskId
                        ? {
                            ...x,
                            progress: data.progress,
                            step: data.current_step,
                            detail: data.step_message || "Processing…",
                        }
                        : x
                );
                this._emit();
            },
            // onComplete
            (data) => {
                const isSkipped = data.chunks === 0;
                this._items = this._items.map((x) =>
                    x.id === taskId
                        ? {
                            ...x,
                            status: "completed",
                            progress: 100,
                            detail: isSkipped
                                ? "Already ingested — skipped"
                                : data.step_message || `Done — ${data.chunks || 0} chunks`,
                            chunks: data.chunks,
                        }
                        : x
                );
                this._emit();
                this._sseConnections.delete(taskId);
            },
            // onError
            (data) => {
                this._items = this._items.map((x) =>
                    x.id === taskId
                        ? {
                            ...x,
                            status: "failed",
                            progress: -1,
                            detail: data?.error || data?.step_message || "Processing failed",
                        }
                        : x
                );
                this._emit();
                this._sseConnections.delete(taskId);
            },
        );

        this._sseConnections.set(taskId, eventSource);

        // Safety: close SSE after 5 minutes
        setTimeout(() => {
            if (this._sseConnections.has(taskId)) {
                eventSource.close();
                this._sseConnections.delete(taskId);
                const item = this._items.find((x) => x.id === taskId);
                if (item && item.status === "running") {
                    this.updateIngest(taskId, {
                        status: "completed",
                        detail: "Check collection stats for results",
                    });
                }
            }
        }, 300000);
    },

    updateIngest(id: string, update: Partial<IngestStatus>) {
        this._items = this._items.map((x) => (x.id === id ? { ...x, ...update } : x));
        this._emit();
    },

    removeIngest(id: string) {
        // Close SSE if still open
        if (this._sseConnections.has(id)) {
            this._sseConnections.get(id)?.close();
            this._sseConnections.delete(id);
        }
        this._items = this._items.filter((x) => x.id !== id);
        this._emit();
    },

    subscribe(fn: (items: IngestStatus[]) => void) {
        this._listeners.add(fn);
        return () => this._listeners.delete(fn);
    },

    _emit() {
        this._listeners.forEach((fn) => fn([...this._items]));
    },
};

// ============================================================================
// Step label display
// ============================================================================

const STEP_DISPLAY: Record<string, string> = {
    queued: "Queued",
    uploading: "Downloading…",
    parsing: "Parsing document…",
    chunking: "Chunking text…",
    embedding: "Creating embeddings…",
    indexing: "Indexing…",
    completed: "Complete",
    failed: "Failed",
};

function getStepLabel(step?: string, detail?: string): string {
    if (detail) return detail;
    if (step && STEP_DISPLAY[step]) return STEP_DISPLAY[step];
    return "Processing…";
}

// ============================================================================
// Status Icon
// ============================================================================

const StatusIcon = ({ status }: { status: IngestStatus["status"] }) => {
    switch (status) {
        case "completed": return <IconCheck size={14} className="text-emerald-500" />;
        case "failed": return <IconAlertCircle size={14} className="text-red-500" />;
        default: return <IconLoader2 size={14} className="text-emerald-500 animate-spin" />;
    }
};

// ============================================================================
// Main Component
// ============================================================================

export function AgroUploadNotifications({ onAllComplete }: AgroUploadNotificationsProps) {
    const [items, setItems] = useState<IngestStatus[]>([]);
    const [expanded, setExpanded] = useState(true);

    useEffect(() => {
        const unsub = agroNotificationBus.subscribe((newItems) => {
            setItems(newItems);

            // Auto-dismiss completed/failed items after 8s
            newItems.forEach((item) => {
                if (item.status === "completed" || item.status === "failed") {
                    setTimeout(() => {
                        agroNotificationBus.removeIngest(item.id);

                        // If all items are done, notify parent
                        const remaining = agroNotificationBus._items.filter(
                            (x) => x.status === "running"
                        );
                        if (remaining.length === 0) {
                            onAllComplete?.();
                        }
                    }, 8000);
                }
            });
        });
        return () => { unsub(); };
    }, [onAllComplete]);

    if (items.length === 0) return null;

    const pending = items.filter((t) => t.status === "running").length;
    const completed = items.filter((t) => t.status === "completed").length;
    const failed = items.filter((t) => t.status === "failed").length;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed bottom-4 right-4 z-50 w-80 bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl shadow-black/10 dark:shadow-black/30 border border-gray-100 dark:border-zinc-800 overflow-hidden"
        >
            {/* Header */}
            <div
                className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-zinc-800 cursor-pointer select-none"
                onClick={() => setExpanded((v) => !v)}
            >
                <div className="flex items-center gap-2.5">
                    <div className="relative">
                        <IconLeaf size={16} className="text-emerald-500" />
                        {pending > 0 && (
                            <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-600 text-white text-[8px] font-bold rounded-full flex items-center justify-center">
                                {pending}
                            </span>
                        )}
                    </div>
                    <span className="text-xs font-semibold text-gray-900 dark:text-zinc-100">
                        Agro Ingestion
                    </span>
                    {/* Summary badges */}
                    <div className="flex items-center gap-1 ml-1">
                        {completed > 0 && (
                            <span className="text-[9px] bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 px-1.5 py-0.5 rounded-full font-medium">
                                {completed} done
                            </span>
                        )}
                        {failed > 0 && (
                            <span className="text-[9px] bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 px-1.5 py-0.5 rounded-full font-medium">
                                {failed} failed
                            </span>
                        )}
                    </div>
                </div>
                {expanded ? (
                    <IconChevronDown size={14} className="text-gray-400" />
                ) : (
                    <IconChevronUp size={14} className="text-gray-400" />
                )}
            </div>

            {/* Task list */}
            <AnimatePresence>
                {expanded && (
                    <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: "auto" }}
                        exit={{ height: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="p-3 space-y-2 max-h-[280px] overflow-y-auto">
                            {items.map((item) => (
                                <div
                                    key={item.id}
                                    className="px-3 py-2.5 rounded-lg bg-gray-50 dark:bg-zinc-800/50 border border-gray-100 dark:border-zinc-700"
                                >
                                    <div className="flex items-start gap-2.5">
                                        <div className="mt-0.5 shrink-0">
                                            <StatusIcon status={item.status} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-medium text-gray-800 dark:text-zinc-200 truncate">
                                                {item.label}
                                            </p>
                                            <p className="text-[10px] text-gray-400 dark:text-zinc-500 mt-0.5">
                                                {getStepLabel(item.step, item.detail)}
                                            </p>
                                        </div>
                                        <span className={`text-[10px] font-semibold shrink-0 mt-0.5 ${item.status === "completed"
                                            ? "text-emerald-500"
                                            : item.status === "failed"
                                                ? "text-red-500"
                                                : "text-emerald-500"
                                            }`}>
                                            {item.status === "completed"
                                                ? "Done"
                                                : item.status === "failed"
                                                    ? "Failed"
                                                    : `${Math.max(0, item.progress)}%`}
                                        </span>
                                    </div>

                                    {/* Progress bar */}
                                    {item.status === "running" && item.progress >= 0 && (
                                        <div className="mt-2 h-1 bg-gray-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                                            <motion.div
                                                className="h-full bg-emerald-500 rounded-full"
                                                initial={{ width: 0 }}
                                                animate={{ width: `${item.progress}%` }}
                                                transition={{ duration: 0.5, ease: "easeOut" }}
                                            />
                                        </div>
                                    )}
                                    {item.status === "completed" && (
                                        <div className="mt-2 h-1 bg-emerald-500 rounded-full" />
                                    )}
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

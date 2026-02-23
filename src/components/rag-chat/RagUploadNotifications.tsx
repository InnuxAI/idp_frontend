"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { IconCheck, IconAlertCircle, IconLoader2, IconChevronDown, IconChevronUp, IconBell } from "@tabler/icons-react";
import { ragApi, RagTaskStatus } from "../../lib/rag-api";

/**
 * Notification singleton that stores active RAG task pollers.
 * Components call addTask() to register a new task for polling.
 */
export const ragNotificationBus = {
    _listeners: new Set<(tasks: ActiveTask[]) => void>(),
    _tasks: [] as ActiveTask[],

    addTask(taskId: string, filename: string) {
        this._tasks = [
            ...this._tasks,
            { taskId, filename, status: "pending" as RagTaskStatus["status"], step: "Queued" },
        ];
        this._emit();
    },

    updateTask(taskId: string, update: Partial<ActiveTask>) {
        this._tasks = this._tasks.map((t) =>
            t.taskId === taskId ? { ...t, ...update } : t
        );
        this._emit();
    },

    removeTask(taskId: string) {
        this._tasks = this._tasks.filter((t) => t.taskId !== taskId);
        this._emit();
    },

    subscribe(fn: (tasks: ActiveTask[]) => void) {
        this._listeners.add(fn);
        return () => this._listeners.delete(fn);
    },

    _emit() {
        this._listeners.forEach((fn) => fn([...this._tasks]));
    },
};

interface ActiveTask {
    taskId: string;
    filename: string;
    status: RagTaskStatus["status"];
    step: string;
    error?: string;
}

interface RagUploadNotificationsProps {
    onAllComplete?: () => void;
}

const STATUS_LABEL: Record<ActiveTask["status"], string> = {
    pending: "Queued",
    converting: "Converting PDF…",
    vector_indexing: "Indexing vectors…",
    graph_building: "Building graph…",
    completed: "Done",
    failed: "Failed",
};

const StatusIcon = ({ status }: { status: ActiveTask["status"] }) => {
    switch (status) {
        case "completed": return <IconCheck size={14} className="text-emerald-500" />;
        case "failed": return <IconAlertCircle size={14} className="text-red-500" />;
        default: return <IconLoader2 size={14} className="text-violet-500 animate-spin" />;
    }
};

export function RagUploadNotifications({ onAllComplete }: RagUploadNotificationsProps) {
    const [tasks, setTasks] = useState<ActiveTask[]>([]);
    const [expanded, setExpanded] = useState(true);
    const pollersRef = useRef<Map<string, () => void>>(new Map());

    // Subscribe to bus
    useEffect(() => {
        const unsub = ragNotificationBus.subscribe((newTasks) => {
            setTasks(newTasks);

            // Start pollers for any tasks without one
            newTasks.forEach((t) => {
                if (!pollersRef.current.has(t.taskId)) {
                    const cleanup = ragApi.pollTaskStatus(
                        t.taskId,
                        (status: RagTaskStatus) => {
                            ragNotificationBus.updateTask(t.taskId, {
                                status: status.status,
                                step: status.step,
                                error: status.error || undefined,
                            });

                            if (status.status === "completed" || status.status === "failed") {
                                pollersRef.current.get(t.taskId)?.();
                                pollersRef.current.delete(t.taskId);

                                // Auto-dismiss after 5 s
                                setTimeout(() => {
                                    ragNotificationBus.removeTask(t.taskId);
                                    onAllComplete?.();
                                }, 5000);
                            }
                        }
                    );
                    pollersRef.current.set(t.taskId, cleanup);
                }
            });
        });

        return () => { unsub(); pollersRef.current.forEach((c) => c()); };
    }, [onAllComplete]);

    if (tasks.length === 0) return null;

    const pending = tasks.filter((t) => t.status !== "completed" && t.status !== "failed").length;

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
                        <IconBell size={16} className="text-violet-500" />
                        {pending > 0 && (
                            <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-violet-600 text-white text-[8px] font-bold rounded-full flex items-center justify-center">
                                {pending}
                            </span>
                        )}
                    </div>
                    <span className="text-xs font-semibold text-gray-900 dark:text-zinc-100">
                        RAG Ingestion
                    </span>
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
                        <div className="p-3 space-y-2 max-h-[240px] overflow-y-auto">
                            {tasks.map((task) => (
                                <div
                                    key={task.taskId}
                                    className="flex items-start gap-2.5 px-3 py-2 rounded-lg bg-gray-50 dark:bg-zinc-800/50 border border-gray-100 dark:border-zinc-700"
                                >
                                    <div className="mt-0.5 shrink-0">
                                        <StatusIcon status={task.status} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-medium text-gray-800 dark:text-zinc-200 truncate">
                                            {task.filename}
                                        </p>
                                        <p className="text-[10px] text-gray-400 dark:text-zinc-500 mt-0.5">
                                            {task.error || task.step || STATUS_LABEL[task.status]}
                                        </p>
                                    </div>
                                    <span className={`text-[10px] font-semibold shrink-0 mt-0.5 ${task.status === "completed"
                                        ? "text-emerald-500"
                                        : task.status === "failed"
                                            ? "text-red-500"
                                            : "text-violet-500"
                                        }`}>
                                        {STATUS_LABEL[task.status]}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

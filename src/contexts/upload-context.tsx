"use client";

import React, {
    createContext,
    useContext,
    useState,
    useEffect,
    useCallback,
    useRef,
} from "react";
import { ProcessingStep, STEP_LABELS } from "@/types/zete-types";

// ============================================================================
// Types
// ============================================================================

export interface UploadItem {
    id: string;
    fileName: string;
    file?: File;
    status: "pending" | "uploading" | "processing" | "success" | "error";
    progress: number;
    taskId?: string;
    docId?: string;
    currentStep?: ProcessingStep;
    stepMessage?: string;
    error?: string;
}

interface UploadContextType {
    uploads: UploadItem[];
    addUpload: (item: UploadItem) => void;
    updateUpload: (id: string, updates: Partial<UploadItem>) => void;
    removeUpload: (id: string) => void;
    clearCompleted: () => void;
    startSSE: (id: string, taskId: string) => void;
    stopAllSSE: () => void;
}

const UploadContext = createContext<UploadContextType | undefined>(undefined);

// ============================================================================
// Provider Component
// ============================================================================

export function UploadProvider({ children }: { children: React.ReactNode }) {
    const [uploads, setUploads] = useState<UploadItem[]>([]);
    const sseConnections = useRef<Map<string, EventSource>>(new Map());

    // Load uploads from sessionStorage on mount (persists across page navigation)
    useEffect(() => {
        if (typeof window !== "undefined") {
            const saved = sessionStorage.getItem("activeUploads");
            if (saved) {
                try {
                    const parsed = JSON.parse(saved) as UploadItem[];
                    // Filter out completed items older than session
                    const activeUploads = parsed.filter(
                        (u) => u.status === "processing" || u.status === "uploading"
                    );
                    setUploads(activeUploads);

                    // Reconnect SSE for active uploads
                    activeUploads.forEach((upload) => {
                        if (upload.taskId) {
                            // Small delay to ensure component is mounted
                            setTimeout(() => {
                                startSSEConnection(upload.id, upload.taskId!);
                            }, 100);
                        }
                    });
                } catch (error) {
                    console.error("Error loading uploads from session:", error);
                }
            }
        }
    }, []);

    // Save uploads to sessionStorage whenever they change
    useEffect(() => {
        if (typeof window !== "undefined") {
            // Only save active uploads (not pending or completed)
            const toSave = uploads.filter(
                (u) => u.status === "processing" || u.status === "uploading"
            );
            sessionStorage.setItem("activeUploads", JSON.stringify(toSave));
        }
    }, [uploads]);

    // Cleanup SSE connections on unmount
    useEffect(() => {
        return () => {
            sseConnections.current.forEach((es) => es.close());
            sseConnections.current.clear();
        };
    }, []);

    // Start SSE connection for a task
    const startSSEConnection = useCallback((id: string, taskId: string) => {
        // Close existing connection if any
        if (sseConnections.current.has(id)) {
            sseConnections.current.get(id)?.close();
        }

        // Get auth token - check both sessionStorage and localStorage (matching auth-api.ts logic)
        let token: string | null = null;
        if (typeof window !== "undefined") {
            // First check session storage
            token = sessionStorage.getItem("auth_token");
            // Then check localStorage if remember me was used
            if (!token && localStorage.getItem("auth_remember") === "true") {
                token = localStorage.getItem("auth_token");
            }
        }

        if (!token) {
            console.error("[UploadContext] No auth token for SSE");
            return;
        }

        // SSE needs to connect directly to backend (Next.js doesn't proxy EventSource)
        const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
        const url = `${apiBaseUrl}/api/zete/tasks/${taskId}/stream?token=${encodeURIComponent(token)}`;
        console.log(`[UploadContext] Starting SSE for ${id}`);
        const eventSource = new EventSource(url);

        eventSource.onopen = () => {
            console.log(`[UploadContext] SSE connected for ${id}`);
        };

        eventSource.addEventListener("status", (event) => {
            try {
                const data = JSON.parse(event.data);
                setUploads((prev) =>
                    prev.map((u) =>
                        u.id === id
                            ? {
                                ...u,
                                progress: data.progress,
                                currentStep: data.current_step as ProcessingStep,
                                stepMessage:
                                    data.step_message ||
                                    STEP_LABELS[data.current_step as ProcessingStep] ||
                                    "Processing...",
                            }
                            : u
                    )
                );
            } catch (e) {
                console.error("[UploadContext] Error parsing SSE status:", e);
            }
        });

        eventSource.addEventListener("complete", (event) => {
            try {
                const data = JSON.parse(event.data);
                console.log(`[UploadContext] SSE complete for ${id}:`, data);
                setUploads((prev) =>
                    prev.map((u) =>
                        u.id === id
                            ? {
                                ...u,
                                status: "success",
                                progress: 100,
                                docId: data.doc_id,
                                stepMessage: "Complete!",
                            }
                            : u
                    )
                );
                eventSource.close();
                sseConnections.current.delete(id);
            } catch (e) {
                console.error("[UploadContext] Error parsing SSE complete:", e);
            }
        });

        eventSource.addEventListener("error", (event) => {
            // Check if it's an SSE event with data or a connection error
            if (event instanceof MessageEvent) {
                try {
                    const data = JSON.parse(event.data);
                    console.log(`[UploadContext] SSE error event for ${id}:`, data);
                    setUploads((prev) =>
                        prev.map((u) =>
                            u.id === id
                                ? {
                                    ...u,
                                    status: "error",
                                    error: data.error || "Processing failed",
                                }
                                : u
                        )
                    );
                } catch (e) {
                    console.error("[UploadContext] Error parsing SSE error event:", e);
                }
            } else {
                console.error(`[UploadContext] SSE connection error for ${id}`);
            }
            eventSource.close();
            sseConnections.current.delete(id);
        });

        sseConnections.current.set(id, eventSource);
    }, []);

    // Add a new upload
    const addUpload = useCallback((item: UploadItem) => {
        setUploads((prev) => {
            // Check if already exists
            const exists = prev.some((u) => u.id === item.id);
            if (exists) {
                return prev.map((u) => (u.id === item.id ? { ...u, ...item } : u));
            }
            return [...prev, item];
        });
    }, []);

    // Update an existing upload
    const updateUpload = useCallback((id: string, updates: Partial<UploadItem>) => {
        setUploads((prev) =>
            prev.map((u) => (u.id === id ? { ...u, ...updates } : u))
        );
    }, []);

    // Remove an upload
    const removeUpload = useCallback((id: string) => {
        // Close SSE connection if exists
        if (sseConnections.current.has(id)) {
            sseConnections.current.get(id)?.close();
            sseConnections.current.delete(id);
        }
        setUploads((prev) => prev.filter((u) => u.id !== id));
    }, []);

    // Clear all completed uploads
    const clearCompleted = useCallback(() => {
        setUploads((prev) =>
            prev.filter((u) => u.status !== "success" && u.status !== "error")
        );
    }, []);

    // Start SSE for a specific upload
    const startSSE = useCallback(
        (id: string, taskId: string) => {
            startSSEConnection(id, taskId);
        },
        [startSSEConnection]
    );

    // Stop all SSE connections
    const stopAllSSE = useCallback(() => {
        sseConnections.current.forEach((es) => es.close());
        sseConnections.current.clear();
    }, []);

    return (
        <UploadContext.Provider
            value={{
                uploads,
                addUpload,
                updateUpload,
                removeUpload,
                clearCompleted,
                startSSE,
                stopAllSSE,
            }}
        >
            {children}
        </UploadContext.Provider>
    );
}

// ============================================================================
// Hook
// ============================================================================

export function useUploadContext() {
    const context = useContext(UploadContext);
    if (context === undefined) {
        throw new Error("useUploadContext must be used within an UploadProvider");
    }
    return context;
}

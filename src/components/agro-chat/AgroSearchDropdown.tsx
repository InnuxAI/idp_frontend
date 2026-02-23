"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    IconSearch, IconX, IconLoader2, IconLeaf, IconDatabase,
} from "@tabler/icons-react";
import { agroApi } from "@/lib/agro-api";

interface AgroSearchDropdownProps {
    onSelectDocument?: (documentId: string) => void;
}

/**
 * Search dropdown for Agro Chat — shows collection stats from ChromaDB.
 * Since healthy_food_rag doesn't have a document listing endpoint,
 * this shows the collection's chunk count and health status.
 */
export function AgroSearchDropdown({ onSelectDocument }: AgroSearchDropdownProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [stats, setStats] = useState<{ collection: string; total_chunks: number } | null>(null);
    const [health, setHealth] = useState<Record<string, unknown> | null>(null);
    const [error, setError] = useState<string | null>(null);

    const containerRef = useRef<HTMLDivElement>(null);

    // Fetch stats when dropdown opens
    useEffect(() => {
        if (isOpen && !stats) {
            setLoading(true);
            setError(null);
            Promise.all([
                agroApi.getCollectionStats().catch((e) => {
                    console.warn("[AgroSearch] Stats fetch failed:", e);
                    return null;
                }),
                agroApi.health().catch((e) => {
                    console.warn("[AgroSearch] Health check failed:", e);
                    return null;
                }),
            ])
                .then(([statsResp, healthResp]) => {
                    if (statsResp) setStats(statsResp);
                    if (healthResp) setHealth(healthResp);
                    if (!statsResp && !healthResp) {
                        setError("Could not connect to Agro service. Is it running on port 8060?");
                    }
                })
                .finally(() => setLoading(false));
        }
    }, [isOpen, stats]);

    // Close on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        if (isOpen) document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [isOpen]);

    // Escape key
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.key === "Escape" && isOpen) setIsOpen(false);
        };
        document.addEventListener("keydown", handler);
        return () => document.removeEventListener("keydown", handler);
    }, [isOpen]);

    const handleRefresh = () => {
        setStats(null);
        setHealth(null);
        setError(null);
    };

    const dropdownVariants = {
        hidden: { opacity: 0, scale: 0.85, y: -20 },
        visible: {
            opacity: 1, scale: 1, y: 0,
            transition: { type: "spring" as const, stiffness: 350, damping: 18, mass: 0.8 },
        },
        exit: {
            opacity: 0, scale: 0.9, y: -15,
            transition: { type: "spring" as const, stiffness: 400, damping: 25 },
        },
    };

    return (
        <div ref={containerRef} className="relative">
            <motion.button
                onClick={() => { setIsOpen(!isOpen); if (!isOpen) handleRefresh(); }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors shadow-md ${isOpen
                    ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/30"
                    : "bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/20"
                    }`}
            >
                <IconSearch size={14} />
                <span className="hidden sm:inline">Search</span>
            </motion.button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        variants={dropdownVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        className="absolute right-0 top-full mt-2 w-[340px] bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-700 shadow-2xl shadow-black/10 dark:shadow-black/30 overflow-hidden z-50"
                        style={{ transformOrigin: "top right" }}
                    >
                        {/* Header */}
                        <div className="px-4 py-3 border-b border-gray-100 dark:border-zinc-800 flex items-center gap-2">
                            <IconDatabase size={16} className="text-emerald-500" />
                            <span className="text-sm font-semibold text-gray-900 dark:text-zinc-100">
                                Agro Knowledge Base
                            </span>
                        </div>

                        {/* Content */}
                        <div className="p-4">
                            {loading ? (
                                <div className="flex items-center justify-center py-8 gap-2 text-gray-400">
                                    <IconLoader2 size={16} className="animate-spin text-emerald-500" />
                                    <span className="text-sm">Loading stats...</span>
                                </div>
                            ) : error ? (
                                <div className="py-6 text-center">
                                    <p className="text-sm text-red-500 dark:text-red-400">{error}</p>
                                    <p className="text-xs text-gray-400 mt-2">
                                        Start the server with:<br />
                                        <code className="text-[10px] bg-gray-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded font-mono">
                                            cd healthy_food_rag && uvicorn healthy_food_rag.main:app --port 8060
                                        </code>
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {/* Collection Stats */}
                                    {stats && (
                                        <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800/30">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-[10px] uppercase tracking-wider text-emerald-600 dark:text-emerald-400 font-semibold">
                                                    Collection
                                                </span>
                                                <span className="text-xs font-medium text-emerald-700 dark:text-emerald-300">
                                                    {stats.collection}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs text-gray-500 dark:text-zinc-400">
                                                    Total chunks indexed
                                                </span>
                                                <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                                                    {stats.total_chunks.toLocaleString()}
                                                </span>
                                            </div>
                                        </div>
                                    )}

                                    {/* Health Info */}
                                    {health && (
                                        <div className="space-y-1.5">
                                            {Object.entries(health)
                                                .filter(([k]) => k !== "status")
                                                .map(([k, v]) => (
                                                    <div key={k} className="flex items-center justify-between text-xs">
                                                        <span className="text-gray-400 dark:text-zinc-500 capitalize">
                                                            {k.replace(/_/g, " ")}
                                                        </span>
                                                        <span className="text-gray-700 dark:text-zinc-300 font-mono text-[11px]">
                                                            {String(v)}
                                                        </span>
                                                    </div>
                                                ))}
                                        </div>
                                    )}

                                    {/* Status badge */}
                                    {health && (
                                        <div className="flex items-center justify-center gap-2 pt-2">
                                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                            <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                                                Service Online
                                            </span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default AgroSearchDropdown;

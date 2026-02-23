"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    IconSearch, IconX, IconLoader2, IconFile, IconChevronRight,
} from "@tabler/icons-react";
import { ragApi, RagDocument } from "@/lib/rag-api";

interface RagSearchDropdownProps {
    onSelectDocument?: (documentId: string) => void;
}

/**
 * Live-search dropdown for RAG documents (title-based).
 * Because agentic-rag doesn't have a Meilisearch endpoint yet,
 * we fetch all documents and filter client-side.
 */
export function RagSearchDropdown({ onSelectDocument }: RagSearchDropdownProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [allDocs, setAllDocs] = useState<RagDocument[]>([]);
    const [filtered, setFiltered] = useState<RagDocument[]>([]);
    const [loading, setLoading] = useState(false);

    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Fetch document list when dropdown opens
    useEffect(() => {
        if (isOpen && allDocs.length === 0) {
            setLoading(true);
            ragApi.listDocuments()
                .then((docs) => {
                    setAllDocs(docs);
                    setFiltered(docs.slice(0, 20));
                })
                .catch(console.error)
                .finally(() => setLoading(false));
        }
        if (isOpen) setTimeout(() => inputRef.current?.focus(), 80);
    }, [isOpen]);

    // Close on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
                setQuery("");
            }
        };
        if (isOpen) document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [isOpen]);

    // Escape key
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.key === "Escape" && isOpen) { setIsOpen(false); setQuery(""); }
        };
        document.addEventListener("keydown", handler);
        return () => document.removeEventListener("keydown", handler);
    }, [isOpen]);

    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setQuery(val);
        if (!val.trim()) {
            setFiltered(allDocs.slice(0, 20));
            return;
        }
        const q = val.toLowerCase();
        setFiltered(
            allDocs.filter((d) =>
                d.title.toLowerCase().includes(q) || d.source?.toLowerCase().includes(q)
            ).slice(0, 20)
        );
    }, [allDocs]);

    const handleSelect = (doc: RagDocument) => {
        onSelectDocument?.(doc.id);
        setIsOpen(false);
        setQuery("");
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
                onClick={() => setIsOpen(!isOpen)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors shadow-md ${isOpen
                    ? "bg-violet-600 hover:bg-violet-700 text-white shadow-violet-500/30"
                    : "bg-violet-500 hover:bg-violet-600 text-white shadow-violet-500/20"
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
                        className="absolute right-0 top-full mt-2 w-[380px] bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-700 shadow-2xl shadow-black/10 dark:shadow-black/30 overflow-hidden z-50"
                        style={{ transformOrigin: "top right" }}
                    >
                        {/* Input */}
                        <div className="p-3 border-b border-gray-100 dark:border-zinc-800">
                            <div className="relative">
                                <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={query}
                                    onChange={handleInputChange}
                                    placeholder="Search RAG documents..."
                                    className="w-full pl-10 pr-10 py-2.5 text-sm border border-gray-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent bg-gray-50 dark:bg-zinc-800 dark:text-white placeholder-gray-400"
                                />
                                {loading && (
                                    <IconLoader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-violet-500 animate-spin" />
                                )}
                                {!loading && query && (
                                    <motion.button
                                        onClick={() => { setQuery(""); setFiltered(allDocs.slice(0, 20)); inputRef.current?.focus(); }}
                                        whileHover={{ scale: 1.1 }}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 flex items-center justify-center rounded-full bg-gray-200 dark:bg-zinc-700 text-gray-500 dark:text-gray-400 hover:bg-gray-300"
                                    >
                                        <IconX className="h-3 w-3" />
                                    </motion.button>
                                )}
                            </div>
                        </div>

                        {/* Results */}
                        <div className="overflow-y-auto max-h-[280px]">
                            {filtered.length > 0 ? (
                                filtered.map((doc) => (
                                    <motion.button
                                        key={doc.id}
                                        onClick={() => handleSelect(doc)}
                                        whileHover={{ backgroundColor: "rgba(139,92,246,0.08)" }}
                                        className="w-full px-3 py-2.5 text-left flex items-center gap-3 border-b border-gray-50 dark:border-zinc-800/50 last:border-0 transition-colors"
                                    >
                                        <IconFile className="h-4 w-4 text-violet-400 shrink-0" />
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-sm text-gray-900 dark:text-white truncate">
                                                {doc.title}
                                            </p>
                                            {doc.source && (
                                                <p className="text-xs text-gray-400 dark:text-zinc-500 truncate">
                                                    {doc.source}
                                                </p>
                                            )}
                                        </div>
                                        <IconChevronRight className="h-4 w-4 text-gray-300 flex-shrink-0" />
                                    </motion.button>
                                ))
                            ) : query && !loading ? (
                                <div className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                                    <IconFile className="h-10 w-10 mx-auto mb-3 opacity-30" />
                                    <p className="text-sm font-medium">No documents found</p>
                                    <p className="text-xs mt-1 opacity-70">Try a different search term</p>
                                </div>
                            ) : !query ? (
                                <div className="px-4 py-8 text-center text-gray-400 dark:text-zinc-500">
                                    <IconSearch className="h-8 w-8 mx-auto mb-2 opacity-30" />
                                    <p className="text-sm">Start typing to search</p>
                                </div>
                            ) : null}
                        </div>

                        {/* Footer */}
                        {filtered.length > 0 && (
                            <div className="px-3 py-2 border-t border-gray-100 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-800/50 text-xs text-gray-500 dark:text-gray-400">
                                {filtered.length} of {allDocs.length} documents
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default RagSearchDropdown;

"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    IconFileText, IconExternalLink, IconLeaf,
    IconFileDescription, IconFile, IconLoader2,
    IconSparkles, IconTag,
} from "@tabler/icons-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { AgroDocument, agroApi } from "../../lib/agro-api";

type TabId = "summary" | "content" | "pdf";

interface AgroDocumentPanelProps {
    document: AgroDocument | null;
    initialPage?: number;   // jump to this page in the PDF tab
    initialTab?: TabId;     // open this tab immediately
    onDelete?: () => void;
}

const TAB_CONFIG: { id: TabId; label: string; icon: typeof IconSparkles }[] = [
    { id: "summary", label: "Summary", icon: IconSparkles },
    { id: "content", label: "Content", icon: IconFileDescription },
    { id: "pdf", label: "PDF", icon: IconFile },
];

export function AgroDocumentPanel({ document, initialPage, initialTab, onDelete }: AgroDocumentPanelProps) {
    const [activeTab, setActiveTab] = useState<TabId>(initialTab ?? "summary");
    const [markdown, setMarkdown] = useState<string | null>(null);
    const [mdLoading, setMdLoading] = useState(false);
    const [mdError, setMdError] = useState<string | null>(null);
    const [targetPage, setTargetPage] = useState<number | undefined>(initialPage);

    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    const pdfUrl = document?.source
        ? `${API_BASE_URL}/api/agro/api/blob/download?blob_name=${encodeURIComponent(document.source)}`
        : null;

    const sourceStem = document?.source
        ? document.source.replace(/\.[^.]+$/, '').replace(/^.*[\\/]/, '')
        : document?.title?.replace(/\.[^.]+$/, '') || null;

    // Fetch markdown when Content tab selected
    useEffect(() => {
        if (activeTab !== "content" || !sourceStem) return;
        let cancelled = false;
        setMdLoading(true);
        setMdError(null);
        agroApi.getDocumentMarkdown(sourceStem)
            .then((resp) => { if (!cancelled) setMarkdown(resp?.markdown ?? null); })
            .catch((err) => { if (!cancelled) setMdError(err?.message || "Failed to load markdown"); })
            .finally(() => { if (!cancelled) setMdLoading(false); });
        return () => { cancelled = true; };
    }, [activeTab, sourceStem]);

    // Reset when document changes
    useEffect(() => {
        setMarkdown(null);
        setMdError(null);
    }, [document?.id, document?.source]);

    // When initialPage or initialTab changes from outside (source badge click)
    useEffect(() => {
        if (initialPage != null) {
            setTargetPage(initialPage);
            setActiveTab("pdf");
        } else if (initialTab) {
            setActiveTab(initialTab);
        }
    }, [initialPage, initialTab]);

    // Extract metadata for display
    const metadata = document?.metadata || {};
    const summary = document?.summary || (metadata.summary as string) || "";
    const customMeta = document?.customMetadata || (metadata.custom_metadata as Record<string, unknown>) || {};
    const docType = (metadata.document_type as string) || (metadata.tier as string) || "unknown";

    return (
        <div className="flex flex-col h-full bg-white dark:bg-zinc-900 relative overflow-hidden">
            {/* Header */}
            {document ? (
                <div className="flex-none px-4 py-4 bg-gradient-to-br from-blue-50 to-sky-50 dark:from-blue-950/40 dark:to-sky-950/30 border-b border-blue-100 dark:border-blue-800/40 z-10 sticky top-0 rounded-t-xl">
                    <p className="text-[10px] uppercase tracking-widest font-bold text-blue-600 dark:text-blue-400 mb-1.5">
                        Document Details
                    </p>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-zinc-100 leading-tight mb-1 break-words">
                        {document.title?.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ') || "Untitled"}
                    </h3>
                    <p className="text-[11px] text-gray-500 dark:text-zinc-400 truncate flex items-center gap-1 mb-2">
                        <IconExternalLink size={10} />
                        {document.source || document.title}
                    </p>
                    {document.id && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-mono text-gray-500 dark:text-zinc-500 bg-white/60 dark:bg-zinc-800/60 rounded-full px-2 py-0.5 border border-gray-200 dark:border-zinc-700">
                            ID: {document.id}
                        </span>
                    )}
                </div>
            ) : (
                <div className="flex-none px-4 py-3 border-b border-gray-100 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md z-10 sticky top-0 flex items-center gap-3 rounded-t-xl">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gray-100 to-white dark:from-zinc-800 dark:to-zinc-700 flex items-center justify-center">
                        <IconFileText size={16} className="text-gray-600 dark:text-zinc-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 dark:text-zinc-100 truncate leading-tight">
                            Document Details
                        </p>
                        <p className="text-[10px] uppercase tracking-wider text-gray-400 dark:text-zinc-500 font-medium">
                            Agro Index
                        </p>
                    </div>
                </div>
            )}

            {/* Tabs */}
            {document && (
                <div className="flex-none px-3 py-2.5">
                    <div className="flex items-center gap-1 p-1 bg-gray-100/80 dark:bg-zinc-800/60 rounded-lg">
                        {TAB_CONFIG.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex-1 flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-md text-[11px] font-semibold transition-all duration-200
                                    ${activeTab === tab.id
                                        ? "bg-white dark:bg-zinc-700 text-gray-900 dark:text-zinc-100 shadow-sm ring-1 ring-gray-200/60 dark:ring-zinc-600/60"
                                        : "text-gray-400 dark:text-zinc-500 hover:text-gray-600 dark:hover:text-zinc-300 hover:bg-white/40 dark:hover:bg-zinc-700/40"
                                    }`}
                            >
                                <tab.icon size={13} />
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Content area */}
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
                                <IconLeaf size={28} className="opacity-30" />
                            </div>
                            <p className="text-sm font-medium opacity-60">No document selected</p>
                            <p className="text-xs mt-1 opacity-40">
                                Use search to find and preview documents
                            </p>
                        </motion.div>
                    ) : (
                        <>
                            {/* ────── SUMMARY + METADATA TAB ────── */}
                            {activeTab === "summary" && (
                                <motion.div
                                    key="summary"
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -8 }}
                                    className="p-4 space-y-4"
                                >
                                    {/* Document type badge */}
                                    <div className="flex items-center gap-2">
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
                                            <IconTag size={10} />
                                            {docType.replace(/_/g, " ")}
                                        </span>
                                    </div>

                                    {/* Summary */}
                                    {summary ? (
                                        <div>
                                            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-2">
                                                Summary
                                            </p>
                                            <p className="text-xs text-foreground/80 leading-relaxed bg-muted/50 rounded-lg p-3 border border-border">
                                                {summary}
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="bg-muted/30 rounded-lg p-3 border border-border">
                                            <p className="text-xs text-muted-foreground italic">No summary available</p>
                                        </div>
                                    )}

                                    {/* Custom metadata */}
                                    {Object.keys(customMeta).length > 0 && (
                                        <div>
                                            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-2">
                                                Extracted Metadata
                                            </p>
                                            <div className="bg-card rounded-lg border border-border divide-y divide-border">
                                                {Object.entries(customMeta)
                                                    .filter(([, v]) => v !== null && v !== undefined && v !== "")
                                                    .map(([key, value]) => (
                                                        <div key={key} className="flex items-start justify-between px-3 py-2 text-xs gap-2">
                                                            <span className="text-muted-foreground capitalize whitespace-nowrap">
                                                                {key.replace(/_/g, " ")}
                                                            </span>
                                                            <span className="text-foreground/80 text-right break-words max-w-[160px] font-medium">
                                                                {Array.isArray(value)
                                                                    ? (value as string[]).join(", ")
                                                                    : typeof value === "boolean"
                                                                        ? value ? "Yes" : "No"
                                                                        : String(value)
                                                                }
                                                            </span>
                                                        </div>
                                                    ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Quick stats */}
                                    <div>
                                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-2">
                                            Index Info
                                        </p>
                                        <div className="grid grid-cols-2 gap-2">
                                            {[
                                                { label: "Chunks", value: metadata.chunk_count },
                                                { label: "Pages", value: metadata.page_count },
                                            ]
                                                .filter((item) => item.value !== undefined && item.value !== 0)
                                                .map((item) => (
                                                    <div key={item.label} className="bg-muted/30 rounded-lg p-2.5 text-center border border-border">
                                                        <p className="text-lg font-bold text-foreground">{String(item.value)}</p>
                                                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{item.label}</p>
                                                    </div>
                                                ))}
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {/* ────── CONTENT TAB ────── */}
                            {activeTab === "content" && (
                                <motion.div
                                    key="content"
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -8 }}
                                    className="p-4"
                                >
                                    {mdLoading ? (
                                        <div className="flex flex-col items-center justify-center h-48 text-gray-400 dark:text-zinc-500 gap-2">
                                            <IconLoader2 size={24} className="animate-spin text-primary" />
                                            <p className="text-xs font-medium">Loading document markdown…</p>
                                        </div>
                                    ) : (markdown || document.content) ? (
                                        <div className="prose prose-sm dark:prose-invert max-w-none
                                                        prose-headings:text-primary dark:prose-headings:text-primary
                                                        prose-p:text-gray-600 dark:prose-p:text-zinc-400
                                                        prose-p:whitespace-pre-line
                                                        prose-table:text-xs
                                                        [&_table]:border-collapse [&_td]:border [&_td]:border-gray-200 [&_td]:dark:border-zinc-700 [&_td]:px-2 [&_td]:py-1
                                                        [&_th]:border [&_th]:border-gray-200 [&_th]:dark:border-zinc-700 [&_th]:px-2 [&_th]:py-1 [&_th]:bg-gray-50 [&_th]:dark:bg-zinc-800">
                                            {markdown && (
                                                <div className="flex items-center gap-1.5 mb-3 px-2 py-1 rounded-md bg-primary/10 border border-primary/20">
                                                    <IconFileDescription size={12} className="text-primary" />
                                                    <span className="text-[10px] font-medium text-primary">
                                                        Full document — Extracted markdown
                                                    </span>
                                                </div>
                                            )}
                                            <ReactMarkdown
                                                remarkPlugins={[remarkGfm]}
                                                components={{
                                                    p: ({ children }) => (
                                                        <p className="text-xs leading-relaxed text-gray-600 dark:text-zinc-400 whitespace-pre-line mb-2">{children}</p>
                                                    ),
                                                    table: ({ children }) => (
                                                        <div className="overflow-x-auto my-2"><table className="text-[11px] w-full">{children}</table></div>
                                                    ),
                                                    h1: ({ children }) => <h1 className="text-sm font-bold text-gray-900 dark:text-zinc-100 mt-3 mb-1">{children}</h1>,
                                                    h2: ({ children }) => <h2 className="text-xs font-bold text-gray-800 dark:text-zinc-200 mt-3 mb-1">{children}</h2>,
                                                    h3: ({ children }) => <h3 className="text-xs font-semibold text-gray-700 dark:text-zinc-300 mt-2 mb-1">{children}</h3>,
                                                    strong: ({ children }) => <strong className="font-semibold text-gray-800 dark:text-zinc-200">{children}</strong>,
                                                    ul: ({ children }) => <ul className="list-disc pl-4 space-y-0.5 text-xs text-gray-600 dark:text-zinc-400">{children}</ul>,
                                                    ol: ({ children }) => <ol className="list-decimal pl-4 space-y-0.5 text-xs text-gray-600 dark:text-zinc-400">{children}</ol>,
                                                    hr: () => <hr className="my-3 border-gray-200 dark:border-zinc-700" />,
                                                }}
                                            >
                                                {markdown || document.content || ""}
                                            </ReactMarkdown>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center h-48 text-gray-400 dark:text-zinc-500 gap-2">
                                            <IconFileDescription size={32} className="opacity-30" />
                                            <p className="text-sm font-medium">No content available</p>
                                            <p className="text-xs opacity-60">
                                                {mdError || "No markdown or extracted content available for this document."}
                                            </p>
                                        </div>
                                    )}
                                </motion.div>
                            )}

                            {/* ────── PDF TAB ────── */}
                            {activeTab === "pdf" && (
                                <motion.div
                                    key="pdf"
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -8 }}
                                    className="h-full"
                                >
                                    {pdfUrl ? (
                                        <iframe
                                            key={`${pdfUrl}#page=${targetPage ?? 1}`}
                                            src={`${pdfUrl}${targetPage ? `#page=${targetPage}` : ''}`}
                                            title={document.title}
                                            className="w-full h-full border-0"
                                            style={{ minHeight: "calc(100vh - 180px)" }}
                                        />
                                    ) : (
                                        <div className="flex flex-col items-center justify-center h-48 text-gray-400 dark:text-zinc-500 gap-2 p-4">
                                            <IconFile size={32} className="opacity-30" />
                                            <p className="text-sm font-medium">PDF not available</p>
                                            <p className="text-xs opacity-60 text-center">
                                                No file source path available for this document.
                                            </p>
                                        </div>
                                    )}
                                </motion.div>
                            )}
                        </>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}

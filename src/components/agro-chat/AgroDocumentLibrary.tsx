"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    IconFileText,
    IconSearch,
    IconTrash,
    IconEye,
    IconFileDescription,
    IconCreditCard,
    IconBookmark,
    IconDatabase,
    IconLoader2,
    IconLeaf,
    IconFileTypePdf,
    IconAlertTriangle,
    IconRefresh,
    IconChevronDown,
    IconChevronUp,
    IconExternalLink,
} from "@tabler/icons-react";
import { agroApi, AgroLibraryDocument } from "@/lib/agro-api";

// ─────────────────────────────────────────────────────────────────
// Type config
// ─────────────────────────────────────────────────────────────────

const DOC_TYPE_CONFIG: Record<string, {
    label: string;
    color: string;
    bgColor: string;
    borderColor: string;
    icon: React.ElementType;
}> = {
    product_catalog: {
        label: "Catalog",
        color: "text-blue-700 dark:text-blue-400",
        bgColor: "bg-blue-50 dark:bg-blue-950/30",
        borderColor: "border-blue-200 dark:border-blue-800/40",
        icon: IconBookmark,
    },
    brochure: {
        label: "Brochure",
        color: "text-purple-700 dark:text-purple-400",
        bgColor: "bg-purple-50 dark:bg-purple-950/30",
        borderColor: "border-purple-200 dark:border-purple-800/40",
        icon: IconFileDescription,
    },
    visiting_card: {
        label: "Visiting Card",
        color: "text-amber-700 dark:text-amber-400",
        bgColor: "bg-amber-50 dark:bg-amber-950/30",
        borderColor: "border-amber-200 dark:border-amber-800/40",
        icon: IconCreditCard,
    },
    text_document: {
        label: "Text",
        color: "text-emerald-700 dark:text-emerald-400",
        bgColor: "bg-emerald-50 dark:bg-emerald-950/30",
        borderColor: "border-emerald-200 dark:border-emerald-800/40",
        icon: IconFileText,
    },
    unknown: {
        label: "Unknown",
        color: "text-gray-600 dark:text-zinc-400",
        bgColor: "bg-gray-50 dark:bg-zinc-800/30",
        borderColor: "border-gray-200 dark:border-zinc-700",
        icon: IconFileText,
    },
};

const FILTER_TABS = [
    { key: "all", label: "All" },
    { key: "product_catalog", label: "Catalogs" },
    { key: "brochure", label: "Brochures" },
    { key: "visiting_card", label: "Visiting Cards" },
];

type SortKey = "source_file" | "document_type" | "brand" | "chunk_count" | "page_count" | "created_at";

function formatDate(iso?: string) {
    if (!iso) return "—";
    try {
        return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
    } catch { return "—"; }
}

// ─────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────

export function AgroDocumentLibrary() {
    const [documents, setDocuments] = useState<AgroLibraryDocument[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [activeFilter, setActiveFilter] = useState("all");
    const [deletingHash, setDeletingHash] = useState<string | null>(null);
    const [confirmDelete, setConfirmDelete] = useState<AgroLibraryDocument | null>(null);
    const [expandedRow, setExpandedRow] = useState<string | null>(null);
    const [sortKey, setSortKey] = useState<SortKey>("created_at");
    const [sortAsc, setSortAsc] = useState(false);

    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

    const loadDocuments = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const result = await agroApi.listDocuments();
            setDocuments(result.documents);
        } catch (err: any) {
            setError(err?.message || "Failed to load documents");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { loadDocuments(); }, [loadDocuments]);

    const handleDelete = async (doc: AgroLibraryDocument) => {
        setDeletingHash(doc.doc_hash);
        try {
            await agroApi.deleteDocument(doc.doc_hash);
            setDocuments((prev) => prev.filter((d) => d.doc_hash !== doc.doc_hash));
            setConfirmDelete(null);
        } catch (err: any) {
            setError(err?.message || "Failed to delete document");
        } finally {
            setDeletingHash(null);
        }
    };

    const handleViewPdf = (doc: AgroLibraryDocument) => {
        const url = `${API_BASE_URL}/api/agro/api/blob/download?blob_name=${encodeURIComponent(doc.source_file)}`;
        window.open(url, "_blank");
    };

    const handleSort = (key: SortKey) => {
        if (sortKey === key) {
            setSortAsc(!sortAsc);
        } else {
            setSortKey(key);
            setSortAsc(true);
        }
    };

    // Filter + sort
    const filtered = documents
        .filter((doc) => {
            const matchesType = activeFilter === "all" || doc.document_type === activeFilter;
            const matchesSearch =
                !searchTerm ||
                doc.source_file.toLowerCase().includes(searchTerm.toLowerCase()) ||
                doc.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (doc.summary || "").toLowerCase().includes(searchTerm.toLowerCase());
            return matchesType && matchesSearch;
        })
        .sort((a, b) => {
            const dir = sortAsc ? 1 : -1;
            const aVal = a[sortKey] ?? "";
            const bVal = b[sortKey] ?? "";
            if (typeof aVal === "number" && typeof bVal === "number") return (aVal - bVal) * dir;
            return String(aVal).localeCompare(String(bVal)) * dir;
        });

    // Stats
    const typeCounts = documents.reduce<Record<string, number>>((acc, d) => {
        acc[d.document_type] = (acc[d.document_type] || 0) + 1;
        return acc;
    }, {});
    const totalChunks = documents.reduce((sum, d) => sum + d.chunk_count, 0);

    const SortIcon = ({ col }: { col: SortKey }) => {
        if (sortKey !== col) return null;
        return sortAsc
            ? <IconChevronUp size={12} className="inline ml-0.5 opacity-60" />
            : <IconChevronDown size={12} className="inline ml-0.5 opacity-60" />;
    };

    return (
        <div className="min-h-screen bg-background">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="mb-6">
                    <div className="flex items-center gap-3 mb-1">
                        <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
                            <IconDatabase size={18} className="text-primary-foreground" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-foreground">Document Library</h1>
                            <p className="text-xs text-muted-foreground">Agro Chat knowledge base</p>
                        </div>
                    </div>
                </div>

                {/* Stats Bar */}
                <div className="grid grid-cols-4 gap-3 mb-5">
                    {[
                        { label: "Documents", value: documents.length, accent: false },
                        { label: "Chunks", value: totalChunks, accent: false },
                        { label: "Catalogs", value: typeCounts.product_catalog || 0, accent: true },
                        { label: "Brochures", value: typeCounts.brochure || 0, accent: true },
                    ].map((stat) => (
                        <div key={stat.label} className="bg-card rounded-lg p-3 border border-border">
                            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">{stat.label}</p>
                            <p className={`text-xl font-bold ${stat.accent ? "text-primary" : "text-foreground"}`}>{stat.value}</p>
                        </div>
                    ))}
                </div>

                {/* Search + Filter Bar */}
                <div className="flex flex-col sm:flex-row gap-3 mb-4">
                    <div className="relative flex-1">
                        <IconSearch size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Search by name, brand, or summary…"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-border bg-card text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-ring transition-all"
                        />
                    </div>
                    <div className="flex items-center gap-1 p-0.5 bg-muted rounded-lg">
                        {FILTER_TABS.map((tab) => (
                            <button
                                key={tab.key}
                                onClick={() => setActiveFilter(tab.key)}
                                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all duration-200
                                    ${activeFilter === tab.key
                                        ? "bg-card text-foreground shadow-sm ring-1 ring-border"
                                        : "text-muted-foreground hover:text-foreground"
                                    }`}
                            >
                                {tab.label}
                                {tab.key !== "all" && typeCounts[tab.key] ? (
                                    <span className="ml-1 opacity-60">({typeCounts[tab.key]})</span>
                                ) : null}
                            </button>
                        ))}
                    </div>
                    <button
                        onClick={loadDocuments}
                        disabled={loading}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted border border-border transition-all"
                    >
                        <IconRefresh size={14} className={loading ? "animate-spin" : ""} />
                        Refresh
                    </button>
                </div>

                {/* Error */}
                {error && (
                    <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm flex items-center gap-2">
                        <IconAlertTriangle size={16} />
                        {error}
                        <button onClick={() => setError(null)} className="ml-auto text-destructive hover:opacity-80">✕</button>
                    </div>
                )}

                {/* Loading */}
                {loading ? (
                    <div className="bg-card rounded-lg border border-border overflow-hidden">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="flex items-center gap-4 px-4 py-3 border-b border-border last:border-b-0 animate-pulse">
                                <div className="h-4 w-16 bg-muted rounded" />
                                <div className="h-4 w-40 bg-muted rounded" />
                                <div className="h-4 w-24 bg-muted rounded" />
                                <div className="h-4 w-12 bg-muted rounded ml-auto" />
                            </div>
                        ))}
                    </div>
                ) : filtered.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex flex-col items-center justify-center py-20 text-center"
                    >
                        <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mb-4">
                            <IconLeaf size={28} className="text-muted-foreground opacity-40" />
                        </div>
                        <p className="text-base font-semibold text-muted-foreground mb-1">
                            {documents.length === 0 ? "No documents yet" : "No matches found"}
                        </p>
                        <p className="text-sm text-muted-foreground/60 max-w-xs">
                            {documents.length === 0
                                ? "Upload documents via Agro Chat to build your knowledge base."
                                : "Try adjusting your search or filter criteria."}
                        </p>
                    </motion.div>
                ) : (
                    /* ─── DATA TABLE ─── */
                    <div className="bg-card rounded-lg border border-border overflow-hidden shadow-sm">
                        {/* Table Header */}
                        <div className="grid grid-cols-[1fr_120px_160px_70px_70px_80px_100px] gap-2 px-4 py-2.5 bg-muted/50 border-b border-border text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">
                            <button onClick={() => handleSort("source_file")} className="text-left hover:text-foreground transition-colors">
                                Document <SortIcon col="source_file" />
                            </button>
                            <button onClick={() => handleSort("document_type")} className="text-left hover:text-foreground transition-colors">
                                Type <SortIcon col="document_type" />
                            </button>
                            <button onClick={() => handleSort("brand")} className="text-left hover:text-foreground transition-colors">
                                Brand <SortIcon col="brand" />
                            </button>
                            <button onClick={() => handleSort("chunk_count")} className="text-right hover:text-foreground transition-colors">
                                Chunks <SortIcon col="chunk_count" />
                            </button>
                            <button onClick={() => handleSort("page_count")} className="text-right hover:text-foreground transition-colors">
                                Pages <SortIcon col="page_count" />
                            </button>
                            <button onClick={() => handleSort("created_at")} className="text-left hover:text-foreground transition-colors">
                                Added <SortIcon col="created_at" />
                            </button>
                            <span className="text-right">Actions</span>
                        </div>

                        {/* Table Rows */}
                        <AnimatePresence mode="popLayout">
                            {filtered.map((doc, idx) => {
                                const typeConfig = DOC_TYPE_CONFIG[doc.document_type] || DOC_TYPE_CONFIG.unknown;
                                const TypeIcon = typeConfig.icon;
                                const isExpanded = expandedRow === doc.doc_hash;
                                const customMeta = doc.custom_metadata || {};

                                return (
                                    <motion.div
                                        key={doc.doc_hash}
                                        layout
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0, height: 0 }}
                                        transition={{ delay: idx * 0.01 }}
                                    >
                                        {/* Main row */}
                                        <div
                                            className={`grid grid-cols-[1fr_120px_160px_70px_70px_80px_100px] gap-2 px-4 py-2.5 border-b border-border items-center text-sm cursor-pointer hover:bg-muted/30 transition-colors ${isExpanded ? "bg-muted/20" : ""}`}
                                            onClick={() => setExpandedRow(isExpanded ? null : doc.doc_hash)}
                                        >
                                            {/* Document name */}
                                            <div className="min-w-0">
                                                <p className="font-medium text-foreground truncate text-[13px] leading-tight">
                                                    {doc.source_stem.replace(/[-_]/g, " ")}
                                                </p>
                                                <p className="text-[10px] text-muted-foreground truncate">{doc.source_file}</p>
                                            </div>

                                            {/* Type badge */}
                                            <div>
                                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${typeConfig.bgColor} ${typeConfig.color} ${typeConfig.borderColor} border`}>
                                                    <TypeIcon size={10} />
                                                    {typeConfig.label}
                                                </span>
                                            </div>

                                            {/* Brand */}
                                            <p className="text-xs text-foreground/70 truncate">
                                                {doc.brand && doc.brand !== "Unknown" ? doc.brand : "—"}
                                            </p>

                                            {/* Chunks */}
                                            <p className="text-xs text-foreground/70 text-right font-mono">{doc.chunk_count}</p>

                                            {/* Pages */}
                                            <p className="text-xs text-foreground/70 text-right font-mono">{doc.page_count || "—"}</p>

                                            {/* Date */}
                                            <p className="text-[11px] text-muted-foreground">{formatDate(doc.created_at)}</p>

                                            {/* Actions */}
                                            <div className="flex items-center justify-end gap-1">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleViewPdf(doc); }}
                                                    className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
                                                    title="View PDF"
                                                >
                                                    <IconFileTypePdf size={14} />
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        window.open(
                                                            `${API_BASE_URL}/api/agro/api/markdown/${encodeURIComponent(doc.source_stem)}`,
                                                            "_blank"
                                                        );
                                                    }}
                                                    className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
                                                    title="View Markdown"
                                                >
                                                    <IconEye size={14} />
                                                </button>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); setConfirmDelete(doc); }}
                                                    disabled={deletingHash === doc.doc_hash}
                                                    className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all disabled:opacity-50"
                                                    title="Delete"
                                                >
                                                    {deletingHash === doc.doc_hash ? (
                                                        <IconLoader2 size={14} className="animate-spin" />
                                                    ) : (
                                                        <IconTrash size={14} />
                                                    )}
                                                </button>
                                            </div>
                                        </div>

                                        {/* Expanded detail row */}
                                        <AnimatePresence>
                                            {isExpanded && (
                                                <motion.div
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: "auto", opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    transition={{ duration: 0.2 }}
                                                    className="overflow-hidden border-b border-border"
                                                >
                                                    <div className="px-4 py-3 bg-muted/20">
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                            {/* Summary */}
                                                            <div>
                                                                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1.5">Summary</p>
                                                                {doc.summary ? (
                                                                    <p className="text-xs text-foreground/70 leading-relaxed bg-card rounded-md p-2.5 border border-border">
                                                                        {doc.summary}
                                                                    </p>
                                                                ) : (
                                                                    <p className="text-xs text-muted-foreground italic">No summary available</p>
                                                                )}
                                                                <p className="text-[10px] text-muted-foreground mt-2 font-mono">
                                                                    Hash: {doc.doc_hash.slice(0, 16)}…
                                                                </p>
                                                            </div>

                                                            {/* Extracted metadata */}
                                                            <div>
                                                                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1.5">Extracted Metadata</p>
                                                                {Object.keys(customMeta).length > 0 ? (
                                                                    <div className="bg-card rounded-md border border-border divide-y divide-border max-h-48 overflow-y-auto">
                                                                        {Object.entries(customMeta)
                                                                            .filter(([, v]) => v !== null && v !== undefined && v !== "")
                                                                            .map(([key, value]) => (
                                                                                <div key={key} className="flex items-start justify-between px-2.5 py-1.5 text-[11px] gap-2">
                                                                                    <span className="text-muted-foreground capitalize whitespace-nowrap">
                                                                                        {key.replace(/_/g, " ")}
                                                                                    </span>
                                                                                    <span className="text-foreground/80 text-right break-words max-w-[200px] font-medium">
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
                                                                ) : (
                                                                    <p className="text-xs text-muted-foreground italic">No metadata extracted</p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>

                        {/* Footer */}
                        <div className="px-4 py-2 bg-muted/30 text-[11px] text-muted-foreground">
                            Showing {filtered.length} of {documents.length} documents
                        </div>
                    </div>
                )}
            </div>

            {/* Delete Confirmation Modal */}
            <AnimatePresence>
                {confirmDelete && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
                        onClick={() => setConfirmDelete(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-card rounded-xl shadow-2xl border border-border p-6 max-w-sm w-full"
                        >
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                                    <IconAlertTriangle size={20} className="text-destructive" />
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-foreground">Delete Document</h3>
                                    <p className="text-xs text-muted-foreground">This action cannot be undone</p>
                                </div>
                            </div>
                            <p className="text-sm text-foreground/70 mb-6">
                                Delete <strong className="text-foreground">{confirmDelete.source_file}</strong> and
                                all {confirmDelete.chunk_count} chunks from the knowledge base?
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setConfirmDelete(null)}
                                    className="flex-1 py-2.5 rounded-lg text-sm font-medium text-foreground bg-muted hover:bg-muted/80 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => handleDelete(confirmDelete)}
                                    disabled={deletingHash !== null}
                                    className="flex-1 py-2.5 rounded-lg text-sm font-medium text-destructive-foreground bg-destructive hover:bg-destructive/90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {deletingHash ? (
                                        <IconLoader2 size={14} className="animate-spin" />
                                    ) : (
                                        <IconTrash size={14} />
                                    )}
                                    Delete
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

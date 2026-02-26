"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import {
    Breadcrumb, BreadcrumbItem, BreadcrumbLink,
    BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
    IconChartBar, IconMessageQuestion, IconAlertTriangle,
    IconTrendingUp, IconFiles, IconBrain, IconRefresh,
    IconThumbUp, IconThumbDown, IconCheck, IconPlayerPlay, IconHourglassHigh
} from "@tabler/icons-react";
import { PageGuard } from "@/components/auth/PageGuard";
import { agroApi } from "@/lib/agro-api";
import { useAuth } from "@/contexts/AuthContext";
import { PAGE_PERMISSIONS } from "@/lib/page-permissions";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, Legend,
} from "recharts";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface Overview {
    total_queries: number;
    failed_prompts: number;
    hitl_open: number;
    avg_faithfulness: number | null;
    avg_confidence: number | null;
    success_rate: number;
    doc_type_counts: Record<string, number>;
    rag_metrics: { chunks_indexed: number; ontology_concepts: number; success_rate: number };
}

interface TrendDay { date: string; queries: number; uploads: number; failed: number; }
interface HITLItem {
    id: string; query: string; gap_type: string; status: string;
    answer_given?: string; comment?: string; confidence_score?: number; best_match_doc?: string;
    created_at: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// KPI Card
// ─────────────────────────────────────────────────────────────────────────────

function KPICard({
    label, value, sub, borderColor = "border-gray-200 dark:border-zinc-800", textColor = "text-gray-900 dark:text-zinc-100", iconBg = "bg-gray-100 dark:bg-zinc-800", iconColor = "text-gray-600 dark:text-zinc-400", icon: Icon,
}: {
    label: string; value: string | number; sub?: string;
    borderColor?: string; textColor?: string; iconBg?: string; iconColor?: string; icon: React.ElementType;
}) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className={`rounded-2xl border ${borderColor} p-5 flex flex-col gap-3 bg-white dark:bg-zinc-900 shadow-sm transition-shadow hover:shadow-md h-full`}
        >
            <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-widest text-gray-500 dark:text-zinc-400">{label}</span>
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${iconBg} ${iconColor}`}>
                    <Icon size={18} />
                </div>
            </div>
            <div className="flex-1 flex flex-col justify-end">
                <span className={`text-3xl font-serif font-black tracking-tight ${textColor} leading-none`}>{value}</span>
                {sub && <p className="text-[11.5px] text-gray-500 dark:text-zinc-400 mt-2 leading-snug">{sub}</p>}
            </div>
        </motion.div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Donut Chart & Metrics
// ─────────────────────────────────────────────────────────────────────────────

function DonutChart({ segments, size = 80 }: { segments: { value: number, color: string }[], size?: number }) {
    const r = 28, cx = 40, cy = 40, circumference = 2 * Math.PI * r;
    const total = segments.reduce((s, seg) => s + seg.value, 0);
    let offset = 0;
    const slices = segments.map(seg => {
        const dash = total > 0 ? (seg.value / total) * circumference : 0;
        const gap = circumference - dash;
        const slice = { ...seg, dash, gap, offset };
        offset += dash;
        return slice;
    });

    return (
        <svg width={size} height={size} viewBox="0 0 80 80" className="-rotate-90 shrink-0">
            {/* Track */}
            <circle cx={cx} cy={cy} r={r} fill="none" className="stroke-gray-100 dark:stroke-zinc-800" strokeWidth={10} />
            {/* Slices */}
            {slices.map((s, i) => (
                <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={s.color} strokeWidth={10}
                    strokeDasharray={`${s.dash} ${s.gap}`} strokeDashoffset={-s.offset} strokeLinecap="round"
                    className="transition-all duration-500 ease-out" />
            ))}
            {/* Center cutout */}
            <circle cx={cx} cy={cy} r={18} className="fill-white dark:fill-zinc-900" />
        </svg>
    );
}

function MetricRow({ label, pct, colorCls, bgCls }: { label: string, pct?: number | null, colorCls: string, bgCls: string }) {
    const display = pct != null ? `${Math.round(pct * 100)}%` : "—";
    return (
        <div className="flex flex-col gap-1.5 w-full">
            <div className="flex justify-between items-center w-full">
                <span className="text-[12px] font-medium text-gray-600 dark:text-zinc-400">{label}</span>
                <span className={`text-[13px] font-serif font-black ${colorCls}`}>{display}</span>
            </div>
            {pct != null && (
                <div className="h-1.5 w-full rounded-full bg-gray-100 dark:bg-zinc-800 overflow-hidden shrink-0">
                    <div className={`h-full rounded-full transition-all duration-700 ease-out ${bgCls}`}
                        style={{ width: `${Math.min(100, Math.max(0, Math.round(pct * 100)))}%` }}
                    />
                </div>
            )}
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Tabs
// ─────────────────────────────────────────────────────────────────────────────

const ALL_TABS = [
    { id: "overview", label: "Overview", icon: IconChartBar, adminOnly: false },
    { id: "queries", label: "Query Analytics", icon: IconMessageQuestion, adminOnly: false },
    { id: "trends", label: "Trends", icon: IconTrendingUp, adminOnly: false },
    { id: "failed", label: "Failed Prompts", icon: IconAlertTriangle, adminOnly: true },
    { id: "documents", label: "Documents", icon: IconFiles, adminOnly: true },
    { id: "hitl", label: "HITL Queue", icon: IconBrain, adminOnly: true },
];

// ─────────────────────────────────────────────────────────────────────────────
// HITL Queue sub-component
// ─────────────────────────────────────────────────────────────────────────────

function HITLQueue() {
    const [items, setItems] = useState<HITLItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<string | undefined>(undefined);
    const [working, setWorking] = useState<string | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const res = await agroApi.fetchHITLItems(filter, 50, 0) as { items?: HITLItem[] };
            setItems(res.items ?? []);
        } finally {
            setLoading(false);
        }
    }, [filter]);

    useEffect(() => { load(); }, [load]);

    const act = async (id: string, action: "in_review" | "wont_fix" | "resolve") => {
        setWorking(id);
        try {
            if (action === "resolve") {
                await agroApi.resolveHITLItem(id, { trigger_reingest: false });
            } else {
                await agroApi.updateHITLItem(id, { status: action });
            }
            await load();
        } finally { setWorking(null); }
    };

    const statusColor: Record<string, string> = {
        open: "bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400",
        in_review: "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400",
        resolved: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400",
        wont_fix: "bg-gray-100 text-gray-500 dark:bg-zinc-800 dark:text-zinc-400",
    };

    return (
        <div>
            {/* Filter pills */}
            <div className="flex gap-2 mb-4 flex-wrap">
                {[undefined, "open", "in_review", "resolved", "wont_fix"].map(s => (
                    <button
                        key={s ?? "all"}
                        onClick={() => setFilter(s)}
                        className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${filter === s
                            ? "bg-emerald-600 border-emerald-600 text-white"
                            : "border-gray-200 text-gray-600 dark:border-zinc-700 dark:text-zinc-300 hover:border-emerald-300"
                            }`}
                    >
                        {s ? s.replace("_", " ") : "All"}
                    </button>
                ))}
                <button onClick={load} className="ml-auto p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-400 transition-colors">
                    <IconRefresh size={14} />
                </button>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center h-64 text-gray-400 dark:text-zinc-600 gap-3">
                    <IconHourglassHigh size={32} className="animate-spin text-emerald-500 opacity-80" />
                    Loading queue…
                </div>
            ) : items.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-gray-400 dark:text-zinc-600 gap-2">
                    <IconCheck size={32} className="opacity-40" />
                    <p className="text-sm">No items in the queue</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {items.map(item => (
                        <motion.div
                            key={item.id}
                            initial={{ opacity: 0, y: 4 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="border border-gray-200 dark:border-zinc-700/60 rounded-xl p-4 bg-gray-100/80 dark:bg-zinc-800/70 shadow-sm"
                        >
                            <div className="flex items-start gap-3">
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 dark:text-zinc-100 line-clamp-2">{item.query}</p>
                                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${statusColor[item.status] ?? ""}`}>
                                            {item.status.replace("_", " ")}
                                        </span>
                                        <span className="text-[10px] text-gray-400 dark:text-zinc-500">{item.gap_type.replace("_", " ")}</span>
                                        {item.confidence_score != null && (
                                            <span className="text-[10px] text-gray-400 dark:text-zinc-500">
                                                conf: {Math.round(item.confidence_score * 100)}%
                                            </span>
                                        )}
                                        <span className="text-[10px] text-gray-300 dark:text-zinc-600 ml-auto">
                                            {new Date(item.created_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                    {/* Answer the AI gave — collapsible */}
                                    {item.answer_given && (
                                        <details className="mt-2 group">
                                            <summary className="text-[10px] font-semibold text-gray-400 dark:text-zinc-500 cursor-pointer select-none list-none flex items-center gap-1 hover:text-gray-600 dark:hover:text-zinc-300">
                                                <span className="transition-transform group-open:rotate-90 inline-block">▶</span>
                                                AI Answer
                                            </summary>
                                            <div className="mt-1.5 bg-gray-50 dark:bg-zinc-800/60 rounded-lg px-3 py-2 text-[11px] text-gray-700 dark:text-zinc-300 leading-relaxed
                                                prose prose-xs dark:prose-invert max-w-none
                                                prose-p:my-0.5 prose-headings:text-xs prose-headings:font-semibold
                                                prose-table:text-[10px] prose-td:px-1.5 prose-td:py-0.5 prose-th:px-1.5 prose-th:py-0.5
                                                prose-strong:font-semibold prose-ul:my-1 prose-li:my-0
                                                max-h-48 overflow-y-auto">
                                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                    {item.answer_given}
                                                </ReactMarkdown>
                                            </div>
                                        </details>
                                    )}
                                    {item.comment && (
                                        <p className="text-[11px] text-gray-500 dark:text-zinc-400 mt-1.5 italic">"{item.comment}"</p>
                                    )}
                                </div>
                                {/* Actions */}
                                {item.status !== "resolved" && item.status !== "wont_fix" && (
                                    <div className="flex gap-1 shrink-0">
                                        {item.status === "open" && (
                                            <button
                                                onClick={() => act(item.id, "in_review")}
                                                disabled={working === item.id}
                                                className="px-2 py-1 rounded-lg text-[10px] font-semibold bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 transition-colors disabled:opacity-50"
                                            >
                                                <IconPlayerPlay size={10} className="inline mr-0.5" /> Review
                                            </button>
                                        )}
                                        <button
                                            onClick={() => act(item.id, "resolve")}
                                            disabled={working === item.id}
                                            className="px-2 py-1 rounded-lg text-[10px] font-semibold bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 transition-colors disabled:opacity-50"
                                        >
                                            <IconCheck size={10} className="inline mr-0.5" /> Resolve
                                        </button>
                                        <button
                                            onClick={() => act(item.id, "wont_fix")}
                                            disabled={working === item.id}
                                            className="px-2 py-1 rounded-lg text-[10px] font-semibold bg-gray-50 text-gray-400 hover:bg-gray-100 dark:bg-zinc-800 dark:text-zinc-500 transition-colors disabled:opacity-50"
                                        >
                                            Won&apos;t Fix
                                        </button>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Dashboard Page
// ─────────────────────────────────────────────────────────────────────────────

function AgroDashboardContent() {
    const { user } = useAuth();
    const isAdmin = (user?.permissions ?? []).includes(PAGE_PERMISSIONS.ADMIN);
    const TABS = ALL_TABS.filter(t => !t.adminOnly || isAdmin);

    const [activeTab, setActiveTab] = useState("overview");
    const [loading, setLoading] = useState(true);
    const [overview, setOverview] = useState<Overview | null>(null);
    const [queries, setQueries] = useState<Record<string, unknown> | null>(null);
    const [failed, setFailed] = useState<Record<string, unknown> | null>(null);
    const [trends, setTrends] = useState<TrendDay[]>([]);
    const [docs, setDocs] = useState<Record<string, unknown> | null>(null);
    const [period, setPeriod] = useState(60);

    const loadAll = useCallback(async () => {
        setLoading(true);
        try {
            const [ov, q, f, tr, d] = await Promise.all([
                agroApi.fetchDashboardOverview(period),
                agroApi.fetchDashboardQueries(period),
                agroApi.fetchDashboardFailed(period),
                agroApi.fetchDashboardTrends(period),
                agroApi.fetchDashboardDocuments({ page_size: 20 }),
            ]);
            setOverview(ov as unknown as Overview);
            setQueries(q);
            setFailed(f);
            setTrends(((tr as Record<string, unknown>).series as TrendDay[]) ?? []);
            setDocs(d);
        } finally {
            setLoading(false);
        }
    }, [period]);

    useEffect(() => { loadAll(); }, [loadAll]);

    const pct = (v: number | null | undefined) =>
        v != null ? `${Math.round(v * 100)}%` : "—";

    return (
        <SidebarProvider
            defaultOpen={false}
            style={{ "--sidebar-width": "calc(var(--spacing) * 72)", "--header-height": "calc(var(--spacing) * 12)" } as React.CSSProperties}
        >
            <AppSidebar variant="inset" />
            <SidebarInset className="flex flex-col h-screen overflow-hidden dark:bg-zinc-950 dark:text-zinc-100">
                {/* Header */}
                <header className="h-14 shrink-0 flex items-center justify-between gap-2 px-4 dark:border-zinc-800 border-b">
                    <div className="flex items-center gap-2">
                        <SidebarTrigger className="-ml-1 dark:text-zinc-400" />
                        <Separator orientation="vertical" className="mr-2 h-4 dark:bg-zinc-700" />
                        <Breadcrumb>
                            <BreadcrumbList>
                                <BreadcrumbItem className="hidden md:block">
                                    <BreadcrumbLink href="#" className="dark:text-zinc-400">Knowledge Intelligence</BreadcrumbLink>
                                </BreadcrumbItem>
                                <BreadcrumbSeparator className="hidden md:block dark:text-zinc-600" />
                                <BreadcrumbItem>
                                    <BreadcrumbPage className="dark:text-zinc-100">Agro Dashboard</BreadcrumbPage>
                                </BreadcrumbItem>
                            </BreadcrumbList>
                        </Breadcrumb>
                    </div>

                    {/* Period selector */}
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 dark:text-zinc-500">Period:</span>
                        {[30, 60, 90].map(d => (
                            <button
                                key={d}
                                onClick={() => setPeriod(d)}
                                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${period === d
                                    ? "bg-emerald-600 text-white shadow-sm"
                                    : "bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 hover:bg-gray-200"
                                    }`}
                            >
                                {d}d
                            </button>
                        ))}
                        <button
                            onClick={loadAll}
                            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-400 transition-colors ml-1"
                            title="Refresh"
                        >
                            <IconRefresh size={14} />
                        </button>
                    </div>
                </header>

                {/* Tab bar */}
                <div className="flex gap-1 px-4 pt-3 pb-0 overflow-x-auto shrink-0 border-b border-gray-100 dark:border-zinc-800">
                    {TABS.map(t => (
                        <button
                            key={t.id}
                            onClick={() => setActiveTab(t.id)}
                            className={`flex items-center gap-1.5 px-3 py-2 rounded-t-xl text-xs font-medium border-b-2 transition-all whitespace-nowrap ${activeTab === t.id
                                ? "border-emerald-500 text-emerald-600 dark:text-emerald-400 bg-emerald-50/60 dark:bg-emerald-950/20"
                                : "border-transparent text-gray-500 dark:text-zinc-500 hover:text-gray-700 dark:hover:text-zinc-300"
                                }`}
                        >
                            <t.icon size={13} />
                            {t.label}
                            {t.id === "hitl" && overview && overview.hitl_open > 0 && (
                                <span className="ml-0.5 px-1.5 py-0.5 rounded-full bg-red-500 text-white text-[9px] font-bold">
                                    {overview.hitl_open}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-5">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-64 text-gray-400 dark:text-zinc-600 gap-3">
                            <IconHourglassHigh size={32} className="animate-spin text-emerald-500 opacity-80" />
                            <span className="text-sm">Loading analytics…</span>
                        </div>
                    ) : (
                        <AnimatePresence mode="wait">
                            {/* ── Overview ── */}
                            {activeTab === "overview" && overview && (
                                <motion.div key="overview" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>

                                    {/* TOP KPI GRID */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-6">
                                        <KPICard label="Total Documents" value={Object.values(overview.doc_type_counts).filter((v, i, a) => typeof v === 'number').reduce((a, b) => (a as number) + (b as number), 0) - (overview.doc_type_counts.total || 0)} icon={IconFiles}
                                            iconBg="bg-blue-50 dark:bg-blue-900/20" iconColor="text-blue-600 dark:text-blue-400" textColor="text-blue-600 dark:text-blue-400"
                                            sub={`${overview.doc_type_counts["catalog"] || 0} catalog · ${overview.doc_type_counts["brochure"] || 0} brochure · ${overview.doc_type_counts["vcard"] || 0} vcard`} />

                                        <KPICard label="Total Queries" value={overview.total_queries} icon={IconMessageQuestion}
                                            iconBg="bg-emerald-50 dark:bg-emerald-900/20" iconColor="text-emerald-600 dark:text-emerald-400" textColor="text-emerald-600 dark:text-emerald-400"
                                            sub="Chat queries this period" />

                                        <KPICard label="Avg Faithfulness" value={overview.avg_faithfulness != null ? `${Math.round(overview.avg_faithfulness * 100)}%` : "—"} icon={IconThumbUp}
                                            iconBg={overview.avg_faithfulness != null && overview.avg_faithfulness >= 0.85 ? "bg-emerald-50 dark:bg-emerald-900/20" : "bg-amber-50 dark:bg-amber-900/20"}
                                            iconColor={overview.avg_faithfulness != null && overview.avg_faithfulness >= 0.85 ? "text-emerald-600 dark:text-emerald-400" : "text-amber-500 dark:text-amber-400"}
                                            textColor={overview.avg_faithfulness != null && overview.avg_faithfulness >= 0.85 ? "text-emerald-600 dark:text-emerald-400" : "text-amber-500 dark:text-amber-400"}
                                            sub={overview.avg_faithfulness != null && overview.avg_faithfulness >= 0.85 ? "Excellent accuracy" : (overview.avg_faithfulness != null && overview.avg_faithfulness >= 0.70 ? "Good" : "Needs review")} />

                                        <KPICard label="Failed Prompts" value={overview.failed_prompts} icon={IconAlertTriangle}
                                            iconBg={overview.failed_prompts === 0 ? "bg-emerald-50 dark:bg-emerald-900/20" : "bg-rose-50 dark:bg-rose-900/20"}
                                            iconColor={overview.failed_prompts === 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-500 dark:text-rose-400"}
                                            textColor={overview.failed_prompts === 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-500 dark:text-rose-400"}
                                            sub={overview.failed_prompts === 0 ? "No failures" : "Confidence < 40%"} />

                                        <KPICard label="HITL Open" value={overview.hitl_open} icon={IconBrain}
                                            iconBg={overview.hitl_open === 0 ? "bg-emerald-50 dark:bg-emerald-900/20" : "bg-amber-50 dark:bg-amber-900/20"}
                                            iconColor={overview.hitl_open === 0 ? "text-emerald-600 dark:text-emerald-400" : "text-amber-500 dark:text-amber-400"}
                                            textColor={overview.hitl_open === 0 ? "text-emerald-600 dark:text-emerald-400" : "text-amber-500 dark:text-amber-400"}
                                            sub={overview.hitl_open === 0 ? "Queue clear" : "Awaiting review"} />
                                    </div>

                                    {/* BOTTOM ROW (Doc Types & RAG Performance) */}
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">

                                        {/* DOC TYPES DONUT */}
                                        <div className="rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm overflow-hidden flex flex-col">
                                            <div className="py-3.5 px-5 text-xs font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-widest border-b border-gray-100 dark:border-zinc-800">
                                                Document Types
                                            </div>
                                            <div className="p-5 flex gap-6 items-center flex-1">
                                                <div className="relative shrink-0 flex items-center justify-center pl-2">
                                                    <DonutChart segments={[
                                                        { value: overview.doc_type_counts["catalog"] || 0, color: "#10b981" },
                                                        { value: overview.doc_type_counts["brochure"] || 0, color: "#3b82f6" },
                                                        { value: overview.doc_type_counts["vcard"] || 0, color: "#f59e0b" },
                                                    ]} size={90} />
                                                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pl-2">
                                                        <span className="text-[22px] font-serif font-black text-gray-900 dark:text-zinc-100 leading-none">
                                                            {(overview.doc_type_counts.catalog || 0) + (overview.doc_type_counts.brochure || 0) + (overview.doc_type_counts.vcard || 0)}
                                                        </span>
                                                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">docs</span>
                                                    </div>
                                                </div>
                                                <div className="flex-1 flex flex-col gap-3 pr-2">
                                                    {[
                                                        { key: "catalog", label: "Product Catalog", bg: "bg-emerald-600" },
                                                        { key: "brochure", label: "Brochure", bg: "bg-blue-600" },
                                                        { key: "vcard", label: "Visiting Card", bg: "bg-amber-500" },
                                                    ].map((dt) => {
                                                        const count = overview.doc_type_counts[dt.key] || 0;
                                                        const tot = (overview.doc_type_counts.catalog || 0) + (overview.doc_type_counts.brochure || 0) + (overview.doc_type_counts.vcard || 0);
                                                        const pct = tot > 0 ? (count / tot) * 100 : 0;
                                                        return (
                                                            <div key={dt.key}>
                                                                <div className="flex justify-between items-center mb-1.5">
                                                                    <div className="flex items-center gap-2">
                                                                        <div className={`w-2.5 h-2.5 rounded-[2px] ${dt.bg}`} />
                                                                        <span className="text-xs font-semibold text-gray-600 dark:text-zinc-400">{dt.label}</span>
                                                                    </div>
                                                                    <span className="text-xs font-bold text-gray-900 dark:text-zinc-100">{count}</span>
                                                                </div>
                                                                <div className="h-1.5 rounded-full bg-gray-100 dark:bg-zinc-800 overflow-hidden">
                                                                    <div className={`h-full rounded-full transition-all duration-700 ease-out ${dt.bg}`} style={{ width: `${pct}%` }} />
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        </div>

                                        {/* RAG PERFORMANCE METRICS */}
                                        <div className="rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm overflow-hidden flex flex-col">
                                            <div className="py-3.5 px-5 text-xs font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-widest border-b border-gray-100 dark:border-zinc-800">
                                                RAG Performance
                                            </div>
                                            <div className="px-5 pt-4 pb-5 flex flex-col gap-4">
                                                <MetricRow label="Avg Faithfulness" pct={overview.avg_faithfulness} colorCls="text-emerald-600 dark:text-emerald-400" bgCls="bg-emerald-500" />
                                                <MetricRow label="Avg Confidence" pct={overview.avg_confidence} colorCls="text-blue-600 dark:text-blue-400" bgCls="bg-blue-500" />
                                                <MetricRow label="Success Rate" pct={overview.success_rate} colorCls={overview.success_rate >= 0.9 ? "text-emerald-600 dark:text-emerald-400" : "text-amber-500 dark:text-amber-400"} bgCls={overview.success_rate >= 0.9 ? "bg-emerald-500" : "bg-amber-500"} />

                                                <div className="border-t border-gray-100 dark:border-zinc-800 pt-3.5 mt-1 flex gap-8">
                                                    <div>
                                                        <div className="text-[20px] font-serif font-black text-gray-900 dark:text-zinc-100">
                                                            {overview.rag_metrics?.chunks_indexed?.toLocaleString() ?? 0}
                                                        </div>
                                                        <div className="text-[10px] font-medium text-gray-500 dark:text-zinc-500 mt-1 uppercase tracking-wider">Chunks Indexed</div>
                                                    </div>
                                                    <div>
                                                        <div className="text-[20px] font-serif font-black text-gray-900 dark:text-zinc-100">
                                                            {overview.rag_metrics?.ontology_concepts?.toLocaleString() ?? 202}
                                                        </div>
                                                        <div className="text-[10px] font-medium text-gray-500 dark:text-zinc-500 mt-1 uppercase tracking-wider">Ontology Concepts</div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {/* ── Query Analytics ── */}
                            {activeTab === "queries" && queries && (
                                <motion.div key="queries" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="grid md:grid-cols-2 gap-6">
                                    {/* Top queries */}
                                    <div className="rounded-2xl border border-gray-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm p-5">
                                        <h3 className="text-sm font-semibold text-gray-900 dark:text-zinc-100 mb-4">Top Queries</h3>
                                        {((queries.top_queries ?? []) as Array<{ query: string; hits: number; pct: number }>).length === 0 ? (
                                            <p className="text-xs text-gray-400 py-6 text-center">No data yet</p>
                                        ) : (
                                            <div className="space-y-2.5">
                                                {((queries.top_queries ?? []) as Array<{ query: string; hits: number; pct: number }>).map((q, i) => (
                                                    <div key={i} className="flex items-center gap-3">
                                                        <span className="text-[10px] text-gray-400 w-4 text-right">{i + 1}</span>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-xs text-gray-700 dark:text-zinc-300 truncate">{q.query}</p>
                                                            <div className="h-1 rounded-full bg-gray-100 dark:bg-zinc-800 mt-1">
                                                                <div className="h-full rounded-full bg-emerald-400" style={{ width: `${Math.round(q.pct * 100)}%` }} />
                                                            </div>
                                                        </div>
                                                        <span className="text-[10px] font-bold text-gray-500 dark:text-zinc-400 shrink-0">{q.hits}×</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Top documents */}
                                    <div className="rounded-2xl border border-gray-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm p-5">
                                        <h3 className="text-sm font-semibold text-gray-900 dark:text-zinc-100 mb-4">Top Accessed Documents</h3>
                                        {((queries.top_docs ?? []) as Array<{ filename: string; hits: number; pct: number }>).length === 0 ? (
                                            <p className="text-xs text-gray-400 py-6 text-center">No data yet</p>
                                        ) : (
                                            <div className="space-y-2.5">
                                                {((queries.top_docs ?? []) as Array<{ filename: string; hits: number; pct: number }>).map((d, i) => (
                                                    <div key={i} className="flex items-center gap-3">
                                                        <span className="text-[10px] text-gray-400 w-4 text-right">{i + 1}</span>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-xs text-gray-700 dark:text-zinc-300 truncate">{d.filename}</p>
                                                            <div className="h-1 rounded-full bg-gray-100 dark:bg-zinc-800 mt-1">
                                                                <div className="h-full rounded-full bg-blue-400" style={{ width: `${Math.round(d.pct * 100)}%` }} />
                                                            </div>
                                                        </div>
                                                        <span className="text-[10px] font-bold text-gray-500 dark:text-zinc-400 shrink-0">{d.hits}×</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            )}

                            {/* ── Failed Prompts ── */}
                            {activeTab === "failed" && failed && (
                                <motion.div key="failed" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                                    <div className="rounded-2xl border border-gray-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm p-5">
                                        <h3 className="text-sm font-semibold text-gray-900 dark:text-zinc-100 mb-4">
                                            Failed Prompts
                                            <span className="ml-2 text-xs text-gray-400 font-normal">(confidence &lt; 40%)</span>
                                        </h3>
                                        {((failed.failed ?? []) as Array<{ query: string; count: number; best_confidence: number; best_match_doc?: string }>).length === 0 ? (
                                            <p className="text-sm text-gray-400 py-6 text-center">🎉 No failed prompts in this period</p>
                                        ) : (
                                            <div className="overflow-x-auto">
                                                <table className="w-full text-xs">
                                                    <thead>
                                                        <tr className="border-b border-gray-100 dark:border-zinc-800">
                                                            <th className="text-left text-gray-400 dark:text-zinc-500 font-semibold uppercase tracking-wider py-2 pr-4">Query</th>
                                                            <th className="text-left text-gray-400 dark:text-zinc-500 font-semibold uppercase tracking-wider py-2 pr-4">Count</th>
                                                            <th className="text-left text-gray-400 dark:text-zinc-500 font-semibold uppercase tracking-wider py-2 pr-4">Best Conf.</th>
                                                            <th className="text-left text-gray-400 dark:text-zinc-500 font-semibold uppercase tracking-wider py-2">Top Doc</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-gray-50 dark:divide-zinc-800/50">
                                                        {((failed.failed ?? []) as Array<{ query: string; count: number; best_confidence: number; best_match_doc?: string }>).map((f, i) => (
                                                            <tr key={i} className="hover:bg-gray-50 dark:hover:bg-zinc-800/30 transition-colors">
                                                                <td className="py-2.5 pr-4 text-gray-700 dark:text-zinc-300 max-w-sm truncate">{f.query}</td>
                                                                <td className="py-2.5 pr-4">
                                                                    <span className="px-2 py-0.5 rounded-full bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400 font-bold">{f.count}×</span>
                                                                </td>
                                                                <td className="py-2.5 pr-4 text-gray-500 dark:text-zinc-400">{Math.round(f.best_confidence * 100)}%</td>
                                                                <td className="py-2.5 text-gray-400 dark:text-zinc-500 max-w-xs truncate">{f.best_match_doc ?? "—"}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            )}

                            {/* ── Trends ── */}
                            {activeTab === "trends" && (
                                <motion.div key="trends" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                                    <div className="rounded-2xl border border-gray-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm p-5">
                                        <h3 className="text-sm font-semibold text-gray-900 dark:text-zinc-100 mb-6">Daily Activity ({period} days)</h3>
                                        {trends.length === 0 ? (
                                            <p className="text-sm text-gray-400 py-12 text-center">No trend data yet. Queries will start appearing after Supabase event logging is active.</p>
                                        ) : (
                                            <ResponsiveContainer width="100%" height={320}>
                                                <LineChart data={trends} margin={{ left: -10, right: 10, top: 5, bottom: 5 }}>
                                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,100,100,0.1)" />
                                                    <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={d => d.slice(5)} />
                                                    <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                                                    <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid rgba(0,0,0,0.1)", fontSize: 12 }} />
                                                    <Legend wrapperStyle={{ fontSize: 11 }} />
                                                    <Line type="monotone" dataKey="queries" stroke="#10b981" strokeWidth={2} dot={false} name="Queries" />
                                                    <Line type="monotone" dataKey="uploads" stroke="#3b82f6" strokeWidth={2} dot={false} name="Uploads" />
                                                    <Line type="monotone" dataKey="failed" stroke="#ef4444" strokeWidth={2} dot={false} name="Failed" strokeDasharray="4 4" />
                                                </LineChart>
                                            </ResponsiveContainer>
                                        )}
                                    </div>
                                </motion.div>
                            )}

                            {/* ── Documents ── */}
                            {activeTab === "documents" && docs && (
                                <motion.div key="documents" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                                    <div className="rounded-2xl border border-gray-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm p-5">
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="text-sm font-semibold text-gray-900 dark:text-zinc-100">Document Registry</h3>
                                            <span className="text-xs text-gray-400">{(docs.total as number) ?? 0} total</span>
                                        </div>
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-xs">
                                                <thead>
                                                    <tr className="border-b border-gray-100 dark:border-zinc-800">
                                                        {["Document", "Type", "Brand", "Chunks", "Pages", "Uploaded"].map(h => (
                                                            <th key={h} className="text-left text-gray-400 dark:text-zinc-500 font-semibold uppercase tracking-wider py-2 pr-4 first:pl-0">{h}</th>
                                                        ))}
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-50 dark:divide-zinc-800/50">
                                                    {((docs.documents ?? []) as Array<Record<string, unknown>>).map((d, i) => (
                                                        <tr key={i} className="hover:bg-gray-50 dark:hover:bg-zinc-800/30 transition-colors">
                                                            <td className="py-2.5 pr-4 text-gray-700 dark:text-zinc-300 max-w-xs truncate">{String(d.source_file ?? d.title ?? "—")}</td>
                                                            <td className="py-2.5 pr-4"><span className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-medium">{String(d.document_type ?? "—")}</span></td>
                                                            <td className="py-2.5 pr-4 text-gray-500 dark:text-zinc-400">{String(d.brand ?? "—")}</td>
                                                            <td className="py-2.5 pr-4 text-gray-500 dark:text-zinc-400">{String(d.chunk_count ?? "—")}</td>
                                                            <td className="py-2.5 pr-4 text-gray-500 dark:text-zinc-400">{String(d.page_count ?? "—")}</td>
                                                            <td className="py-2.5 text-gray-400 dark:text-zinc-500">{d.created_at ? new Date(String(d.created_at)).toLocaleDateString() : "—"}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {/* ── HITL ── */}
                            {activeTab === "hitl" && (
                                <motion.div key="hitl" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                                    <HITLQueue />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    )}
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}

export default function AgroDashboardPage() {
    return (
        <PageGuard>
            <AgroDashboardContent />
        </PageGuard>
    );
}

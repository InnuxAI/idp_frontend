"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { IconSend, IconSparkles, IconSearch, IconBulb, IconMessageChatbot, IconLeaf, IconFileText, IconBook, IconId, IconCategory, IconChevronDown, IconBrain } from "@tabler/icons-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { agroApi } from "../../lib/agro-api";

/**
 * Strip "Answer:", "Sources:" (+ table), and "Reasoning:" sections
 * from the LLM response so the chat bubble only shows the core answer.
 */
function cleanAssistantContent(raw: string): string {
    let text = raw;
    // Remove leading "**Answer:**" or "Answer:" label
    text = text.replace(/^\s*\*{0,2}Answer:?\*{0,2}\s*/i, '');
    // Remove "**Sources:**" block and everything after it until "**Reasoning:**" or end
    text = text.replace(/\n*\*{0,2}Sources:?\*{0,2}[\s\S]*?(\*{0,2}Reasoning:?\*{0,2}[\s\S]*$|$)/i, '');
    // If Reasoning wasn't caught above, remove it separately
    text = text.replace(/\n*\*{0,2}Reasoning:?\*{0,2}[\s\S]*$/i, '');
    // Strip CITED_FILES sentinel if streaming didn't complete stripping
    text = text.replace(/\nCITED_FILES:.*$/im, '');
    return text.trim();
}

/** Source document extracted from the retrieval SSE event */
export interface AgroSourceDoc {
    source: string;           // source_file from backend
    sourceStem?: string;      // source_stem (filename without extension)
    supabaseId?: string;      // Supabase UUID primary key
    summary?: string;         // LLM-generated document summary
    customMetadata?: Record<string, unknown>;  // LLM-extracted metadata
    score?: number;           // confidence_score (0-1)
    confidencePct?: string;   // confidence_pct (e.g. "85.6%")
    tier?: string;            // tier_label (e.g. "Tier 1 (Direct Match)")
    content?: string;         // excerpt from the best chunk
    pages?: number[];         // page numbers from cited chunks
    metadata?: Record<string, unknown>;
}

interface Message {
    id: string;
    role: "user" | "assistant";
    content: string;
    timestamp: Date;
    isError?: boolean;
    isStreaming?: boolean;
    sources?: AgroSourceDoc[];
    reasoning?: string;   // extracted reasoning section from LLM
    statusText?: string;  // live pipeline stage shown while streaming + empty
}

interface AgroChatPanelProps {
    onSourceClick?: (source: AgroSourceDoc, pageNumber?: number) => void;
}

// ─────────────────────────────────────────────
// Document-type filter constants
// ─────────────────────────────────────────────

const DOC_TYPES = [
    { value: "product_catalog", label: "Catalogue", icon: IconBook },
    { value: "brochure", label: "Brochure", icon: IconCategory },
    { value: "visiting_card", label: "Visiting Card", icon: IconId },
] as const;


const ALL_TYPES = new Set(DOC_TYPES.map((t) => t.value));

/**
 * Multi-select pill tabs. All selected = no filter.
 * Prevents deselecting the last active tab by resetting to all.
 */
function DocTypeFilter({
    selected,
    onChange,
}: {
    selected: Set<string>;
    onChange: (next: Set<string>) => void;
}) {
    const toggle = (value: string) => {
        const next = new Set(selected);
        if (next.has(value)) {
            next.delete(value);
            // guard: if nothing left, restore all
            if (next.size === 0) {
                onChange(new Set(ALL_TYPES));
                return;
            }
        } else {
            next.add(value);
        }
        onChange(next);
    };

    return (
        <div className="flex items-center gap-1.5 pb-2">
            {DOC_TYPES.map(({ value, label, icon: Icon }) => {
                const active = selected.has(value);
                return (
                    <button
                        key={value}
                        type="button"
                        onClick={() => toggle(value)}
                        className={`
                            flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold
                            border transition-all duration-150 select-none
                            ${active
                                ? "bg-emerald-600 border-emerald-600 text-white shadow-sm shadow-emerald-300/40"
                                : "bg-white border-gray-200 text-gray-500 hover:border-emerald-300 hover:text-emerald-600 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-400 dark:hover:border-emerald-600"
                            }
                        `}
                    >
                        <Icon size={11} stroke={2} />
                        {label}
                        {selected.size < 3 && !active && (
                            <span className="ml-0.5 opacity-50 text-[9px]">off</span>
                        )}
                    </button>
                );
            })}
            {selected.size < 3 && (
                <button
                    type="button"
                    onClick={() => onChange(new Set(ALL_TYPES))}
                    className="text-[10px] text-emerald-600 dark:text-emerald-400 hover:underline ml-1 font-medium"
                >
                    All
                </button>
            )}
        </div>
    );
}

const SAMPLE_PROMPTS = [
    { icon: IconSearch, text: "What oils are healthy for cooking?" },
    { icon: IconBulb, text: "Summarise the key nutritional info from my documents." },
    { icon: IconMessageChatbot, text: "What are the main agricultural products covered?" },
    { icon: IconSparkles, text: "Find product recommendations based on the data." },
];

function WelcomeScreen({ onSuggestionClick }: { onSuggestionClick: (text: string) => void }) {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="h-full flex flex-col items-center justify-center text-center px-6 -mt-10"
        >
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 200, damping: 20 }}
                className="w-16 h-16 bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-900/20 dark:to-zinc-900/50 rounded-2xl flex items-center justify-center mb-8 shadow-sm border border-emerald-50 dark:border-zinc-800"
            >
                <IconLeaf size={32} className="text-emerald-500/80 dark:text-emerald-400" stroke={1.5} />
            </motion.div>

            <motion.h3
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-3xl font-serif text-gray-900 dark:text-zinc-100 mb-3 tracking-tight"
            >
                Agro Assistant
            </motion.h3>

            <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-gray-500 dark:text-zinc-400 max-w-md text-sm mb-8 leading-relaxed"
            >
                Ask questions about agricultural products, nutrition data, and food science. I search through your document library to give grounded, cited answers.
            </motion.p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg">
                {SAMPLE_PROMPTS.map((s, i) => (
                    <motion.button
                        key={i}
                        initial={{ opacity: 0, scale: 0.96 }}
                        animate={{ opacity: 1, scale: 1, transition: { delay: i * 0.05 } }}
                        whileHover={{ scale: 1.015, boxShadow: "0 4px 20px -4px rgba(16,185,129,0.2)" }}
                        whileTap={{ scale: 0.985 }}
                        onClick={() => onSuggestionClick(s.text)}
                        className="flex items-center p-3.5 rounded-xl border border-gray-100 bg-white hover:border-emerald-200 dark:bg-zinc-800/50 dark:border-zinc-700 dark:hover:bg-zinc-700 transition-colors text-left gap-3.5 group shadow-sm"
                    >
                        <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 transition-transform duration-200 group-hover:scale-110">
                            <s.icon size={16} stroke={2} />
                        </div>
                        <span className="text-sm text-gray-600 group-hover:text-gray-900 dark:text-zinc-400 dark:group-hover:text-zinc-200 transition-colors font-medium">
                            {s.text}
                        </span>
                    </motion.button>
                ))}
            </div>
        </motion.div>
    );
}

/** Emerald-themed source badge — clicking opens the document in the panel */
// ─────────────────────────────────────────────
// Reasoning collapsible panel
// ─────────────────────────────────────────────

function ReasoningPanel({
    reasoning,
    sources,
    onPageClick,
}: {
    reasoning: string;
    sources?: AgroSourceDoc[];
    onPageClick?: (source: AgroSourceDoc, page: number) => void;
}) {
    const [open, setOpen] = useState(false);

    if (!reasoning) return null;

    return (
        <div className="-mx-5 -mb-1 mt-2">
            {/* Toggle button — sits just below the sources row */}
            <button
                onClick={() => setOpen((v) => !v)}
                className="flex items-center gap-1.5 px-5 py-1.5 w-full text-[11px] font-medium text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 hover:bg-emerald-50/60 dark:hover:bg-emerald-950/20 transition-colors border-t border-gray-200/60 dark:border-zinc-700/50"
            >
                <IconBrain size={12} className="opacity-70" />
                <span className="flex-1 text-left">{open ? "Hide" : "View"} Reasoning</span>
                <motion.span
                    animate={{ rotate: open ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                >
                    <IconChevronDown size={12} className="opacity-70" />
                </motion.span>
            </button>

            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.22, ease: "easeInOut" }}
                        className="overflow-hidden"
                    >
                        <div className="px-5 pb-4 pt-3 bg-emerald-50/60 dark:bg-emerald-950/20 text-xs text-gray-600 dark:text-zinc-400 leading-relaxed space-y-2 rounded-b-2xl">
                            {/* Reasoning text */}
                            <p className="whitespace-pre-line">{reasoning}</p>

                            {/* Per-source page badges */}
                            {sources && sources.some(s => s.pages && s.pages.length > 0) && (
                                <div className="flex items-center gap-1.5 pt-2 border-t border-emerald-100 dark:border-emerald-900/30 overflow-x-auto pb-0.5">
                                    <span className="text-[10px] uppercase tracking-wider text-emerald-600 dark:text-emerald-500 font-semibold shrink-0">Pages cited:</span>
                                    {sources.flatMap(src =>
                                        (src.pages ?? []).map(pg => (
                                            <button
                                                key={`${src.source}-p${pg}`}
                                                onClick={() => onPageClick?.(src, pg)}
                                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold shrink-0 bg-white dark:bg-zinc-800 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors shadow-sm"
                                            >
                                                <IconFileText size={9} />
                                                {src.sourceStem || src.source.replace(/\.[^.]+$/, '')} · p.{pg}
                                            </button>
                                        ))
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

/** Emerald-themed source badge — clicking opens the document in the panel */
function SourceBadge({ source, onClick }: { source: AgroSourceDoc; onClick?: () => void }) {
    // Use source_stem (filename without extension) for display label
    const label = source.sourceStem || source.source?.replace(/^.*[\\/]/, '') || "Unknown";
    const scoreLabel = source.confidencePct || (source.score != null ? `${(source.score * 100).toFixed(0)}%` : null);
    return (
        <button
            onClick={onClick}
            title={`Open ${source.source}`}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium
                       bg-emerald-50 text-emerald-700 border border-emerald-100
                       hover:bg-emerald-100 hover:border-emerald-200
                       dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800/50 dark:hover:bg-emerald-900/40
                       transition-all cursor-pointer active:scale-95"
        >
            <IconFileText size={11} className="opacity-70 shrink-0" />
            <span className="truncate max-w-[140px]">{label}</span>
            {scoreLabel && (
                <span className="text-[9px] text-emerald-500 dark:text-emerald-400 font-semibold ml-0.5">
                    {scoreLabel}
                </span>
            )}
        </button>
    );
}

/**
 * Parse retrieval data from the SSE stream.
 * Backend format (from format_document_citation):
 *   {source_file, source_stem, confidence_score, confidence_pct,
 *    tier, tier_label, excerpt, matched_concepts, chunk_count, pages}
 */
function parseRetrievalSources(data: Record<string, unknown>): AgroSourceDoc[] {
    const docs = (data.documents ?? data.results ?? []) as Array<Record<string, unknown>>;
    if (!Array.isArray(docs)) return [];
    return docs
        .map((d) => ({
            source: String(d.source_file ?? d.source ?? ""),
            sourceStem: typeof d.source_stem === "string" ? d.source_stem : undefined,
            supabaseId: typeof d.supabase_id === "string" ? d.supabase_id : undefined,
            summary: typeof d.summary === "string" ? d.summary : undefined,
            customMetadata: (d.custom_metadata && typeof d.custom_metadata === "object") ? d.custom_metadata as Record<string, unknown> : undefined,
            score: typeof d.confidence_score === "number" ? d.confidence_score : undefined,
            confidencePct: typeof d.confidence_pct === "string" ? d.confidence_pct : undefined,
            tier: typeof d.tier_label === "string" ? d.tier_label : (typeof d.tier === "number" ? `Tier ${d.tier}` : undefined),
            content: typeof d.excerpt === "string" ? d.excerpt : undefined,
            pages: Array.isArray(d.pages) ? (d.pages as number[]) : undefined,
            metadata: {
                ...(d.chunk_count != null ? { chunks: d.chunk_count } : {}),
                ...(Array.isArray(d.matched_concepts) ? { concepts: (d.matched_concepts as string[]).join(", ") } : {}),
                ...(Array.isArray(d.pages) && (d.pages as number[]).length ? { pages: (d.pages as number[]).join(", ") } : {}),
                ...(d.ontology_boost != null ? { ontology_boost: d.ontology_boost } : {}),
            } as Record<string, unknown>,
        }))
        .filter((s) => s.source);
}

export function AgroChatPanel({ onSourceClick }: AgroChatPanelProps) {
    const [input, setInput] = useState("");
    const [messages, setMessages] = useState<Message[]>([]);
    const [isTyping, setIsTyping] = useState(false);
    const [sessionId, setSessionId] = useState<string | undefined>();
    const [selectedTypes, setSelectedTypes] = useState<Set<string>>(new Set(ALL_TYPES));
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isTyping]);

    // Create session on first interaction
    const ensureSession = async (): Promise<string> => {
        if (sessionId) return sessionId;
        try {
            const resp = await agroApi.createSession();
            setSessionId(resp.session_id);
            return resp.session_id;
        } catch (err) {
            console.error("[AgroChatPanel] Failed to create session:", err);
            throw err;
        }
    };

    const handleSubmit = async (e: React.FormEvent, overrideInput?: string) => {
        e.preventDefault();
        const text = (overrideInput ?? input).trim();
        if (!text || isTyping) return;

        const userMsg: Message = {
            id: Date.now().toString(),
            role: "user",
            content: text,
            timestamp: new Date(),
        };

        setMessages((prev) => [...prev, userMsg]);
        setInput("");
        setIsTyping(true);

        // Create placeholder for streaming response
        const aiId = (Date.now() + 1).toString();
        const aiPlaceholder: Message = {
            id: aiId,
            role: "assistant",
            content: "",
            timestamp: new Date(),
            isStreaming: true,
        };
        setMessages((prev) => [...prev, aiPlaceholder]);

        try {
            const sid = await ensureSession();

            // Compute effective filter: undefined when all selected (no filter)
            const effectiveDocTypes =
                selectedTypes.size === ALL_TYPES.size
                    ? undefined
                    : Array.from(selectedTypes);

            await agroApi.chatStream(
                text,
                sid,
                // onToken — append token delta
                (token) => {
                    setMessages((prev) =>
                        prev.map((m) =>
                            m.id === aiId ? { ...m, content: m.content + token } : m
                        )
                    );
                },
                // onDone — mark streaming complete, replace badges with LLM-curated sources,
                // and store the reasoning text for the collapsible panel
                (data) => {
                    setMessages((prev) =>
                        prev.map((m) => {
                            if (m.id !== aiId) return m;
                            const d = data as Record<string, unknown>;
                            const llmSources = Array.isArray(d.llm_sources)
                                ? parseRetrievalSources({ documents: d.llm_sources as unknown[] })
                                : null;
                            const reasoning = typeof d.reasoning === "string" ? d.reasoning : undefined;
                            return {
                                ...m,
                                isStreaming: false,
                                ...(llmSources && llmSources.length > 0 ? { sources: llmSources } : {}),
                                ...(reasoning ? { reasoning } : {}),
                            };
                        })
                    );
                },
                // onError
                (err) => {
                    console.error("[AgroChatPanel] Stream error:", err);
                    setMessages((prev) =>
                        prev.map((m) =>
                            m.id === aiId
                                ? {
                                    ...m,
                                    content: "Sorry, I encountered an error. Please try again.",
                                    isError: true,
                                    isStreaming: false,
                                }
                                : m
                        )
                    );
                },
                // onRetrieval — extract source documents and attach to message + update status
                (data) => {
                    const sources = parseRetrievalSources(data);
                    const docs = sources.length;
                    const topDoc = sources[0];
                    const tier = topDoc?.tier ?? "";
                    const statusText = docs > 0
                        ? `Found ${docs} document${docs !== 1 ? 's' : ''}${tier ? ` · ${tier}` : ''} — generating answer…`
                        : "Generating answer…";
                    setMessages((prev) =>
                        prev.map((m) =>
                            m.id === aiId ? { ...m, sources, statusText } : m
                        )
                    );
                },
                effectiveDocTypes,
            );
        } catch {
            setMessages((prev) =>
                prev.map((m) =>
                    m.id === aiId
                        ? {
                            ...m,
                            content: "Failed to connect to the Agro service. Please check that the server is running.",
                            isError: true,
                            isStreaming: false,
                        }
                        : m
                )
            );
        } finally {
            setIsTyping(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-white dark:bg-zinc-900 relative overflow-hidden">
            {/* Header */}
            <div className="flex-none px-6 py-4 border-b border-gray-100 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md z-10 sticky top-0 flex items-center gap-3 rounded-t-xl">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-600 to-emerald-500 flex items-center justify-center shadow-sm">
                    <IconLeaf size={16} className="text-white" />
                </div>
                <div>
                    <p className="text-lg font-serif font-medium text-gray-900 dark:text-zinc-100 tracking-tight leading-snug">
                        Agro Assistant
                    </p>
                    <p className="text-[10px] uppercase tracking-wider text-gray-500 dark:text-zinc-500 font-semibold">
                        Agricultural · Food Science RAG
                    </p>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar relative scroll-smooth">
                {messages.length === 0 ? (
                    <WelcomeScreen onSuggestionClick={(t) => handleSubmit({ preventDefault: () => { } } as any, t)} />
                ) : (
                    <div className="space-y-8 py-4 px-2">
                        {messages.map((msg) => (
                            <motion.div
                                key={msg.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`flex items-start gap-4 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
                            >
                                <Avatar className="h-8 w-8 shrink-0 ring-2 ring-white shadow-sm mt-1">
                                    {msg.role === "user" ? (
                                        <AvatarFallback className="bg-gray-900 text-white font-medium text-xs">
                                            US
                                        </AvatarFallback>
                                    ) : (
                                        <AvatarFallback className="bg-emerald-100 border border-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                                            <IconLeaf size={14} />
                                        </AvatarFallback>
                                    )}
                                </Avatar>

                                <div
                                    className={`max-w-[85%] px-5 py-1 rounded-2xl text-sm leading-relaxed shadow-sm ${msg.role === "user"
                                        ? "bg-gray-900 text-gray-50 dark:bg-zinc-600 dark:text-zinc-50 rounded-tr-sm"
                                        : msg.isError
                                            ? "bg-red-50 border border-red-100 text-red-800 dark:bg-red-900/10 dark:border-red-900/30 dark:text-red-400 rounded-tl-sm"
                                            : "bg-gray-200 border border-gray-100 text-gray-700 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-300 rounded-tl-sm"
                                        }`}
                                >
                                    {msg.role === "user" ? (
                                        msg.content
                                    ) : (
                                        <>
                                            {/* While streaming and content is empty — show pipeline status */}
                                            {msg.isStreaming && !msg.content && (
                                                <div className="flex flex-col gap-2 py-1">
                                                    <div className="flex items-center gap-2">
                                                        {/* Step 1: always */}
                                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                                                        <span className={`text-xs font-medium transition-colors ${msg.statusText ? 'text-gray-400 dark:text-zinc-500 line-through' : 'text-gray-600 dark:text-zinc-300'}`}>
                                                            Searching knowledge base
                                                        </span>
                                                    </div>
                                                    {msg.statusText && (
                                                        <>
                                                            <div className="flex items-center gap-2">
                                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                                                                <span className="text-xs font-medium text-gray-600 dark:text-zinc-300">
                                                                    {msg.statusText}
                                                                </span>
                                                            </div>
                                                        </>
                                                    )}
                                                    {!msg.statusText && (
                                                        <div className="flex items-center gap-2 opacity-40">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-zinc-600 shrink-0" />
                                                            <span className="text-xs text-gray-400 dark:text-zinc-500">Analysing documents…</span>
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {/* Normal answer content */}
                                            {(msg.content || !msg.isStreaming) && (
                                                <div className="prose prose-sm max-w-none prose-p:my-2 prose-headings:font-serif prose-headings:font-medium dark:prose-headings:text-zinc-200 prose-code:text-emerald-600 dark:prose-code:text-emerald-400 prose-code:bg-emerald-50 dark:prose-code:bg-emerald-900/30 prose-code:rounded prose-code:px-1">
                                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                        {cleanAssistantContent(msg.content) || (msg.isStreaming ? "▌" : "")}
                                                    </ReactMarkdown>
                                                </div>
                                            )}

                                            {/* Source badges — shown when stream is done and sources arrived */}
                                            {!msg.isStreaming && msg.sources && msg.sources.length > 0 && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: 4 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    className="flex flex-nowrap items-center gap-1.5 mt-3 pt-3 overflow-x-auto border-t border-gray-200/60 dark:border-zinc-700/50 pb-0.5"
                                                >
                                                    <span className="text-[10px] text-gray-400 dark:text-zinc-500 uppercase tracking-wider font-medium mr-1 self-center">
                                                        Sources:
                                                    </span>
                                                    {msg.sources.map((src, idx) => (
                                                        <SourceBadge
                                                            key={`${src.source}-${idx}`}
                                                            source={src}
                                                            onClick={() => onSourceClick?.(src)}
                                                        />
                                                    ))}
                                                </motion.div>
                                            )}

                                            {/* Reasoning panel — collapsible, floats below the answer */}
                                            {!msg.isStreaming && msg.reasoning && (
                                                <ReasoningPanel
                                                    reasoning={msg.reasoning}
                                                    sources={msg.sources}
                                                    onPageClick={(src, pg) => onSourceClick?.(src, pg)}
                                                />
                                            )}
                                        </>
                                    )}
                                </div>
                            </motion.div>
                        ))}

                        <div ref={messagesEndRef} />
                    </div>
                )}
            </div>

            {/* Input */}
            <div className="flex-none p-4 pt-2 pb-2 bg-gradient-to-t from-white via-white to-white/0 dark:from-zinc-900 dark:via-zinc-900 dark:to-zinc-900/0 z-20">
                {/* Document type filter pills */}
                <DocTypeFilter selected={selectedTypes} onChange={setSelectedTypes} />

                <form onSubmit={handleSubmit} className="relative group">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-100 to-emerald-200 dark:from-emerald-900/20 dark:to-emerald-800/20 rounded-2xl blur opacity-20 group-hover:opacity-50 transition-all duration-500 pointer-events-none" />
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Ask about agricultural products, nutrition..."
                        className="relative w-full pl-5 pr-14 py-3.5 rounded-xl bg-white border border-gray-200 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-100 focus:border-emerald-300 dark:focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50/50 dark:focus:ring-emerald-900/20 shadow-lg shadow-gray-100/50 dark:shadow-none transition-all text-sm text-gray-800 outline-none disabled:opacity-50 placeholder:text-gray-400 dark:placeholder:text-zinc-500"
                        disabled={isTyping}
                    />
                    <button
                        type="submit"
                        disabled={!input.trim() || isTyping}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-emerald-600 text-white dark:bg-emerald-700 dark:hover:bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-all shadow-md active:scale-95"
                    >
                        <IconSend size={16} stroke={2} />
                    </button>
                </form>
                <div className="text-center mt-2">
                    <span className="text-[10px] text-gray-400 dark:text-zinc-600 font-medium tracking-wide">
                        AI can make mistakes. Verify important info.
                    </span>
                </div>
            </div>
        </div>
    );
}

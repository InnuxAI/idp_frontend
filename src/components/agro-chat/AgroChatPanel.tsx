"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { IconSend, IconSparkles, IconSearch, IconBulb, IconMessageChatbot, IconLeaf, IconFileText } from "@tabler/icons-react";
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
}

interface AgroChatPanelProps {
    onSourceClick?: (source: AgroSourceDoc) => void;
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
                // onDone — mark streaming complete
                () => {
                    setMessages((prev) =>
                        prev.map((m) =>
                            m.id === aiId ? { ...m, isStreaming: false } : m
                        )
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
                // onRetrieval — extract source documents and attach to message
                (data) => {
                    const sources = parseRetrievalSources(data);
                    if (sources.length > 0) {
                        setMessages((prev) =>
                            prev.map((m) =>
                                m.id === aiId ? { ...m, sources } : m
                            )
                        );
                    }
                },
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
                                            <div className="prose prose-sm max-w-none prose-p:my-2 prose-headings:font-serif prose-headings:font-medium dark:prose-headings:text-zinc-200 prose-code:text-emerald-600 dark:prose-code:text-emerald-400 prose-code:bg-emerald-50 dark:prose-code:bg-emerald-900/30 prose-code:rounded prose-code:px-1">
                                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                    {cleanAssistantContent(msg.content) || (msg.isStreaming ? "▌" : "")}
                                                </ReactMarkdown>
                                            </div>

                                            {/* Source badges — shown when stream is done and sources arrived */}
                                            {!msg.isStreaming && msg.sources && msg.sources.length > 0 && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: 4 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-gray-200/60 dark:border-zinc-700/50"
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
                                        </>
                                    )}
                                </div>
                            </motion.div>
                        ))}

                        <AnimatePresence>
                            {isTyping && messages.at(-1)?.content === "" && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="flex items-center gap-2 text-gray-400 text-xs ml-12 p-2"
                                >
                                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                                </motion.div>
                            )}
                        </AnimatePresence>
                        <div ref={messagesEndRef} />
                    </div>
                )}
            </div>

            {/* Input */}
            <div className="flex-none p-4 pt-2 bg-gradient-to-t from-white via-white to-white/0 dark:from-zinc-900 dark:via-zinc-900 dark:to-zinc-900/0 z-20">
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

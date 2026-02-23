"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { IconSend, IconSparkles, IconSearch, IconBulb, IconMessageChatbot, IconRobot, IconFileText } from "@tabler/icons-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { ragApi, RagSource } from "../../lib/rag-api";

interface Message {
    id: string;
    role: "user" | "assistant";
    content: string;
    timestamp: Date;
    isError?: boolean;
    isStreaming?: boolean;
    sources?: RagSource[];
}

interface RagChatPanelProps {
    onSourceClick?: (documentId: string) => void;
}

const SAMPLE_PROMPTS = [
    { icon: IconSearch, text: "Summarise the key points from my documents." },
    { icon: IconBulb, text: "What are the main topics covered?" },
    { icon: IconMessageChatbot, text: "Find all mentions of recent dates or deadlines." },
    { icon: IconSparkles, text: "What conclusions can you draw from the data?" },
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
                className="w-16 h-16 bg-gradient-to-br from-violet-50 to-white dark:from-violet-900/20 dark:to-zinc-900/50 rounded-2xl flex items-center justify-center mb-8 shadow-sm border border-violet-50 dark:border-zinc-800"
            >
                <IconRobot size={32} className="text-violet-500/80 dark:text-violet-400" stroke={1.5} />
            </motion.div>

            <motion.h3
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-3xl font-serif text-gray-900 dark:text-zinc-100 mb-3 tracking-tight"
            >
                RAG Assistant
            </motion.h3>

            <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-gray-500 dark:text-zinc-400 max-w-md text-sm mb-8 leading-relaxed"
            >
                Upload documents and ask questions. I search through your document library to give grounded, cited answers.
            </motion.p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg">
                {SAMPLE_PROMPTS.map((s, i) => (
                    <motion.button
                        key={i}
                        initial={{ opacity: 0, scale: 0.96 }}
                        animate={{ opacity: 1, scale: 1, transition: { delay: i * 0.05 } }}
                        whileHover={{ scale: 1.015, boxShadow: "0 4px 20px -4px rgba(139,92,246,0.2)" }}
                        whileTap={{ scale: 0.985 }}
                        onClick={() => onSuggestionClick(s.text)}
                        className="flex items-center p-3.5 rounded-xl border border-gray-100 bg-white hover:border-violet-200 dark:bg-zinc-800/50 dark:border-zinc-700 dark:hover:bg-zinc-700 transition-colors text-left gap-3.5 group shadow-sm"
                    >
                        <div className="p-2 rounded-lg bg-violet-50 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400 transition-transform duration-200 group-hover:scale-110">
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

/** Violet-themed source badge — clicking opens the document in the panel */
function SourceBadge({ source, onClick }: { source: RagSource; onClick?: () => void }) {
    const label = source.title || source.source || source.document_id.slice(0, 12) + "…";
    return (
        <button
            onClick={onClick}
            title={`Open ${label}`}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium
                       bg-violet-50 text-violet-700 border border-violet-100
                       hover:bg-violet-100 hover:border-violet-200
                       dark:bg-violet-900/20 dark:text-violet-300 dark:border-violet-800/50 dark:hover:bg-violet-900/40
                       transition-all cursor-pointer active:scale-95"
        >
            <IconFileText size={11} className="opacity-70 shrink-0" />
            <span className="truncate max-w-[140px]">{label}</span>
        </button>
    );
}

export function RagChatPanel({ onSourceClick }: RagChatPanelProps) {
    const [input, setInput] = useState("");
    const [messages, setMessages] = useState<Message[]>([]);
    const [isTyping, setIsTyping] = useState(false);
    const [sessionId, setSessionId] = useState<string | undefined>();
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isTyping]);

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
            await ragApi.chatStream(
                text,
                sessionId,
                // onChunk — append token delta
                (chunk) => {
                    setMessages((prev) =>
                        prev.map((m) =>
                            m.id === aiId ? { ...m, content: m.content + chunk } : m
                        )
                    );
                },
                // onDone — mark streaming complete
                (newSessionId) => {
                    setSessionId(newSessionId);
                    setMessages((prev) =>
                        prev.map((m) =>
                            m.id === aiId ? { ...m, isStreaming: false } : m
                        )
                    );
                },
                // onError
                (err) => {
                    console.error("[RagChatPanel] Stream error:", err);
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
                // onReplace — backend stripped SOURCES_JSON, replace entire content
                (cleanText) => {
                    setMessages((prev) =>
                        prev.map((m) =>
                            m.id === aiId ? { ...m, content: cleanText } : m
                        )
                    );
                },
                // onSources — attach source badges to message
                (sources) => {
                    setMessages((prev) =>
                        prev.map((m) =>
                            m.id === aiId ? { ...m, sources } : m
                        )
                    );
                },
            );
        } finally {
            setIsTyping(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-white dark:bg-zinc-900 relative overflow-hidden">
            {/* Header */}
            <div className="flex-none px-6 py-4 border-b border-gray-100 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md z-10 sticky top-0 flex items-center gap-3 rounded-t-xl">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-violet-500 flex items-center justify-center shadow-sm">
                    <IconRobot size={16} className="text-white" />
                </div>
                <div>
                    <p className="text-lg font-serif font-medium text-gray-900 dark:text-zinc-100 tracking-tight leading-snug">
                        RAG Assistant
                    </p>
                    <p className="text-[10px] uppercase tracking-wider text-gray-500 dark:text-zinc-500 font-semibold">
                        Agentic · Vector + Graph Search
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
                                        <AvatarFallback className="bg-violet-100 border border-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400">
                                            <IconRobot size={14} />
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
                                            <div className="prose prose-sm max-w-none prose-p:my-2 prose-headings:font-serif prose-headings:font-medium dark:prose-headings:text-zinc-200 prose-code:text-violet-600 dark:prose-code:text-violet-400 prose-code:bg-violet-50 dark:prose-code:bg-violet-900/30 prose-code:rounded prose-code:px-1">
                                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                    {msg.content || (msg.isStreaming ? "▌" : "")}
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
                                                            key={`${src.document_id}-${idx}`}
                                                            source={src}
                                                            onClick={() => onSourceClick?.(src.document_id)}
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
                                    <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                                    <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                                    <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
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
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-violet-100 to-violet-200 dark:from-violet-900/20 dark:to-violet-800/20 rounded-2xl blur opacity-20 group-hover:opacity-50 transition-all duration-500 pointer-events-none" />
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Ask anything about your documents..."
                        className="relative w-full pl-5 pr-14 py-3.5 rounded-xl bg-white border border-gray-200 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-100 focus:border-violet-300 dark:focus:border-violet-500 focus:ring-4 focus:ring-violet-50/50 dark:focus:ring-violet-900/20 shadow-lg shadow-gray-100/50 dark:shadow-none transition-all text-sm text-gray-800 outline-none disabled:opacity-50 placeholder:text-gray-400 dark:placeholder:text-zinc-500"
                        disabled={isTyping}
                    />
                    <button
                        type="submit"
                        disabled={!input.trim() || isTyping}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-violet-600 text-white dark:bg-violet-700 dark:hover:bg-violet-600 rounded-lg hover:bg-violet-700 disabled:opacity-50 transition-all shadow-md active:scale-95"
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

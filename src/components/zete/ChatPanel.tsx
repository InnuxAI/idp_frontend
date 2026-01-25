
"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { IconSend, IconSparkles, IconSearch, IconBulb, IconFileText } from "@tabler/icons-react";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { zeteApi } from "../../lib/zete-api";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { SourceDocument } from "../../types/zete-types";
import { DocumentTypeFilter, type DocumentTypeFilter as DocTypeFilter } from "./DocumentTypeFilter";

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    isError?: boolean;
    sources?: SourceDocument[];
}

const suggestions = [
    { icon: IconSearch, text: "Find all SOWs above $50k", color: "text-indigo-600", bg: "bg-indigo-50/50" },
    { icon: IconFileText, text: "Summarize the Alpha Project MSA", color: "text-indigo-600", bg: "bg-indigo-50/50" },
    { icon: IconBulb, text: "What are the payment terms?", color: "text-indigo-600", bg: "bg-indigo-50/50" },
    { icon: IconSparkles, text: "Show me documents expiring soon", color: "text-indigo-600", bg: "bg-indigo-50/50" },
];

function WelcomeScreen({ onSuggestionClick }: { onSuggestionClick: (text: string) => void }) {
    return (
        <motion.div
            initial="hidden"
            animate="visible"
            variants={{
                hidden: { opacity: 0 },
                visible: {
                    opacity: 1,
                    transition: { staggerChildren: 0.1 }
                }
            }}
            className="h-full flex flex-col items-center justify-center text-center px-6 -mt-10"
        >
            <motion.div
                variants={{
                    hidden: { opacity: 0, scale: 0.9, y: 10 },
                    visible: { opacity: 1, scale: 1, y: 0, transition: { type: "spring", stiffness: 200, damping: 20 } }
                }}
                className="w-16 h-16 bg-gradient-to-br from-indigo-50 to-white dark:from-indigo-900/20 dark:to-zinc-900/50 rounded-2xl flex items-center justify-center mb-8 shadow-sm border border-indigo-50 dark:border-zinc-800"
            >
                <IconSparkles size={32} className="text-indigo-500/80 dark:text-indigo-400" stroke={1.5} />
            </motion.div>

            <motion.h3
                variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }}
                className="text-3xl font-serif text-gray-900 dark:text-zinc-100 mb-3 tracking-tight"
            >
                How can I help you?
            </motion.h3>

            <motion.p
                variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }}
                className="text-gray-500 dark:text-zinc-400 max-w-sm text-sm mb-12 leading-relaxed"
            >
                Ask questions about your documents, contracts, or specific clauses in the knowledge graph.
            </motion.p>

            <motion.div
                variants={{ hidden: { opacity: 0 }, visible: { opacity: 1 } }}
                className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg"
            >
                {suggestions.map((s, i) => (
                    <motion.button
                        key={i}
                        variants={{
                            hidden: { opacity: 0, y: 10 },
                            visible: { opacity: 1, y: 0 }
                        }}
                        whileHover={{ scale: 1.01, y: -1 }}
                        whileTap={{ scale: 0.99 }}
                        onClick={() => onSuggestionClick(s.text)}
                        className="flex items-center p-3.5 rounded-xl border border-gray-100 bg-white hover:bg-gray-50/50 hover:border-indigo-100 dark:bg-zinc-800/50 dark:border-zinc-700 dark:hover:bg-zinc-700 transition-all text-left gap-3.5 group shadow-sm hover:shadow-md"
                    >
                        {/* <div className={`p-2 rounded-lg ${s.bg} ${s.color} transition-colors`}>
                            <s.icon size={16} stroke={2} />
                        </div> */}
                        <span className="text-sm text-gray-600 group-hover:text-gray-900 dark:text-zinc-400 dark:group-hover:text-zinc-200 transition-colors font-medium">
                            {s.text}
                        </span>
                    </motion.button>
                ))}
            </motion.div>
        </motion.div>
    );
}

interface ChatPanelProps {
    onSourceClick?: (docId: string) => void;
}

export function ChatPanel({ onSourceClick }: ChatPanelProps) {
    const [input, setInput] = useState("");
    const [messages, setMessages] = useState<Message[]>([]);
    const [isTyping, setIsTyping] = useState(false);
    const [selectedTypes, setSelectedTypes] = useState<DocTypeFilter[]>([]);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping]);

    const handleSuggestionClick = (text: string) => {
        setInput(text);
    };

    const handleSubmit = async (e: React.FormEvent, overrideInput?: string) => {
        e.preventDefault();
        const textToSend = overrideInput || input;
        if (!textToSend.trim() || isTyping) return;

        const question = textToSend.trim();
        const userMsg: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: question,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMsg]);
        setInput("");
        setIsTyping(true);

        try {
            // Pass document types filter to API (backend will use when implemented)
            const response = await zeteApi.query(question, selectedTypes.length > 0 ? selectedTypes : undefined);

            const aiMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: response.answer || "I found some results but couldn't generate a text answer.",
                timestamp: new Date(),
                isError: false,
                sources: response.sources || []
            };
            setMessages(prev => [...prev, aiMsg]);
        } catch (err) {
            const errorMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: "Sorry, I encountered a network error while connecting to the server.",
                timestamp: new Date(),
                isError: true
            };
            setMessages(prev => [...prev, errorMsg]);
        } finally {
            setIsTyping(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-white dark:bg-zinc-900 relative overflow-hidden">
            {/* Header */}
            <div className="flex-none px-6 py-4 border-b border-gray-100 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md z-10 sticky top-0 flex items-center justify-between rounded-t-xl">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center shadow-sm">
                        <IconSparkles size={16} className="text-white" />
                    </div>
                    <div>
                        <p className="text-lg font-serif font-medium text-gray-900 dark:text-zinc-100 tracking-tight leading-snug">AI Assistant</p>
                        <p className="text-[10px] uppercase tracking-wider text-gray-500 dark:text-zinc-500 font-semibold">Zete Graph Optimized</p>
                    </div>
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar relative scroll-smooth">
                {messages.length === 0 ? (
                    <WelcomeScreen onSuggestionClick={handleSuggestionClick} />
                ) : (
                    <div className="space-y-8 py-4 px-2">
                        {messages.map((msg) => (
                            <motion.div
                                key={msg.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`flex items-start gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                            >
                                <Avatar className="h-8 w-8 shrink-0 ring-2 ring-white shadow-sm mt-1">
                                    {msg.role === 'user' ? (
                                        <AvatarFallback className="bg-gray-900 text-white font-medium text-xs">US</AvatarFallback>
                                    ) : (
                                        <AvatarFallback className="bg-gray-200 border border-gray-100 text-indigo-600">
                                            <IconSparkles size={14} />
                                        </AvatarFallback>
                                    )}
                                </Avatar>

                                <div
                                    className={`max-w-[85%] px-5 py-1 rounded-2xl text-sm leading-relaxed shadow-sm ${msg.role === 'user'
                                        ? 'bg-gray-900 text-gray-50 dark:bg-zinc-600 dark:text-zinc-50 rounded-tr-sm'
                                        : msg.isError
                                            ? 'bg-red-50 border border-red-100 text-red-800 dark:bg-red-900/10 dark:border-red-900/30 dark:text-red-400 rounded-tl-sm'
                                            : 'bg-gray-200 border border-gray-100 text-gray-700 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-300 rounded-tl-sm shadow-gray-100/50 dark:shadow-none'
                                        }`}
                                >
                                    {msg.role === 'user' ? (
                                        msg.content
                                    ) : (
                                        <>
                                            <div className="prose prose-sm max-w-none prose-p:my-2 prose-headings:font-serif prose-headings:font-medium prose-headings:text-gray-900 dark:prose-headings:text-zinc-200 prose-code:text-indigo-600 dark:prose-code:text-indigo-400 prose-code:bg-indigo-50 dark:prose-code:bg-indigo-900/30 prose-code:rounded prose-code:px-1 prose-pre:bg-gray-50 dark:prose-pre:bg-zinc-900 prose-pre:border prose-pre:border-gray-100 dark:prose-pre:border-zinc-800 prose-pre:text-gray-800 dark:prose-pre:text-zinc-200 prose-strong:text-zinc-900 dark:prose-strong:text-zinc-100 prose-p:text-zinc-700 dark:prose-p:text-zinc-300 prose-li:text-zinc-700 dark:prose-li:text-zinc-300 prose-div">
                                                <ReactMarkdown
                                                    remarkPlugins={[remarkGfm]}
                                                    components={{
                                                        pre: ({ node, ...props }: any) => <div className="overflow-auto !bg-gray-900 !text-gray-100 p-3 rounded-xl my-2 border border-gray-800 text-xs" {...props} />,
                                                        code: ({ node, ...props }: any) => <code className="!bg-gray-100 !text-gray-800 rounded px-1.5 py-0.5 text-xs font-mono font-medium border border-gray-200" {...props} />
                                                    }}
                                                >
                                                    {msg.content}
                                                </ReactMarkdown>
                                            </div>
                                            {/* Source Citation Badges */}
                                            {msg.sources && msg.sources.length > 0 && (
                                                <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-gray-200/50 dark:border-zinc-700/50">
                                                    <span className="text-[10px] text-gray-400 dark:text-zinc-500 uppercase tracking-wider font-medium mr-1 self-center">Sources:</span>
                                                    {msg.sources.map((source, idx) => {
                                                        // Color mapping based on document type
                                                        const typeColors: Record<string, string> = {
                                                            'MSA': 'bg-purple-100 text-purple-700 hover:bg-purple-200 dark:bg-purple-900/30 dark:text-purple-300',
                                                            'SOW': 'bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-300',
                                                            'Invoice': 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300',
                                                            'Addendum': 'bg-amber-100 text-amber-700 hover:bg-amber-200 dark:bg-amber-900/30 dark:text-amber-300',
                                                            'NDA': 'bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-300',
                                                            'Organization': 'bg-pink-100 text-pink-700 hover:bg-pink-200 dark:bg-pink-900/30 dark:text-pink-300',
                                                            'VisitingCard': 'bg-orange-100 text-orange-700 hover:bg-orange-200 dark:bg-orange-900/30 dark:text-orange-300',
                                                            'Brochure': 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300',
                                                        };
                                                        const colorClass = typeColors[source.doc_type || ''] || 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-zinc-700 dark:text-zinc-300';

                                                        return (
                                                            <button
                                                                key={`${source.doc_id}-${idx}`}
                                                                onClick={() => onSourceClick?.(source.doc_id)}
                                                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium transition-all cursor-pointer ${colorClass}`}
                                                                title={`Open ${source.title || source.doc_id}`}
                                                            >
                                                                <span className="opacity-60 text-[9px]">{source.doc_type || 'Doc'}</span>
                                                                <span className="truncate max-w-[120px]">{source.title || source.doc_id}</span>
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            </motion.div>
                        ))}

                        <AnimatePresence>
                            {isTyping && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="flex items-center gap-2 text-gray-400 text-xs ml-12 p-2"
                                >
                                    <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                    <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                    <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                </motion.div>
                            )}
                        </AnimatePresence>
                        <div ref={messagesEndRef} />
                    </div>
                )}
            </div>

            {/* Document Type Filters + Input */}
            <div className="flex-none p-4 pt-2 bg-gradient-to-t from-white via-white to-white/0 dark:from-zinc-900 dark:via-zinc-900 dark:to-zinc-900/0 z-20">
                {/* Filter Buttons */}
                <div className="mb-3">
                    <DocumentTypeFilter
                        selectedTypes={selectedTypes}
                        onTypesChange={setSelectedTypes}
                        disabled={isTyping}
                    />
                </div>
                <form onSubmit={handleSubmit} className="relative group">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-100 to-purple-100 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-2xl blur opacity-20 group-hover:opacity-50 transition-all duration-500 pointer-events-none" />
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Ask anything..."
                        className="relative w-full pl-5 pr-14 py-3.5 rounded-xl bg-white border border-gray-200 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-100 focus:border-indigo-300 dark:focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50/50 dark:focus:ring-indigo-900/20 shadow-lg shadow-gray-100/50 dark:shadow-none transition-all text-sm text-gray-800 outline-none disabled:bg-gray-50 dark:disabled:bg-zinc-800 disabled:text-gray-400 placeholder:text-gray-400 dark:placeholder:text-zinc-500"
                        disabled={isTyping}
                    />
                    <button
                        type="submit"
                        disabled={!input.trim() || isTyping}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-gray-900 text-white dark:bg-zinc-700 dark:hover:bg-zinc-600 rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:hover:bg-gray-900 transition-all shadow-md active:scale-95"
                    >
                        <IconSend size={16} stroke={2} />
                    </button>
                </form>
                <div className="text-center mt-2">
                    <span className="text-[10px] text-gray-400 dark:text-zinc-600 font-medium tracking-wide">AI can make mistakes. Verify important info.</span>
                </div>
            </div>
        </div>
    );
}

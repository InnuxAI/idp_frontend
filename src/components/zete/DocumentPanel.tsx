
"use client";

import { useState, useEffect, memo, useMemo } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import dynamic from "next/dynamic";
import { DocumentDetails } from "../../types/zete-types";
import { zeteApi } from "../../lib/zete-api";
import { Badge } from "../ui/badge";

// Dynamically import document viewer to avoid SSR issues
const UniversalDocumentViewer = dynamic(
    () => import("./UniversalDocumentViewer").then(mod => mod.UniversalDocumentViewer),
    {
        ssr: false,
        loading: () => (
            <div className="flex h-full items-center justify-center text-gray-400 dark:text-zinc-500">
                <div className="flex flex-col items-center gap-2">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-200 border-t-indigo-500" />
                    <p className="text-xs">Loading viewer...</p>
                </div>
            </div>
        )
    }
);

interface DocumentPanelProps {
    document: DocumentDetails | null;
}

interface ParsedContent {
    cleaned: string;
    links: string[];
}

function parseContent(content: string): ParsedContent {
    let cleaned = content;
    const links: string[] = [];

    // 1. Remove YAML frontmatter
    cleaned = cleaned.replace(/^---\n[\s\S]*?\n---\n/, "");

    // 2. Remove legacy ID/Parent line
    cleaned = cleaned.replace(/^id:.*?parent:.*?\n/i, "");

    // 3. Extract and remove "Discovered Links" or "Related Documents" sections
    const sectionRegex = /(?:##\s*)?(?:Discovered Links|Related Documents)\s*\n((?:(?:-\s*)?.*?\[\[.*?\]\].*?\n?)+)/gi;

    let match;
    while ((match = sectionRegex.exec(cleaned)) !== null) {
        const linksBlock = match[1];
        const linkMatches = linksBlock.match(/\[\[(.*?)\]\]/g);
        if (linkMatches) {
            linkMatches.forEach(l => links.push(l.replace(/[\[\]]/g, "")));
        }
    }

    cleaned = cleaned.replace(sectionRegex, "");

    return { cleaned: cleaned.trim(), links: [...new Set(links)] };
}

const fadeInUp: Variants = {
    hidden: { opacity: 0, y: 15 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.5,
            ease: [0.25, 0.1, 0.25, 1.0]
        }
    }
};

// Memoized document content renderer
const DocumentContentRenderer = memo(function DocumentContentRenderer({
    content,
    docId
}: {
    content: string;
    docId: string;
}) {
    const contentWithBadges = content.replace(/\[\[(.*?)\]\]/g, "[$1](badge://$1)");

    return (
        <div className="flex-1 overflow-y-auto px-6 py-4 min-h-0">
            <AnimatePresence mode="wait">
                <motion.div
                    key={docId}
                    className="max-w-none text-gray-600 dark:text-zinc-300 text-sm leading-relaxed"
                    variants={{
                        hidden: { opacity: 0, y: 10 },
                        visible: {
                            opacity: 1,
                            y: 0,
                            transition: {
                                staggerChildren: 0.04,
                                delayChildren: 0.05,
                                duration: 0.3
                            }
                        },
                        exit: {
                            opacity: 0,
                            y: -10,
                            transition: { duration: 0.2 }
                        }
                    }}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                >
                    <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        urlTransform={(value) => value}
                        components={{
                            h1: ({ children }) => <motion.h1 variants={fadeInUp} className="text-xl font-bold text-gray-900 dark:text-zinc-100 mb-3">{children}</motion.h1>,
                            h2: ({ children }) => <motion.h2 variants={fadeInUp} className="text-base font-bold text-gray-900 dark:text-zinc-100 mt-5 mb-2 pb-1 border-b border-gray-100 dark:border-zinc-800">{children}</motion.h2>,
                            h3: ({ children }) => <motion.h3 variants={fadeInUp} className="text-sm font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-wide mt-4 mb-1.5">{children}</motion.h3>,
                            p: ({ children }) => <motion.p variants={fadeInUp} className="mb-2 text-gray-700 dark:text-zinc-300">{children}</motion.p>,
                            strong: ({ children }) => <motion.strong variants={fadeInUp} className="font-semibold text-gray-900 dark:text-zinc-100">{children}</motion.strong>,
                            em: ({ children }) => <motion.em variants={fadeInUp} className="italic">{children}</motion.em>,
                            blockquote: ({ children }) => <motion.blockquote variants={fadeInUp} className="border-l-2 border-gray-200 dark:border-zinc-700 pl-3 italic my-2 text-gray-500 dark:text-zinc-400 text-sm">{children}</motion.blockquote>,
                            hr: () => <motion.hr variants={fadeInUp} className="my-4 border-gray-100 dark:border-zinc-800" />,
                            ul: ({ children }) => <motion.ul variants={fadeInUp} className="list-disc pl-6 mb-3 space-y-1 text-gray-700 dark:text-zinc-300 [&_ul]:list-[circle] [&_ul]:mt-1 [&_ul_ul]:list-[square]">{children}</motion.ul>,
                            ol: ({ children }) => <motion.ol variants={fadeInUp} className="list-decimal pl-6 mb-3 space-y-1 text-gray-700 dark:text-zinc-300 [&_ol]:list-[lower-alpha] [&_ol]:mt-1">{children}</motion.ol>,
                            li: ({ children }) => <motion.li variants={fadeInUp} className="pl-1 leading-relaxed">{children}</motion.li>,
                            code: ({ children, className }) => {
                                const match = /language-(\w+)/.exec(className || '')
                                const isInline = !match && !children?.toString().includes('\n');
                                return isInline ? (
                                    <code className="px-1.5 py-0.5 rounded-md bg-gray-100 dark:bg-zinc-800 text-gray-800 dark:text-zinc-200 font-mono text-xs border border-gray-200 dark:border-zinc-700">{children}</code>
                                ) : (
                                    <code className="block font-mono text-xs leading-relaxed inherit">{children}</code>
                                )
                            },
                            pre: ({ children }) => (
                                <motion.pre variants={fadeInUp} className="my-4 p-4 rounded-lg bg-gray-900 dark:bg-zinc-950 text-gray-100 dark:text-zinc-300 overflow-x-auto shadow-sm border border-gray-800 dark:border-zinc-800">
                                    {children}
                                </motion.pre>
                            ),
                            img: ({ src, alt }) => (
                                <motion.img
                                    variants={fadeInUp}
                                    src={src}
                                    alt={alt}
                                    className="rounded-lg shadow-sm border border-gray-100 dark:border-zinc-800 my-4 max-h-[400px] object-contain"
                                />
                            ),
                            table: ({ children }) => (
                                <motion.div variants={fadeInUp} className="my-2 overflow-x-auto rounded-md border border-gray-200 dark:border-zinc-800">
                                    <table className="min-w-full text-sm">{children}</table>
                                </motion.div>
                            ),
                            thead: ({ children }) => <motion.thead variants={fadeInUp} className="bg-gray-50/80 dark:bg-zinc-900/80">{children}</motion.thead>,
                            tbody: ({ children }) => <motion.tbody variants={fadeInUp} className="divide-y divide-gray-100 dark:divide-zinc-800">{children}</motion.tbody>,
                            tr: ({ children }) => <motion.tr variants={fadeInUp}>{children}</motion.tr>,
                            th: ({ children }) => <motion.th variants={fadeInUp} className="px-3 py-1.5 text-left text-[10px] font-medium text-gray-500 dark:text-zinc-400 uppercase tracking-wider">{children}</motion.th>,
                            td: ({ children }) => <motion.td variants={fadeInUp} className="px-3 py-1.5 text-gray-700 dark:text-zinc-300">{children}</motion.td>,
                            a: ({ href, children }) => {
                                if (href?.startsWith("badge://")) {
                                    return (
                                        <Badge variant="secondary" className="mx-0.5 px-1.5 py-0 text-[11px] bg-blue-50 text-blue-600 hover:bg-blue-100 border-blue-100 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800 dark:hover:bg-blue-900/50 align-middle inline-flex items-center cursor-default">
                                            {children}
                                        </Badge>
                                    );
                                }
                                return <a href={href} className="text-blue-600 hover:underline dark:text-blue-400">{children}</a>;
                            }
                        }}
                    >
                        {contentWithBadges}
                    </ReactMarkdown>
                </motion.div>
            </AnimatePresence>
        </div>
    );
});

export function DocumentPanel({ document }: DocumentPanelProps) {
    const [summaries, setSummaries] = useState<any | null>(null);
    const [reconciliation, setReconciliation] = useState<any | null>(null);
    const [loading, setLoading] = useState<string | null>(null);

    // Reset state when document changes
    useEffect(() => {
        setSummaries(null);
        setReconciliation(null);
    }, [document?.id]);

    const parsedContent = document ? parseContent(document.content) : { cleaned: "", links: [] };

    const handleSummarize = async () => {
        if (!document) return;
        setLoading("summarize");
        try {
            // Placeholder: need to update API client to support document actions if not generic
            // For now assuming we can call something similar
            // const res = await zeteApi.summarizeDocument(document.id);
            // setSummaries(res);
            console.log("Summarize clicked");
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(null);
        }
    };

    const handleReconcile = async () => {
        if (!document) return;
        setLoading("reconcile");
        try {
            // const res = await zeteApi.reconcileDocument(document.id);
            // setReconciliation(res);
            console.log("Reconcile clicked");
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(null);
        }
    };

    if (!document) {
        return (
            <div className="h-full w-full flex flex-col items-center justify-center text-gray-400 dark:text-zinc-500 p-8 text-center bg-gray-50/50 dark:bg-zinc-900/30">
                <div className="w-12 h-12 mb-4 rounded-full bg-gray-100 dark:bg-zinc-800 flex items-center justify-center">
                    <svg className="w-6 h-6 text-gray-300 dark:text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                </div>
                <p className="font-serif italic text-lg text-gray-500 dark:text-zinc-500">Select a document to view details</p>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1.0] }}
            key={document.id}
            className="flex flex-col h-full"
        >
            {/* Fixed Header Section */}
            <div className="flex-none p-6 pb-4 border-b border-gray-100 dark:border-zinc-800 bg-[#f0f8ff] dark:bg-indigo-950/20 z-10">
                <motion.div
                    initial="hidden"
                    animate="visible"
                    variants={{
                        hidden: { opacity: 0 },
                        visible: {
                            opacity: 1,
                            transition: {
                                staggerChildren: 0.1,
                                delayChildren: 0.2
                            }
                        }
                    }}
                    className="space-y-3"
                >
                    <motion.span
                        variants={{
                            hidden: { opacity: 0, x: 20 },
                            visible: { opacity: 1, x: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
                        }}
                        className="text-xs font-bold tracking-wider text-blue-600 dark:text-blue-400 uppercase block"
                    >
                        {document.metadata.type}
                    </motion.span>

                    <motion.h1
                        variants={{
                            hidden: { opacity: 0, x: 20 },
                            visible: { opacity: 1, x: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
                        }}
                        className="text-3xl font-serif text-gray-900 dark:text-zinc-100 line-clamp-2"
                    >
                        {document.id}
                    </motion.h1>

                    <motion.div
                        variants={{
                            hidden: { opacity: 0, x: 20 },
                            visible: { opacity: 1, x: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
                        }}
                        className="flex flex-wrap gap-2 items-center"
                    >
                        <Badge variant="outline" className="text-xs font-mono text-gray-500 border-gray-200 dark:text-zinc-400 dark:border-zinc-700">
                            ID: {document.id}
                        </Badge>
                        {document.metadata.parent && (
                            <Badge variant="secondary" className="text-xs font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700">
                                Parent: {document.metadata.parent}
                            </Badge>
                        )}
                        {parsedContent.links.length > 0 && (
                            <>
                                <div className="w-px h-4 bg-gray-200 dark:bg-zinc-700 mx-1"></div>
                                {parsedContent.links.map(link => (
                                    <Badge key={link} variant="default" className="text-xs font-medium bg-primary/15 text-primary hover:bg-primary/30 border-primary dark:bg-primary/30 dark:text-primary dark:border-primary">
                                        Link: {link}
                                    </Badge>
                                ))}
                            </>
                        )}
                    </motion.div>
                </motion.div>

                <motion.div
                    initial="hidden"
                    animate="visible"
                    variants={{
                        hidden: { opacity: 0, x: 20 },
                        visible: {
                            opacity: 1,
                            x: 0,
                            transition: {
                                type: "spring",
                                stiffness: 300,
                                damping: 24,
                                delay: 0.4
                            }
                        }
                    }}
                    className="flex gap-4 mt-6"
                >
                    <ActionButton
                        label="Summarize Chain"
                        onClick={handleSummarize}
                        loading={loading === 'summarize'}
                        icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" /></svg>}
                        variant="primary"
                    />
                    {document.metadata.type === 'Invoice' && (
                        <ActionButton
                            label="Reconcile"
                            onClick={handleReconcile}
                            loading={loading === 'reconcile'}
                            icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                            variant="secondary"
                        />
                    )}
                </motion.div>

                <AnimatePresence mode="popLayout">
                    {reconciliation && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="overflow-hidden"
                        >
                            <div className={`mt-4 p-4 rounded-lg border ${reconciliation.result === 'MATCH' ? 'bg-green-200 border-green-400 text-green-800' : 'bg-red-200 border-red-400 text-red-800'}`}>
                                <h3 className="font-bold mb-2 flex items-center gap-2">
                                    {reconciliation.result === 'MATCH' ? 'Reconciliation Successful' : 'Reconciliation Failed'}
                                </h3>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <span className="block opacity-70 text-xs uppercase">Invoice Amount</span>
                                        <span className="font-mono text-lg">${reconciliation.invoice_amount?.toLocaleString() ?? 'N/A'}</span>
                                    </div>
                                    <div>
                                        <span className="block opacity-70 text-xs uppercase">SOW Amount</span>
                                        <span className="font-mono text-lg">${reconciliation.sow_amount?.toLocaleString() ?? 'N/A'}</span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {summaries && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="overflow-hidden"
                        >
                            <div className="mt-6 rounded-xl border border-blue-100 bg-blue-50/50 p-4">
                                <h3 className="font-serif text-lg font-medium text-blue-900 mb-3 px-1">Context Summary</h3>
                                <div className="space-y-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                                    {summaries.chain.map((s: any) => (
                                        <div
                                            key={s.doc_id}
                                            className="bg-white p-3 rounded-lg text-sm leading-relaxed border border-blue-100 shadow-sm"
                                        >
                                            <div className="font-semibold text-gray-900 mb-1 flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-blue-400"></div>
                                                {s.doc_id}
                                                <span className="text-xs font-normal text-gray-500 bg-gray-100 px-1.5 rounded">{s.type}</span>
                                            </div>
                                            <div className="text-gray-600 pl-3.5">{s.summary}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Scrollable Content Section */}
            {isBinaryFile(document.content) ? (
                <div className="flex-1 min-h-0">
                    <UniversalDocumentViewer
                        fileUrl={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/zete/documents/${document.id}/raw`}
                        fileName={document.metadata?.file_path || `${document.id}.unknown`}
                        title={document.metadata?.title || document.id}
                    />
                </div>
            ) : (
                <DocumentContentRenderer
                    content={parsedContent.cleaned}
                    docId={document.id}
                />
            )}
        </motion.div>
    );
}

// Helper to detect if content indicates a binary file
function isBinaryFile(content: string): boolean {
    if (!content) return false;
    // Check for placeholder patterns from backend
    const binaryPatterns = [
        /^\[Binary image file:/i,
        /^\[Binary file:/i,
        /^\[PDF document:/i,
    ];
    return binaryPatterns.some(pattern => pattern.test(content.trim()));
}

function ActionButton({ label, onClick, loading, icon, variant = 'outline' }: { label: string, onClick: () => void, loading: boolean, icon: React.ReactNode, variant?: 'primary' | 'secondary' | 'outline' }) {
    const baseClasses = "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium shadow-sm disabled:opacity-50 transition-colors";

    const variantClasses = {
        primary: "bg-gray-900 text-white border border-transparent hover:bg-gray-800 dark:bg-indigo-600 dark:hover:bg-indigo-500",
        secondary: "bg-blue-600 text-white border border-blue-100 hover:bg-blue-500 dark:bg-blue-700 dark:border-blue-800 dark:hover:bg-blue-600",
        outline: "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-700"
    }[variant];

    return (
        <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onClick}
            disabled={loading}
            className={`${baseClasses} ${variantClasses}`}
        >
            {loading ? (
                <div className={`w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin ${variant === 'primary' ? 'text-white' : 'text-current'}`} />
            ) : icon}
            {label}
        </motion.button>
    );
}

"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
    IconMessageChatbot,
    IconFileDescription,
    IconUpload,
} from "@tabler/icons-react";
import { PageGuard } from "@/components/auth/PageGuard";

// Agro Chat specific components
import { AgroChatPanel, AgroSourceDoc } from "@/components/agro-chat/AgroChatPanel";
import { AgroDocumentPanel } from "@/components/agro-chat/AgroDocumentPanel";
import { AgroUploadModal } from "@/components/agro-chat/AgroUploadModal";
// import { AgroSearchDropdown } from "@/components/agro-chat/AgroSearchDropdown";
import { AgroUploadNotifications } from "@/components/agro-chat/AgroUploadNotifications";
import { AgroDocument } from "@/lib/agro-api";

// Panel animation variants – identical to Zete/RAG Chat for visual consistency
const panelVariants = {
    hidden: {
        opacity: 0,
        scale: 0.95,
        transition: { type: "spring" as const, stiffness: 400, damping: 30 },
    },
    visible: {
        opacity: 1,
        scale: 1,
        transition: { type: "spring" as const, stiffness: 400, damping: 30 },
    },
    exit: {
        opacity: 0,
        scale: 0.95,
        transition: { type: "spring" as const, stiffness: 400, damping: 30 },
    },
};

const springTransition = {
    type: "spring" as const,
    stiffness: 300,
    damping: 30,
};

function AgroChatPageContent() {
    // Panel visibility
    const [showChat, setShowChat] = useState(true);
    const [showDocument, setShowDocument] = useState(true);

    // Selected document + page to jump to
    const [selectedDocument, setSelectedDocument] = useState<AgroDocument | null>(null);
    const [initialPage, setInitialPage] = useState<number | undefined>(undefined);
    const [initialTab, setInitialTab] = useState<"summary" | "confidence" | "content" | "pdf" | undefined>(undefined);

    // Upload modal
    const [showUploadModal, setShowUploadModal] = useState(false);

    // Refresh callback — used by upload notifications to signal ingestion complete
    const handleUploadComplete = useCallback(() => {
        // No graph to refresh; future: could refresh document list
    }, []);

    const handleDocumentDeleted = useCallback(() => {
        setSelectedDocument(null);
    }, []);

    /** Convert a source badge click into a document panel entry */
    const handleSourceClick = useCallback((source: AgroSourceDoc, pageNumber?: number, msgContext?: { faithfulness?: any; reasoning?: string }) => {
        const filename = source.sourceStem || source.source?.replace(/^.*[\\/]/, '') || "Unknown Document";
        setSelectedDocument({
            id: source.supabaseId || source.source || Date.now().toString(),
            title: filename,
            source: source.source || "",
            content: source.content,
            summary: source.summary,
            customMetadata: source.customMetadata,
            metadata: {
                ...(source.metadata ?? {}),
                ...(source.confidencePct ? { confidence: source.confidencePct } : source.score != null ? { confidence: `${(source.score * 100).toFixed(1)}%` } : {}),
                ...(source.tier ? { tier: source.tier } : {}),
                ...(msgContext?.faithfulness ? { faithfulness: msgContext.faithfulness } : {}),
                ...(msgContext?.reasoning ? { reasoning: msgContext.reasoning } : {}),
            },
        });
        // If a page number was provided (from a reasoning panel badge), jump to PDF tab at that page
        if (pageNumber != null) {
            setInitialPage(pageNumber);
            setInitialTab("confidence");
        } else {
            setInitialPage(undefined);
            setInitialTab("confidence");
        }
        setShowDocument(true);
    }, []);

    return (
        <SidebarProvider
            defaultOpen={false}
            style={
                {
                    "--sidebar-width": "calc(var(--spacing) * 72)",
                    "--header-height": "calc(var(--spacing) * 12)",
                } as React.CSSProperties
            }
        >
            <AppSidebar variant="inset" />
            <SidebarInset className="flex flex-col h-screen overflow-hidden dark:bg-zinc-950 dark:text-zinc-100 relative">
                {/* Header */}
                <header className="h-14 shrink-0 flex items-center justify-between gap-2 px-4 dark:border-zinc-800">
                    <div className="flex items-center gap-2">
                        <SidebarTrigger className="-ml-1 dark:text-zinc-400 dark:hover:text-zinc-100" />
                        <Separator orientation="vertical" className="mr-2 h-4 dark:bg-zinc-700" />
                        <Breadcrumb>
                            <BreadcrumbList>
                                <motion.div
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.1 }}
                                >
                                    <BreadcrumbItem className="hidden md:block">
                                        <BreadcrumbLink href="#" className="dark:text-zinc-400 dark:hover:text-zinc-200">
                                            Knowledge Intelligence
                                        </BreadcrumbLink>
                                    </BreadcrumbItem>
                                </motion.div>
                                <motion.div
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.15 }}
                                >
                                    <BreadcrumbSeparator className="hidden md:block dark:text-zinc-600" />
                                </motion.div>
                                <motion.div
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.2 }}
                                >
                                    <BreadcrumbItem>
                                        <BreadcrumbPage className="dark:text-zinc-100">Agro Chat</BreadcrumbPage>
                                    </BreadcrumbItem>
                                </motion.div>
                            </BreadcrumbList>
                        </Breadcrumb>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-3">
                        {/* Upload Button */}
                        <motion.button
                            onClick={() => setShowUploadModal(true)}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-500/20 transition-colors"
                        >
                            <IconUpload size={14} />
                            <span className="hidden sm:inline">Ingest</span>
                        </motion.button>

                        {/* Search Dropdown */}
                        {/* <AgroSearchDropdown />

                        {/* Panel toggles */}
                        <div className="flex items-center gap-1 bg-gray-200 dark:bg-zinc-800 p-1 rounded-lg transition-colors">
                            <button
                                onClick={() => setShowChat(!showChat)}
                                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 ${showChat
                                    ? "bg-white shadow text-gray-900 dark:bg-zinc-700 dark:text-zinc-100"
                                    : "text-gray-500 hover:text-gray-700 dark:text-zinc-400 dark:hover:text-zinc-200"
                                    }`}
                            >
                                <IconMessageChatbot size={14} />
                                <span className="hidden sm:inline">Chat</span>
                            </button>
                            <button
                                onClick={() => setShowDocument(!showDocument)}
                                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 ${showDocument
                                    ? "bg-white shadow text-gray-900 dark:bg-zinc-700 dark:text-zinc-100"
                                    : "text-gray-500 hover:text-gray-700 dark:text-zinc-400 dark:hover:text-zinc-200"
                                    }`}
                            >
                                <IconFileDescription size={14} />
                                <span className="hidden sm:inline">Document</span>
                            </button>
                        </div>
                    </div>
                </header>

                {/* Main content */}
                <motion.div
                    className="flex-1 flex gap-4 p-4 overflow-hidden"
                    layout
                    transition={springTransition}
                >
                    {/* Chat Panel */}
                    <AnimatePresence mode="popLayout">
                        {showChat && (
                            <motion.div
                                key="agro-chat-panel"
                                layout
                                variants={panelVariants}
                                initial="hidden"
                                animate="visible"
                                exit="exit"
                                className="flex-1 min-w-[320px] rounded-xl border border-gray-200 bg-white dark:bg-zinc-900 dark:border-zinc-800 overflow-hidden shadow-sm flex flex-col"
                            >
                                <AgroChatPanel onSourceClick={handleSourceClick} />

                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Document Panel */}
                    <AnimatePresence mode="wait">
                        {showDocument && (
                            <motion.div
                                key="agro-document-panel"
                                variants={panelVariants}
                                initial="hidden"
                                animate="visible"
                                exit="exit"
                                style={{ width: showChat ? 350 : 420 }}
                                className="shrink-0 rounded-xl border border-gray-200 bg-white dark:bg-zinc-900 dark:border-zinc-800 overflow-hidden shadow-sm flex flex-col"
                            >
                                <AgroDocumentPanel
                                    document={selectedDocument}
                                    initialPage={initialPage}
                                    initialTab={initialTab}
                                    onDelete={handleDocumentDeleted}
                                />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>

                {/* Upload Modal */}
                <AgroUploadModal
                    isOpen={showUploadModal}
                    onClose={() => setShowUploadModal(false)}
                    onUploadComplete={handleUploadComplete}
                />

                {/* Upload Progress Notifications */}
                <AgroUploadNotifications onAllComplete={handleUploadComplete} />
            </SidebarInset>
        </SidebarProvider>
    );
}

export default function AgroChatPage() {
    return (
        <PageGuard>
            <AgroChatPageContent />
        </PageGuard>
    );
}

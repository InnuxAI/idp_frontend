"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
    CreditCard,
    BookOpen,
    FileText,
    Search,
    Calendar,
    HardDrive,
    Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
    BreadcrumbLink,
} from "@/components/ui/breadcrumb";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import ZeteDocumentViewer from "@/components/zete/ZeteDocumentViewer";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface BlobFile {
    filename: string;
    file_path: string;
    size_bytes: number;
    content_type: string;
    created_at: string | null;
    modified_at: string | null;
}

interface ZeteDocument {
    doc_id: string;
    document_type: string;
    title: string;
    file_path: string;
    summary: string;
    created_at: string;
    updated_at: string;
}

export default function ZeteLibraryPage() {
    const [blobFiles, setBlobFiles] = useState<BlobFile[]>([]);
    const [zeteDocuments, setZeteDocuments] = useState<ZeteDocument[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [viewer, setViewer] = useState<{
        isOpen: boolean;
        docId: string;
        filename: string;
    }>({
        isOpen: false,
        docId: "",
        filename: "",
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        const token = sessionStorage.getItem("auth_token") || localStorage.getItem("auth_token");
        const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};

        try {
            const [blobRes, vcRes, brochureRes] = await Promise.all([
                fetch(`${API_BASE_URL}/api/zete/documents/blob-list`, { headers }),
                fetch(
                    `${API_BASE_URL}/api/zete/documents?doc_type=VisitingCard&limit=100`,
                    { headers }
                ),
                fetch(
                    `${API_BASE_URL}/api/zete/documents?doc_type=Brochure&limit=100`,
                    { headers }
                ),
            ]);

            if (blobRes.ok) {
                const data = await blobRes.json();
                setBlobFiles(data.files || []);
            }

            const allDocs: ZeteDocument[] = [];
            if (vcRes.ok) {
                const vcData = await vcRes.json();
                allDocs.push(...vcData);
            }
            if (brochureRes.ok) {
                const brData = await brochureRes.json();
                allDocs.push(...brData);
            }
            setZeteDocuments(allDocs);
        } catch (error) {
            console.error("Failed to load data:", error);
        } finally {
            setLoading(false);
        }
    };

    const visitingCardCount = zeteDocuments.filter(
        (d) => d.document_type === "VisitingCard"
    ).length;
    const brochureCount = zeteDocuments.filter(
        (d) => d.document_type === "Brochure"
    ).length;

    const formatFileSize = (bytes: number) => {
        if (!bytes || bytes === 0) return "—";
        const k = 1024;
        const sizes = ["Bytes", "KB", "MB", "GB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
    };

    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return "—";
        try {
            return new Date(dateStr).toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
            });
        } catch {
            return dateStr;
        }
    };

    const getFileTypeLabel = (contentType: string, filename: string) => {
        if (contentType.includes("pdf")) return "PDF";
        if (contentType.includes("image")) return filename.split(".").pop()?.toUpperCase() || "IMG";
        if (contentType.includes("word") || filename.endsWith(".docx")) return "DOCX";
        return filename.split(".").pop()?.toUpperCase() || "FILE";
    };

    const getFileTypeBadgeColor = (contentType: string) => {
        if (contentType.includes("pdf"))
            return "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20";
        if (contentType.includes("image"))
            return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20";
        return "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20";
    };

    // Find the corresponding doc_id for a blob file by matching file_path
    const findDocId = (blobFile: BlobFile): string => {
        const match = zeteDocuments.find(
            (d) =>
                d.file_path === blobFile.file_path ||
                d.file_path === blobFile.filename ||
                d.file_path?.endsWith(blobFile.filename)
        );
        if (match) return match.doc_id;
        // Fallback: derive from filename (strip extension)
        return blobFile.filename.replace(/\.[^/.]+$/, "");
    };

    const filteredFiles = blobFiles.filter((f) =>
        f.filename.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleViewFile = (file: BlobFile) => {
        const docId = findDocId(file);
        setViewer({ isOpen: true, docId, filename: file.filename });
    };

    return (
        <SidebarProvider
            style={
                {
                    "--sidebar-width": "calc(var(--spacing) * 72)",
                    "--header-height": "calc(var(--spacing) * 12)",
                } as React.CSSProperties
            }
        >
            <AppSidebar variant="inset" />
            <SidebarInset>
                <SiteHeader
                    breadcrumb={
                        <Breadcrumb>
                            <BreadcrumbList>
                                <motion.div
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.1 }}
                                >
                                    <BreadcrumbItem className="hidden md:block">
                                        <BreadcrumbLink
                                            href="#"
                                            className="dark:text-zinc-400 dark:hover:text-zinc-200"
                                        >
                                            Documents
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
                                        <BreadcrumbPage className="dark:text-zinc-100">
                                            Zete Library
                                        </BreadcrumbPage>
                                    </BreadcrumbItem>
                                </motion.div>
                            </BreadcrumbList>
                        </Breadcrumb>
                    }
                />
                <div className="flex flex-1 flex-col">
                    <div className="@container/main flex flex-1 flex-col gap-2">
                        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
                            <div className="px-4 lg:px-6">
                                {/* Page Header */}
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{
                                        type: "spring",
                                        stiffness: 300,
                                        damping: 25,
                                    }}
                                    className="mb-6"
                                >
                                    <motion.h1
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{
                                            delay: 0.1,
                                            type: "spring",
                                            stiffness: 300,
                                            damping: 25,
                                        }}
                                        className="text-4xl font-bold tracking-tight text-foreground"
                                    >
                                        Zete Library
                                    </motion.h1>
                                    <motion.p
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{
                                            delay: 0.2,
                                            type: "spring",
                                            stiffness: 300,
                                            damping: 25,
                                        }}
                                        className="text-lg text-muted-foreground"
                                    >
                                        Browse and manage Zete knowledge graph documents
                                    </motion.p>
                                </motion.div>

                                {/* KPI Cards */}
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.25 }}
                                    className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6"
                                >
                                    {/* Visiting Cards KPI */}
                                    <motion.div
                                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        transition={{
                                            delay: 0.3,
                                            type: "spring",
                                            stiffness: 300,
                                            damping: 25,
                                        }}
                                        whileHover={{
                                            scale: 1.01,
                                            y: -2,
                                            transition: {
                                                type: "spring",
                                                stiffness: 400,
                                                damping: 25,
                                            },
                                        }}
                                    >
                                        <Card className="relative overflow-hidden border-l-4 border-l-violet-500">
                                            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-violet-500/5 to-transparent rounded-bl-full" />
                                            <CardHeader className="pb-2">
                                                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                                    <CreditCard className="h-4 w-4 text-violet-500" />
                                                    Visiting Cards
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="flex items-baseline gap-2">
                                                    <span className="text-4xl font-bold text-foreground">
                                                        {loading ? "..." : visitingCardCount}
                                                    </span>
                                                    <span className="text-sm text-muted-foreground">
                                                        documents
                                                    </span>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </motion.div>

                                    {/* Brochure KPI */}
                                    <motion.div
                                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        transition={{
                                            delay: 0.4,
                                            type: "spring",
                                            stiffness: 300,
                                            damping: 25,
                                        }}
                                        whileHover={{
                                            scale: 1.01,
                                            y: -2,
                                            transition: {
                                                type: "spring",
                                                stiffness: 400,
                                                damping: 25,
                                            },
                                        }}
                                    >
                                        <Card className="relative overflow-hidden border-l-4 border-l-amber-500">
                                            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-amber-500/5 to-transparent rounded-bl-full" />
                                            <CardHeader className="pb-2">
                                                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                                    <BookOpen className="h-4 w-4 text-amber-500" />
                                                    Brochures
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="flex items-baseline gap-2">
                                                    <span className="text-4xl font-bold text-foreground">
                                                        {loading ? "..." : brochureCount}
                                                    </span>
                                                    <span className="text-sm text-muted-foreground">
                                                        documents
                                                    </span>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </motion.div>
                                </motion.div>

                                {/* Search Bar */}
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{
                                        delay: 0.5,
                                        type: "spring",
                                        stiffness: 300,
                                        damping: 25,
                                    }}
                                    className="relative max-w-md mb-6"
                                >
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search files..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-9"
                                    />
                                </motion.div>

                                {/* File List */}
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{
                                        delay: 0.6,
                                        type: "spring",
                                        stiffness: 300,
                                        damping: 25,
                                    }}
                                >
                                    <Card>
                                        <CardHeader className="pb-3">
                                            <CardTitle className="text-lg flex items-center justify-between">
                                                <span>All Files</span>
                                                <Badge variant="secondary" className="text-xs">
                                                    {filteredFiles.length} file
                                                    {filteredFiles.length !== 1 ? "s" : ""}
                                                </Badge>
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="p-0">
                                            {loading ? (
                                                <div className="text-center py-12 text-muted-foreground">
                                                    <div className="animate-pulse">
                                                        Loading files...
                                                    </div>
                                                </div>
                                            ) : filteredFiles.length === 0 ? (
                                                <div className="text-center py-12">
                                                    <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-40" />
                                                    <p className="text-muted-foreground">
                                                        {searchQuery
                                                            ? "No files match your search"
                                                            : "No files found in storage"}
                                                    </p>
                                                </div>
                                            ) : (
                                                <div className="divide-y">
                                                    {/* Table Header */}
                                                    <div className="grid grid-cols-12 gap-4 px-4 py-2.5 text-xs font-medium text-muted-foreground uppercase tracking-wider bg-muted/30">
                                                        <div className="col-span-5">Filename</div>
                                                        <div className="col-span-2">Type</div>
                                                        <div className="col-span-2">Size</div>
                                                        <div className="col-span-2">Uploaded</div>
                                                        <div className="col-span-1"></div>
                                                    </div>

                                                    {/* File Rows */}
                                                    <AnimatePresence>
                                                        {filteredFiles.map((file, index) => (
                                                            <motion.div
                                                                key={file.file_path}
                                                                initial={{ opacity: 0, x: -10 }}
                                                                animate={{ opacity: 1, x: 0 }}
                                                                transition={{
                                                                    delay: 0.02 * Math.min(index, 20),
                                                                    type: "spring",
                                                                    stiffness: 400,
                                                                    damping: 30,
                                                                }}
                                                                whileHover={{ backgroundColor: "var(--muted)" }}
                                                                className="grid grid-cols-12 gap-4 px-4 py-3 items-center cursor-pointer transition-colors"
                                                                onClick={() => handleViewFile(file)}
                                                            >
                                                                <div className="col-span-5 flex items-center gap-3 min-w-0">
                                                                    <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                                                                    <span className="text-sm font-medium truncate">
                                                                        {file.filename}
                                                                    </span>
                                                                </div>
                                                                <div className="col-span-2">
                                                                    <Badge
                                                                        variant="outline"
                                                                        className={`text-xs ${getFileTypeBadgeColor(file.content_type)}`}
                                                                    >
                                                                        {getFileTypeLabel(
                                                                            file.content_type,
                                                                            file.filename
                                                                        )}
                                                                    </Badge>
                                                                </div>
                                                                <div className="col-span-2">
                                                                    <span className="text-sm text-muted-foreground flex items-center gap-1.5">
                                                                        <HardDrive className="h-3 w-3" />
                                                                        {formatFileSize(file.size_bytes)}
                                                                    </span>
                                                                </div>
                                                                <div className="col-span-2">
                                                                    <span className="text-sm text-muted-foreground flex items-center gap-1.5">
                                                                        <Calendar className="h-3 w-3" />
                                                                        {formatDate(file.created_at)}
                                                                    </span>
                                                                </div>
                                                                <div className="col-span-1 flex justify-end">
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        className="h-7 w-7 p-0"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            handleViewFile(file);
                                                                        }}
                                                                    >
                                                                        <Eye className="h-3.5 w-3.5" />
                                                                    </Button>
                                                                </div>
                                                            </motion.div>
                                                        ))}
                                                    </AnimatePresence>
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            </div>
                        </div>
                    </div>
                </div>
            </SidebarInset>

            {/* Document Viewer Dialog */}
            <ZeteDocumentViewer
                isOpen={viewer.isOpen}
                onClose={() =>
                    setViewer({ isOpen: false, docId: "", filename: "" })
                }
                docId={viewer.docId}
                filename={viewer.filename}
            />
        </SidebarProvider>
    );
}

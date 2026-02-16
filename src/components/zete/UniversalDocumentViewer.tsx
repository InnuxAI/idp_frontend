"use client";

import { memo, useMemo, useState, useEffect, useRef } from "react";

interface UniversalDocumentViewerProps {
    /** Full URL or local file path to the document */
    fileUrl: string;
    /** File name for display and type detection */
    fileName: string;
    /** Optional: MIME type override */
    fileType?: string;
    /** Optional: Document metadata for header display */
    title?: string;
}

// Get file extension for type detection
function getFileExtension(fileName: string): string {
    const parts = fileName.split(".");
    return parts.length > 1 ? parts.pop()?.toLowerCase() || "" : "";
}

// Map extensions to MIME types
const MIME_MAP: Record<string, string> = {
    pdf: "application/pdf",
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    gif: "image/gif",
    webp: "image/webp",
    bmp: "image/bmp",
    tiff: "image/tiff",
    txt: "text/plain",
    html: "text/html",
    htm: "text/html",
    md: "text/markdown",
};

type DocCategory = "image" | "pdf" | "text" | "unknown";

function getDocCategory(fileName: string, mimeType?: string): DocCategory {
    const ext = getFileExtension(fileName);
    const mime = mimeType || MIME_MAP[ext] || "";

    if (mime.startsWith("image/") || ["png", "jpg", "jpeg", "gif", "webp", "bmp", "tiff"].includes(ext)) {
        return "image";
    }
    if (mime === "application/pdf" || ext === "pdf") {
        return "pdf";
    }
    if (mime.startsWith("text/") || ["txt", "md", "html", "htm", "csv"].includes(ext)) {
        return "text";
    }
    return "unknown";
}

/**
 * UniversalDocumentViewer - Renders documents using native HTML elements
 * 
 * Uses <img> for images, <iframe> for PDFs, and <pre> for text.
 * No third-party doc viewer library — maximum reliability.
 */
const UniversalDocumentViewer = memo(function UniversalDocumentViewer({
    fileUrl,
    fileName,
    fileType,
    title,
}: UniversalDocumentViewerProps) {
    const [isDark, setIsDark] = useState(true);
    const [blobUrl, setBlobUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const blobUrlRef = useRef<string | null>(null);

    useEffect(() => {
        const checkDark = () => setIsDark(document.documentElement.classList.contains("dark"));
        checkDark();
        const observer = new MutationObserver(checkDark);
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
        return () => observer.disconnect();
    }, []);

    // Fetch document with auth headers and create blob URL
    useEffect(() => {
        let cancelled = false;

        const fetchDocument = async () => {
            setLoading(true);
            setError(null);

            try {
                const token = sessionStorage.getItem('auth_token') || localStorage.getItem('auth_token');
                const response = await fetch(fileUrl, {
                    headers: token ? { 'Authorization': `Bearer ${token}` } : {},
                });

                if (!response.ok) {
                    throw new Error(`Failed to load document: ${response.status}`);
                }

                const blob = await response.blob();

                if (cancelled) return; // Don't set state if effect was cleaned up

                // Revoke previous blob URL if any
                if (blobUrlRef.current) {
                    URL.revokeObjectURL(blobUrlRef.current);
                }

                const url = URL.createObjectURL(blob);
                blobUrlRef.current = url;
                setBlobUrl(url);
            } catch (err) {
                if (cancelled) return;
                console.error('Failed to fetch document:', err);
                setError(err instanceof Error ? err.message : 'Failed to load document');
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        fetchDocument();

        return () => {
            cancelled = true;
        };
    }, [fileUrl]);

    // Cleanup blob URL on unmount only
    useEffect(() => {
        return () => {
            if (blobUrlRef.current) {
                URL.revokeObjectURL(blobUrlRef.current);
                blobUrlRef.current = null;
            }
        };
    }, []);

    const category = useMemo(() => getDocCategory(fileName, fileType), [fileName, fileType]);

    // Theme colors
    const bgColor = isDark ? "#18181b" : "#f8fafc";
    const mutedText = isDark ? "#a1a1aa" : "#71717a";

    return (
        <div
            className="w-full h-full flex flex-col rounded-lg overflow-hidden relative"
            style={{ background: bgColor }}
        >
            {/* Optional header */}
            {title && (
                <div
                    className="flex-none px-4 py-3 border-b"
                    style={{
                        background: isDark ? "rgba(39, 39, 42, 0.5)" : "rgba(244, 244, 245, 0.8)",
                        borderColor: isDark ? "#27272a" : "#e5e5e5"
                    }}
                >
                    <h3
                        className="text-sm font-medium truncate"
                        style={{ color: isDark ? "#f4f4f5" : "#18181b" }}
                    >
                        {title}
                    </h3>
                    <p
                        className="text-xs mt-0.5 truncate"
                        style={{ color: mutedText }}
                    >
                        {fileName}
                    </p>
                </div>
            )}

            {/* Document content */}
            <div className="flex-1 min-h-0 relative overflow-auto">
                {loading ? (
                    <div className="flex h-full items-center justify-center" style={{ color: mutedText }}>
                        <div className="flex flex-col items-center gap-2">
                            <div className="h-6 w-6 animate-spin rounded-full border-2 border-current border-t-indigo-500" />
                            <p className="text-xs">Loading document...</p>
                        </div>
                    </div>
                ) : error ? (
                    <div className="flex h-full items-center justify-center" style={{ color: mutedText }}>
                        <div className="flex flex-col items-center gap-2 text-center px-4">
                            <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            <p className="text-xs">{error}</p>
                        </div>
                    </div>
                ) : blobUrl ? (
                    <DocumentRenderer
                        blobUrl={blobUrl}
                        category={category}
                        fileName={fileName}
                        isDark={isDark}
                        bgColor={bgColor}
                    />
                ) : null}
            </div>
        </div>
    );
});

/** Renders the actual document content based on type */
function DocumentRenderer({
    blobUrl,
    category,
    fileName,
    isDark,
    bgColor,
}: {
    blobUrl: string;
    category: DocCategory;
    fileName: string;
    isDark: boolean;
    bgColor: string;
}) {
    if (category === "image") {
        return (
            <div className="flex items-center justify-center h-full p-4" style={{ background: bgColor }}>
                <img
                    src={blobUrl}
                    alt={fileName}
                    className="max-w-full max-h-full object-contain rounded-lg shadow-sm"
                    style={{ border: `1px solid ${isDark ? '#27272a' : '#e5e5e5'}` }}
                />
            </div>
        );
    }

    if (category === "pdf") {
        return (
            <iframe
                src={`${blobUrl}#toolbar=1&navpanes=0`}
                title={fileName}
                className="w-full h-full border-0"
                style={{ background: isDark ? "#1a1a1a" : "#ffffff" }}
            />
        );
    }

    if (category === "text") {
        return <TextRenderer blobUrl={blobUrl} isDark={isDark} />;
    }

    // Unknown file type - offer download
    return (
        <div className="flex h-full items-center justify-center">
            <div className="flex flex-col items-center gap-3 text-center px-4">
                <svg className="w-12 h-12 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-sm text-zinc-400">{fileName}</p>
                <a
                    href={blobUrl}
                    download={fileName}
                    className="px-4 py-2 rounded-lg text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-500 transition-colors"
                >
                    Download File
                </a>
            </div>
        </div>
    );
}

/** Text file renderer that fetches and displays text content */
function TextRenderer({ blobUrl, isDark }: { blobUrl: string; isDark: boolean }) {
    const [text, setText] = useState<string>("Loading...");

    useEffect(() => {
        fetch(blobUrl)
            .then(r => r.text())
            .then(setText)
            .catch(() => setText("Failed to load text content"));
    }, [blobUrl]);

    return (
        <pre
            className="p-4 text-sm font-mono whitespace-pre-wrap overflow-auto h-full"
            style={{
                color: isDark ? "#e4e4e7" : "#3f3f46",
                background: isDark ? "#18181b" : "#f8fafc",
            }}
        >
            {text}
        </pre>
    );
}

export default UniversalDocumentViewer;
export { UniversalDocumentViewer };

"use client";

import { memo, useMemo, useState, useEffect } from "react";
import DocViewer, { DocViewerRenderers, IDocument, ITheme } from "@cyntler/react-doc-viewer";
import "@cyntler/react-doc-viewer/dist/index.css";

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
    doc: "application/msword",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    xls: "application/vnd.ms-excel",
    xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ppt: "application/vnd.ms-powerpoint",
    pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    txt: "text/plain",
    html: "text/html",
    htm: "text/html",
};

/**
 * UniversalDocumentViewer - Renders various document types using react-doc-viewer
 * 
 * Supports: PDF, Images, Office documents, and more.
 */
const UniversalDocumentViewer = memo(function UniversalDocumentViewer({
    fileUrl,
    fileName,
    fileType,
    title,
}: UniversalDocumentViewerProps) {
    // SSR-safe theme detection
    const [isDark, setIsDark] = useState(true);

    useEffect(() => {
        const checkDark = () => setIsDark(document.documentElement.classList.contains("dark"));
        checkDark();

        const observer = new MutationObserver(checkDark);
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

        return () => observer.disconnect();
    }, []);

    // Build document array for viewer
    const docs = useMemo<IDocument[]>(() => {
        const ext = getFileExtension(fileName);
        const mimeType = fileType || MIME_MAP[ext];

        return [
            {
                uri: fileUrl,
                fileName: fileName,
                fileType: mimeType,
            },
        ];
    }, [fileUrl, fileName, fileType]);

    // Theme configuration
    const theme = useMemo<ITheme>(() => ({
        primary: "#6366f1",
        secondary: isDark ? "#18181b" : "#ffffff",
        tertiary: isDark ? "#27272a" : "#f4f4f5",
        textPrimary: isDark ? "#f4f4f5" : "#18181b",
        textSecondary: isDark ? "#a1a1aa" : "#52525b",
        textTertiary: isDark ? "#71717a" : "#a1a1aa",
        disableThemeScrollbar: false,
    }), [isDark]);

    // Config
    const config = useMemo(
        () => ({
            header: {
                disableHeader: true,
                disableFileName: true,
                retainURLParams: false,
            },
            csvDelimiter: ",",
            pdfZoom: {
                defaultZoom: 1.0,
                zoomJump: 0.2,
            },
            pdfVerticalScrollByDefault: true,
        }),
        []
    );

    // Colors based on theme
    const bgColor = isDark ? "#18181b" : "#f8fafc";
    const controlBg = isDark ? "rgba(39, 39, 42, 0.95)" : "rgba(255, 255, 255, 0.95)";
    const controlBorder = isDark ? "rgba(63, 63, 70, 0.5)" : "rgba(228, 228, 231, 0.8)";
    const buttonBg = isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)";
    const buttonHoverBg = isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.1)";
    const textColor = isDark ? "#e4e4e7" : "#3f3f46";
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

            {/* Document viewer */}
            <div className="flex-1 min-h-0 relative">
                <DocViewer
                    documents={docs}
                    pluginRenderers={DocViewerRenderers}
                    theme={theme}
                    config={config}
                    style={{
                        width: "100%",
                        height: "100%",
                        background: bgColor,
                    }}
                    className="document-viewer"
                />
            </div>

            {/* Custom styles for the default controls */}
            <style jsx global>{`
                /* Hide default header */
                .document-viewer #header-bar {
                    display: none !important;
                }
                
                /* Style the PDF controls - only appearance, not positioning */
                .document-viewer #pdf-controls {
                    display: flex !important;
                    align-items: center !important;
                    gap: 4px !important;
                    padding: 8px 16px !important;
                    border-radius: 12px !important;
                    background: ${controlBg} !important;
                    border: 1px solid ${controlBorder} !important;
                    backdrop-filter: blur(8px) !important;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
                    margin: 8px auto !important;
                }
                
                /* Style the control buttons */
                .document-viewer #pdf-controls button {
                    display: flex !important;
                    align-items: center !important;
                    justify-content: center !important;
                    min-width: 32px !important;
                    height: 32px !important;
                    padding: 4px 8px !important;
                    border: none !important;
                    border-radius: 8px !important;
                    background: ${buttonBg} !important;
                    color: ${textColor} !important;
                    cursor: pointer !important;
                    transition: all 0.15s ease !important;
                    font-size: 14px !important;
                }
                
                .document-viewer #pdf-controls button:hover {
                    background: ${buttonHoverBg} !important;
                    transform: scale(1.05) !important;
                }
                
                .document-viewer #pdf-controls button:active {
                    transform: scale(0.95) !important;
                }
                
                .document-viewer #pdf-controls button:disabled {
                    opacity: 0.4 !important;
                    cursor: not-allowed !important;
                    transform: none !important;
                }
                
                /* Style the page indicator text */
                .document-viewer #pdf-controls span,
                .document-viewer #pdf-controls input {
                    font-size: 12px !important;
                    font-weight: 500 !important;
                    color: ${mutedText} !important;
                    background: transparent !important;
                    border: none !important;
                    text-align: center !important;
                    padding: 0 4px !important;
                }
                
                /* PDF renderer background */
                .document-viewer #proxy-renderer {
                    overflow: auto !important;
                    background: ${bgColor} !important;
                }
                
                .document-viewer #pdf-renderer {
                    background: ${bgColor} !important;
                }
                
                .document-viewer #pdf-page-wrapper {
                    background: ${bgColor} !important;
                    padding-bottom: 60px !important;
                }
                
                /* Image renderer */
                .document-viewer img {
                    max-width: 100%;
                    height: auto;
                    object-fit: contain;
                    border-radius: 8px;
                }
                
                .document-viewer #image-renderer {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 16px;
                    background: ${bgColor} !important;
                }
            `}</style>
        </div>
    );
});

export default UniversalDocumentViewer;
export { UniversalDocumentViewer };

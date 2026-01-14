import React, { useState, useEffect } from 'react';
import { apiService } from '@/services/api';
import { Loader2, AlertCircle } from 'lucide-react';

interface AuthorizedPdfViewerProps {
    url: string;
    className?: string;
    title?: string;
}

export function AuthorizedPdfViewer({ url, className = "", title = "PDF Viewer" }: AuthorizedPdfViewerProps) {
    const [blobUrl, setBlobUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let active = true;
        let currentObjectUrl: string | null = null;

        const loadPdf = async () => {
            if (!url) return;

            try {
                setLoading(true);
                setError(null);

                const blob = await apiService.fetchPdf(url);

                if (active) {
                    currentObjectUrl = URL.createObjectURL(blob);
                    setBlobUrl(currentObjectUrl);
                }
            } catch (err: any) {
                if (active) {
                    console.error("Failed to fetch PDF:", err);

                    // Try to give a helpful error message
                    if (err.response && err.response.status === 401) {
                        setError("Session expired or unauthorized. Please log in again.");
                    } else if (err.response && err.response.status === 404) {
                        setError("The PDF document was not found.");
                    } else {
                        setError("Failed to load PDF document.");
                    }
                }
            } finally {
                if (active) {
                    setLoading(false);
                }
            }
        };

        loadPdf();

        // Cleanup function
        return () => {
            active = false;
            if (currentObjectUrl) {
                URL.revokeObjectURL(currentObjectUrl);
            }
        };
    }, [url]);

    if (loading) {
        return (
            <div className={`flex flex-col items-center justify-center bg-muted/20 h-full w-full ${className}`}>
                <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
                <p className="text-sm text-muted-foreground">Loading document...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className={`flex flex-col items-center justify-center bg-muted/20 h-full w-full p-6 text-center ${className}`}>
                <AlertCircle className="h-10 w-10 text-destructive mb-3" />
                <h3 className="font-medium text-lg mb-1">Error Loading PDF</h3>
                <p className="text-sm text-muted-foreground">{error}</p>
            </div>
        );
    }

    if (!blobUrl) {
        return (
            <div className={`flex items-center justify-center bg-muted/20 h-full w-full ${className}`}>
                <p className="text-sm text-muted-foreground">No document URL provided</p>
            </div>
        );
    }

    return (
        <iframe
            src={blobUrl}
            className={`w-full h-full border-0 ${className}`}
            title={title}
        />
    );
}
